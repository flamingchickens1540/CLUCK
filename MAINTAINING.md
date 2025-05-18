# Maintaining

## Adding Members

Visit `/admin/members/` and enter data in the bottom row. Slack IDs will automatically populate by the email
Alternatively use the onboarding button on the app home

## Creating Accounts

To create an account,
Role should be "read" "write" or "admin"

```
npm run createaccount youruser yourpassword role
```

## Adjusting Seasons

Set the `valDate` column of the `start_date` records in the `State` table of the database to the date you want to start tracking current hour information from, typically around kickoff or the end of summer.

## Fallback photos

These photos are used when Slack photos are not set or are not marked as acceptable. This is now handled by the [CG Photo Access API](https://docs.google.com/document/d/1nhMTYlZLCCqJBqti7kGpqYtWIABRlldEO7k7EdXJGY0/edit)

## Adding Member Fields

Additional fields not used by CLUCK can be added to the spreadsheet directly. See the [registered column](https://docs.google.com/spreadsheets/d/1p18eJW29CzLn-zZKBKm-OOM6BtR-oLlrZVfNJtNPl9A/edit?gid=568325748#gid=568325748&range=B2:B46) and ['extra' sheet](https://docs.google.com/spreadsheets/d/1p18eJW29CzLn-zZKBKm-OOM6BtR-oLlrZVfNJtNPl9A/edit?gid=2140052736#gid=2140052736) in the template spreadsheet for an example

-   Hours & Certs row 3 represents the table that the column is found in
-   Hours & Certs row 4 is the column name
-   Hours & Certs row 5 is automatically calculated to be the column index

Make sure to update [the db model](prisma/schema.prisma), [the spreadsheet mapping](src/spreadsheet/index.ts), and the [member dashboard](src/views/admin_members) if adding new fields to CLUCK.
