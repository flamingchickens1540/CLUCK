import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { CellValueChangedEvent, GridApi, RowDataUpdatedEvent, RowValueChangedEvent } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'
import { ordinal, safeParseInt, toTitleCase } from '~lib/util'
console.log('AAA')
;(async () => {
    console.log('starting')
    let gridApi: GridApi
    // Grid Options: Contains all of the Data Grid configurations
    const gridOptions: ag.GridOptions<Prisma.Member> = {
        getRowId: (params) => params.data.email,
        pinnedBottomRowData: [{}],

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
                params.node?.isRowPinned() && (params.value == null || params.value == '') && params.colDef
                    ? (params.colDef.headerName ?? toTitleCase(params.colDef.field!)) + '...'
                    : params.value
        },
        getRowStyle: ({ node }) => (node.rowPinned ? { 'font-weight': '300', 'color': '#a0a0a0', 'font-style': 'italic' } : undefined),

        async onCellValueChanged(event) {
            if (event.rowPinned) {
                console.log(event.data)
            } else {
                if (event.column.getColDef().field == 'email') {
                    return
                }
                const res = await fetch('/api/admin/members', { method: 'PUT', body: JSON.stringify(event.data) })
                const member = await res.json()
                gridApi.applyTransaction({ update: [member] })
            }
        }
    }

    document.getElementById('btn-add-member')?.addEventListener('click', async () => {
        const bottomRow = gridApi.getPinnedBottomRow(0)!
        const res = await fetch('/api/admin/members', { method: 'POST', body: JSON.stringify(bottomRow.data) })
        const response_data = await res.json()
        if (response_data.success) {
            gridApi.applyTransaction({ add: [response_data.data] })
            bottomRow.setData({})
        } else {
            alert('Invalid data')
        }
    })

    console.log(gridOptions)
    // Your Javascript code to create the Data Grid
    gridApi = ag.createGrid(document.querySelector('#mygrid')!, gridOptions)

    fetch('/api/admin/members').then(async (resp) => {
        gridApi.setGridOption('rowData', await resp.json())
    })
})()
