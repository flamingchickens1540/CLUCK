import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { GridApi } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'
import { toTitleCase } from '~lib/util'
import { getColumns } from '~views/admin_members/grid'

const getDefaultRow = () => ({ team: 'primary', use_slack_photo: false }) as never
export async function initNewMemberTable(mainTable: GridApi) {
    console.log('starting')
    // Grid Options: Contains all of the Data Grid configurations
    const gridOptions: ag.GridOptions<Prisma.Member> = {
        // Column Definitions: Defines the columns to be displayed.
        columnDefs: getColumns({ include_photo: false }),
        rowData: [getDefaultRow()],
        headerHeight: 0,
        defaultColDef: {
            valueFormatter: (params) => (params.value == null || params.value == '' ? (params.colDef.headerName ?? toTitleCase(params.colDef.field!)) + '...' : params.value)
        },
        getRowStyle: ({ node }) => ({ 'font-weight': '300', 'color': '#a0a0a0', 'font-style': 'italic' })
    }

    document.getElementById('btn-add-member')?.addEventListener('click', async () => {
        const bottomRow = grid.getDisplayedRowAtIndex(0)!
        const res = await fetch('/api/admin/members', { method: 'POST', body: JSON.stringify(bottomRow.data) })
        const response_data = await res.json()
        if (response_data.success) {
            mainTable.applyTransaction({ add: [response_data.data] })
            mainTable.getRowNode(response_data.data.email)?.setSelected(true)
            bottomRow.setData(getDefaultRow())
        } else {
            alert('Invalid data')
        }
    })
    // Your Javascript code to create the Data Grid
    const grid = ag.createGrid(document.querySelector('#new-member-grid')!, gridOptions)
}
