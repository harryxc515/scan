# virustotal telegram bot

a telegram bot that scans urls, files, ip addresses, domains and hashes
using the virustotal api v3. built with node.js, telegraf, mongodb and
deployable to render.com.

---

## features

- scan urls with 70+ antivirus engines
- upload and scan files (up to 32mb on free virustotal api)
- lookup ip address reputation
- lookup domain reputation
- lookup file by md5 / sha1 / sha256 hash
- scan history stored per user in mongodb
- webhook mode for production (render), polling for local dev
- health check endpoint at /health

---

## project structure

```
vt-telegram-bot/
  bot.js              main entry point
  config.js           all configuration values
  render.yaml         render deployment spec
  Procfile            process definition
  package.json
  .env.example        environment variable template

  modules/
    database.js       mongodb connection
    virustotal.js     virustotal api v3 wrapper
    formatter.js      message formatting helpers

  models/
    User.js           user schema (mongoose)
    Scan.js           scan history schema (mongoose)

  handlers/
    index.js          registers all handlers
    start.js          /start command
    help.js           /help command
    scan.js           /scan command and text detection
    file.js           file upload handler
    history.js        /history command
```

---

## setup

### 1. get a telegram bot token

1. open telegram and message @botfather
2. send /newbot and follow the steps
3. copy the bot token

### 2. get a virustotal api key

1. sign up at https://www.virustotal.com
2. go to your profile -> api key
3. copy the key (free tier: 4 requests/min, 500/day)

### 3. create a mongodb database

use mongodb atlas (free tier m0):
1. go to https://cloud.mongodb.com
2. create a free cluster
3. create a database user with a password
4. whitelist 0.0.0.0/0 (allow all ips, required for render)
5. click connect -> drivers and copy the connection string
6. replace <password> with your db user password
7. set the database name to vtbot

---

## local development

```bash
# clone or unzip the project
cd vt-telegram-bot

# install dependencies
npm install

# copy and fill in env vars
cp .env.example .env
# edit .env with your BOT_TOKEN, VT_API_KEY, MONGO_URI

# run in dev mode (polling)
npm run dev

# or run normally
npm start
```

---

## deploy to render.com

### option a: using render.yaml (recommended)

1. push this project to a github repository
2. go to https://dashboard.render.com
3. click new -> blueprint
4. connect your github repo
5. render will detect render.yaml and create the service
6. set the following environment variables in render dashboard:
   - BOT_TOKEN
   - VT_API_KEY
   - MONGO_URI
   - WEBHOOK_URL  (set this to your render service url after first deploy)
7. deploy

### option b: manual web service

1. go to https://dashboard.render.com
2. click new -> web service
3. connect your github repo
4. set:
   - build command:  npm install
   - start command:  node bot.js
   - plan:          free
5. add environment variables:
   - NODE_ENV=production
   - PORT=3000
   - BOT_TOKEN=<your token>
   - VT_API_KEY=<your key>
   - MONGO_URI=<your atlas uri>
   - WEBHOOK_URL=https://<your-render-url>.onrender.com
6. deploy

note: on the free render plan the service sleeps after 15 minutes of
inactivity. set up an uptime monitor (e.g. uptimerobot.com) to ping
/health every 5 minutes to keep it awake.

---

## bot commands

| command          | description                          |
|------------------|--------------------------------------|
| /start           | welcome message and usage guide      |
| /help            | show help                            |
| /scan <input>    | scan a url, hash, ip or domain       |
| /history         | show last 10 scans                   |

you can also just send text or a file directly without any command
and the bot will auto-detect and scan it.

---

## virustotal api limits (free tier)

- 4 requests per minute
- 500 requests per day
- max file size for direct upload: 32mb
- files over 32mb use a special upload url (still within free tier limits)

---

## environment variables

| variable      | required | description                                   |
|---------------|----------|-----------------------------------------------|
| BOT_TOKEN     | yes      | telegram bot token from @botfather            |
| VT_API_KEY    | yes      | virustotal api key                            |
| MONGO_URI     | yes      | mongodb connection string                     |
| PORT          | no       | http server port (default 3000)               |
| NODE_ENV      | no       | development or production                     |
| WEBHOOK_URL   | no       | public https url for webhook (production)     |

---

## license

mit
