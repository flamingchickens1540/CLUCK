# Maintaining

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
                data[email] = photo
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

Make sure to update [the db model](prisma/schema.prisma), [the spreadsheet mapping](src/spreadsheet/index.ts), and the [member dashboard](src/views/admin_members).
