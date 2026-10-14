/* Garmin challenges widget. Embed it in a page:
 *   <div id="garmin-widget" data-src="https://your.site/data.json"></div>
 *   <script src="garmin-widget.js"></script>
 * Optional attributes: data-refresh-url, data-theme="light|dark", data-theme-toggle="off",
 *                      data-lang="cs|en", data-lang-toggle="off", data-pace-days="7", data-reload-minutes="15"
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
      missing: "chybí překlad", error: "Chyba načtení: ", langTitle: "Jazyk: čeština"
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
      missing: "missing translation", error: "Load error: ", langTitle: "Language: English"
    }
  };
  var S = STR.cs;  // texts of the widget being rendered (set at the start of render)
  var REPO = "https://github.com/subrova/garmin-widget";  // the copyright line links here
  var UNIT_DEC = { steps: 0, km: 1, minutes: 0, activities: 1 };

  var DARK = "--gw-card:#1c2430;--gw-txt:#fff;--gw-line:transparent;--gw-bar:#34404f;--gw-ok:#2ec4b6;--gw-mid:#ffd166;--gw-warn:#ff9f43;--gw-bad:#ef6f6c;--gw-mut:#9aa7b8;--gw-head:#fff;",
    LIGHT = "--gw-card:#fff;--gw-txt:#1b2430;--gw-line:#dde3ea;--gw-bar:#e3e8ee;--gw-ok:#12877d;--gw-mid:#a86d00;--gw-warn:#c2570c;--gw-bad:#c53030;--gw-mut:#5b6878;--gw-head:#1b2430;";
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
    ".gw-t{font-weight:700;font-size:inherit;color:var(--gw-mid);margin-left:6px}" +
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
  // challenge name in the current language; "!" marks a missing Czech translation
  function nm(c, lang) {
    var name = lang === "en" ? (c.name_en || c.name) : c.name;
    return esc(name) + (lang === "cs" && c.translated === false ? ' <small class="gw-t" title="' + S.missing + '">!</small>' : "");
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
    function dm(x) { var p = x.split("-"); return S.dm(+p[2], +p[1], STR.en.months[+p[1] - 1].slice(0, 3)); }
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
      var tail = rem ? (over ? S.endedOn + dm(c.end)
        : S.perDay(val(perDay, c.unit, true), cl) + (future ? S.starts + dm(c.start) : ""))
        : S.done;
      html += '<div class="gw-c' + (rem ? "" : " gw-done") + '"><div class="gw-h"><span>' + nm(c, lang) + "</span><span>" + pct + " %</span></div>" +
        '<div class="gw-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="gw-r"><span>' + val(c.current, c.unit) + " / " + val(c.target, c.unit, true) + "</span><span>" + (rem ? S.left(rest(rem, c.unit)) : "") + "</span></div>" +
        '<div class="gw-d"' + (rem && !future ? ' style="color:' + (over ? "var(--gw-bad)" : onPace ? "var(--gw-ok)" : "var(--gw-warn)") + '"' : "") + "><span>" + tail + "</span>" + (proj ? '<span class="gw-p">' + proj + "</span>" : "") + "</div>" + todayLine + "</div>";
    });
    if (flags.length) {
      html += '<div class="gw-f">' + flags.map(function (c) {
        var st = c.earned ? [S.done, "var(--gw-ok)"] : (c.start > iso ? [S.waiting, "var(--gw-mut)"] : (c.end < iso ? [S.notDone, "var(--gw-bad)"] : [S.running, "var(--gw-mid)"]));
        return '<div class="gw-c' + (c.earned ? " gw-done" : "") + '"><div class="gw-h"><span>' + nm(c, lang) + '</span></div><div class="gw-r">' + dm(c.start) + " – " + dm(c.end) +
          '</div><div class="gw-d" style="color:' + st[1] + '">' + st[0] + "</div></div>";
      }).join("") + "</div>";
    }
    el.innerHTML = "<style>" + css + '</style><div class="gw gw-' + el.getAttribute("data-theme") + '"><h2 class="gw-m">' + title(d, '<span class="gw-ctl">' + langBtn(el) + themeBtn(el) + "</span>") + "</h2>" + totals(d) + html +
      '<div class="gw-u"><span>' + S.updated + stamp(d.updated) + ' <button class="gw-rf" type="button" title="' + S.reload + '">↻</button></span>' +
      '<span><a class="gw-cr" href="' + REPO + '" target="_blank" rel="noopener">© ' + new Date().getFullYear() + " Sharkie</a></span></div></div>";
  }
  function init(el) {
    var src = el.getAttribute("data-src") || "data.json";
    var savedTheme, savedLang;
    try { savedTheme = localStorage.getItem("gw-theme"); savedLang = localStorage.getItem("gw-lang"); } catch (e) {}
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
