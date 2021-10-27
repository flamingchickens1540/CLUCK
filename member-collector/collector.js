
import { WebClient } from "@slack/web-api"
// import { createEventAdapter } from "@slack/events-api"

// Load google sheets
import { GoogleSpreadsheet } from "google-spreadsheet";
import { readFileSync, writeFileSync } from 'fs'

export const collect = async (signin_secret, token, google_client_secret) => {
    const client = new WebClient(token);


    // Load google sheets
    const hours_sheet_id = '10AcplDpfbXlECQYaFuTFcIeN2U8raP9XysuN3e31js0'
    let sheet = null;
    await (async () => {
        // const google_client_secret = JSON.parse(readFileSync('secrets/client_secret.json'))
        const doc = await new GoogleSpreadsheet(hours_sheet_id)
        await doc.useServiceAccountAuth(google_client_secret)
        await doc.loadInfo()
        sheet = doc.sheetsByIndex[0]
    })()

    // Get names
    let names = []

    const startNameRow = 3
    const endNameRow = 60
    const nameColumn = 0
    const validPictColumn = 6;
    await sheet.loadCells({ startRowIndex: startNameRow, endRowIndex: endNameRow + 1, startColumnIndex: nameColumn, endColumnIndex: nameColumn + 1 })
    await sheet.loadCells({ startRowIndex: startNameRow, endRowIndex: endNameRow + 1, startColumnIndex: validPictColumn, endColumnIndex: validPictColumn + 1 })
    for (let y = startNameRow; y <= endNameRow; y++) {
        let cell = sheet.getCell(y, nameColumn)
        let name = cell.value
        if (name != 'Name' && name != null && name != '' && name != ' ') {
            let pictcell = sheet.getCell(y, validPictColumn)
            let pict = pictcell.value
            names.push({ name, pict: !pict || !pict.includes || !pict.includes('N') })
        }
    }
    // Huzzah! Names aquired!

    // Load slack users data
    let userlist = await client.users.list()
    let users = userlist.members
    users = users.filter(elem => { return !elem.deleted })
    // console.log(users)

    // member obj:
    // full name, first name, profile picture url

    // Build members catalogue
    let members = []
    names.forEach(nameobj => {
        let name = nameobj.name
        let pict = nameobj.pict;
        let foundMember = users.find(elem => { return elem.real_name.includes(name.trim()) || name.includes(elem.real_name.trim()) });
        if (!foundMember) {
            members.push({
                name: name,
                firstname: name.split(' ')[0],
                pict:pict
            })
        } else {
            members.push({
                name: name,
                firstname: name.split(' ')[0],
                img: foundMember.profile.image_original,
                pict:pict
            })
        }
    })

    writeFileSync('member-collector/members.json', JSON.stringify(members))
}