import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { CellValueChangedEvent, GridApi, RowDataUpdatedEvent, RowValueChangedEvent } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'
import { getColumns } from '~views/admin_members/grid'
import { initNewMemberTable } from '~views/admin_members/new_member'
;(async () => {
    // Grid Options: Contains all of the Data Grid configurations
    const gridOptions: ag.GridOptions<Prisma.Member> = {
        getRowId: (params) => params.data.email,

        // Column Definitions: Defines the columns to be displayed.
        columnDefs: getColumns({ include_photo: true }),

        async onCellValueChanged(event) {
            const payload: Prisma.Member & { id?: string } = event.data
            if (event.column.getColDef().field == 'email') {
                payload.id = event.oldValue
            } else {
                payload.id = event.data.email
            }
            const res = await fetch('/api/admin/members', { method: 'PUT', body: JSON.stringify(event.data) })
            const member = await res.json()
            gridApi.applyTransaction({ update: [member] })
        }
    }
    // Your Javascript code to create the Data Grid
    const gridApi = ag.createGrid(document.querySelector('#mygrid')!, gridOptions)

    fetch('/api/admin/members').then(async (resp) => {
        gridApi.setGridOption('rowData', await resp.json())
    })

    document.getElementById('btn-sync-slack')?.addEventListener('click', async () => {
        await fetch('/api/members/refresh', { method: 'GET' })
        fetch('/api/admin/members').then(async (resp) => {
            gridApi.setGridOption('rowData', await resp.json())
        })
    })

    await initNewMemberTable(gridApi)
})()
