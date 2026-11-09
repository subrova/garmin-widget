#!/usr/bin/env python3
"""Regenerates the demo data (docs/demo-data.json) and the README screenshots (docs/screenshots/*.png):
four views (challenges, month, year, settings opened) in both themes - the dark ones in Czech, the light ones in English.

    python3 docs/make_screenshots.py

The demo data is random but seeded and always relative to today, so the screenshots look consistent whenever
they are regenerated. Nothing here is real Garmin data. Challenge and badge names are translated with names.cs.json,
exactly as the widget does it for real data.

Needs Google Chrome (or Chromium) and Pillow (`pip install pillow`) - development tools, not needed to run the widget.
Re-run it whenever a change alters how the widget looks, then check the images.
"""
import calendar, functools, json, random, shutil, subprocess, sys, tempfile, threading
from datetime import date, datetime, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from czech_names import localize  # the same month-aware Czech names as the real data

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = DOCS / "screenshots"
WIDTH, SCALE, MAX_HEIGHT = 420, 2, 1900   # phone width, 2x resolution, a window taller than any view
RADIUS = 44                                # rounded corners, in image pixels (about 22 CSS px)
BORDER = 3                                 # outline, in image pixels (1.5 CSS px): keeps the edge visible on white and dark pages
BORDER_COLORS = {"light": (139, 148, 158, 170),   # neutral grey, semi-transparent
                 "dark": (176, 186, 200, 225)}    # lighter and stronger: a dark screenshot on a dark page needs more contrast
# (tab, theme, settings panel open?) - dark first, as in the README; "settings" shows the first tab with the panel opened
VIEWS = [(tab, theme, False) for theme in ("dark", "light") for tab in ("challenges", "month", "year")]
VIEWS = [v for theme in ("dark", "light") for v in [x for x in VIEWS if x[1] == theme] + [("challenges", theme, True)]]
LANG = {"dark": "cs", "light": "en"}      # the dark screenshots are Czech, the light ones English
PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{{margin:0;padding:16px;background:{bg};color:{fg}}}</style></head>
<body><div id="garmin-widget" data-src="docs/demo-data.json" data-lang="{lang}" data-theme="{theme}" data-tab="{tab}" data-reload-minutes="0"></div>
<script src="garmin-widget.js"></script>{extra}</body></html>
"""
# the settings view: open the gear panel as soon as the widget has rendered, and show the whole panel (no inner scrolling)
OPEN_SETTINGS = ('<style>.gw-set{max-height:none!important}</style>'
                 '<script>var t=setInterval(function(){var g=document.querySelector(".gw-gear");if(g){clearInterval(t);g.click();}},50);</script>')
COLORS = {"dark": ("#0f141b", "#fff"), "light": ("#eef1f5", "#1b2430")}


NAMES_CS = json.loads((ROOT / "names.cs.json").read_text()) if (ROOT / "names.cs.json").exists() else {}


def czech(key, english):
    """Czech name of a demo challenge / badge (the demo data is always about the running month)."""
    template = NAMES_CS.get(key + date.today().strftime("_%Y_%m")) or NAMES_CS.get(key)
    return localize(template, date.today().month) or english


def make_demo_data():
    """Random demo data of the running month, the year so far, sports, badges and challenges."""
    r = random.Random(2026)
    today = date.today()
    y, m = today.year, today.month
    first, last = date(y, m, 1), date(y, m, calendar.monthrange(y, m)[1])
    iso = lambda d: d.isoformat()

    daily = []
    for i in range(today.day):
        d = first + timedelta(days=i)
        steps = max(1800, min(int(r.gauss(9800, 3300)), 19500))
        if d == today:
            steps = int(steps * 0.55)
        daily.append({"date": iso(d), "steps": steps, "km": max(round(steps * 0.00078 + r.uniform(-.2, .3), 2), 0.5),
                      "minutes": max(0, int(r.gauss(48, 26))), "goal": 7000})
    totals = {"steps": sum(x["steps"] for x in daily), "km": round(sum(x["km"] for x in daily), 2),
              "minutes": sum(x["minutes"] for x in daily)}

    sports = [{"type": "walking", "minutes": 742.0, "count": 22, "km": 51.3},
              {"type": "cycling", "minutes": 318.5, "count": 5, "km": 96.8},
              {"type": "strength_training", "minutes": 203.0, "count": 6, "km": 0.0},
              {"type": "yoga", "minutes": 96.0, "count": 4, "km": 0.0},
              {"type": "swimming", "minutes": 84.0, "count": 2, "km": 2.6},
              {"type": "running", "minutes": 61.0, "count": 2, "km": 9.4}]

    months = []
    for mm in range(1, m):
        s = r.randint(205000, 318000)
        months.append({"month": f"{y}-{mm:02d}", "steps": s, "km": round(s * 0.00079, 2), "minutes": r.randint(900, 2100)})
    months.append({"month": f"{y}-{m:02d}", **totals})

    def badge(key, name, kind, days_ago, points, expedition=None):
        when = today - timedelta(days=days_ago)  # a challenge badge is named after the month it was earned in ("MONTH" in the name)
        name = name.replace("MONTH", when.strftime("%B"))
        cs = localize(NAMES_CS.get(key), when.month) if "MONTH" in name or kind == "challenge" else None
        return {"key": key, "name": cs or name, "name_en": name, "translated": key in NAMES_CS, "expedition": expedition, "kind": kind,
                "date": iso(when), "points": points, "count": 1}
    badges = [badge("virtual_climb_mont_blanc", "Mont Blanc", "expedition", 9, 4, "climb"),
              badge("challenge_total_step_100k", "Step into MONTH", "challenge", 13, 2),
              badge("challenge_top_3_weeklysteps", "MONTH Steps Podium", "challenge", 13, 2),
              badge("activity_new_sport", "Try Something New", "other", 20, 1),
              badge("virtual_hike_camino_de_santiago", "Camino de Santiago", "expedition", 34, 4, "hike"),
              badge("challenge_total_activity_20", "Active MONTH", "challenge", 36, 2),
              badge("wellness_sleep_savant", "Sleep Savant", "other", 41, 1),
              badge("challenge_walk_3mi", "MONTH Weekend Walking", "challenge", 47, 1),
              badge("virtual_climb_kosciuszko", "Kosciuszko", "expedition", 60, 4, "climb"),
              badge("challenge_total_walk_15_hours", "MONTH Time to Walk", "challenge", 61, 1)]

    def cumulative(values):  # start-of-day progress per date + the total
        hist, c = {}, 0.0
        for d, v in zip(daily, values):
            hist[d["date"]] = round(c, 2)
            c += v
        return hist, round(c, 2)
    hs, cs = cumulative([x["steps"] for x in daily])
    hw, cw = cumulative([round(x["minutes"] * 0.6, 1) for x in daily])
    acts = [1 if r.random() < .62 else 0 for _ in daily]
    ha, ca = cumulative(acts)
    hk, ck = cumulative([round(x["km"] * 0.8, 2) for x in daily])

    def progress(name, key, unit, target, current, hist, end, today_amount, **extra):
        d = {"name": czech(key, name), "name_en": name, "key": key, "translated": key in NAMES_CS, "source": "badge", "unit": unit, "target": target,
             "current": current, "start": iso(first), "end": end, "earned": False, "earnedDate": None, "kind": "progress",
             "today": today_amount, "hist": hist}
        d.update(extra)
        return d

    def flag(name, key, start, end, earned_days_ago=None):
        return {"name": czech(key, name), "name_en": name, "key": key, "translated": key in NAMES_CS, "source": "badge", "unit": None, "target": 0,
                "current": 0, "start": iso(start), "end": iso(end), "earned": earned_days_ago is not None,
                "earnedDate": iso(today - timedelta(days=earned_days_ago)) if earned_days_ago is not None else None, "kind": "flag"}
    saturday = today + timedelta(days=(5 - today.weekday()) % 7)
    mon = first.strftime("%B")  # English month name in the demo challenge names
    earned_at = first + timedelta(days=max(0, min(today.day - 2, 12)))  # completed inside its own period, never in the future
    challenges = [
        progress(f"Step into {mon}", "challenge_total_step_100k", "steps", 100000, 100000, {}, iso(first + timedelta(days=13)), 0,
                 earned=True, earnedDate=iso(earned_at), inferred=True),
        progress(f"Active {mon}", "challenge_total_activity_20", "activities", 20, float(ca), ha, iso(last), float(acts[-1])),
        progress(f"{mon} Time to Walk", "challenge_total_walk_15_hours", "minutes", 900, cw, hw, iso(last), round(daily[-1]["minutes"] * 0.6, 1)),
        progress(f"{mon} Step Month", "challenge_total_step_300k", "steps", 300000, float(cs), hs, iso(last), float(daily[-1]["steps"])),
        progress("2026 Walking - Stage 4", "challenge_total_walk_92mi", "km", 148.06, ck, hk, f"{y}-12-31", round(daily[-1]["km"] * 0.8, 2)),
        flag(f"{mon} Weekend Walking", "challenge_walk_3mi", saturday, saturday + timedelta(days=1)),
        flag(f"{mon} Steps Podium", "challenge_top_3_weeklysteps", first + timedelta(days=1), last + timedelta(days=1), 1 if today.day >= 3 else None)]

    data = {"updated": datetime.now().replace(microsecond=0).isoformat(), "user": "TrailRunner", "month": f"{y}-{m:02d}",
            "monthStart": iso(first), "monthEnd": iso(last), "totals": totals, "daily": daily, "sports": sports,
            "year": {"year": y, "months": months}, "badges": badges, "challenges": challenges}
    (DOCS / "demo-data.json").write_text(json.dumps(data, indent=1))
    print("demo data written")


def round_corners(img, color):
    """Rounded corners (transparent) plus a thin neutral outline."""
    w, h = img.size
    k = 4  # the mask is drawn 4x larger and shrunk, which smooths the edges
    mask = Image.new("L", (w * k, h * k), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w * k - 1, h * k - 1), radius=RADIUS * k, fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    img = img.convert("RGBA")
    img.putalpha(mask)
    # the outline is drawn the same way (4x, then shrunk) along the rounded edge
    ring = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    ImageDraw.Draw(ring).rounded_rectangle((0, 0, w * k - 1, h * k - 1), radius=RADIUS * k, outline=color, width=BORDER * k)
    return Image.alpha_composite(img, ring.resize((w, h), Image.LANCZOS))


def crop_to_content(img):
    """Cuts the empty page below the widget (the page background is the colour of the bottom-left pixel)."""
    img = img.convert("RGB")
    box = ImageChops.difference(img, Image.new("RGB", img.size, img.getpixel((0, img.height - 1)))).getbbox()
    return img.crop((0, 0, img.width, min(img.height, (box[3] if box else img.height) + 16 * SCALE)))


def main():
    chrome = next((p for p in (shutil.which(n) for n in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser")) if p), None)
    if not chrome:
        sys.exit("Google Chrome / Chromium not found")
    make_demo_data()
    OUT.mkdir(parents=True, exist_ok=True)
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *args):  # no request log
            pass
    handler = functools.partial(Quiet, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    pages = []
    try:
        with tempfile.TemporaryDirectory() as tmp:
            for tab, theme, settings in VIEWS:
                name = f"{'settings' if settings else tab}_{theme}"
                page = ROOT / f"_demo_{name}.html"
                pages.append(page)
                bg, fg = COLORS[theme]
                page.write_text(PAGE.format(bg=bg, fg=fg, lang=LANG[theme], theme=theme, tab=tab, extra=OPEN_SETTINGS if settings else ""))
                raw = Path(tmp) / f"{name}.png"
                subprocess.run([chrome, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
                                f"--force-device-scale-factor={SCALE}", f"--window-size={WIDTH},{MAX_HEIGHT}",
                                "--virtual-time-budget=8000", f"--screenshot={raw}", f"http://127.0.0.1:{port}/{page.name}"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90, check=True)
                img = round_corners(crop_to_content(Image.open(raw)), BORDER_COLORS[theme])
                img.save(OUT / f"{name}.png", optimize=True)
                print(f"{name}.png {img.size}")
    finally:
        server.shutdown()
        for page in pages:
            page.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
