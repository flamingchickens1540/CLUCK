import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'
;(async () => {
    const colDefs: ag.ColDef<Prisma.Cert>[] = [
        {
            field: 'id',
            editable: false,
            sort: 'asc'
        },
        {
            field: 'label',
            editable: true,
            cellEditor: 'agTextCellEditor',
            headerName: 'Label'
        },
        {
            field: 'isManager',
            editable: true,
            headerName: 'Manager?'
        },
        {
            colId: 'managerCert',
            field: 'managerCert',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            headerName: 'Managed By',
            headerTooltip: 'Allows managers to submit over slack',
            cellEditorParams: {
                values: []
            }
        },
        {
            colId: 'replaces',
            field: 'replaces',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: [] },
            headerName: 'Replaces'
        }
    ]
    // Grid Options: Contains all of the Data Grid configurations
    const gridOptions: ag.GridOptions<Prisma.Cert> = {
        getRowId: (params) => params.data.id,

        // Column Definitions: Defines the columns to be displayed.
        columnDefs: colDefs,

        async onCellValueChanged(event) {
            const res = await fetch('/api/admin/certs', { method: 'PUT', body: JSON.stringify(event.data) })
            const cert = await res.json()
            if (cert.error) {
                event.node.setDataValue(event.column.getColDef().field!, event.oldValue)
            }
            gridApi.applyTransaction({ update: [cert] })
        }
    }
    // Your Javascript code to create the Data Grid
    const gridApi = ag.createGrid(document.querySelector('#mygrid')!, gridOptions)
    fetch('/api/admin/certs').then(async (resp) => {
        const certs: Prisma.Cert[] = await resp.json()
        gridApi.setGridOption('rowData', certs)
        gridApi.getColumnDef('managerCert')!.cellEditorParams!.values = [null, ...certs.filter((c) => c.isManager).map((c) => c.id)]
        gridApi.getColumnDef('replaces')!.cellEditorParams!.values = [null, ...certs.filter((c) => !c.isManager).map((c) => c.id)]
    })
})()
