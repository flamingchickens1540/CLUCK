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

Set the `start_date` field to the date you want to start tracking current hour information from, typically around kickoff or the end of summer. Any hour submissions after this point will be counted towards totals. It can be in any format accepted by the [Javascript Date constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)

## Refreshing Veracross photos

Open [the student directory](https://portals.veracross.com/catlin/student/directory/1) and paste the following into the browser console. You may need to disable CSP to run this script.

```js
function loadNext() {
    console.log('loading more pages...')
    const elem = document.querySelector('.DirectoryEntries_LoadMoreEntriesButton')
    if (elem) {
        elem.click()
        setTimeout(loadNext, 1000)
    } else {
        const people = document.querySelectorAll('.directory-Entry_Header')
        const data = {}
        people.forEach((person) => {
            const email = person.querySelector('a')?.innerHTML?.trim()
            const photo = person.querySelector('.directory-Entry_PersonPhoto--full')?.src
            if (email && photo) {
                data[email] = photo.replace('c_limit', 'c_fill,g_north')
            } else {
                console.log('missing data for', person)
            }
        })
        fetch('https://cluck.team1540.org/api/members/fallback_photos', {
            method: 'POST',
            headers: { 'X-Api-Key': 'YOUR-API-KEY' },
            body: JSON.stringify(data)
        })
            .then((resp) => resp.text())
            .then(console.log)
    }
}

loadNext()
```

## Adding Member Fields

Additional fields not used by CLUCK can be added to the spreadsheet directly. See the [registered column](https://docs.google.com/spreadsheets/d/1p18eJW29CzLn-zZKBKm-OOM6BtR-oLlrZVfNJtNPl9A/edit?gid=568325748#gid=568325748&range=B2:B46) and ['extra' sheet](https://docs.google.com/spreadsheets/d/1p18eJW29CzLn-zZKBKm-OOM6BtR-oLlrZVfNJtNPl9A/edit?gid=2140052736#gid=2140052736) in the template spreadsheet for an example

-   Hours & Certs row 3 represents the table that the column is found in
-   Hours & Certs row 4 is the column name
-   Hours & Certs row 5 is automatically calculated to be the column index

Make sure to update [the db model](prisma/schema.prisma), [the spreadsheet mapping](src/spreadsheet/index.ts), and the [member dashboard](src/views/admin_members) if adding new fields to CLUCK.
