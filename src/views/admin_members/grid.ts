import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { safeParseInt, toTitleCase } from '~lib/util'

export function getColumns(edit_email: boolean = false): ag.ColDef<Prisma.Member>[] {
    return [
        {
            field: 'email',
            editable: true
        },
        {
            field: 'full_name',
            editable: true,
            cellEditor: 'agTextCellEditor',
            headerName: 'Full Name',
            sort: 'asc'
        },
        {
            field: 'grade',
            editable: true,
            cellEditor: 'agTextCellEditor',
            initialWidth: 100,
            valueParser: (params) => safeParseInt(params.newValue) ?? params.oldValue
        },
        {
            field: 'years',
            editable: true,
            cellEditor: 'agTextCellEditor',
            initialWidth: 100,
            headerName: 'Years Experience',
            valueParser: (params) => safeParseInt(params.newValue) ?? params.oldValue
        },
        {
            field: 'team',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: ['Primary', 'Junior'] },
            valueFormatter: (params) => toTitleCase(params.value ?? '')
        },
        {
            field: 'use_slack_photo',
            editable: true,
            headerName: 'Slack Photo Approved'
        }
    ]
}
