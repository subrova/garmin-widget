#!/usr/bin/env python3
"""Downloads the monthly steps / km / intensity minutes and the challenges from
Garmin Connect and writes them to data.json (read by garmin-widget.js).

Usage:
    pip install garminconnect
    export GARMIN_EMAIL=...  GARMIN_PASSWORD=...   # only for the first login
    python fetch_garmin.py [--out data.json] [--month 2026-10]

After the first login (including the MFA code) the tokens are stored in
~/.garminconnect, so later runs no longer need the password.
"""
import argparse, calendar, json, os, re, sys, time
from datetime import date, datetime, timedelta
from pathlib import Path

from garminconnect import Garmin

TOKENS = os.path.expanduser(os.environ.get("GARMINTOKENS", "~/.garminconnect"))
HERE = Path(__file__).parent


def login():
    try:
        api = Garmin()
        api.login(TOKENS)
        return api
    except Exception:
        email, pw = os.getenv("GARMIN_EMAIL"), os.getenv("GARMIN_PASSWORD")
        if not (email and pw):
            sys.exit("No valid saved login. Set GARMIN_EMAIL and GARMIN_PASSWORD.")
        api = Garmin(email, pw, prompt_mfa=lambda: input("MFA code: ").strip())
        api.login(TOKENS)
        return api


def pick(d, *keys):
    for k in keys:
        if isinstance(d, dict) and d.get(k) is not None:
            return d[k]
    return None


def month_totals(api, first, last):
    """Monthly totals (steps, km, intensity minutes - vigorous counts double, like Garmin does),
    the per-day values for the chart [{"date", "steps", "km", "minutes", "goal"}] and the number of failed days."""
    upto = min(last, date.today())
    steps = dist_m = 0.0
    per_day = {}
    for d in api.get_daily_steps(first.isoformat(), upto.isoformat()) or []:
        n, m = d.get("totalSteps") or 0, d.get("totalDistance") or 0
        steps += n
        dist_m += m
        per_day[d["calendarDate"]] = {"steps": n, "km": round(m / 1000, 2), "goal": d.get("stepGoal")}
    minutes = errors = 0
    cur = first
    while cur <= upto:
        day_min = 0
        try:
            s = api.get_stats(cur.isoformat())
            day_min = (s.get("moderateIntensityMinutes") or 0) + 2 * (s.get("vigorousIntensityMinutes") or 0)
        except Exception as e:  # one bad day must not abort the whole run
            errors += 1
            print(f"warn: stats {cur}: {e}", file=sys.stderr)
        minutes += day_min
        per_day.setdefault(cur.isoformat(), {"steps": 0, "km": 0, "goal": None})["minutes"] = day_min
        cur = date.fromordinal(cur.toordinal() + 1)
    daily = [{"date": k, "steps": v["steps"], "km": v["km"], "minutes": v.get("minutes", 0), "goal": v["goal"]}
             for k, v in sorted(per_day.items())]
    return {"steps": round(steps), "km": round(dist_m / 1000, 2), "minutes": round(minutes)}, daily, errors


def sports_summary(api, first, last):
    """Time spent per sport this month, from the recorded activities (duration = elapsed time, the same
    measure Garmin uses for its walking challenges): [{"type", "minutes", "count", "km"}], longest first."""
    try:
        acts = api.get_activities_by_date(first.isoformat(), min(last, date.today()).isoformat()) or []
    except Exception as e:
        print(f"warn: activities: {e}", file=sys.stderr)
        return []
    agg = {}
    for a in acts:
        t = (a.get("activityType") or {}).get("typeKey") or "other"
        r = agg.setdefault(t, {"type": t, "minutes": 0.0, "count": 0, "km": 0.0})
        r["minutes"] += (a.get("duration") or 0) / 60
        r["count"] += 1
        r["km"] += (a.get("distance") or 0) / 1000
    return sorted(({**r, "minutes": round(r["minutes"], 1), "km": round(r["km"], 2)} for r in agg.values()),
                  key=lambda r: -r["minutes"])


MONTHS_CACHE = HERE / "months.json"  # totals of finished months (computed once, they do not change)
YEAR_BUDGET_S = 150  # max seconds per run spent on computing missing months; the rest is done by the next runs


def year_overview(api, today, current):
    """Monthly totals of the current year: finished months come from the cache (missing ones are computed,
    oldest first, within a time budget), the running month is `current`."""
    try:
        cache = json.loads(MONTHS_CACHE.read_text())
    except Exception:
        cache = {}
    y, started = today.year, time.time()
    for m in range(1, today.month):
        key = f"{y}-{m:02d}"
        late_sync = today.day <= 3 and m == today.month - 1  # the previous month may still receive late synced data
        if key in cache and not late_sync:
            continue
        if time.time() - started > YEAR_BUDGET_S:
            break
        totals, _, errors = month_totals(api, date(y, m, 1), date(y, m, calendar.monthrange(y, m)[1]))
        if errors == 0:
            cache[key] = totals
            MONTHS_CACHE.write_text(json.dumps(cache, indent=2))
    months = [{"month": k, **cache[k]} for k in sorted(cache) if k.startswith(f"{y}-") and k < f"{y}-{today.month:02d}"]
    months.append({"month": f"{y}-{today.month:02d}", **current})
    return {"year": y, "months": months}


UNIT_MAP = {  # Garmin unit/metric name -> our unit
    "steps": "steps", "step": "steps",
    "meter": "km", "meters": "km", "m": "km", "distance": "km", "kilometer": "km", "km": "km",
    "minute": "minutes", "minutes": "minutes", "min": "minutes", "second": "minutes", "seconds": "minutes",
}


# Czech names keyed by badgeKey (the API returns English names); add new ones to names.cs.json
NAMES_CS = json.loads((HERE / "names.cs.json").read_text()) if (HERE / "names.cs.json").exists() else {}

# keys of challenges to hide (list in hide.json, e.g. ["challenge_total_step_100k"])
HIDE = set(json.loads((HERE / "hide.json").read_text())) if (HERE / "hide.json").exists() else set()

# badgeUnitId -> (unit, multiplier): 1 = meters, 3 = activity count, 5 = steps, 7 = seconds
BADGE_UNITS = {1: ("km", 0.001), 3: ("activities", 1), 5: ("steps", 1), 7: ("minutes", 1 / 60)}


def normalize_challenge(c, source):
    """Garmin returns varying shapes, so the mapping is defensive. Raw data is dumped to raw_challenges.json."""
    name = pick(c, "adHocChallengeName", "challengeName", "badgeChallengeName", "name", "title", "badgeName")
    target = pick(c, "goalValue", "targetValue", "target", "badgeTargetValue", "challengeTarget", "badgeTargetValueInMeters")
    progress = pick(c, "currentValue", "userProgress", "progressValue", "badgeProgressValue", "value", "currentProgress")
    start = pick(c, "startDate", "startTime", "challengeStartDate", "badgeChallengeStartDate")
    end = pick(c, "endDate", "endTime", "challengeEndDate", "badgeChallengeEndDate")
    uid = c.get("badgeUnitId")
    unit_raw = str(pick(c, "unitTypeKey", "unit", "metricType", "challengeCategoryKey", "badgeUnitTypeKey") or "").lower()
    unit = next((v for k, v in UNIT_MAP.items() if k in unit_raw), None)
    mult = 1
    if uid in BADGE_UNITS:  # verified against real Garmin Connect data
        unit, mult = BADGE_UNITS[uid]
    if uid in BADGE_UNITS:
        pass
    elif unit == "km" and "kilo" not in unit_raw and unit_raw != "km":
        mult = 0.001  # Garmin reports distance in meters
    if unit == "minutes" and "second" in unit_raw:
        mult = 1 / 60
    key = re.sub(r"_\d{4}_\d{2}$", "", c.get("badgeKey") or "")  # without the trailing year and month
    return {
        "name": NAMES_CS.get(key, name), "name_en": name, "key": key, "translated": key in NAMES_CS, "source": source, "unit": unit,
        "target": None if target is None else round(float(target) * mult, 2),
        "current": None if progress is None else round(float(progress) * mult, 2),
        "start": str(start)[:10] if start else None, "end": str(end)[:10] if end else None,
        "earned": bool(c.get("badgeEarnedDate")),
        "earnedDate": (c.get("badgeEarnedDate") or "")[:10] or None,
    }


SEEN = HERE / "seen.json"
BADGES_SHOWN = 30  # how many of the latest earned badges go into data.json (the widget shows data-badges of them, default 10)


def strip_key(badge_key):
    return re.sub(r"_\d{4}_\d{2}$", "", badge_key or "")


def earned_badges(api):
    """Earned badges from Garmin, newest first: (list for data.json, index "key|start date" -> badge)."""
    try:
        badges = api.get_earned_badges() or []
    except Exception as e:
        print(f"warn: earned badges: {e}", file=sys.stderr)
        return [], {}
    badges = sorted((b for b in badges if b.get("badgeEarnedDate")), key=lambda b: b["badgeEarnedDate"], reverse=True)
    index = {}
    for b in badges:
        index.setdefault(f'{strip_key(b.get("badgeKey"))}|{(b.get("badgeStartDate") or "")[:10]}', b)
    shown = []
    for b in badges[:BADGES_SHOWN]:
        key = strip_key(b.get("badgeKey"))
        # expeditions ("virtual_*" badges): never translated; elevation unit = climb, distance unit = hike
        expedition = None
        if key.startswith("virtual_"):
            expedition = "climb" if b.get("badgeUnitId") == 2 else "hike"
        kind = "expedition" if expedition else "challenge" if key.startswith("challenge_") else "other"
        shown.append({"key": key, "name": b.get("badgeName") if expedition else NAMES_CS.get(key, b.get("badgeName")),
                      "name_en": b.get("badgeName"), "translated": True if expedition else key in NAMES_CS,
                      "expedition": expedition, "kind": kind, "date": b["badgeEarnedDate"][:10],
                      "points": b.get("badgePoints"), "count": b.get("badgeEarnedNumber")})
    return shown, index


def remember_completed(out, first, last, badge_index):
    """Garmin drops a completed challenge from the "non-completed" list. We remember the challenges we have
    seen; when one vanishes, the earned badges tell whether it was really completed (and when). Completed
    challenges stay visible (greyed out) until the end of the month; vanished ones without a badge are dropped."""
    try:
        seen = json.loads(SEEN.read_text())
    except Exception:
        seen = {}
    now = {}
    for n in out:
        if n.get("key") and n["source"] == "badge":
            k = f'{n["key"]}|{n["start"]}'
            now[k] = n
            seen[k] = n
    for k, n in list(seen.items()):
        if n["end"] and n["end"] < first.isoformat():
            del seen[k]  # old challenge from a previous period
            continue
        if k in now or n["key"] in HIDE or (n["start"] or "") > last.isoformat():
            continue
        badge = badge_index.get(k)
        if badge:
            done = dict(n, earned=True, inferred=True, earnedDate=badge["badgeEarnedDate"][:10])
            if n["kind"] == "progress":
                done["current"] = done["target"]
            out.append(done)
    SEEN.write_text(json.dumps(seen, indent=2, ensure_ascii=False))
    return out


BASE = HERE / "baseline.json"  # legacy: start-of-day state of one day, migrated into history.json
HIST = HERE / "history.json"
HIST_DAYS = 62  # how many days of start-of-day snapshots to keep


# How Garmin counts the challenges (verified against real data: the sums match the challenge progress):
#   steps challenges        = steps per day
#   "walk N hours"          = total duration of walking activities
#   "walk N mi"             = total distance of walking activities
#   "N activities"          = number of activities lasting at least 20 minutes (any type)
CHALLENGE_RULES = [
    (re.compile(r"^challenge_total_step"), "steps"),
    (re.compile(r"^challenge_total_walk_\d+_hours$"), "walk_min"),
    (re.compile(r"^challenge_total_walk_\d+mi$"), "walk_km"),
    (re.compile(r"^challenge_total_activity"), "act20"),
]
ACTIVE_SECONDS = 20 * 60


def rule_kind(n):
    return next((k for rx, k in CHALLENGE_RULES if rx.match(n.get("key") or "")), None)


def daily_series(api, start):
    """Per-day values (date -> number) for the rules above, from `start` until today. {} on failure."""
    end = date.today().isoformat()
    try:
        steps = {d["calendarDate"]: d.get("totalSteps") or 0 for d in (api.get_daily_steps(start, end) or [])}
        walk_min, walk_km, act20 = {}, {}, {}
        for a in api.get_activities_by_date(start, end) or []:
            day = (a.get("startTimeLocal") or "")[:10]
            if not day:
                continue
            dur = a.get("duration") or 0
            if (a.get("activityType") or {}).get("typeKey") == "walking":
                walk_min[day] = walk_min.get(day, 0) + dur / 60
                walk_km[day] = walk_km.get(day, 0) + (a.get("distance") or 0) / 1000
            if dur >= ACTIVE_SECONDS:
                act20[day] = act20.get(day, 0) + 1
        return {"steps": steps, "walk_min": walk_min, "walk_km": walk_km, "act20": act20}
    except Exception as e:
        print(f"warn: daily series: {e}", file=sys.stderr)
        return {}


def series_hist(n, series):
    """Start-of-day progress per date computed from Garmin's daily data, or None when there is no rule,
    no data, or the sum does not match the challenge progress reported by Garmin (then snapshots are used)."""
    kind = rule_kind(n)
    if not kind or kind not in series or not n.get("start"):
        return None
    daily, cum, hist = series[kind], 0.0, {}
    d, t = date.fromisoformat(n["start"]), date.today()
    while d <= t:
        hist[d.isoformat()] = round(cum, 2)
        cum += daily.get(d.isoformat(), 0)
        d += timedelta(days=1)
    if abs(cum - n["current"]) > max(0.5, 0.005 * n["current"]):
        print(f"warn: {n.get('key')}: computed {cum:.2f} != reported {n['current']} - using snapshots", file=sys.stderr)
        return None
    cutoff = (t - timedelta(days=HIST_DAYS)).isoformat()
    return {k: v for k, v in hist.items() if k >= cutoff}


def apply_today(out, api):
    """Adds 'today' (how far a challenge moved since the start of the day) and 'hist' (start-of-day
    progress per date) to every progress challenge.
    Preferably 'hist' is computed from Garmin's per-day data (see CHALLENGE_RULES), which also fills in the days
    before the first download. Challenges without a (matching) rule fall back to snapshots: the state at the first
    download after midnight (so run the fetch shortly after midnight too).
    The widget derives the recent daily pace from 'hist'."""
    today = date.today().isoformat()
    try:
        hist = json.loads(HIST.read_text())
    except Exception:
        hist = {}
    if today not in hist and BASE.exists():  # migrate the legacy baseline of today
        try:
            b = json.loads(BASE.read_text())
            if b.get("date") == today:
                hist[today] = b["values"]
        except Exception:
            pass
    day = hist.setdefault(today, {})
    for n in out:
        if n.get("kind") != "progress" or n.get("inferred") or n.get("current") is None:
            continue
        k = f'{n.get("key") or n["name"]}|{n.get("start")}'
        day.setdefault(k, n["current"])  # new challenge in the middle of the day: counts from now
        n["today"] = round(max(0.0, n["current"] - day[k]), 2)
        n["hist"] = {d: v[k] for d, v in sorted(hist.items()) if k in v}
    # override with the series computed from Garmin's daily data wherever it is available and consistent
    todo = [n for n in out if n.get("hist") is not None and rule_kind(n) and n.get("start")]
    if todo:
        series = daily_series(api, min(n["start"] for n in todo))
        for n in todo:
            h = series_hist(n, series)
            if h:
                n["hist"] = h
                n["today"] = round(max(0.0, n["current"] - h.get(today, n["current"])), 2)
                n["histSource"] = "garmin"
    cutoff = (date.today() - timedelta(days=HIST_DAYS)).isoformat()
    HIST.write_text(json.dumps({d: v for d, v in hist.items() if d >= cutoff}, indent=2))


def challenges(api, first, last, totals):
    raw, out = {}, []
    for label, fn, args in [
        ("adhoc", api.get_adhoc_challenges, (0, 50)),
        ("virtual", api.get_inprogress_virtual_challenges, (1, 50)),
        ("badge", api.get_non_completed_badge_challenges, (1, 50)),
    ]:
        try:
            r = fn(*args)
        except Exception as e:
            print(f"warn: {label}: {e}", file=sys.stderr)
            continue
        raw[label] = r
        items = r if isinstance(r, list) else next((v for v in (r or {}).values() if isinstance(v, list)), [])
        for c in items:
            n = normalize_challenge(c, label)
            if label == "virtual" or n["key"] in HIDE:
                continue  # virtual routes have no monthly deadline
            n["kind"] = "progress" if n["target"] else "flag"  # goal 0 = only completed / not completed
            if n["end"] and n["end"] < first.isoformat():
                continue
            if n["start"] and n["start"] > last.isoformat():
                continue
            out.append(n)
    (HERE / "raw_challenges.json").write_text(json.dumps(raw, indent=2, ensure_ascii=False))

    badges, badge_index = earned_badges(api)
    out = remember_completed(out, first, last, badge_index)
    apply_today(out, api)

    # display order from order.json (keys); unknown ones go last
    order = json.loads((HERE / "order.json").read_text()) if (HERE / "order.json").exists() else []
    out.sort(key=lambda n: order.index(n["key"]) if n.get("key") in order else len(order))

    # manual goals (challenges the API does not return, e.g. group ones) from challenges.manual.json
    manual = HERE / "challenges.manual.json"  # optional, same format as challenges.example.json
    if manual.exists():
        for m in json.loads(manual.read_text()):
            out.append({"name": m["name"], "source": "manual", "unit": m["unit"],
                        "target": m["target"], "current": totals[m["unit"]],
                        "start": first.isoformat(), "end": last.isoformat()})
    return out, badges


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE / "data.json"))
    ap.add_argument("--month", help="YYYY-MM (default: current month)")
    a = ap.parse_args()
    today = date.today()
    y, m = (int(x) for x in a.month.split("-")) if a.month else (today.year, today.month)
    first = date(y, m, 1)
    last = date(y, m, calendar.monthrange(y, m)[1])

    api = login()
    totals, daily, _ = month_totals(api, first, last)
    chal, badges = challenges(api, first, last, totals)
    data = {
        "updated": datetime.now().isoformat(timespec="seconds"),
        "user": api.get_full_name(),
        "month": f"{y}-{m:02d}", "monthStart": first.isoformat(), "monthEnd": last.isoformat(),
        "totals": totals, "daily": daily, "sports": sports_summary(api, first, last), "year": year_overview(api, today, totals) if (first.year, first.month) == (today.year, today.month) else None, "challenges": chal, "badges": badges,
    }
    Path(a.out).write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"OK -> {a.out}: {totals}, challenges: {len(data['challenges'])}")


if __name__ == "__main__":
    main()
