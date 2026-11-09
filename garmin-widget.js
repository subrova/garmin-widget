/* Garmin challenges widget. Embed it in a page:
 *   <div id="garmin-widget" data-src="https://your.site/data.json"></div>
 *   <script src="garmin-widget.js"></script>
 * Optional attributes: data-refresh-url, data-theme="light|dark", data-theme-toggle="off", data-settings="off",
 *                      data-lang="cs|en", data-lang-toggle="off", data-pace-days="7", data-reload-minutes="15", data-tab="challenges|month|year", data-badges="10",
 *                      data-year-goal-steps="300000", data-year-goal-km="220", data-year-goal-hours="30"
 */
(function () {
  // ---- UI texts (languages: cs, en) ----
  function plural(n, one, few, many) { return n === 1 ? one : n < 5 ? few : many; }
  var STR = {
    cs: {
      locale: "cs-CZ",
      units: { steps: "kroků", km: "km", minutes: "min", activities: "aktivit" },
      activity1: "aktivita",
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
      error: "Chyba načtení: ", stale: "Nové údaje se nepodařilo načíst, zobrazují se poslední známé", langTitle: "Jazyk: čeština",
      settings: "Nastavení", close: "Zavřít", groupAppearance: "Vzhled", language: "Jazyk", theme: "Režim", themeLight: "Světlý", themeDark: "Tmavý",
      fontSize: "Velikost písma", groupGoals: "Cíle", goalsYear: "Roční graf – cíl na měsíc", goalsMonth: "Měsíční graf – cíl na den",
      goalsHint: "Prázdné = výchozí, 0 = bez čáry", gSteps: "Kroky", gKm: "Vzdálenost (km)", gHours: "Aktivní čas (h)", gMinutes: "Aktivní čas (min)", garminDefault: "Garmin",
      groupDisplay: "Zobrazení", sportsShown: "Počet samostatných sportů", hideDone: "Schovat splněné výzvy", yes: "Ano", no: "Ne", defaultMetricMonth: "Výchozí veličina – měsíční graf", defaultMetricYear: "Výchozí veličina – roční graf",
      groupCalc: "Výpočty", paceWindow: "Délka okna pro tempo", resetAll: "Obnovit výchozí hodnoty", resetAsk: "Klepni znovu pro potvrzení", resetCancelled: "Výchozí hodnoty nebyly obnoveny, chybělo potvrzení.", dayWord: function (n) { return plural(n, "den", "dny", "dní"); },
      tabs: { challenges: "Výzvy", month: "Měsíc", year: "Rok" },
      monthsShort: ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"],
      yearTotal: "Celkem za rok: ", bestMonth: "Nejlepší měsíc: ", perDayAvg: function (x) { return "Ø " + x + " / den"; },
      metrics: { steps: "Kroky", km: "Km", minutes: "Minuty" }, metricsYear: { steps: "Kroky", km: "Km", minutes: "Hodiny" },
      onTrack: function (ok, n) { return "Stíháš " + ok + (n === 2 || n === 3 || n === 6 || n === 7 ? " ze " : " z ") + n + (n === 1 ? " výzvy" : " výzev"); },
      allDone: "🎉 Gratuluju! Všechny výzvy splněny", doneCount: function (n) { return n + " splněno"; },
      expedition: { climb: "Výstup", hike: "Túra" },
      badgeKind: { challenge: "Výzva", other: "Odznak" },
      badgesTitle: "Poslední odznaky", pts: function () { return "b."; },
      avgTitle: "Průměrná délka aktivity",
      sportsTitle: "Čas podle sportu", times: function (n) { return n + "×"; },
      sports: { walking: "Chůze", archery: "Lukostřelba", jump_rope: "Švihadlo", running: "Běh", cycling: "Cyklistika", hiking: "Turistika", strength_training: "Silový trénink", yoga: "Jóga", swimming: "Plavání", indoor_cardio: "Kardio", other: "Ostatní" },
      cmpMonth: "vs minulý měsíc", cmpYear: "vs loni", cmpVsDay: " oproti minulému měsíci ke stejnému dni", cmpEnd: "Odhad na konci měsíce: ", cmpPrevEnd: " (minulý měsíc: ", cmpLastYear: "loni ",
      cmpYtd: function (a, b, p) { return "Dokončené měsíce: letos " + a + ", loni " + b + " (" + p + ")"; },
      streak: function (n, plus) { return "🔥 série " + n + (plus ? "+" : "") + " " + plural(n, "den", "dny", "dní"); }, streakBest: function (n) { return " · rekord " + n; }, streakTip: "dny za sebou s dosaženým denním cílem kroků (včetně tohoto dne)",
      goalLabel: "cíl ", chartAvg: "Průměr za den: ", chartBest: "Nejlepší den: ", noData: "data po dnech nejsou k dispozici"
    },
    en: {
      locale: "en-US",
      units: { steps: "steps", km: "km", minutes: "min", activities: "activities" },
      activity1: "activity",
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
      error: "Load error: ", stale: "Could not load new data, showing the last known", langTitle: "Language: English",
      settings: "Settings", close: "Close", groupAppearance: "Appearance", language: "Language", theme: "Theme", themeLight: "Light", themeDark: "Dark",
      fontSize: "Font size", groupGoals: "Goals", goalsYear: "Year chart – goal per month", goalsMonth: "Month chart – goal per day",
      goalsHint: "Empty = default, 0 = no line", gSteps: "Steps", gKm: "Distance (km)", gHours: "Active time (h)", gMinutes: "Active time (min)", garminDefault: "Garmin",
      groupDisplay: "Display", sportsShown: "Number of separate sports", hideDone: "Hide completed challenges", yes: "Yes", no: "No", defaultMetricMonth: "Default metric – month chart", defaultMetricYear: "Default metric – year chart",
      groupCalc: "Calculations", paceWindow: "Pace window length", resetAll: "Reset to defaults", resetAsk: "Tap again to confirm", resetCancelled: "Defaults were not restored, the confirmation was missing.", dayWord: function (n) { return n === 1 ? "day" : "days"; },
      tabs: { challenges: "Challenges", month: "Month", year: "Year" },
      monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      yearTotal: "Year total: ", bestMonth: "Best month: ", perDayAvg: function (x) { return "avg " + x + " / day"; },
      metrics: { steps: "Steps", km: "Km", minutes: "Minutes" }, metricsYear: { steps: "Steps", km: "Km", minutes: "Hours" },
      onTrack: function (ok, n) { return "On track for " + ok + " of " + n + (n === 1 ? " challenge" : " challenges"); },
      allDone: "🎉 Congratulations! All challenges completed", doneCount: function (n) { return n + " completed"; },
      expedition: { climb: "Climb", hike: "Hike" },
      badgeKind: { challenge: "Challenge", other: "Badge" },
      badgesTitle: "Latest badges", pts: function (n) { return n === 1 ? "pt" : "pts"; },
      avgTitle: "Average activity length",
      sportsTitle: "Time by sport", times: function (n) { return n + "×"; },
      sports: { walking: "Walking", archery: "Archery", jump_rope: "Jump rope", running: "Running", cycling: "Cycling", hiking: "Hiking", strength_training: "Strength training", yoga: "Yoga", swimming: "Swimming", indoor_cardio: "Cardio", other: "Other" },
      cmpMonth: "vs last month", cmpYear: "vs last year", cmpVsDay: " vs the previous month on the same day", cmpEnd: "Estimate for the end of the month: ", cmpPrevEnd: " (previous month: ", cmpLastYear: "last year ",
      cmpYtd: function (a, b, p) { return "Finished months: this year " + a + ", last year " + b + " (" + p + ")"; },
      streak: function (n, plus) { return "🔥 streak " + n + (plus ? "+" : "") + " " + (n === 1 ? "day" : "days"); }, streakBest: function (n) { return " · record " + n; }, streakTip: "days in a row with the daily step goal reached (including this day)",
      goalLabel: "goal ", chartAvg: "Daily average: ", chartBest: "Best day: ", noData: "no per-day data available"
    }
  };
  var S = STR.cs;  // texts of the widget being rendered (set at the start of render)
  var REPO = "https://github.com/subrova/garmin-widget";  // the copyright line links here
  var UNIT_DEC = { steps: 0, km: 2, minutes: 0, activities: 1 };

  // ---- settings: the user's choice (kept in the browser) beats the attribute in the HTML, which beats the built-in default ----
  var DEFS = {
    fontSize: { def: 100 },
    goalYearSteps: { attr: "data-year-goal-steps", def: 300000 }, goalYearKm: { attr: "data-year-goal-km", def: 220 }, goalYearHours: { attr: "data-year-goal-hours", def: 30 },
    goalMonthSteps: { def: null }, goalMonthKm: { def: null }, goalMonthMinutes: { def: null },   // null = Garmin's own daily step goal / no line
    sportsShown: { def: 4 }, hideDone: { def: false }, metricMonth: { def: "steps" }, metricYear: { def: "steps" },
    paceDays: { attr: "data-pace-days", def: 7 },
    compareMonth: { attr: "data-compare-month", def: false }, compareYear: { attr: "data-compare-year", def: false }   // chart comparison with the previous month / year (attribute value "on" turns it on by default)
  };
  var STEPPERS = {   // settings changed with - / + through a list of sensible values
    fontSize: { list: [90, 100, 110, 120], fmt: function (v) { return v + " %"; } },
    sportsShown: { list: [1, 2, 3, 4, 5, 6, 7, 8], fmt: String },
    paceDays: { list: [2, 3, 4, 5, 7, 10, 14, 21, 30, 45, 60], fmt: function (v) { return v + " " + S.dayWord(v); } }
  };
  function userSettings() { try { return JSON.parse(localStorage.getItem("gw-settings")) || {}; } catch (e) { return {}; } }
  function saveSetting(key, value) {
    var u = userSettings();
    if (value === null || value === undefined || value === "") delete u[key]; else u[key] = value;
    try { localStorage.setItem("gw-settings", JSON.stringify(u)); } catch (e) {}
  }
  function attrDefault(el, key) {
    var d = DEFS[key];
    if (typeof d.def === "boolean") return d.attr && el.getAttribute(d.attr) === "on" ? true : d.def;
    var n = d.attr ? parseFloat(el.getAttribute(d.attr)) : NaN;
    return isNaN(n) ? d.def : n;
  }
  function getSetting(el, key) {
    var all = userSettings(), u = all[key], def = attrDefault(el, key);
    if (u === undefined && (key === "metricMonth" || key === "metricYear")) u = all.metric;  // older versions had one shared choice
    if (u === undefined) return def;
    if (typeof def === "boolean") return u === true;
    if (key === "metricMonth" || key === "metricYear") return ["steps", "km", "minutes"].indexOf(u) >= 0 ? u : def;
    var n = Number(u);
    return isFinite(n) && n >= 0 ? n : def;
  }
  function commitInputs(el) {  // save the numbers typed into the panel (empty = back to the default)
    var inputs = el.querySelectorAll ? el.querySelectorAll(".gw-in") : [];
    for (var i = 0; i < inputs.length; i++) {
      var raw = inputs[i].value.trim().replace(",", "."), n = parseFloat(raw);
      saveSetting(inputs[i].getAttribute("data-key"), raw !== "" && isFinite(n) && n >= 0 ? n : null);
    }
  }
  function nearestIndex(list, v) { var best = 0; list.forEach(function (x, i) { if (Math.abs(x - v) < Math.abs(list[best] - v)) best = i; }); return best; }

  var DARK = "--gw-card:#1c2430;--gw-txt:#fff;--gw-line:transparent;--gw-bar:#34404f;--gw-ok:#2ec4b6;--gw-mid:#ffd166;--gw-warn:#ff9f43;--gw-bad:#ef6f6c;--gw-mut:#9aa7b8;--gw-head:#fff;--gw-s1:#2ec4b6;--gw-s2:#ff9f43;--gw-s3:#8ab4ff;--gw-s4:#c39bff;--gw-s5:#ff7eb6;--gw-s6:#ffd166;",
    LIGHT = "--gw-card:#fff;--gw-txt:#1b2430;--gw-line:#dde3ea;--gw-bar:#e3e8ee;--gw-ok:#12877d;--gw-mid:#a86d00;--gw-warn:#c2570c;--gw-bad:#c53030;--gw-mut:#5b6878;--gw-head:#1b2430;--gw-s1:#12877d;--gw-s2:#d9730d;--gw-s3:#3b6fd4;--gw-s4:#8e5bd6;--gw-s5:#d6336c;--gw-s6:#a86d00;";
  // theme: data-theme="light" | "dark" (when not set, the phone setting is used; afterwards the toggle button decides)
  var css = ".gw{" + DARK + "}" +
    "@media (prefers-color-scheme:light){.gw:not(.gw-dark){" + LIGHT + "}}" +
    ".gw.gw-light{" + LIGHT + "}.gw.gw-dark{" + DARK + "}" +
    ".gw{font-family:system-ui,sans-serif;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;max-width:480px;touch-action:pan-y;overflow-x:clip}" +
    ".gw-c{background:var(--gw-card);color:var(--gw-txt);border:1px solid var(--gw-line);border-radius:14px;padding:12px 14px}" +
    ".gw-h{display:flex;justify-content:space-between;font-weight:600}" +
    ".gw-bar{height:8px;background:var(--gw-bar);border-radius:4px;margin:8px 0;overflow:hidden}" +
    ".gw-bar i{display:block;height:100%;background:var(--gw-ok)}" +
    ".gw-r{display:flex;justify-content:space-between;font-size:13px;opacity:.85}" +
    ".gw-d{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:15px;margin-top:6px;color:var(--gw-mid);font-weight:600}" +
    ".gw-f{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}.gw-f .gw-h{display:block;font-size:14px;margin-bottom:6px}" +
    ".gw-f .gw-h span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".gw-s{font-size:16px;font-weight:400;opacity:.6}" +
    ".gw-hr{display:flex;align-items:center;gap:8px}" +
    ".gw-gear,.gw-x{background:none;border:0;padding:0;flex:none;display:flex;align-items:center;justify-content:center;font:inherit;line-height:1;color:var(--gw-mut);cursor:pointer}" +
    ".gw-gear{width:26px;height:22px}.gw-gear[aria-expanded=true]{color:var(--gw-txt)}.gw-x{width:22px;height:22px;font-size:20px}" +
    ".gw-hd{position:relative;z-index:20}" +
    ".gw-set{position:absolute;top:calc(100% + 6px);right:0;width:min(430px,100%);box-sizing:border-box;border:1px solid rgba(139,148,158,.45);box-shadow:0 10px 30px rgba(0,0,0,.38)}" +
    ".gw-set{max-height:min(calc(100vh - 64px),860px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--gw-mut) transparent}" +
    ".gw-h>span:last-child:not(:first-child){flex:none;white-space:nowrap}" +
    ".gw-m>span:first-child{white-space:nowrap}.gw-hr{min-width:0}.gw-s{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".gw-sv{min-width:52px;text-align:center;font-size:13px;color:var(--gw-txt);align-self:center}.gw-sb[disabled]{opacity:.35;cursor:default}.gw-stp{padding:5px 12px;font-size:15px;line-height:1}" +
    ".gw-in{width:104px;box-sizing:border-box;background:var(--gw-bar);color:var(--gw-txt);border:1px solid transparent;border-radius:8px;padding:5px 9px;font:inherit;font-size:13px;text-align:right;-moz-appearance:textfield}" +
    ".gw-in::-webkit-inner-spin-button,.gw-in::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.gw-in:focus{outline:none;border-color:var(--gw-ok)}.gw-in::placeholder{color:var(--gw-mut);opacity:.85}" +
    ".gw-rs{display:block;width:100%;margin-top:12px;padding:7px 10px;border-radius:10px;border:1px solid var(--gw-mut);background:none;color:var(--gw-txt);font:inherit;font-size:13px;cursor:pointer}" +
    ".gw-rs.gw-ask{background:var(--gw-warn);border-color:var(--gw-warn);color:var(--gw-card);font-weight:700}" +   // waiting for the second tap: a filled button
    ".gw-note{margin:0 2px 10px;padding:8px 12px;border-radius:10px;border:1px solid var(--gw-warn);color:var(--gw-warn);font-size:13px}" +
    ".gw-sub{margin:7px 0 1px;font-size:12px;font-weight:600;color:var(--gw-txt);opacity:.9}.gw-hint{font-size:11px;color:var(--gw-mut);margin:2px 0 4px}" +
    ".gw-sg{margin:9px 0 2px;padding-top:7px;border-top:1px solid rgba(139,148,158,.32);font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--gw-ok)}" +
    ".gw-set .gw-h+.gw-sg{margin-top:6px;padding-top:0;border-top:0}" +
    ".gw-st{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:4px 10px;margin:4px 0;font-size:14px}.gw-st>:first-child{white-space:nowrap}.gw-st>:nth-child(n+2){margin-left:auto}" +   // labels never wrap; on a narrow screen the control drops below its label
    ".gw-set .gw-sb{padding:4px 8px}" +
    ".gw-seg{display:flex;background:var(--gw-bar);border-radius:10px;padding:2px}" +
    ".gw-sb{display:flex;align-items:center;gap:6px;background:none;border:0;border-radius:8px;padding:4px 10px;font:inherit;font-size:13px;color:var(--gw-mut);cursor:pointer}" +
    ".gw-sb.gw-on{background:var(--gw-card);color:var(--gw-txt);box-shadow:0 1px 3px rgba(0,0,0,.28)}.gw-sb svg{display:block}.gw-sb .gw-fl{width:18px;height:12px;border-radius:2px}" +
    ".gw-m{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 2px 0;font-size:20px;font-weight:700;color:var(--gw-head)}" +
    ".gw-c.gw-done{opacity:.6;filter:grayscale(.8)}" +
    ".gw-t3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center}.gw-t3 .gw-c{padding:10px 6px}" +
    ".gw-n{font-size:18px;font-weight:700}.gw-l{font-size:11px;opacity:.65;margin-top:2px}" +
    ".gw-p{font-size:13px;font-weight:400;color:var(--gw-mut)}" +
    ".gw-rf{background:none;border:0;padding:0 2px;margin-left:4px;font:inherit;font-size:16px;line-height:1;color:var(--gw-mut);cursor:pointer}" +
    "@keyframes gw-spin{to{transform:rotate(360deg)}}.gw-rf.gw-spin{display:inline-block;animation:gw-spin .8s linear infinite}" +
    ".gw-td{margin-top:2px}" +
    "@keyframes gw-in-next{from{opacity:.3;transform:translateX(16px)}to{opacity:1;transform:none}}" +
    "@keyframes gw-in-prev{from{opacity:.3;transform:translateX(-16px)}to{opacity:1;transform:none}}" +
    ".gw-sl-next .gw-tabs ~ *{animation:gw-in-next .22s ease-out}.gw-sl-prev .gw-tabs ~ *{animation:gw-in-prev .22s ease-out}" +
    "@media (prefers-reduced-motion:reduce){.gw .gw-tabs ~ *{animation:none!important}}" +
    ".gw-stale{color:var(--gw-warn);cursor:help}" +
    ".gw-ex{display:inline-block;vertical-align:-2px;margin-right:6px;color:var(--gw-mut)}" +
    ".gw-sum{margin:6px 2px 2px;font-size:15px;font-weight:600}" +
    ".gw-sbar{display:flex;height:10px;border-radius:5px;overflow:hidden;margin:8px 0}.gw-sbar i{display:block;height:100%}" +
    ".gw-sr{display:flex;justify-content:space-between;gap:8px;font-size:13px;margin-top:4px}.gw-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}" +
    ".gw-tabs{display:flex;background:var(--gw-bar);border-radius:12px;padding:3px}" +
    ".gw-tab{flex:1;background:none;color:var(--gw-mut);border:0;border-radius:9px;padding:7px 0;font:inherit;font-size:14px;font-weight:600;cursor:pointer}" +
    ".gw-tab.gw-on{background:var(--gw-card);color:var(--gw-txt);box-shadow:0 1px 3px rgba(0,0,0,.28)}" +
    ".gw-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.gw-pill{background:none;color:var(--gw-mut);border:1px solid var(--gw-mut);border-radius:999px;padding:3px 12px;font:inherit;font-size:12px;cursor:pointer}" +
    ".gw-pill.gw-on{background:var(--gw-ok);border-color:var(--gw-ok);color:var(--gw-card)}" +
    ".gw-chart{display:block;width:100%;height:auto}.gw-b{fill:var(--gw-ok);cursor:pointer}.gw-b.gw-today{fill:var(--gw-mid)}.gw-b.gw-sel{stroke:var(--gw-txt);stroke-width:1.2}" +
    ".gw-gl{paint-order:stroke;stroke:var(--gw-card);stroke-width:3px;stroke-linejoin:round}" +
    ".gw-lgd{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--gw-mut);margin:-2px 0 6px}.gw-lgd i{display:inline-block;width:14px;height:0;border-top:2.5px solid var(--gw-ok);margin-right:5px;vertical-align:3px}.gw-lgd i.gw-dash{border-top:2px dashed var(--gw-mut)}.gw-lgd i.gw-sq{width:9px;height:9px;border:0;border-radius:2px;background:var(--gw-ok);vertical-align:-1px}.gw-lgd i.gw-sq.gw-prev{background:var(--gw-mut);opacity:.55}" +
    ".gw-cl{fill:none;stroke:var(--gw-ok);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}.gw-cp{fill:none;stroke:var(--gw-mut);stroke-width:2;stroke-dasharray:4 3}.gw-bp{fill:var(--gw-mut);opacity:.55}" +
    ".gw-ax{fill:var(--gw-mut);font-size:9px}.gw-goal{stroke:var(--gw-mut);stroke-width:1;stroke-dasharray:3 3}" +
    ".gw-cap{margin-top:14px;margin-bottom:5px;font-size:15px}.gw-cap b{font-weight:700}" +
    ".gw-cr{color:inherit;text-decoration:none}.gw-cr:hover{text-decoration:underline}" +
    ".gw-u{display:flex;justify-content:space-between;gap:8px;margin:-4px 2px 0;font-size:13px;color:var(--gw-mut)}";

  // mode "down" / "up" rounds in that direction instead of to the nearest (a tiny epsilon keeps 1.2 from becoming 1.1999...);
  // challenges show what is done rounded down and what is goal / left rounded up, so "1.2 of 1.2" never means "not done yet"
  function fmt(v, dec, mode) {
    if (mode) { var p = Math.pow(10, dec); v = mode === "down" ? Math.floor(v * p + 1e-9) / p : Math.ceil(v * p - 1e-9) / p; }
    return Number(v).toLocaleString(S.locale, { maximumFractionDigits: dec });
  }
  // value + unit; minutes are shown as "3 h 45 min"
  function val(v, unit, withUnit, mode) {
    if (unit === "minutes") {
      var m = mode === "down" ? Math.floor(v + 1e-9) : mode === "up" ? Math.ceil(v - 1e-9) : Math.round(v), h = Math.floor(m / 60);
      return h ? h + " h" + (m % 60 ? " " + (m % 60) + " min" : "") : m + " min";
    }
    var name = (unit === "activities" && Number(v) === 1 ? S.activity1 : own(S.units, unit)) || "";
    return fmt(v, own(UNIT_DEC, unit) == null ? 1 : UNIT_DEC[unit], mode) + (withUnit && name ? " " + name : "");
  }
  // value + shortened unit, used for the "remaining" label
  function rest(v, unit, mode) {
    if (unit === "minutes") return val(v, unit, false, mode);
    var name = own(S.short, unit) || own(S.units, unit) || "";
    return fmt(v, own(UNIT_DEC, unit) == null ? 1 : UNIT_DEC[unit], mode) + " " + name;
  }
  // numbers coming from data.json are always forced to real numbers before they go into the HTML
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function own(obj, key) { return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  // challenge name in the current language (names without a Czech translation stay in English)
  function nm(c, lang) {
    return esc(lang === "en" ? (c.name_en || c.name) : c.name);
  }

  function title(d, btns) {
    var p = (d.month || "").split("-"), m = S.months[+p[1] - 1] ? S.months[+p[1] - 1] + " " + esc(String(p[0]).slice(2)) : "";
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
  // ---- settings: a gear next to the name opens a panel under the header ----
  var GEAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  // the rows of the panel, grouped; a language / theme row is hidden when its toggle is switched off in the HTML
  function settingRows(el) {
    var u = userSettings(), html = "";
    var seg = function (key, cur, opts) {
      return '<span class="gw-seg">' + opts.map(function (o) {
        return '<button class="gw-sb' + (o[0] === cur ? " gw-on" : "") + '" type="button" data-set="' + key + '" data-v="' + o[0] + '">' + (o[2] || "") + o[1] + "</button>";
      }).join("") + "</span>";
    };
    var stepper = function (key) {
      var st = STEPPERS[key], i = nearestIndex(st.list, getSetting(el, key));
      return '<span class="gw-seg"><button class="gw-sb gw-stp" type="button" data-step="' + key + '" data-d="-1" aria-label="-"' + (i <= 0 ? " disabled" : "") + '>−</button>' +
        '<span class="gw-sv">' + st.fmt(st.list[i]) + '</span><button class="gw-sb gw-stp" type="button" data-step="' + key + '" data-d="1" aria-label="+"' + (i >= st.list.length - 1 ? " disabled" : "") + ">+</button></span>";
    };
    var numIn = function (key, label, placeholder) {
      var v = u[key];
      return '<div class="gw-st"><span>' + label + '</span><input class="gw-in" type="number" inputmode="decimal" min="0" step="any" data-key="' + key + '" placeholder="' + esc(placeholder) + '" value="' + (v === undefined ? "" : esc(v)) + '"></div>';
    };
    var row = function (label, control) { return '<div class="gw-st"><span>' + label + "</span>" + control + "</div>"; };
    var group = function (title, body) { return '<div class="gw-sg">' + title + "</div>" + body; };
    var flag = function (code) { return FLAG[code].replace("<svg ", '<svg class="gw-fl" '); };

    var look = "";
    if (el.getAttribute("data-lang-toggle") !== "off") look += row(S.language, seg("lang", el.getAttribute("data-lang"), [["cs", "Čeština", flag("cs")], ["en", "English", flag("en")]]));
    look += row(S.fontSize, stepper("fontSize"));
    if (el.getAttribute("data-theme-toggle") !== "off") look += row(S.theme, seg("theme", el.getAttribute("data-theme"), [["light", S.themeLight, ICON.light], ["dark", S.themeDark, ICON.dark]]));
    html += group(S.groupAppearance, look);

    html += group(S.groupGoals,
      '<div class="gw-sub">' + S.goalsYear + "</div>" +
      numIn("goalYearSteps", S.gSteps, attrDefault(el, "goalYearSteps")) + numIn("goalYearKm", S.gKm, attrDefault(el, "goalYearKm")) + numIn("goalYearHours", S.gHours, attrDefault(el, "goalYearHours")) +
      '<div class="gw-sub">' + S.goalsMonth + "</div>" +
      numIn("goalMonthSteps", S.gSteps, S.garminDefault) + numIn("goalMonthKm", S.gKm, "–") + numIn("goalMonthMinutes", S.gMinutes, "–") +
      '<div class="gw-hint">' + S.goalsHint + "</div>");

    html += group(S.groupDisplay,
      row(S.sportsShown, stepper("sportsShown")) +
      row(S.hideDone, seg("hideDone", getSetting(el, "hideDone") ? "1" : "0", [["0", S.no], ["1", S.yes]])) +
      row(S.defaultMetricMonth, seg("metricMonth", getSetting(el, "metricMonth"), [["steps", S.metrics.steps], ["km", S.metrics.km], ["minutes", S.metrics.minutes]])) +
      row(S.defaultMetricYear, seg("metricYear", getSetting(el, "metricYear"), [["steps", S.metricsYear.steps], ["km", S.metricsYear.km], ["minutes", S.metricsYear.minutes]])));

    html += group(S.groupCalc, row(S.paceWindow, stepper("paceDays")));
    html += '<button class="gw-rs' + (el._gwResetAsk ? " gw-ask" : "") + '" type="button">' + (el._gwResetAsk ? S.resetAsk : S.resetAll) + "</button>";
    return html;
  }
  function gearBtn(el) {
    if (el.getAttribute("data-settings") === "off") return "";
    return '<button class="gw-gear" type="button" aria-label="' + S.settings + '" aria-expanded="' + (el._gwSettings ? "true" : "false") + '" title="' + S.settings + '">' + GEAR + "</button>";
  }
  function settingsPanel(el) {
    if (!el._gwSettings) return "";
    var rows = settingRows(el);
    return '<div class="gw-c gw-set"><div class="gw-h"><span>' + S.settings + '</span><button class="gw-x" type="button" aria-label="' + S.close + '" title="' + S.close + '">×</button></div>' + rows + "</div>";
  }
  function render(el, d) {
    // the stylesheet is added to <head> once; putting a <style> into the re-rendered markup made the page flash on every tab switch
    if (!document.getElementById("gw-style")) { var st = document.createElement("style"); st.id = "gw-style"; st.textContent = css; document.head.appendChild(st); }
    commitInputs(el);  // numbers typed in the settings panel are saved before the markup is replaced
    // the markup is replaced on every change, so the panel would jump back to its top: remember its scroll position and the
    // focused control, and restore both afterwards
    var oldPanel = el.querySelector ? el.querySelector(".gw-set") : null, panelTop = oldPanel ? oldPanel.scrollTop : 0, focusSel = null;
    var ae = document.activeElement;
    if (oldPanel && ae && oldPanel.contains(ae)) {
      var at = function (n) { return ae.getAttribute(n); };
      focusSel = ae.hasAttribute("data-step") ? '.gw-set [data-step="' + at("data-step") + '"][data-d="' + at("data-d") + '"]'
        : ae.hasAttribute("data-set") ? '.gw-set [data-set="' + at("data-set") + '"][data-v="' + at("data-v") + '"]'
        : ae.classList.contains("gw-rs") ? ".gw-set .gw-rs" : null;
    }
    var lang = el.getAttribute("data-lang");
    var paceDays = Math.max(2, Math.min(60, parseInt(getSetting(el, "paceDays"), 10) || 7));  // length of the pace window
    var hideDone = getSetting(el, "hideDone"), fontSize = getSetting(el, "fontSize");
    var currentMetric = function (chart) {  // chart: "month" | "year"
      var m = el.getAttribute("data-metric-" + chart);
      return ["steps", "km", "minutes"].indexOf(m) >= 0 ? m : getSetting(el, chart === "year" ? "metricYear" : "metricMonth");
    };
    S = STR[lang];
    var today = new Date();
    // today by LOCAL time (toISOString would use UTC, so right after midnight it would still be yesterday)
    var iso = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
    var left = Math.max(1, Math.floor((new Date(d.monthEnd) - new Date(iso)) / 864e5) + 1);
    var html = "";
    var flags = [];
    var sumTotal = 0, sumOk = 0, sumDone = 0;  // for the summary line: challenges on track / completed
    var longHtml = "";  // challenges longer than a month: shown at the very bottom
    // long challenges (more than a month, e.g. 3 months) are shown every month, at the very bottom, and count in the summary
    // only in the month they end; short ones that straddle a month break (weekends, 4 weeks) count in the month that holds
    // most of their days (a tie goes to the later month)
    function longRun(c) { return !!(c.start && c.end && (new Date(c.end) - new Date(c.start)) / 864e5 + 1 > 31); }
    function belongsTo(c) {
      if (!c.end) return iso.slice(0, 7);
      if (!c.start || longRun(c)) return c.end.slice(0, 7);
      var cnt = {}, best = c.end.slice(0, 7);
      for (var t = new Date(c.start + "T00:00:00Z"), e = new Date(c.end + "T00:00:00Z"); t <= e; t = new Date(t.getTime() + 864e5)) { var k = t.toISOString().slice(0, 7); cnt[k] = (cnt[k] || 0) + 1; }
      Object.keys(cnt).sort().forEach(function (k) { if (cnt[k] >= (cnt[best] || 0)) best = k; });
      return best;
    }
    function counts(c) { return belongsTo(c) === iso.slice(0, 7); }
    function dm(x) { var p = String(x).split("-"), mon = STR.en.months[+p[1] - 1]; return mon ? S.dm(+p[2], +p[1], mon.slice(0, 3)) : ""; }
    // "Month" tab: bar chart of the chosen metric per day of the month
    function monthTab() {
      var daily = d.daily;
      if (!daily || !daily.length) return '<div class="gw-c"><div class="gw-r">' + S.noData + "</div></div>";
      var metric = currentMetric("month");
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
      // goal line: the user's goal per day if set (0 = no line); otherwise Garmin's own daily step goal (it can change
      // from day to day, steps only) or no line
      var custom = getSetting(el, metric === "steps" ? "goalMonthSteps" : metric === "km" ? "goalMonthKm" : "goalMonthMinutes");
      var goals = days.map(function (k) {
        if (custom === null) return metric === "steps" && by[k] && by[k].goal ? by[k].goal : null;
        return custom > 0 ? custom : null;
      });
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
          '<text class="gw-ax gw-gl" text-anchor="' + (room ? "start" : "end") + '" x="' + (room ? lastX + 3 : lastX).toFixed(1) + '" y="' + (room ? y(lastG) + 3 : y(lastG) - 3).toFixed(1) + '">' + S.goalLabel + (metric === "steps" ? fmt(lastG, 0) : f(lastG)) + "</text>";
      }
      [1, 5, 10, 15, 20, 25, 30].forEach(function (dd) { if (dd <= n) svg += '<text class="gw-ax" text-anchor="middle" x="' + (pl + (dd - 1) * slot + slot / 2).toFixed(1) + '" y="' + (H - 4) + '">' + dd + "</text>"; });
      svg += "</svg>";
      var pills = ["steps", "km", "minutes"].map(function (m) { return '<button class="gw-pill' + (m === metric ? " gw-on" : "") + '" type="button" data-c="month" data-m="' + m + '">' + S.metrics[m] + "</button>"; }).join("");
      var cmpPrev = d.prev && d.prev.daily && d.prev.daily.length;
      if (cmpPrev) pills += cmpPill("compareMonth", S.cmpMonth);
      if (cmpPrev && getSetting(el, "compareMonth")) return monthCompare(metric, pills, days, by, f) + sportsCard();
      return '<div class="gw-c"><div class="gw-pills">' + pills + "</div>" + svg +
        '<div class="gw-cap"><b>' + dm(days[sel]) + "</b> – " + f(vals[sel]) + (metric === "steps" ? streakText(days[sel], by) : "") + "</div>" +
        '<div class="gw-p">' + S.chartAvg + f(avg) + "</div>" + (best >= 0 ? '<div class="gw-p">' + S.chartBest + dm(days[best]) + " (" + f(vals[best]) + ")</div>" : "") + "</div>" + sportsCard();
    }
    // days in a row with the daily step goal reached, ending at day k (a running day that has not reached it yet counts the days before it);
    // the previous month's days are included, the rest of the series before them comes from d.streak (exact); without it a series reaching
    // the start of the data is shown as "N+"; the record is the longer of d.streak.best and the series itself
    function streakText(k, by) {
      var all = {}; (d.prev && d.prev.daily || []).forEach(function (x) { all[x.date] = x; }); Object.keys(by).forEach(function (x) { all[x] = by[x]; });
      var reached = function (x) { return all[x] && all[x].goal && all[x].steps >= all[x].goal; };
      var back = function (x) { return new Date(new Date(x + "T00:00:00Z").getTime() - 864e5).toISOString().slice(0, 10); };
      var cur = k;
      if (!reached(cur)) { if (cur !== iso) return ""; cur = back(cur); }
      var n = 0; while (reached(cur)) { n++; cur = back(cur); }
      var st = d.streak, exact = false;
      if (n && !all[cur] && st && st.baseEnd === cur) { n += num(st.base); exact = true; }
      var best = Math.max(st ? num(st.best) : 0, n);
      return n ? ' · <span style="color:var(--gw-ok)" title="' + S.streakTip + '">' + S.streak(n, !all[cur] && !exact) + "</span>" + (best > n ? '<span class="gw-p">' + S.streakBest(best) + "</span>" : "") : "";
    }
    function cmpPill(key, label) { return '<button class="gw-pill' + (getSetting(el, key) ? " gw-on" : "") + '" type="button" data-cmp="' + key + '">' + label + "</button>"; }
    // the month as running totals: this month (solid, up to today) against the previous month (dashed, whole month)
    function monthCompare(metric, pills, days, by, f) {
      var pm = d.prev.month, byP = {}; d.prev.daily.forEach(function (x) { byP[x.date] = x; });
      var n = days.length, pn = new Date(+pm.slice(0, 4), +pm.slice(5), 0).getDate(), N = Math.max(n, pn);
      var last = iso > d.monthEnd ? n - 1 : days.indexOf(iso);
      var cur = [], pr = [], c = 0;
      for (var i = 0; i <= last; i++) { c += by[days[i]] ? by[days[i]][metric] || 0 : 0; cur.push(c); }
      c = 0;
      for (var j = 1; j <= pn; j++) { var x = byP[pm + "-" + ("0" + j).slice(-2)]; c += x ? x[metric] || 0 : 0; pr.push(c); }
      var W = 320, H = 150, pl = 4, pr_ = 4, pt = 14, pb = 18;
      var max = Math.max(cur.length ? cur[cur.length - 1] : 0, pr[pr.length - 1], 1) * 1.12;
      var px = function (i) { return pl + i * (W - pl - pr_) / Math.max(1, N - 1); }, py = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
      var line = function (a) { return a.map(function (v, i) { return px(i).toFixed(1) + "," + py(v).toFixed(1); }).join(" "); };
      var svg = '<svg class="gw-chart" viewBox="0 0 ' + W + " " + H + '" role="img"><polyline class="gw-cp" points="' + line(pr) + '"/>';
      if (cur.length) svg += '<polyline class="gw-cl" points="' + line(cur) + '"/><circle cx="' + px(cur.length - 1).toFixed(1) + '" cy="' + py(cur[cur.length - 1]).toFixed(1) + '" r="3.5" style="fill:var(--gw-ok)"/>';
      [1, 5, 10, 15, 20, 25, 30].forEach(function (dd) { if (dd <= N) svg += '<text class="gw-ax" text-anchor="middle" x="' + px(dd - 1).toFixed(1) + '" y="' + (H - 4) + '">' + dd + "</text>"; });
      svg += "</svg>";
      var legend = '<div class="gw-lgd"><span><i></i>' + S.months[+d.month.slice(5) - 1] + '</span><span><i class="gw-dash"></i>' + S.months[+pm.slice(5) - 1] + "</span></div>";
      var out = '<div class="gw-c"><div class="gw-pills">' + pills + "</div>" + legend + svg;
      if (cur.length) {
        var now = cur[cur.length - 1], then = pr[Math.min(last, pn - 1)], diff = now - then;
        out += '<div class="gw-cap"><b>' + dm(days[last]) + "</b> – " + f(now) + "</div>" +
          '<div class="gw-p" style="color:var(--gw-' + (diff >= 0 ? "ok" : "warn") + ')">' + (diff >= 0 ? "+" : "−") + f(Math.abs(diff)) + S.cmpVsDay + " (" + f(then) + ")</div>";
        if (last < n - 1 && last > 0) out += '<div class="gw-p">' + S.cmpEnd + f(cur[last - 1] / last * n) + S.cmpPrevEnd + f(pr[pn - 1]) + ")</div>";  // the average of the complete days so far
      }
      return out + "</div>";
    }
    // time per sport this month: stacked bar + list (top 4 sports, the rest is merged into "other")
    function sportsCard() {
      var list = (d.sports || []).filter(function (x) { return x.minutes > 0; });
      if (!list.length) return "";
      var top = list.slice(0, getSetting(el, "sportsShown")), rest = list.slice(top.length);
      if (rest.length) top.push({ type: "other", minutes: rest.reduce(function (a, b) { return a + b.minutes; }, 0), count: rest.reduce(function (a, b) { return a + b.count; }, 0) });
      var total = top.reduce(function (a, b) { return a + b.minutes; }, 0);
      // fixed colour per known sport; other sports take the spare colours in order, "other" is grey
      var FIXED = { walking: 1, archery: 2, jump_rope: 3 }, spare = [4, 5, 6], spareAt = 0, col = {};
      top.forEach(function (x) { col[x.type] = x.type === "other" ? "var(--gw-mut)" : "var(--gw-s" + (FIXED[x.type] || spare[spareAt++ % spare.length]) + ")"; });
      var color = function (i, t) { return col[t]; };
      var nameOf = function (t) { return own(S.sports, t) || esc(t.replace(/_/g, " ").replace(/^./, function (c) { return c.toUpperCase(); })); };
      var bar = top.map(function (x, i) { return '<i style="width:' + (x.minutes / total * 100).toFixed(1) + "%;background:" + color(i, x.type) + '"></i>'; }).join("");
      var rows = top.map(function (x, i) {
        return '<div class="gw-sr"><span><i class="gw-dot" style="background:' + color(i, x.type) + '"></i>' + nameOf(x.type) + "</span><span>" +
          val(x.minutes, "minutes") + " · " + Math.round(x.minutes / total * 100) + " % · " + S.times(num(x.count)) + "</span></div>";
      }).join("");
      // second card: average length of one activity per sport (and overall)
      var count = top.reduce(function (a, b) { return a + b.count; }, 0);
      var avgRows = top.filter(function (x) { return x.count > 0; }).map(function (x, i) {
        return '<div class="gw-sr"><span><i class="gw-dot" style="background:' + color(i, x.type) + '"></i>' + nameOf(x.type) + "</span><span>" + val(x.minutes / x.count, "minutes") + "</span></div>";
      }).join("");
      return '<div class="gw-c"><div class="gw-h"><span>' + S.sportsTitle + "</span><span>" + val(total, "minutes") + '</span></div><div class="gw-sbar">' + bar + "</div>" + rows + "</div>" +
        '<div class="gw-c"><div class="gw-h"><span>' + S.avgTitle + "</span><span>" + (count ? val(total / count, "minutes") : "–") + "</span></div>" + avgRows + "</div>";
    }
    // "Year" tab: bar chart of the chosen metric per month of the current year
    function yearTab() {
      var yr = d.year;
      if (!yr || !yr.months || !yr.months.length) return '<div class="gw-c"><div class="gw-r">' + S.noData + "</div></div>";
      var metric = currentMetric("year");
      var by = {}; yr.months.forEach(function (x) { by[x.month] = x; });
      var keys = []; for (var m = 1; m <= 12; m++) keys.push(yr.year + "-" + ("0" + m).slice(-2));
      var nowKey = iso.slice(0, 7);
      var vals = keys.map(function (k) { return by[k] ? by[k][metric] : null; });
      var cmpPrev = yr.prev && yr.prev.months && yr.prev.months.length, cmp = cmpPrev && getSetting(el, "compareYear"), pby = {};
      if (cmp) yr.prev.months.forEach(function (x) { pby[x.month] = x; });
      var pvals = keys.map(function (k) { var x = cmp ? pby[(yr.year - 1) + k.slice(4)] : null; return x ? x[metric] : null; });
      var f = function (v) { return v == null ? "–" : (metric === "minutes" ? val(v, "minutes") : val(v, metric, true)); };
      var total = 0, best = -1;
      vals.forEach(function (v, i) { if (v != null) { total += v; if (best < 0 || v > vals[best]) best = i; } });
      var sel = parseInt(el.getAttribute("data-ysel"), 10);
      if (isNaN(sel) || sel < 0 || sel > 11 || vals[sel] == null) sel = keys.indexOf(nowKey);
      var dim = function (i) { return keys[i] === nowKey ? +iso.slice(8) : new Date(yr.year, i + 1, 0).getDate(); };  // days counted in the month
      var W = 320, H = 150, pl = 4, pr = 4, pt = 14, pb = 18, slot = (W - pl - pr) / 12, bw = slot * 0.7;
      // monthly goal line, configurable per metric (0 turns it off): data-year-goal-steps (default 300000),
      // data-year-goal-km (default 220), data-year-goal-hours (default 30, active minutes)
      var goal = metric === "steps" ? getSetting(el, "goalYearSteps") : metric === "km" ? getSetting(el, "goalYearKm") : getSetting(el, "goalYearHours") * 60;
      if (!(goal > 0)) goal = 0;
      var max = Math.max.apply(null, vals.concat(pvals).filter(function (v) { return v != null; }).concat([goal, 1])) * 1.1;
      var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
      var svg = '<svg class="gw-chart" viewBox="0 0 ' + W + " " + H + '" role="img">';
      keys.forEach(function (k, i) {
        var v = vals[i];
        svg += '<text class="gw-ax" text-anchor="middle" x="' + (pl + i * slot + slot / 2).toFixed(1) + '" y="' + (H - 4) + '">' + S.monthsShort[i] + "</text>";
        var pv = pvals[i];
        if (pv != null && pv > 0) svg += '<rect class="gw-bp" x="' + (pl + i * slot + slot / 2 - bw / 2).toFixed(1) + '" y="' + y(pv).toFixed(1) + '" width="' + (bw / 2 - 0.3).toFixed(1) + '" height="' + (H - pb - y(pv)).toFixed(1) + '" rx="1.5"><title>' + S.months[i] + " " + (yr.year - 1) + " – " + f(pv) + "</title></rect>";
        if (v == null || v <= 0) return;
        var bx = cmp ? pl + i * slot + slot / 2 + 0.3 : pl + i * slot + (slot - bw) / 2, bwc = cmp ? bw / 2 - 0.3 : bw;
        svg += '<rect class="gw-b' + (k === nowKey ? " gw-today" : "") + (i === sel ? " gw-sel" : "") + '" data-y="' + i + '" x="' + bx.toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + bwc.toFixed(1) + '" height="' + (H - pb - y(v)).toFixed(1) + '" rx="1.5"><title>' + S.months[i] + " – " + f(v) + "</title></rect>";
      });
      if (goal) svg += '<line class="gw-goal" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(goal).toFixed(1) + '" y2="' + y(goal).toFixed(1) + '"/>' +
        '<text class="gw-ax gw-gl" text-anchor="end" x="' + (W - pr) + '" y="' + (y(goal) - 3).toFixed(1) + '">' + S.goalLabel + (metric === "steps" ? fmt(goal, 0) : f(goal)) + "</text>";
      svg += "</svg>";
      var pills = ["steps", "km", "minutes"].map(function (mm) { return '<button class="gw-pill' + (mm === metric ? " gw-on" : "") + '" type="button" data-c="year" data-m="' + mm + '">' + S.metricsYear[mm] + "</button>"; }).join("");
      var per = vals[sel] != null ? " (" + S.perDayAvg(f(vals[sel] / dim(sel))) + ")" : "";
      if (cmpPrev) pills += cmpPill("compareYear", S.cmpYear);
      var legend = "", cmpLines = "";
      if (cmp) {
        legend = '<div class="gw-lgd"><span><i class="gw-sq"></i>' + num(yr.year) + '</span><span><i class="gw-sq gw-prev"></i>' + (num(yr.year) - 1) + "</span></div>";
        if (pvals[sel] != null && vals[sel] != null && pvals[sel] > 0) {
          var dp = Math.round((vals[sel] - pvals[sel]) / pvals[sel] * 100);
          cmpLines += '<div class="gw-p" style="color:var(--gw-' + (dp >= 0 ? "ok" : "warn") + ')">' + S.cmpLastYear + f(pvals[sel]) + " (" + (dp >= 0 ? "+" : "−") + Math.abs(dp) + " %)</div>";
        }
        var a = 0, b = 0;  // finished months only, so that the running month does not drag the comparison down
        keys.forEach(function (k, i) { if (k < nowKey && vals[i] != null && pvals[i] != null) { a += vals[i]; b += pvals[i]; } });
        if (b > 0) { var pt2 = Math.round((a - b) / b * 100); cmpLines += '<div class="gw-p">' + S.cmpYtd(f(a), f(b), (pt2 >= 0 ? "+" : "−") + Math.abs(pt2) + " %") + "</div>"; }
      }
      return '<div class="gw-c"><div class="gw-pills">' + pills + "</div>" + legend + svg +
        '<div class="gw-cap"><b>' + S.months[sel] + "</b> – " + f(vals[sel]) + '<span class="gw-p">' + per + "</span></div>" + cmpLines +
        '<div class="gw-p">' + S.yearTotal + f(total) + "</div>" + (best >= 0 ? '<div class="gw-p">' + S.bestMonth + S.months[best] + " (" + f(vals[best]) + ")</div>" : "") + "</div>" + badgesCard();
    }
    // latest earned badges (name, date, points)
    function badgesCard() {
      var list = (d.badges || []).slice(0, Math.max(1, Math.min(30, parseInt(el.getAttribute("data-badges"), 10) || 10)));  // data-badges, default 10
      if (!list.length) return "";
      var rows = list.map(function (b) {
        var k = own(EXP_ICON, b.expedition) ? b.expedition : own(EXP_ICON, b.kind) ? b.kind : "other", ico = '<span class="gw-ex" title="' + (own(S.expedition, k) || own(S.badgeKind, k)) + '">' + EXP_ICON[k] + "</span>";
        return '<div class="gw-sr"><span>' + ico + nm(b, lang) + "</span><span>" + dm(b.date) + (num(b.points) ? " · " + num(b.points) + " " + S.pts(num(b.points)) : "") + "</span></div>";
      }).join("");
      return '<div class="gw-c"><div class="gw-h" style="margin-bottom:8px"><span>' + S.badgesTitle + "</span></div>" + rows + "</div>";
    }
    (d.challenges || []).forEach(function (c) {
      if (!longRun(c) && belongsTo(c) < iso.slice(0, 7)) return;  // a short challenge of the previous month (it only ran into the first days of this one)
      if (c.kind === "flag") {
        // no percentage: counted as done when earned, as on track while it is still running or not started yet, as missed once it has ended
        if (counts(c)) { sumTotal++; if (c.earned) { sumDone++; sumOk++; } else if (!(c.end < iso)) sumOk++; }
        if (!(hideDone && c.earned)) flags.push(c);
        return;
      }
      if (c.target == null || c.current == null) {
        html += '<div class="gw-c"><div class="gw-h">' + nm(c, lang) + "</div><div class='gw-r'>" + S.noGoal + "</div></div>";
        return;
      }
      var rem = Math.max(0, c.target - c.current);
      // 100 % only for a really completed challenge: the percentage is rounded DOWN and never reaches 100 while something is missing
      var ratio = c.current / c.target * 100, pct = rem ? Math.min(99, Math.floor(ratio)) : 100, barW = rem ? Math.min(99.5, ratio) : 100;
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
      // the first 3 days of a challenge are too little data to judge: it counts as on track and no estimate is shown
      var young = elapsed <= 3;
      var onPace = young || rate * cl >= c.target - s1;
      var proj = "";
      if (rem && rate > 0 && !young && !(c.end && c.end < iso) && !(c.start && c.start > iso)) {
        if (onPace) {
          var fin = new Date(new Date(iso).getTime() + (Math.ceil((c.target - s1) / rate) - 1) * 864e5);
          proj = S.estimate + dm(fin.toISOString().slice(0, 10));
        } else proj = S.estimate + Math.min(99, Math.floor((s1 + rate * cl) / c.target * 100)) + " %";  // below 100 % by definition: rounded down
      }
      var todayLine = "", todayOk = false;  // today's quota done: just a tick after the daily goal, otherwise a line "today X of Y"
      if (rem && tdy > 0 && !(c.end && c.end < iso) && !(c.start && c.start > iso)) {
        if (tdy >= perDay) todayOk = true;
        else todayLine = '<div class="gw-p gw-td">' + S.today(val(tdy, c.unit, false, "down"), val(perDay, c.unit, true, "up")) + "</div>";
      }
      var over = c.end && c.end < iso, future = c.start && c.start > iso;
      if (counts(c)) { sumTotal++; if (!rem) { sumDone++; sumOk++; } else if (future || (!over && onPace)) sumOk++; }  // a challenge that has not started yet counts as on track
      var tail = rem ? (over ? S.endedOn + dm(c.end)
        : S.perDay(val(perDay, c.unit, true, "up"), cl) + (todayOk ? ' <span title="' + S.todayDone + '">✔</span>' : "") + (future ? S.starts + dm(c.start) : ""))
        : "";
      // completed: "done + date" takes the place of the "remaining" label and the daily-goal row is left out
      var right = rem ? S.left(rest(rem, c.unit, "up")) : S.done + (c.earnedDate ? " " + dm(c.earnedDate) : "");
      if (hideDone && !rem) return;  // completed challenges are hidden (they still count in the summary line)
      var card = '<div class="gw-c' + (rem ? "" : " gw-done") + '"><div class="gw-h"><span>' + nm(c, lang) + "</span><span>" + pct + " %</span></div>" +
        '<div class="gw-bar"><i style="width:' + barW.toFixed(1) + '%"></i></div>' +
        '<div class="gw-r"><span>' + val(c.current, c.unit, false, rem ? "down" : "up") + " / " + val(c.target, c.unit, true, "up") + "</span><span>" + right + "</span></div>" +
        (rem ? '<div class="gw-d"' + (!future ? ' style="color:' + (over ? "var(--gw-bad)" : onPace ? "var(--gw-ok)" : "var(--gw-warn)") + '"' : "") + "><span>" + tail + "</span>" + (proj ? '<span class="gw-p">' + proj + "</span>" : "") + "</div>" : "") + todayLine + "</div>";
      if (longRun(c)) longHtml += card; else html += card;
    });
    flags.sort(function (x, y) { return longRun(x) - longRun(y); });  // multi-month ones last (sort is stable in current browsers)
    if (flags.length) {
      html += '<div class="gw-f">' + flags.map(function (c) {
        var st = c.earned ? [S.done + (c.earnedDate ? " " + dm(c.earnedDate) : ""), "var(--gw-ok)"] : (c.start > iso ? [S.waiting, "var(--gw-mut)"] : (c.end < iso ? [S.notDone, "var(--gw-bad)"] : [S.running, "var(--gw-mid)"]));
        return '<div class="gw-c' + (c.earned ? " gw-done" : "") + '"><div class="gw-h"><span title="' + nm(c, lang) + '">' + nm(c, lang) + '</span></div><div class="gw-r">' + dm(c.start) + " – " + dm(c.end) +
          '</div><div class="gw-d" style="color:' + st[1] + '">' + st[0] + "</div></div>";
      }).join("") + "</div>";
    }
    html += longHtml;
    var summary = "";
    if (sumTotal) {
      var allGood = sumOk === sumTotal;
      summary = '<div class="gw-sum" style="color:var(--gw-' + (allGood ? "ok" : "warn") + ')">' +
        (sumDone === sumTotal ? S.allDone : S.onTrack(sumOk, sumTotal) + (sumDone ? " · " + S.doneCount(sumDone) : "")) + "</div>";
    }
    var tab = ["month", "year"].indexOf(el.getAttribute("data-tab")) >= 0 ? el.getAttribute("data-tab") : "challenges";
    var tabsBar = '<div class="gw-tabs">' + ["challenges", "month", "year"].map(function (k) { return '<button class="gw-tab' + (k === tab ? " gw-on" : "") + '" type="button" data-t="' + k + '">' + S.tabs[k] + "</button>"; }).join("") + "</div>";
    el.innerHTML = '<div class="gw gw-'  + el.getAttribute("data-theme") + (el._gwSlide ? " gw-sl-" + el._gwSlide : "") + '"' + (fontSize !== 100 ? ' style="zoom:' + fontSize / 100 + '"' : "") + '><div class="gw-hd"><h2 class="gw-m">' + title(d, gearBtn(el)) + "</h2>" + settingsPanel(el) + "</div>" + (el._gwNotice ? '<div class="gw-note" role="status">' + S.resetCancelled + "</div>" : "") + totals(d) + tabsBar + (tab === "month" ? monthTab() : tab === "year" ? yearTab() : summary + html) +
      '<div class="gw-u"><span>' + S.updated + stamp(d.updated) + ' <button class="gw-rf" type="button" title="' + S.reload + '">↻</button>' +
        (el._gwStale ? ' <span class="gw-stale" title="' + S.stale + '">⚠</span>' : "") + "</span>" +
      '<span><a class="gw-cr" href="' + REPO + '" target="_blank" rel="noopener">© ' + new Date().getFullYear() + " Sharkie</a></span></div></div>";
    el._gwSlide = null;
    var panel = el.querySelector(".gw-set");
    if (panel) {
      panel.scrollTop = panelTop;
      var again = focusSel && el.querySelector(focusSel);
      if (again && !again.hasAttribute("disabled")) again.focus({ preventScroll: true });
    }
  }
  function init(el) {
    var src = el.getAttribute("data-src") || "data.json";
    var savedTheme, savedLang;
    var savedTab;
    try { savedTheme = localStorage.getItem("gw-theme"); savedLang = localStorage.getItem("gw-lang"); savedTab = localStorage.getItem("gw-tab"); } catch (e) {}
    if (!el.getAttribute("data-tab") && savedTab) el.setAttribute("data-tab", savedTab);
    // first start: saved choice, else the attribute from the HTML, else the phone setting
    var theme = ICON[savedTheme] ? savedTheme : ICON[el.getAttribute("data-theme")] ? el.getAttribute("data-theme") : sysTheme();
    el._gwAttr = { lang: el.getAttribute("data-lang"), theme: el.getAttribute("data-theme") };  // the defaults of the site, for "reset"
    el.setAttribute("data-theme", theme);
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    var lang = STR[savedLang] ? savedLang : STR[el.getAttribute("data-lang")] ? el.getAttribute("data-lang") : (STR[nav] ? nav : "en");
    el.setAttribute("data-lang", lang);
    function announce() { document.dispatchEvent(new CustomEvent("gw-theme", { detail: el.getAttribute("data-theme") })); }
    // settings: the gear opens / closes the panel; segmented buttons, steppers and switches change a value and re-render
    el.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".gw-gear, .gw-x, .gw-sb, .gw-rs"); if (!t || !el._gwData) return;
      if (t.classList.contains("gw-rs")) {  // first tap asks, second tap resets everything to the defaults
        if (el._gwResetAsk) { resetSettings(); el._gwResetAsk = false; } else el._gwResetAsk = true;
        render(el, el._gwData);
        return;
      }
      var wasAsking = el._gwResetAsk;
      el._gwResetAsk = false;
      if (t.hasAttribute("data-step")) {  // - / + through a list of values
        if (t.hasAttribute("disabled")) return;
        var key = t.getAttribute("data-step"), list = STEPPERS[key].list, i = nearestIndex(list, getSetting(el, key)) + Number(t.getAttribute("data-d"));
        saveSetting(key, list[Math.max(0, Math.min(list.length - 1, i))]);
      } else if (t.classList.contains("gw-sb")) {
        var what = t.getAttribute("data-set"), v = t.getAttribute("data-v");
        if (what === "theme") {
          el.setAttribute("data-theme", v);
          try { localStorage.setItem("gw-theme", v); } catch (err) {}
          announce();
        } else if (what === "lang") {
          el.setAttribute("data-lang", v);
          try { localStorage.setItem("gw-lang", v); } catch (err) {}
        } else if (what === "hideDone") saveSetting("hideDone", v === "1");
        else if (what === "metricMonth" || what === "metricYear") {  // the new default applies at once
          saveSetting(what, v);
          el.removeAttribute(what === "metricYear" ? "data-metric-year" : "data-metric-month");
        }
      } else el._gwSettings = !el._gwSettings;  // the gear toggles, the cross closes
      if (t.classList.contains("gw-x")) el._gwSettings = false;
      if (wasAsking && !el._gwSettings) notCancelled();  // the panel was closed with the reset still waiting for its second tap
      render(el, el._gwData);
    });
    function resetSettings() {  // the user's choices go away; language and theme return to what the HTML / browser / phone say
      try { localStorage.removeItem("gw-settings"); localStorage.removeItem("gw-lang"); localStorage.removeItem("gw-theme"); } catch (err) {}
      var nav2 = (navigator.language || "en").slice(0, 2).toLowerCase(), a = el._gwAttr || {};
      el.setAttribute("data-lang", STR[a.lang] ? a.lang : STR[nav2] ? nav2 : "en");
      el.setAttribute("data-theme", ICON[a.theme] ? a.theme : sysTheme());
      ["data-metric-month", "data-metric-year", "data-sel", "data-ysel"].forEach(function (n) { el.removeAttribute(n); });
      var typed = el.querySelectorAll(".gw-in");  // numbers typed into the open panel would be saved again by the next render
      for (var k = 0; k < typed.length; k++) typed[k].value = "";
      announce();
    }
    function notCancelled() {  // a short notice that the reset was not confirmed
      el._gwNotice = true;
      clearTimeout(el._gwNoticeTimer);
      el._gwNoticeTimer = setTimeout(function () { el._gwNotice = false; if (el._gwData) render(el, el._gwData); }, 5000);
    }
    function closeSettings() { if (el._gwSettings) { if (el._gwResetAsk) notCancelled(); el._gwResetAsk = false; el._gwSettings = false; if (el._gwData) render(el, el._gwData); } }
    document.addEventListener("click", function (e) {  // a click anywhere outside the panel and the gear closes it
      if (el._gwSettings && !(e.target.closest && e.target.closest(".gw-set, .gw-gear"))) closeSettings();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSettings(); });
    var TABS = ["challenges", "month", "year"];
    function switchTab(next, slide) {
      el._gwSettings = false;
      el.setAttribute("data-tab", next);
      try { localStorage.setItem("gw-tab", next); } catch (err) {}
      el._gwSlide = slide || null;
      render(el, el._gwData);
    }
    // swipe left / right switches to the next / previous tab (touch screens)
    var sx = 0, sy = 0, st = 0;
    el.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { st = 0; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (!st || !el._gwData) return;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy, quick = Date.now() - st < 700;
      st = 0;
      if (!quick || Math.abs(dx) < 60 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;  // too short, too slow or rather vertical
      var cur = TABS.indexOf(el.getAttribute("data-tab") === "month" || el.getAttribute("data-tab") === "year" ? el.getAttribute("data-tab") : "challenges");
      var next = TABS[cur + (dx < 0 ? 1 : -1)];
      if (next) switchTab(next, dx < 0 ? "next" : "prev");
    }, { passive: true });
    // tabs, metric pills and chart bars: re-render from the data already loaded
    el.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".gw-tab, .gw-pill, .gw-b"); if (!t || !el._gwData) return;
      if (t.classList.contains("gw-tab")) {
        switchTab(t.getAttribute("data-t"));
        return;
      } else if (t.hasAttribute("data-cmp")) saveSetting(t.getAttribute("data-cmp"), !getSetting(el, t.getAttribute("data-cmp")));
      else if (t.classList.contains("gw-pill")) el.setAttribute("data-metric-" + t.getAttribute("data-c"), t.getAttribute("data-m"));
      else if (t.hasAttribute("data-y")) el.setAttribute("data-ysel", t.getAttribute("data-y"));
      else el.setAttribute("data-sel", t.getAttribute("data-i"));
      render(el, el._gwData);
    });
    // load data.json; a failed request (typical on a mobile network that just woke up) is retried a few
    // times and never wipes what is already shown - the last known data stays with a warning marker
    var lastOk = 0;
    function load(tries) {
      tries = tries || 0;
      return fetch(src + (src.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now(), { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }).then(function (d) { lastOk = Date.now(); el._gwStale = false; el._gwData = d; if (!el._gwSettings) render(el, d); announce(); })
        .catch(function (e) {
          if (tries < 3) return new Promise(function (ok) { setTimeout(ok, 2000 * (tries + 1)); }).then(function () { return load(tries + 1); });
          S = STR[el.getAttribute("data-lang")];
          if (el._gwData) { el._gwStale = true; if (!el._gwSettings) render(el, el._gwData); } else el.textContent = S.error + e;
        });
    }
    // refresh when the page comes back to the foreground or the network returns (if the data is older than 2 minutes)
    function wake() { if (Date.now() - lastOk > 120000) load(); }
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") wake(); });
    window.addEventListener("online", function () { load(); });
    // manual refresh: optionally calls data-refresh-url (a server that runs fetch_garmin.py), then reloads data.json
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".gw-rf"); if (!b || b.classList.contains("gw-spin")) return;
      b.classList.add("gw-spin");
      var url = el.getAttribute("data-refresh-url");
      var t0 = Date.now();
      (url ? fetch(url, { method: "POST" }).catch(function () {}) : Promise.resolve()).then(function () { return load(); }).then(function () {
        var nb = el.querySelector(".gw-rf"); if (nb) nb.classList.add("gw-spin");
        setTimeout(function () { var x = el.querySelector(".gw-rf"); if (x) x.classList.remove("gw-spin"); }, Math.max(0, 700 - (Date.now() - t0)));
      });
    });
    load();
    // auto-reload interval in minutes (data-reload-minutes, default 15, minimum 1, 0 = off)
    var attr = el.getAttribute("data-reload-minutes"), mins = attr === null || attr === "" ? 15 : parseFloat(attr);
    if (isNaN(mins)) mins = 15;
    if (mins > 0) setInterval(function () { load(); }, Math.max(1, mins) * 60 * 1000);
  }
  function go() { var e = document.querySelectorAll("#garmin-widget,[data-garmin-widget]"); for (var i = 0; i < e.length; i++) init(e[i]); }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go) : go();
})();
