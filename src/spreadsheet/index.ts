import { JWT } from 'google-auth-library'
import { sheets, sheets_v4 } from '@googleapis/sheets'
import config from '~config'
import prisma from '~lib/prisma'
import { getMemberPhoto } from '~lib/util'
import { calculateAllSeasonHours, getMeetingsAttended, getMeetingsMissed, getWeeklyHours } from '~lib/hour_operations'
import logger from '~lib/logger'
import { enum_Member_Team } from '@prisma/client'

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

export async function updateSheet() {
    const members = await prisma.member.findMany({ orderBy: { full_name: 'asc' }, where: { active: true, OR: [{ team: 'junior' }, { team: 'primary' }] } })
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

    const meetingsMissed = await getMeetingsMissed()
    const meetings = await getMeetingsAttended()
    const weeklyHours = await getWeeklyHours()
    const allHours = await calculateAllSeasonHours()
    const headers = [
        'Name',
        'LoggedIn',
        'Meetings',
        'MeetingsMissed',
        'LabHours',
        'ExternalHours',
        'EventHours',
        'SummerHours',
        'OutreachHours',
        'QualifyingHours',
        'TotalHours',
        'WeeklyHours',
        'Team',
        'Photo',
        'Certifications'
    ] as const
    const columns = Object.fromEntries(headers.map((h, i) => [h, i])) as Record<(typeof headers)[number], number>
    const rows: (string | number)[][] = []
    rows.push(headers as unknown as string[])

    let hourReqMet = 0
    for (const m of members) {
        const hours = allHours[m.email] ?? { event: 0, external: 0, lab: 0, summer: 0, total: 0, qualifying: 0 }
        const row = new Array(headers.length).fill('')
        row[columns.Name] = m.full_name
        row[columns.LoggedIn] = loggedInMap.has(m.email)
        row[columns.Meetings] = meetings[m.email] ?? 0
        row[columns.MeetingsMissed] = meetingsMissed[m.email] ?? 0
        row[columns.LabHours] = hours.lab
        row[columns.ExternalHours] = hours.external
        row[columns.EventHours] = hours.event
        row[columns.SummerHours] = hours.summer
        row[columns.OutreachHours] = hours.outreach
        row[columns.QualifyingHours] = hours.qualifying
        row[columns.TotalHours] = hours.total
        row[columns.WeeklyHours] = weeklyHours[m.email] ?? 0
        row[columns.Photo] = getMemberPhoto(m, true) ?? ''
        row[columns.Certifications] = certMap[m.email]?.join(', ') ?? ''
        row[columns.Team] = m.team
        rows.push(row)

        if (hours.qualifying >= (m.team == enum_Member_Team.primary ? 50 : 30)) {
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
