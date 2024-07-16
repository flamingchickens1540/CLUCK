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
