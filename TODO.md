# TODO / ideas for later

- [ ] **History of past months** – store monthly results (e.g. `history.json` or SQLite) and show an overview / comparison with previous months.
- [ ] **Active minutes split by sport** – walking / archery / skipping rope etc. Requires downloading individual activities (`get_activities_by_date`) and summing the time per activity type.
- [ ] **Sharing** – a link to a public page and/or exporting the widget as a PNG (e.g. a shareable image with the monthly overview). Think through privacy (what may be published).
- [ ] **Use by other users** – multiple Garmin accounts (tokens and `data.json` per user), login, separated data. Touches security and how the Garmin login is handled.
- [ ] **Translations** – generic activity and challenge names (currently manual in `names.cs.json`), possibly more widget languages (currently Czech and English) and automatic filling in of missing translations.
- [ ] **Security review** – a thorough audit before going public: `/refresh` and its key, public exposure of `data.json`, CORS, login (Basic auth), protection of tokens on the server, dependencies.
- [ ] **Miles / imperial units** – use miles instead of km (and e.g. feet instead of meters) when the Garmin account is set to imperial units. Read the unit system from the Garmin user settings and convert in `fetch_garmin.py` or in the widget.
- [ ] **Usage statistics** – how often and when the widget is opened, use of the ↻ button (without collecting personal data).

## Small items from development

- [ ] Optionally: average "from tomorrow" after a certain hour (see the discussion about the current day).
- [ ] A warning during the download about a challenge without a Czech translation (currently only the `!` in the widget).
- [ ] Verify how Garmin returns completed challenges (for now we infer them from `seen.json`).
- [ ] `server.py`: support HTTP HEAD requests (`curl -I` and monitoring tools currently get 501; browsers use GET and are not affected).
- [ ] Rails: embedding the widget (see the README, section "Later").

## Ideas from Claude (suggestions, not yet approved)

- [ ] **Notifications** – push notification or e-mail when a challenge becomes at risk (e.g. 3 days in a row off pace) or when today's quota is completed.
- [ ] **Per-day chart** – a bar chart of steps per day of the month with the daily goal marked (`get_daily_steps` already returns the data).
- [ ] **Streaks** – how many days in a row the daily goal was met, best streak.
- [ ] **Best days and records** – best day of the month, best month ever (builds on the history).
- [ ] **Summary on top** – one line such as "on track for 4 of 5 challenges".
- [ ] **Evening reminder** – when only a small part of today's quota is missing ("only 800 steps to go").
- [ ] **Custom challenges with a UI** – set your own goal (e.g. 250 km a month) without editing `challenges.manual.json`.
- [ ] **Settings in the browser** – order, hiding and translations of challenges through a screen instead of editing files (mainly for multiple users).
- [ ] **Resilience to outages** – when Garmin does not respond, show the last data marked as stale.
- [ ] **Accessibility** – larger font, contrast, labels for screen readers (the status colors must not be the only carrier of information).
- [ ] **A real Android home-screen widget** – e.g. via KWGT (currently it is a web page added to the home screen).
- [ ] **Backups** – regular backup of `seen.json`, `baseline.json` and the tokens on the server.
