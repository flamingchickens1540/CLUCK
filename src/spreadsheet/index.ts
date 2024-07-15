import { JWT } from 'google-auth-library'
import { sheets, sheets_v4 } from '@googleapis/sheets'
import config from '~config'
import prisma, { getMemberPhoto } from '~lib/prisma'
import { calculateHours, getMeetings, getWeeklyHours } from '~lib/hour_operations'
import { ordinal } from '~lib/util'
import logger from '~lib/logger'
import { Prisma } from '@prisma/client'

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize() {
    const auth = new JWT({
        email: config.google.account.client_email,
        key: config.google.account.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
    return sheets({ version: 'v4', auth: auth })
}

const client = await authorize()

function max50Hours(hours: number) {
    return hours >= 50 ? '50+' : hours
}

export async function updateSheet() {
    const members = await prisma.member.findMany({ orderBy: { full_name: 'asc' } })
    const certs = await prisma.memberCert.findMany({ orderBy: { cert_id: 'asc' }, include: { Cert: { select: { label: true } } } })
    const loggedin = await prisma.hourLog.findMany({ where: { state: 'pending', type: 'lab' } })
    const certMap: Record<string, string[]> = {}
    certs.map((c) => {
        certMap[c.member_id] ??= []
        certMap[c.member_id].push(c.Cert.label)
    })

    const loggedInMap: Set<string> = new Set()
    loggedin.forEach((l) => {
        loggedInMap.add(l.member_id)
    })

    const headers = [
        'Name',
        'LoggedIn',
        'Grade',
        'Years',
        'Meetings',
        'LabHours',
        'ExternalHours',
        'EventHours',
        'SummerHours',
        'QualifyingHours',
        'TotalHours',
        'WeeklyHours',
        'Photo',
        'Certifications'
    ] as const
    const columns = Object.fromEntries(headers.map((h, i) => [h, i])) as Record<(typeof headers)[number], number>
    const additional_fields = await prisma.additionalMemberField.findMany({ orderBy: { key: 'asc' } })
    const rows: (string | number)[][] = []
    const headerrow = [...headers, ...additional_fields.map((f) => f.label)]
    rows.push(headerrow)

    let hourReqMet = 0
    for (const m of members) {
        const hours = (await calculateHours({ email: m.email }))!
        const row = new Array(headerrow.length).fill('')
        row[columns.Name] = m.full_name
        row[columns.LoggedIn] = loggedInMap.has(m.email)
        row[columns.Grade] = ordinal(m.grade)
        row[columns.Years] = m.years
        row[columns.Meetings] = await getMeetings({ email: m.email })
        row[columns.LabHours] = max50Hours(hours.lab)
        row[columns.ExternalHours] = hours.external
        row[columns.EventHours] = hours.event
        row[columns.SummerHours] = hours.summer
        row[columns.QualifyingHours] = max50Hours(hours.qualifying)
        row[columns.TotalHours] = max50Hours(hours.total)
        row[columns.WeeklyHours] = await getWeeklyHours({ email: m.email })
        row[columns.Photo] = getMemberPhoto(m, true) ?? ''
        row[columns.Certifications] = certMap[m.email].join(', ')
        additional_fields.map((f, i) => {
            row[headers.length + i] = (m.extended_fields as Prisma.JsonObject)?.[f.key] ?? ''
        })
        rows.push(row)

        if (hours.qualifying >= 50) {
            hourReqMet++
        }
    }
    await client.spreadsheets.values.update({
        spreadsheetId: config.google.sheet_id,
        range: "'Data'!A1:" + rows.length,
        valueInputOption: 'RAW',
        requestBody: {
            values: rows
        }
    })
    const res = await client.spreadsheets.get({
        spreadsheetId: config.google.sheet_id,
        includeGridData: false
    })
    const data_sheet = res.data.sheets?.find((sheet) => sheet.properties?.title === 'Data')
    const home_sheet = res.data.sheets?.find((sheet) => sheet.properties?.title === 'Hours & Certs')
    const data_id = data_sheet?.properties?.sheetId
    const home_id = home_sheet?.properties?.sheetId

    if (!data_id || !home_id) {
        logger.warn('Could not find sheet ids')
        return
    }
    const updateRequests: sheets_v4.Schema$Request[] = []

    updateRequests.push({
        updateSheetProperties: {
            properties: {
                sheetId: data_id,
                gridProperties: {
                    rowCount: rows.length,
                    columnCount: headers.length
                }
            },
            fields: 'gridProperties'
        }
    })

    updateRequests.push({
        autoResizeDimensions: {
            dimensions: {
                sheetId: data_id,
                dimension: 'COLUMNS'
            }
        }
    })

    updateRequests.push({
        updateCells: {
            range: {
                sheetId: home_id,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 1
            },
            rows: [
                { values: [{ note: 'Last Updated ' + new Date().toLocaleString('en-us', { day: 'numeric', month: 'long', hour12: true, hour: 'numeric', minute: '2-digit' }) }] }
            ],
            fields: 'note'
        }
    })

    const sheetColorGreen = hourReqMet / members.length
    const sheetColorRed = 1 - sheetColorGreen
    const sheetColorBase = 0.3
    updateRequests.push({
        updateSheetProperties: {
            properties: {
                sheetId: home_id,
                gridProperties: {
                    rowCount: rows.length + 15 // Buffer
                },
                tabColorStyle: {
                    rgbColor: {
                        red: Math.min(sheetColorRed + sheetColorBase, 1),
                        green: Math.min(sheetColorGreen + sheetColorBase, 1),
                        blue: 0
                    }
                }
            },
            fields: 'gridProperties(rowCount),tabColorStyle'
        }
    })

    if (updateRequests.length > 0) {
        await client.spreadsheets.batchUpdate({
            spreadsheetId: config.google.sheet_id,
            requestBody: {
                requests: updateRequests
            }
        })
    }
}
