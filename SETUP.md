# Setup

## Config

Set the `start_date` field to the date you want to start tracking current hour information from. This should be the start of the current season, and is used to calculate which hour logs count towards totals. It can be in any format accepted by the [Javascript Date constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)

Make a copy of the `./config/example.json` file as `./config/yourenvlabel.json` and adjust the fields as needed. You will need to set the environment variable `NODE_ENV='yourenvlabel'` when running to load the correct config file

Create a `.env` file in the base folder, and in it set the following DATABASE_URL variable for Prisma

```bash
DATABASE_URL="postgres://user@host/db"
```

## Database

Once you have a postgres database running, run the following to apply the Prisma schema

```bash
npx prisma migrate deploy
```

Then, to populate the database with dummy data (for development), run `dev/seed_db.ts`. This will remove existing database records, do not use in production

```bash
tsx dev/seed_db.ts
```

## Slack

If you plan to run this in a workspace with other instances, you'll need to generate a manifest with different slash command names. First, set the `slack.app.command_prefix` field in your config file, then run the following to create the customized manifest:

```bash
tsx dev/generate_manifest.ts
```

If your instance is the only one, you can use `dev/manifest.json` directly
You'll need to [create a Slack application](https://api.slack.com/apps), which you should do from the app manifest you're using.

-   After you complete the setup flow, click "Install to Workspace"
-   `slack.app.signing_secret` can be found in Basic Information > App Credentials > Signing Secret
-   `slack.app.app_token` should be generated in Basic Information > App-Level Tokens with scope `connections:write`
-   `slack.app.bot_token` can be found in OAuth & Permissions > Bot User OAuth Token

The slack user token needs to be authorized by an administrator, and requires the scopes shown in `dev/user_manifest.json`. You can either add these to the main app's manifest (if the main app will be authorized by a slack administrator) or create a separate app for the user token. The user token is used to set profile fields and usergroups by selected departments.
`slack.app.user_token` can be left as an empty string if desired to disable the profile field and department usergroup functionality, otherwise it will appear next to where the bot token was after reauthorization.

Make sure to also set the appropriate user and channel ids

## Spreadsheet

CLUCK is designed to work with a Google Sheets spreadsheet as a frontend. You can make a copy of the [template spreadsheet](https://docs.google.com/spreadsheets/d/1p18eJW29CzLn-zZKBKm-OOM6BtR-oLlrZVfNJtNPl9A/copy) and set the `google.sheet.id` field in your config file to the id in the URL.
Then, to create the credentials, follow [Google's instructions to create a service account](https://developers.google.com/workspace/guides/create-credentials#service-account), and download the `credentials.json` file. Set the `google.account.private_key` and `google.account.client_email` entries in your config file to the matching keys in `credentials.json`.

You'll need to share the spreadsheet with the email address in `client_email` as an editor to allow the bot to access it.
