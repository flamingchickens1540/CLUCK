import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { RowDataUpdatedEvent } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'
import { ordinal, safeParseInt, toTitleCase } from '~lib/util'
console.log('AAA')
;(async () => {
    console.log('starting')
    const resp = await fetch('/api/admin/members')
    const members = (await resp.json()) as Prisma.Member[]

    const inputRow = {}

    // Grid Options: Contains all of the Data Grid configurations
    const gridOptions: ag.GridOptions<Prisma.Member> = {
        pinnedBottomRowData: [inputRow],

        // Row Data: The data to be displayed.
        rowData: members,
        // Column Definitions: Defines the columns to be displayed.
        columnDefs: [
            {
                field: 'email',
                editable: true,
                cellEditor: 'agTextCellEditor',
                valueParser(params) {
                    if (!params.node?.rowPinned) {
                        return params.oldValue
                    }
                    return params.newValue?.toLowerCase() ?? params.oldValue
                }
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
        ],

        defaultColDef: {
            valueFormatter: (params) =>
                params.node?.isRowPinned() && (params.value == null || params.value == '') ? (params.colDef.headerName ?? toTitleCase(params.colDef.field!)) + '...' : params.value
        },
        getRowStyle: ({ node }) => (node.rowPinned ? { 'font-weight': '300', 'color': '#a0a0a0', 'font-style': 'italic' } : undefined),

        onCellEditingStopped: (params) => {
            const row = gridOptions.pinnedBottomRowData![0]
        }
    }

    console.log(gridOptions)
    // Your Javascript code to create the Data Grid
    ag.createGrid(document.querySelector('#mygrid')!, gridOptions)
})()
