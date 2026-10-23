/* Garmin challenges widget. Embed it in a page:
 *   <div id="garmin-widget" data-src="https://your.site/data.json"></div>
 *   <script src="garmin-widget.js"></script>
 * Optional attributes: data-refresh-url, data-theme="light|dark", data-theme-toggle="off",
 *                      data-lang="cs|en", data-lang-toggle="off", data-pace-days="7", data-reload-minutes="15", data-tab="challenges|month|year", data-badges="10"
 */
(function () {
  // ---- UI texts (languages: cs, en) ----
  function plural(n, one, few, many) { return n === 1 ? one : n < 5 ? few : many; }
  var STR = {
    cs: {
      locale: "cs-CZ",
      units: { steps: "kroků", km: "km", minutes: "min", activities: "aktivit" },
      short: { steps: "kr.", activities: "akt." },
      months: ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"],
      dm: function (day, month) { return day + "." + month + "."; },
      stamp: function (day, month, yy, time) { return day + "." + month + "." + yy + " " + time; },
      title: "Garmin: ",
      tiles: { steps: "kroků", km: "km", minutes: "aktivních" },
      left: function (x) { return "zbývá " + x; },
      perDay: function (v, n) { return "↳ " + v + " / den (" + n + " " + plural(n, "den", "dny", "dní") + ")"; },
      estimate: "odhad: ",
      today: function (a, b) { return "dnes " + a + " z " + b; },
      todayDone: "✔ dnešní dávka splněna",
      done: "✔ splněno", notDone: "nesplněno", endedOn: "nesplněno – skončilo ",
      starts: " – začíná ", waiting: "čeká na start", running: "probíhá",
      noGoal: "údaje o cíli nejsou k dispozici",
      updated: "Aktualizováno ", reload: "Načíst znovu", mode: "Režim: ", light: "světlý", dark: "tmavý",
      error: "Chyba načtení: ", langTitle: "Jazyk: čeština",
      tabs: { challenges: "Výzvy", month: "Měsíc", year: "Rok" },
      monthsShort: ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"],
      yearTotal: "Celkem za rok: ", bestMonth: "Nejlepší měsíc: ", perDayAvg: function (x) { return "Ø " + x + " / den"; },
      metrics: { steps: "Kroky", km: "Km", minutes: "Minuty" },
      onTrack: function (ok, n) { return "Stíháš " + ok + (n === 2 || n === 3 || n === 6 || n === 7 ? " ze " : " z ") + n + (n === 1 ? " výzvy" : " výzev"); },
      allDone: "Všechny výzvy splněny", doneCount: function (n) { return n + " splněno"; },
      expedition: { climb: "Výstup", hike: "Túra" },
      badgeKind: { challenge: "Výzva", other: "Odznak" },
      badgesTitle: "Poslední odznaky", pts: function () { return "b."; },
      sportsTitle: "Čas podle sportu", times: function (n) { return n + "×"; },
      sports: { walking: "Chůze", archery: "Lukostřelba", jump_rope: "Švihadlo", running: "Běh", cycling: "Cyklistika", hiking: "Turistika", strength_training: "Silový trénink", yoga: "Jóga", swimming: "Plavání", indoor_cardio: "Kardio", other: "Ostatní" },
      goalLabel: "cíl ", chartAvg: "Průměr za den: ", chartBest: "Nejlepší den: ", noData: "data po dnech nejsou k dispozici"
    },
    en: {
      locale: "en-US",
      units: { steps: "steps", km: "km", minutes: "min", activities: "activities" },
      short: { steps: "steps", activities: "act." },
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dm: function (day, month, mon) { return day + " " + mon; },
      stamp: function (day, month, yy, time, mon) { return day + " " + mon + " " + yy + " " + time; },
      title: "Garmin: ",
      tiles: { steps: "steps", km: "km", minutes: "active" },
      left: function (x) { return x + " left"; },
      perDay: function (v, n) { return "↳ " + v + " / day (" + n + " " + (n === 1 ? "day" : "days") + ")"; },
      estimate: "estimate: ",
      today: function (a, b) { return "today " + a + " of " + b; },
      todayDone: "✔ today's quota done",
      done: "✔ done", notDone: "not completed", endedOn: "not completed – ended ",
      starts: " – starts ", waiting: "not started", running: "in progress",
      noGoal: "no goal data available",
      updated: "Updated ", reload: "Reload", mode: "Mode: ", light: "light", dark: "dark",
      error: "Load error: ", langTitle: "Language: English",
      tabs: { challenges: "Challenges", month: "Month", year: "Year" },
      monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      yearTotal: "Year total: ", bestMonth: "Best month: ", perDayAvg: function (x) { return "avg " + x + " / day"; },
      metrics: { steps: "Steps", km: "Km", minutes: "Minutes" },
      onTrack: function (ok, n) { return "On track for " + ok + " of " + n + (n === 1 ? " challenge" : " challenges"); },
      allDone: "All challenges completed", doneCount: function (n) { return n + " completed"; },
      expedition: { climb: "Climb", hike: "Hike" },
      badgeKind: { challenge: "Challenge", other: "Badge" },
      badgesTitle: "Latest badges", pts: function (n) { return n === 1 ? "pt" : "pts"; },
      sportsTitle: "Time by sport", times: function (n) { return n + "×"; },
      sports: { walking: "Walking", archery: "Archery", jump_rope: "Jump rope", running: "Running", cycling: "Cycling", hiking: "Hiking", strength_training: "Strength training", yoga: "Yoga", swimming: "Swimming", indoor_cardio: "Cardio", other: "Other" },
      goalLabel: "goal ", chartAvg: "Daily average: ", chartBest: "Best day: ", noData: "no per-day data available"
    }
  };
  var S = STR.cs;  // texts of the widget being rendered (set at the start of render)
  var REPO = "https://github.com/subrova/garmin-widget";  // the copyright line links here
  var UNIT_DEC = { steps: 0, km: 1, minutes: 0, activities: 1 };

  var DARK = "--gw-card:#1c2430;--gw-txt:#fff;--gw-line:transparent;--gw-bar:#34404f;--gw-ok:#2ec4b6;--gw-mid:#ffd166;--gw-warn:#ff9f43;--gw-bad:#ef6f6c;--gw-mut:#9aa7b8;--gw-head:#fff;--gw-s1:#2ec4b6;--gw-s2:#ff9f43;--gw-s3:#8ab4ff;--gw-s4:#c39bff;--gw-s5:#ff7eb6;--gw-s6:#ffd166;",
    LIGHT = "--gw-card:#fff;--gw-txt:#1b2430;--gw-line:#dde3ea;--gw-bar:#e3e8ee;--gw-ok:#12877d;--gw-mid:#a86d00;--gw-warn:#c2570c;--gw-bad:#c53030;--gw-mut:#5b6878;--gw-head:#1b2430;--gw-s1:#12877d;--gw-s2:#d9730d;--gw-s3:#3b6fd4;--gw-s4:#8e5bd6;--gw-s5:#d6336c;--gw-s6:#a86d00;";
  // theme: data-theme="light" | "dark" (when not set, the phone setting is used; afterwards the toggle button decides)
  var css = ".gw{" + DARK + "}" +
    "@media (prefers-color-scheme:light){.gw:not(.gw-dark){" + LIGHT + "}}" +
    ".gw.gw-light{" + LIGHT + "}.gw.gw-dark{" + DARK + "}" +
    ".gw{font-family:system-ui,sans-serif;display:grid;gap:10px;max-width:480px}" +
    ".gw-c{background:var(--gw-card);color:var(--gw-txt);border:1px solid var(--gw-line);border-radius:14px;padding:12px 14px}" +
    ".gw-h{display:flex;justify-content:space-between;font-weight:600}" +
    ".gw-bar{height:8px;background:var(--gw-bar);border-radius:4px;margin:8px 0;overflow:hidden}" +
    ".gw-bar i{display:block;height:100%;background:var(--gw-ok)}" +
    ".gw-r{display:flex;justify-content:space-between;font-size:13px;opacity:.85}" +
    ".gw-d{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:15px;margin-top:6px;color:var(--gw-mid);font-weight:600}" +
    ".gw-f{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gw-f .gw-h{font-size:14px;margin-bottom:6px}" +
    ".gw-s{font-size:16px;font-weight:400;opacity:.6}" +
    ".gw-hr{display:flex;align-items:center;gap:8px}.gw-th,.gw-lg{background:none;border:0;padding:0;flex:none;text-align:center;font:inherit;line-height:1;color:var(--gw-mut);cursor:pointer}" +
    ".gw-th,.gw-lg{display:flex;align-items:center;justify-content:center;height:20px}.gw-th{width:24px;font-size:18px}.gw-lg{width:26px}.gw-lg svg{display:block;margin:0 auto;border-radius:2px}" +
    ".gw-m{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 2px 0;font-size:20px;font-weight:700;color:var(--gw-head)}" +
    ".gw-c.gw-done{opacity:.6;filter:grayscale(.8)}" +
    ".gw-t3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center}.gw-t3 .gw-c{padding:10px 6px}" +
    ".gw-n{font-size:18px;font-weight:700}.gw-l{font-size:11px;opacity:.65;margin-top:2px}" +
    ".gw-p{font-size:13px;font-weight:400;color:var(--gw-mut)}" +
    ".gw-rf{background:none;border:0;padding:0 2px;margin-left:4px;font:inherit;font-size:16px;line-height:1;color:var(--gw-mut);cursor:pointer}" +
    "@keyframes gw-spin{to{transform:rotate(360deg)}}.gw-rf.gw-spin{display:inline-block;animation:gw-spin .8s linear infinite}" +
    ".gw-td{margin-top:2px}" +
    ".gw-ex{display:inline-block;vertical-align:-2px;margin-right:6px;color:var(--gw-mut)}" +
    ".gw-sum{margin:6px 2px 2px;font-size:15px;font-weight:600}" +
    ".gw-sbar{display:flex;height:10px;border-radius:5px;overflow:hidden;margin:8px 0}.gw-sbar i{display:block;height:100%}" +
    ".gw-sr{display:flex;justify-content:space-between;gap:8px;font-size:13px;margin-top:4px}.gw-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}" +
    ".gw-tabs{display:flex;background:var(--gw-bar);border-radius:12px;padding:3px}" +
    ".gw-tab{flex:1;background:none;color:var(--gw-mut);border:0;border-radius:9px;padding:7px 0;font:inherit;font-size:14px;font-weight:600;cursor:pointer}" +
    ".gw-tab.gw-on{background:var(--gw-card);color:var(--gw-txt);box-shadow:0 1px 3px rgba(0,0,0,.28)}" +
    ".gw-pills{display:flex;gap:6px;margin-bottom:10px}.gw-pill{background:none;color:var(--gw-mut);border:1px solid var(--gw-mut);border-radius:999px;padding:3px 12px;font:inherit;font-size:12px;cursor:pointer}" +
    ".gw-pill.gw-on{background:var(--gw-ok);border-color:var(--gw-ok);color:var(--gw-card)}" +
    ".gw-chart{display:block;width:100%;height:auto}.gw-b{fill:var(--gw-ok);cursor:pointer}.gw-b.gw-today{fill:var(--gw-mid)}.gw-b.gw-sel{stroke:var(--gw-txt);stroke-width:1.2}" +
    ".gw-ax{fill:var(--gw-mut);font-size:9px}.gw-goal{stroke:var(--gw-mut);stroke-width:1;stroke-dasharray:3 3}" +
    ".gw-cap{margin-top:6px;font-size:15px}.gw-cap b{font-weight:700}" +
    ".gw-cr{color:inherit;text-decoration:none}.gw-cr:hover{text-decoration:underline}" +
    ".gw-ctl{display:flex;align-items:center;gap:0}" +
    ".gw-u{display:flex;justify-content:space-between;gap:8px;margin:-4px 2px 0;font-size:13px;color:var(--gw-mut)}";

  function fmt(v, dec) { return Number(v).toLocaleString(S.locale, { maximumFractionDigits: dec }); }
  // value + unit; minutes are shown as "3 h 45 min"
  function val(v, unit, withUnit) {
    if (unit === "minutes") {
      var m = Math.round(v), h = Math.floor(m / 60);
      return h ? h + " h" + (m % 60 ? " " + (m % 60) + " min" : "") : m + " min";
    }
    var name = S.units[unit] || "";
    return fmt(v, UNIT_DEC[unit] == null ? 1 : UNIT_DEC[unit]) + (withUnit && name ? " " + name : "");
  }
  // value + shortened unit, used for the "remaining" label
  function rest(v, unit) {
    if (unit === "minutes") return val(v, unit);
    var name = S.short[unit] || S.units[unit] || "";
    return fmt(v, UNIT_DEC[unit] == null ? 1 : UNIT_DEC[unit]) + " " + name;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  // challenge name in the current language (names without a Czech translation stay in English)
  function nm(c, lang) {
    return esc(lang === "en" ? (c.name_en || c.name) : c.name);
  }

  function title(d, btns) {
    var p = (d.month || "").split("-"), m = S.months[+p[1] - 1] ? S.months[+p[1] - 1] + " " + p[0].slice(2) : "";
    return "<span>" + S.title + m + "</span>" + '<span class="gw-hr">' + (d.user ? '<small class="gw-s">' + esc(d.user) + "</small>" : "") + btns + "</span>";
  }
  function stamp(s) {  // e.g. "7.10.26 22:19" (no seconds, two-digit year)
    var x = new Date(s), z = function (n) { return (n < 10 ? "0" : "") + n; };
    var mon = STR.en.months[x.getMonth()].slice(0, 3);
    return S.stamp(x.getDate(), x.getMonth() + 1, z(x.getFullYear() % 100), x.getHours() + ":" + z(x.getMinutes()), mon);
  }
  function totals(d) {
    var s = d.totals; if (!s || s.steps == null) return "";
    function tile(v, label) { return '<div class="gw-c"><div class="gw-n">' + v + '</div><div class="gw-l">' + label + "</div></div>"; }
    return '<div class="gw-t3">' + tile(val(s.steps, "steps"), S.tiles.steps) + tile(val(s.km, "km"), S.tiles.km) + tile(val(s.minutes, "minutes"), S.tiles.minutes) + "</div>";
  }
  // theme icons as inline SVG (font glyphs sit at different heights than the flag)
  var ICON = {
    light: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
    dark: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>'
  };
  function sysTheme() { return window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; }
  function themeBtn(el) {
    if (el.getAttribute("data-theme-toggle") === "off") return "";
    var m = el.getAttribute("data-theme");
    return '<button class="gw-th" type="button" title="' + S.mode + S[m] + '">' + ICON[m] + "</button>";
  }
  // US flag: 13 stripes, blue canton with a simplified star field
  function usFlag() {
    var g = '<svg viewBox="0 0 19 13" width="22" height="15" preserveAspectRatio="none"><rect width="19" height="13" fill="#f1f3f5"/>', r, c;
    for (r = 0; r < 13; r += 2) g += '<rect y="' + r + '" width="19" height="1" fill="#b22234"/>';
    g += '<rect width="7.6" height="7" fill="#3c3b6e"/>';
    for (r = 0; r < 4; r++) for (c = 0; c < 5; c++) g += '<circle cx="' + (0.9 + c * 1.4) + '" cy="' + (1 + r * 1.6) + '" r=".35" fill="#fff"/>';
    return g + "</svg>";
  }
  // expedition icons (inline SVG): climb = mountain, hike = winding trail
  var EXP_ICON = {
    climb: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M2 20l7-12 4 6 3-4 6 10z"/></svg>',
    hike: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19h8a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7h8"/></svg>'
  };
  // icons of the other badge kinds: trophy = challenge badge, star = any other badge
  EXP_ICON.challenge = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';
  EXP_ICON.other = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9z"/></svg>';
  // inline SVG flags (emoji flags are not rendered on Windows)
  var FLAG = {
    cs: '<svg viewBox="0 0 3 2" width="22" height="15"><rect width="3" height="1" fill="#f1f3f5"/><rect y="1" width="3" height="1" fill="#d7141a"/><path d="M0 0l1.5 1L0 2z" fill="#11457e"/></svg>',
    en: usFlag()
  };
  function langBtn(el) {
    if (el.getAttribute("data-lang-toggle") === "off") return "";
    var l = el.getAttribute("data-lang");
    return '<button class="gw-lg" type="button" title="' + S.langTitle + '">' + FLAG[l] + "</button>";
  }
  function render(el, d) {
    var lang = el.getAttribute("data-lang");
    var paceDays = Math.max(2, Math.min(60, parseInt(el.getAttribute("data-pace-days"), 10) || 7));  // length of the pace window
    S = STR[lang];
    var today = new Date();
    // today by LOCAL time (toISOString would use UTC, so right after midnight it would still be yesterday)
    var iso = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
    var left = Math.max(1, Math.floor((new Date(d.monthEnd) - new Date(iso)) / 864e5) + 1);
    var html = "";
    var flags = [];
    var sumTotal = 0, sumOk = 0, sumDone = 0;  // for the summary line: challenges on track / completed
    function dm(x) { var p = x.split("-"); return S.dm(+p[2], +p[1], STR.en.months[+p[1] - 1].slice(0, 3)); }
    // "Month" tab: bar chart of the chosen metric per day of the month
    function monthTab() {
      var daily = d.daily;
      if (!daily || !daily.length) return '<div class="gw-c"><div class="gw-r">' + S.noData + "</div></div>";
      var metric = el.getAttribute("data-metric") || "steps";
      var by = {}; daily.forEach(function (x) { by[x.date] = x; });
      var days = [];
      for (var t = new Date(d.monthStart + "T00:00:00Z"), e = new Date(d.monthEnd + "T00:00:00Z"); t <= e; t = new Date(t.getTime() + 864e5)) days.push(t.toISOString().slice(0, 10));
      var vals = days.map(function (k) { return by[k] ? by[k][metric] : null; });
      var f = function (v) { return v == null ? "–" : (metric === "minutes" ? val(v, "minutes") : val(v, metric, true)); };
      var done = [], best = -1;
      vals.forEach(function (v, i) { if (v != null && days[i] < iso) done.push(v); if (v != null && (best < 0 || v > vals[best])) best = i; });
      if (!done.length) vals.forEach(function (v) { if (v != null) done.push(v); });  // only today so far
      var avg = done.length ? done.reduce(function (a, b) { return a + b; }, 0) / done.length : 0;
      var sel = parseInt(el.getAttribute("data-sel"), 10);
      if (isNaN(sel) || sel < 0 || sel >= days.length) { sel = days.indexOf(iso); if (sel < 0 || vals[sel] == null) sel = best; }
      var W = 320, H = 150, pl = 4, pr = 4, pt = 14, pb = 18, n = days.length, slot = (W - pl - pr) / n, bw = slot * 0.72;
      // Garmin's own daily step goal (it can change from day to day); only steps have one
      var goals = days.map(function (k) { return metric === "steps" && by[k] && by[k].goal ? by[k].goal : null; });
      var max = Math.max.apply(null, vals.concat(goals).filter(function (v) { return v != null; }).concat([1])) * 1.12;
      var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
      var svg = '<svg class="gw-chart" viewBox="0 0 ' + W + " " + H + '" role="img">';
      days.forEach(function (k, i) {
        var v = vals[i]; if (v == null || v <= 0) return;
        svg += '<rect class="gw-b' + (k === iso ? " gw-today" : "") + (i === sel ? " gw-sel" : "") + '" data-i="' + i + '" x="' + (pl + i * slot + (slot - bw) / 2).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - pb - y(v)).toFixed(1) + '" rx="1.5"><title>' + dm(k) + " – " + f(v) + "</title></rect>";
      });
      var pts = [], lastG = null, lastX = 0;  // stepped dashed line through the daily goals
      goals.forEach(function (g, i) {
        if (g == null) return;
        var x0 = pl + i * slot, x1 = x0 + slot, yy = y(g).toFixed(1);
        pts.push(x0.toFixed(1) + "," + yy, x1.toFixed(1) + "," + yy); lastG = g; lastX = x1;
      });
      if (pts.length) {
        var room = lastX < W - pr - 48;  // the label goes into the empty space of the future days when there is room
        svg += '<polyline class="gw-goal" fill="none" points="' + pts.join(" ") + '"/>' +
          '<text class="gw-ax" text-anchor="' + (room ? "start" : "end") + '" x="' + (room ? lastX + 3 : lastX).toFixed(1) + '" y="' + (room ? y(lastG) + 3 : y(lastG) - 3).toFixed(1) + '">' + S.goalLabel + val(lastG, "steps") + "</text>";
      }
      [1, 5, 10, 15, 20, 25, 30].forEach(function (dd) { if (dd <= n) svg += '<text class="gw-ax" text-anchor="middle" x="' + (pl + (dd - 1) * slot + slot / 2).toFixed(1) + '" y="' + (H - 4) + '">' + dd + "</text>"; });
      svg += "</svg>";
      var pills = ["steps", "km", "minutes"].map(function (m) { return '<button class="gw-pill' + (m === metric ? " gw-on" : "") + '" type="button" data-m="' + m + '">' + S.metrics[m] + "</button>"; }).join("");
      return '<div class="gw-c"><div class="gw-pills">' + pills + "</div>" + svg +
        '<div class="gw-cap"><b>' + dm(days[sel]) + "</b> – " + f(vals[sel]) + "</div>" +
        '<div class="gw-p">' + S.chartAvg + f(avg) + (best >= 0 ? " · " + S.chartBest + dm(days[best]) + " (" + f(vals[best]) + ")" : "") + "</div></div>" + sportsCard();
    }
    // time per sport this month: stacked bar + list (top 4 sports, the rest is merged into "other")
    function sportsCard() {
      var list = (d.sports || []).filter(function (x) { return x.minutes > 0; });
      if (!list.length) return "";
      var top = list.slice(0, list.length > 5 ? 4 : 5), rest = list.slice(top.length);
      if (rest.length) top.push({ type: "other", minutes: rest.reduce(function (a, b) { return a + b.minutes; }, 0), count: rest.reduce(function (a, b) { return a + b.count; }, 0) });
      var total = top.reduce(function (a, b) { return a + b.minutes; }, 0);
      // fixed colour per known sport; other sports take the spare colours in order, "other" is grey
      var FIXED = { walking: 1, archery: 2, jump_rope: 3 }, spare = [4, 5, 6], spareAt = 0, col = {};
      top.forEach(function (x) { col[x.type] = x.type === "other" ? "var(--gw-mut)" : "var(--gw-s" + (FIXED[x.type] || spare[spareAt++ % spare.length]) + ")"; });
      var color = function (i, t) { return col[t]; };
      var nameOf = function (t) { return S.sports[t] || esc(t.replace(/_/g, " ").replace(/^./, function (c) { return c.toUpperCase(); })); };
      var bar = top.map(function (x, i) { return '<i style="width:' + (x.minutes / total * 100).toFixed(1) + "%;background:" + color(i, x.type) + '"></i>'; }).join("");
      var rows = top.map(function (x, i) {
        return '<div class="gw-sr"><span><i class="gw-dot" style="background:' + color(i, x.type) + '"></i>' + nameOf(x.type) + "</span><span>" +
          val(x.minutes, "minutes") + " · " + Math.round(x.minutes / total * 100) + " % · " + S.times(x.count) + "</span></div>";
      }).join("");
      return '<div class="gw-c"><div class="gw-h"><span>' + S.sportsTitle + "</span><span>" + val(total, "minutes") + '</span></div><div class="gw-sbar">' + bar + "</div>" + rows + "</div>";
    }
    // "Year" tab: bar chart of the chosen metric per month of the current year
    function yearTab() {
      var yr = d.year;
      if (!yr || !yr.months || !yr.months.length) return '<div class="gw-c"><div class="gw-r">' + S.noData + "</div></div>";
      var metric = el.getAttribute("data-metric") || "steps";
      var by = {}; yr.months.forEach(function (x) { by[x.month] = x; });
      var keys = []; for (var m = 1; m <= 12; m++) keys.push(yr.year + "-" + ("0" + m).slice(-2));
      var nowKey = iso.slice(0, 7);
      var vals = keys.map(function (k) { return by[k] ? by[k][metric] : null; });
      var f = function (v) { return v == null ? "–" : (metric === "minutes" ? val(v, "minutes") : val(v, metric, true)); };
      var total = 0, best = -1;
      vals.forEach(function (v, i) { if (v != null) { total += v; if (best < 0 || v > vals[best]) best = i; } });
      var sel = parseInt(el.getAttribute("data-ysel"), 10);
      if (isNaN(sel) || sel < 0 || sel > 11 || vals[sel] == null) sel = keys.indexOf(nowKey);
      var dim = function (i) { return keys[i] === nowKey ? +iso.slice(8) : new Date(yr.year, i + 1, 0).getDate(); };  // days counted in the month
      var W = 320, H = 150, pl = 4, pr = 4, pt = 14, pb = 18, slot = (W - pl - pr) / 12, bw = slot * 0.7;
      var max = Math.max.apply(null, vals.filter(function (v) { return v != null; }).concat([1])) * 1.1;
      var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
      var svg = '<svg class="gw-chart" viewBox="0 0 ' + W + " " + H + '" role="img">';
      keys.forEach(function (k, i) {
        var v = vals[i];
        svg += '<text class="gw-ax" text-anchor="middle" x="' + (pl + i * slot + slot / 2).toFixed(1) + '" y="' + (H - 4) + '">' + S.monthsShort[i] + "</text>";
        if (v == null || v <= 0) return;
        svg += '<rect class="gw-b' + (k === nowKey ? " gw-today" : "") + (i === sel ? " gw-sel" : "") + '" data-y="' + i + '" x="' + (pl + i * slot + (slot - bw) / 2).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - pb - y(v)).toFixed(1) + '" rx="1.5"><title>' + S.months[i] + " – " + f(v) + "</title></rect>";
      });
      svg += "</svg>";
      var pills = ["steps", "km", "minutes"].map(function (mm) { return '<button class="gw-pill' + (mm === metric ? " gw-on" : "") + '" type="button" data-m="' + mm + '">' + S.metrics[mm] + "</button>"; }).join("");
      var per = vals[sel] != null ? " (" + S.perDayAvg(f(vals[sel] / dim(sel))) + ")" : "";
      return '<div class="gw-c"><div class="gw-pills">' + pills + "</div>" + svg +
        '<div class="gw-cap"><b>' + S.months[sel] + "</b> – " + f(vals[sel]) + '<span class="gw-p">' + per + "</span></div>" +
        '<div class="gw-p">' + S.yearTotal + f(total) + (best >= 0 ? " · " + S.bestMonth + S.months[best] + " (" + f(vals[best]) + ")" : "") + "</div></div>" + badgesCard();
    }
    // latest earned badges (name, date, points)
    function badgesCard() {
      var list = (d.badges || []).slice(0, Math.max(1, Math.min(30, parseInt(el.getAttribute("data-badges"), 10) || 10)));  // data-badges, default 10
      if (!list.length) return "";
      var rows = list.map(function (b) {
        var k = b.expedition || b.kind || "other", ico = '<span class="gw-ex" title="' + (S.expedition[k] || S.badgeKind[k]) + '">' + EXP_ICON[k] + "</span>";
        return '<div class="gw-sr"><span>' + ico + nm(b, lang) + "</span><span>" + dm(b.date) + (b.points ? " · " + b.points + " " + S.pts(b.points) : "") + "</span></div>";
      }).join("");
      return '<div class="gw-c"><div class="gw-h"><span>' + S.badgesTitle + "</span></div>" + rows + "</div>";
    }
    (d.challenges || []).forEach(function (c) {
      if (c.kind === "flag") { flags.push(c); return; }
      if (c.target == null || c.current == null) {
        html += '<div class="gw-c"><div class="gw-h">' + nm(c, lang) + "</div><div class='gw-r'>" + S.noGoal + "</div></div>";
        return;
      }
      var pct = Math.min(100, Math.round(c.current / c.target * 100));
      var rem = Math.max(0, c.target - c.current);
      var from = c.start && c.start > iso ? c.start : iso;  // before the start we count from the start date
      var cl = c.end ? Math.max(1, Math.floor((new Date(c.end) - new Date(from)) / 864e5) + 1) : left;
      // daily goal, stable during the day = (remaining + what was added today) / days from today inclusive
      var tdy = c.today || 0, perDay = (rem + tdy) / cl;
      // pace = average progress per COMPLETE day over the last PACE_DAYS days (data-pace-days, default 7).
      // s1 = progress at the start of today; the history ("hist") holds the start-of-day progress per date.
      var since = c.start && c.start < iso ? c.start : (c.start ? iso : d.monthStart);
      var elapsed = Math.max(1, Math.floor((new Date(iso) - new Date(since)) / 864e5) + 1);
      var s1 = c.current - tdy, rate = elapsed > 1 ? s1 / (elapsed - 1) : c.current;  // fallback: whole-period average
      var ws = new Date(new Date(iso).getTime() - paceDays * 864e5).toISOString().slice(0, 10), d0 = null;
      Object.keys(c.hist || {}).sort().forEach(function (k) { if (d0 === null && k >= ws && k >= since && k < iso) d0 = k; });
      if (d0 !== null) {
        var span = Math.round((new Date(iso) - new Date(d0)) / 864e5);
        if (span >= 3) rate = (s1 - c.hist[d0]) / span;  // fewer than 3 days of history: keep the fallback
      }
      var onPace = rate * cl >= c.target - s1;
      var proj = "";
      if (rem && rate > 0 && !(c.end && c.end < iso) && !(c.start && c.start > iso)) {
        if (onPace) {
          var fin = new Date(new Date(iso).getTime() + (Math.ceil((c.target - s1) / rate) - 1) * 864e5);
          proj = S.estimate + dm(fin.toISOString().slice(0, 10));
        } else proj = S.estimate + Math.round((s1 + rate * cl) / c.target * 100) + " %";
      }
      var todayLine = "";
      if (rem && tdy > 0 && !(c.end && c.end < iso) && !(c.start && c.start > iso))
        todayLine = '<div class="gw-p gw-td">' + (tdy >= perDay ? S.todayDone : S.today(val(tdy, c.unit), val(perDay, c.unit, true))) + "</div>";
      var over = c.end && c.end < iso, future = c.start && c.start > iso;
      if (!future) { sumTotal++; if (!rem) { sumDone++; sumOk++; } else if (!over && onPace) sumOk++; }
      var tail = rem ? (over ? S.endedOn + dm(c.end)
        : S.perDay(val(perDay, c.unit, true), cl) + (future ? S.starts + dm(c.start) : ""))
        : S.done + (c.earnedDate ? " " + dm(c.earnedDate) : "");
      html += '<div class="gw-c' + (rem ? "" : " gw-done") + '"><div class="gw-h"><span>' + nm(c, lang) + "</span><span>" + pct + " %</span></div>" +
        '<div class="gw-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="gw-r"><span>' + val(c.current, c.unit) + " / " + val(c.target, c.unit, true) + "</span><span>" + (rem ? S.left(rest(rem, c.unit)) : "") + "</span></div>" +
        '<div class="gw-d"' + (rem && !future ? ' style="color:' + (over ? "var(--gw-bad)" : onPace ? "var(--gw-ok)" : "var(--gw-warn)") + '"' : "") + "><span>" + tail + "</span>" + (proj ? '<span class="gw-p">' + proj + "</span>" : "") + "</div>" + todayLine + "</div>";
    });
    if (flags.length) {
      html += '<div class="gw-f">' + flags.map(function (c) {
        var st = c.earned ? [S.done + (c.earnedDate ? " " + dm(c.earnedDate) : ""), "var(--gw-ok)"] : (c.start > iso ? [S.waiting, "var(--gw-mut)"] : (c.end < iso ? [S.notDone, "var(--gw-bad)"] : [S.running, "var(--gw-mid)"]));
        return '<div class="gw-c' + (c.earned ? " gw-done" : "") + '"><div class="gw-h"><span>' + nm(c, lang) + '</span></div><div class="gw-r">' + dm(c.start) + " – " + dm(c.end) +
          '</div><div class="gw-d" style="color:' + st[1] + '">' + st[0] + "</div></div>";
      }).join("") + "</div>";
    }
    var summary = "";
    if (sumTotal) {
      var allGood = sumOk === sumTotal;
      summary = '<div class="gw-sum" style="color:var(--gw-' + (allGood ? "ok" : "warn") + ')">' +
        (sumDone === sumTotal ? S.allDone : S.onTrack(sumOk, sumTotal) + (sumDone ? " · " + S.doneCount(sumDone) : "")) + "</div>";
    }
    var tab = ["month", "year"].indexOf(el.getAttribute("data-tab")) >= 0 ? el.getAttribute("data-tab") : "challenges";
    var tabsBar = '<div class="gw-tabs">' + ["challenges", "month", "year"].map(function (k) { return '<button class="gw-tab' + (k === tab ? " gw-on" : "") + '" type="button" data-t="' + k + '">' + S.tabs[k] + "</button>"; }).join("") + "</div>";
    el.innerHTML = "<style>" + css + '</style><div class="gw gw-' + el.getAttribute("data-theme") + '"><h2 class="gw-m">' + title(d, '<span class="gw-ctl">' + langBtn(el) + themeBtn(el) + "</span>") + "</h2>" + totals(d) + tabsBar + (tab === "month" ? monthTab() : tab === "year" ? yearTab() : summary + html) +
      '<div class="gw-u"><span>' + S.updated + stamp(d.updated) + ' <button class="gw-rf" type="button" title="' + S.reload + '">↻</button></span>' +
      '<span><a class="gw-cr" href="' + REPO + '" target="_blank" rel="noopener">© ' + new Date().getFullYear() + " Sharkie</a></span></div></div>";
  }
  function init(el) {
    var src = el.getAttribute("data-src") || "data.json";
    var savedTheme, savedLang;
    var savedTab;
    try { savedTheme = localStorage.getItem("gw-theme"); savedLang = localStorage.getItem("gw-lang"); savedTab = localStorage.getItem("gw-tab"); } catch (e) {}
    if (!el.getAttribute("data-tab") && savedTab) el.setAttribute("data-tab", savedTab);
    // first start: saved choice, else the attribute from the HTML, else the phone setting
    var theme = ICON[savedTheme] ? savedTheme : ICON[el.getAttribute("data-theme")] ? el.getAttribute("data-theme") : sysTheme();
    el.setAttribute("data-theme", theme);
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    var lang = STR[savedLang] ? savedLang : STR[el.getAttribute("data-lang")] ? el.getAttribute("data-lang") : (STR[nav] ? nav : "en");
    el.setAttribute("data-lang", lang);
    function announce() { document.dispatchEvent(new CustomEvent("gw-theme", { detail: el.getAttribute("data-theme") })); }
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".gw-th"); if (!b) return;
      var next = el.getAttribute("data-theme") === "light" ? "dark" : "light";
      el.setAttribute("data-theme", next);
      try { localStorage.setItem("gw-theme", next); } catch (err) {}
      var g = el.querySelector(".gw"); if (g) g.className = "gw gw-" + next;
      b.innerHTML = ICON[next]; b.title = S.mode + S[next];
      announce();
    });
    // tabs, metric pills and chart bars: re-render from the data already loaded
    el.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".gw-tab, .gw-pill, .gw-b"); if (!t || !el._gwData) return;
      if (t.classList.contains("gw-tab")) {
        el.setAttribute("data-tab", t.getAttribute("data-t"));
        try { localStorage.setItem("gw-tab", t.getAttribute("data-t")); } catch (err) {}
      } else if (t.classList.contains("gw-pill")) el.setAttribute("data-metric", t.getAttribute("data-m"));
      else if (t.hasAttribute("data-y")) el.setAttribute("data-ysel", t.getAttribute("data-y"));
      else el.setAttribute("data-sel", t.getAttribute("data-i"));
      render(el, el._gwData);
    });
    // language toggle: re-render from the data already loaded
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".gw-lg"); if (!b || !el._gwData) return;
      var next = el.getAttribute("data-lang") === "cs" ? "en" : "cs";
      el.setAttribute("data-lang", next);
      try { localStorage.setItem("gw-lang", next); } catch (err) {}
      render(el, el._gwData);
    });
    function load() {
      return fetch(src + (src.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now()).then(function (r) { return r.json(); })
        .then(function (d) { el._gwData = d; render(el, d); announce(); }).catch(function (e) { S = STR[el.getAttribute("data-lang")]; el.textContent = S.error + e; });
    }
    // manual refresh: optionally calls data-refresh-url (a server that runs fetch_garmin.py), then reloads data.json
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".gw-rf"); if (!b || b.classList.contains("gw-spin")) return;
      b.classList.add("gw-spin");
      var url = el.getAttribute("data-refresh-url");
      var t0 = Date.now();
      (url ? fetch(url, { method: "POST" }).catch(function () {}) : Promise.resolve()).then(load).then(function () {
        var nb = el.querySelector(".gw-rf"); if (nb) nb.classList.add("gw-spin");
        setTimeout(function () { var x = el.querySelector(".gw-rf"); if (x) x.classList.remove("gw-spin"); }, Math.max(0, 700 - (Date.now() - t0)));
      });
    });
    load();
    // auto-reload interval in minutes (data-reload-minutes, default 15, minimum 1, 0 = off)
    var attr = el.getAttribute("data-reload-minutes"), mins = attr === null || attr === "" ? 15 : parseFloat(attr);
    if (isNaN(mins)) mins = 15;
    if (mins > 0) setInterval(load, Math.max(1, mins) * 60 * 1000);
  }
  function go() { var e = document.querySelectorAll("#garmin-widget,[data-garmin-widget]"); for (var i = 0; i < e.length; i++) init(e[i]); }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go();
})();
