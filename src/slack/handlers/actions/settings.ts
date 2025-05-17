import { CheckboxesAction } from '@slack/bolt'
import prisma from '~lib/prisma'
import { ActionMiddleware } from '~slack/lib/types'
import { refreshState } from '~config'

export const handleBooleanSettings: ActionMiddleware<CheckboxesAction> = async ({ ack, body, client, payload }) => {
    const keys = ['update_spreadsheet_certs']
    for (const key of keys) {
        const value = payload.selected_options.map((opt) => opt.value).includes(key)
        await prisma.state.update({ where: { key: key }, data: { valBool: value } })
    }
    await ack()
    await refreshState()
}
