# Garmin challenges widget

Downloads this month's steps, km, active minutes and challenges from Garmin Connect and shows them as a web widget.

| File | Purpose |
|---|---|
| `fetch_garmin.py` | downloads the data from Garmin into `data.json` |
| `garmin-widget.js` | the widget (embeddable in a web page) |
| `index.html`, `manifest.json`, `icon.svg` | standalone page, can be added to a phone's home screen |
| `server.py` | small server: serves the web page and runs a new download when ↻ is tapped (`POST /refresh`) |
| `names.cs.json`, `order.json`, `hide.json` | Czech challenge names, display order, hidden challenges |
| `garmin-widget.service` | systemd service for the server |
| `TODO.md` | ideas and open items |

The server never serves non-public files (`seen.json`, `raw_challenges.json`, `history.json`, tokens).

The widget UI is available in Czech and English (switch with the CS/EN button). Challenge names come from Garmin in English; Czech names are kept in `names.cs.json`. The code and documentation are in English.

## Installation on a server (Raspberry / VPS)

Ubuntu Server 24.04; first run `sudo apt update && sudo apt install git python3-venv python3-pip`.

```bash
sudo mkdir -p /opt/finmade_widgets && sudo chown $USER /opt/finmade_widgets
git clone git@bitbucket.org:YOUR_ACCOUNT/finmade_widgets.git /opt/finmade_widgets
cd /opt/finmade_widgets/garmin-widget
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
```

Updating later: `cd /opt/finmade_widgets && git pull` (and `sudo systemctl restart garmin-widget` if `server.py` changed).

### Garmin login (once)

The simplest way is to copy the tokens from your own computer – then you need neither the password nor MFA:

```bash
scp -r ~/.garminconnect user@server:~/
```

Or log in directly on the server (you will be asked for the MFA code):

```bash
GARMIN_EMAIL=... GARMIN_PASSWORD=... ./venv/bin/python fetch_garmin.py
```

The tokens are stored in `~/.garminconnect`, after which the password is no longer needed.

### Scheduled downloads (cron, every 30 min)

```
*/30 * * * * cd /opt/finmade_widgets/garmin-widget && ./venv/bin/python fetch_garmin.py >> fetch.log 2>&1
```

More frequent downloads help catch challenges that Garmin removes once they are completed (see `seen.json`).

Every run also stores the start-of-day progress of each challenge in `history.json` (last 62 days). The widget derives the recent pace from it. Until at least 3 days of history exist (for a new challenge or a fresh install), the pace falls back to the average over the whole period so far.

Cron must also run shortly after midnight (`*/30` does that – runs at 0:00 and 0:30). The first download of a new day stores the state of the challenges at the start of the day in `history.json`. The widget uses it to compute "today you already have X of Y", and the daily goal stays constant during the day.

### Server

1. In `garmin-widget.service` set `User` and `REFRESH_KEY` (a random string, e.g. `openssl rand -hex 16`).
2. `sudo cp garmin-widget.service /etc/systemd/system/ && sudo systemctl enable --now garmin-widget`
3. HTTPS: put a reverse proxy in front of the server, e.g. Caddy – `your.domain { reverse_proxy 127.0.0.1:8080 }` (it obtains the certificate by itself). Alternative without opening ports: Cloudflare Tunnel or Tailscale.
4. Set the key in `index.html`: `data-refresh-url="refresh?key=YOUR_KEY"`.
   The key is visible in the HTML to anyone who opens the page. It only protects against accidental triggering,
   and the server downloads at most once per `REFRESH_MIN_GAP` seconds. If the site is public and you do not want
   everyone to see your steps, put a login in front of it (e.g. Basic auth in Caddy).

### Embedding in another site

```html
<div id="garmin-widget" data-src="https://your.domain/data.json"
     data-refresh-url="https://your.domain/refresh?key=YOUR_KEY"></div>
<script src="https://your.domain/garmin-widget.js"></script>
```

On the server then set `Environment=CORS_ORIGIN=https://target.site`.

Optional attributes on the widget element:
- `data-theme="light|dark"` – default theme (otherwise the phone setting is used); `data-theme-toggle="off"` hides the light/dark button.
- `data-lang="cs|en"` – default language (otherwise the browser language is used, falling back to English); `data-lang-toggle="off"` hides the CS/EN button.
- `data-pace-days="7"` – how many of the last complete days are used to compute the pace (the colour of the daily-average line and the estimate on the right). Default 7, range 2–60. Needs a few days of history (see below).
- `data-reload-minutes="15"` – how often an open page re-reads `data.json` (minutes, default 15, minimum 1, `0` turns the automatic reload off). This only reloads what the server already has; fresh data from Garmin still depends on the cron job and the ↻ button.

The choices made with the buttons are remembered in the browser (`localStorage`).

## What changes month by month

- New challenges are shown in English with a `!` – add them to `names.cs.json` (the key is in `data.json`) and, if needed, to `order.json`.
- The rest (month, totals, days left) is recalculated automatically.

## Later: embedding in a Rails app (Heroku)

Decision: downloading from Garmin **does not belong on Heroku** (ephemeral disk – the tokens and `seen.json` would be lost, plus a Scheduler and a paid dyno are needed). The download and `data.json` stay on a small VPS (or Raspberry) running `server.py`; the Rails app only displays the widget.

### Option A – simple (the widget reads the data directly from the server)

In a Rails template:

```erb
<div id="garmin-widget" data-src="https://garmin.your.domain/data.json"
     data-refresh-url="https://garmin.your.domain/refresh?key=YOUR_KEY"></div>
<script src="https://garmin.your.domain/garmin-widget.js"></script>
```

- On the server set `Environment=CORS_ORIGIN=https://your-rails-app.domain` (see `garmin-widget.service`).
- If Rails uses a Content-Security-Policy (`config/initializers/content_security_policy.rb`), allow the server's address in `script_src` and `connect_src`.
- The data and the `/refresh` key are then visible to anyone who opens the page.

### Option B – through Rails (for an app behind a login)

A Rails controller fetches `data.json` from the server and serves it only to logged-in users; the `/refresh` key is known only to Rails and does not appear in the HTML. Sketch:

```ruby
# config/routes.rb
get  "garmin/data",    to: "garmin#data"
post "garmin/refresh", to: "garmin#refresh"

# app/controllers/garmin_controller.rb
class GarminController < ApplicationController
  before_action :authenticate_user!   # or your own authentication
  BASE = ENV.fetch("GARMIN_BASE")     # https://garmin.your.domain
  KEY  = ENV.fetch("GARMIN_KEY")

  def data
    render json: Net::HTTP.get(URI("#{BASE}/data.json"))
  end

  def refresh
    uri = URI("#{BASE}/refresh?key=#{KEY}")
    Net::HTTP.post(uri, "")
    head :ok
  end
end
```

Then in the template:

```erb
<div id="garmin-widget" data-src="/garmin/data" data-refresh-url="/garmin/refresh"></div>
<%= javascript_include_tag "garmin-widget" %>  <%# copy garmin-widget.js to app/assets/javascripts %>
```

Also: `POST /garmin/refresh` needs a CSRF token (add the `X-CSRF-Token` header to the call behind `data-refresh-url`, or use `skip_forgery_protection` for this action), and the server is then protected only by the `REFRESH_KEY` key (Heroku's IP addresses change, so a firewall cannot be set up for them). `data.json` on the server is still publicly reachable; if that is a problem, put Basic auth in front of the server and send it in the request from the Rails controller.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) – free for personal use, study, research and other non-commercial purposes; **commercial use is not permitted**. This is a source-available license, not an open source one. The text is the unmodified official license from <https://polyformproject.org/licenses/noncommercial/1.0.0>.

This project is unofficial and is not affiliated with or endorsed by Garmin. It uses the unofficial [`garminconnect`](https://github.com/cyberjunky/python-garminconnect) library, which is subject to its own license.
