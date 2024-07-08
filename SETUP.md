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