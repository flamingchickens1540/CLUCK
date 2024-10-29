import { getPendingHourSubmissionData } from '~slack/blocks/admin/pending_requests'
import { getHourSubmissionBlocks } from '~slack/blocks/admin/hour_submission'
import { ActionIDs } from '~slack/handlers'
import { getUserHourSummaryBlocks } from '~slack/blocks/member/user_hours'
import { getUserCertBlocks } from '~slack/blocks/member/user_certs'
import { Bits, Blocks, Elements, HomeTab } from 'slack-block-builder'
import config from '~config'
import { getCertRequestBlocks } from '~slack/blocks/certify'
import prisma from '~lib/prisma'
import { getTaskKeys } from '~tasks'

export async function getAppHome(user_id: string) {
    const homeTab = HomeTab()
    if (config.slack.users.devs.includes(user_id)) {
        const tasks = getTaskKeys().map((key) => Bits.Option().text(key).value(key))
        homeTab.blocks(
            Blocks.Header().text('Dev Dashboard'),
        )
        for (let i = 0; i<Math.ceil(tasks.length/5); i++) {
            console.log(tasks.slice(i*5,(i+1)*5))
            homeTab.blocks(
                Blocks.Section()
                    .text('Manual Tasks ('+i+")")
                    .accessory(
                        Elements.OverflowMenu()
                            .actionId(ActionIDs.RUN_TASK)
                            .options(tasks.slice(i*5,(i+1)*5))
                    ),
            )
        }
        
        homeTab.blocks(
            Blocks.Actions().elements(
                Elements.Button().text('Open Onboarding').actionId(ActionIDs.OPEN_ONBOARDING_MODAL),
                Elements.Button().text('Send Pending Requests').actionId(ActionIDs.SEND_PENDING_REQUESTS),
                Elements.Button().text('Create Event Log Button').actionId(ActionIDs.SETUP_EVENT_LOG)
            )
        )
    }
    if (config.slack.users.admins.includes(user_id)) {
        const pending_requests = await getPendingHourSubmissionData()
        const pending_certs = await prisma.memberCertRequest.findMany({ where: { state: 'pending' }, include: { Member: true, Cert: true, Requester: true } })

        homeTab.blocks(Blocks.Header().text('Pending Hour Submissions (' + pending_requests.length + ')'))
        if (pending_requests.length > 0) {
            homeTab.blocks(
                pending_requests
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                    .slice(0, 10)
                    .flatMap((req) => [...getHourSubmissionBlocks(req), Blocks.Divider()])
            )
        } else {
            homeTab.blocks(Blocks.Section().text('None'))
            homeTab.blocks(Blocks.Divider())
        }
        homeTab.blocks(Blocks.Header().text('Pending Certifications (' + pending_certs.length + ')'))
        if (pending_certs.length > 0) {
            homeTab.blocks(
                pending_certs
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                    .slice(0, 10)
                    .flatMap((req) => [...getCertRequestBlocks(req).blocks, Blocks.Divider()])
            )
        } else {
            homeTab.blocks(Blocks.Section().text('None'))
            homeTab.blocks(Blocks.Divider())
        }
        homeTab.blocks(Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString()))
    } else {
        homeTab.blocks(
            Blocks.Actions().elements(
                Elements.Button().text('Log Hours').actionId(ActionIDs.OPEN_LOG_MODAL),
                Elements.Button().text('Show Info').actionId(ActionIDs.OPEN_USERINFO_MODAL)
            ),
            await getUserHourSummaryBlocks({ slack_id: user_id }),
            Blocks.Divider(),
            await getUserCertBlocks({ slack_id: user_id }),
            Blocks.Divider(),
            Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString())
        )
    }
    return homeTab.buildToObject()
}
