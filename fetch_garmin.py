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
import argparse, calendar, json, os, re, sys
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
    """Monthly totals: steps, km, intensity minutes (vigorous counts double, like Garmin does)."""
    steps = dist_m = 0.0
    days = api.get_daily_steps(first.isoformat(), min(last, date.today()).isoformat())
    for d in days or []:
        steps += d.get("totalSteps") or 0
        dist_m += d.get("totalDistance") or 0
    minutes = 0
    cur = first
    while cur <= min(last, date.today()):
        try:
            s = api.get_stats(cur.isoformat())
            minutes += (s.get("moderateIntensityMinutes") or 0) + 2 * (s.get("vigorousIntensityMinutes") or 0)
        except Exception as e:  # one bad day must not abort the whole run
            print(f"warn: stats {cur}: {e}", file=sys.stderr)
        cur = date.fromordinal(cur.toordinal() + 1)
    return {"steps": round(steps), "km": round(dist_m / 1000, 2), "minutes": round(minutes)}


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
    }


SEEN = HERE / "seen.json"
DONE_RATIO = 0.8  # a challenge that vanished from the API before its end, last seen at >= 80 %, counts as completed


def remember_completed(out, first, last):
    """Garmin drops a completed challenge from the "non-completed" list. We remember the
    challenges we have seen, and if one vanishes before its deadline (and was almost done,
    or has no measurable goal), we show it as completed."""
    today = date.today().isoformat()
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
        if k in now or n["key"] in HIDE or (n["end"] and n["end"] < today) or n["start"] > last.isoformat():
            continue
        if n["kind"] == "flag" or (n["target"] and n["current"] >= DONE_RATIO * n["target"]):
            done = dict(n, earned=True, inferred=True)
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

    out = remember_completed(out, first, last)
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
    return out


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
    totals = month_totals(api, first, last)
    data = {
        "updated": datetime.now().isoformat(timespec="seconds"),
        "user": api.get_full_name(),
        "month": f"{y}-{m:02d}", "monthStart": first.isoformat(), "monthEnd": last.isoformat(),
        "totals": totals, "challenges": challenges(api, first, last, totals),
    }
    Path(a.out).write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"OK -> {a.out}: {totals}, challenges: {len(data['challenges'])}")


if __name__ == "__main__":
    main()
