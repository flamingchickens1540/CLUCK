# Setup

## Config

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

The slack user token needs to be authorized by an administrator, and requires adding `users.profile:read` and `users.profile:write` as User Token Scopes in OAuth & Permissions. This is not included in the manifest by default because you may not want to do this, or because you may want to use a separate slack app.
`slack.app.user_token` can be left as an empty string if desired to disable the profile field functionality, otherwise it will appear next to where the bot token was after reauthorization.

Make sure to also set the appropriate user and channel ids
