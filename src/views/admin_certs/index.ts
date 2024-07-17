import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'
;(async () => {
    class ButtonComponent implements ag.ICellRendererComp<Prisma.Cert> {
        private eGui!: HTMLElement
        private eButton!: HTMLElement

        getGui(): HTMLElement {
            return this.eGui
        }
        destroy?(): void {
            this.eGui.remove()
        }
        refresh(params: ag.ICellRendererParams): boolean {
            return true
        }
        // ...
        init(params: ag.ICellRendererParams) {
            // create the cell
            this.eGui = document.createElement('div')
            this.eGui.className = 'w-full h-full flex items-center justify-center'
            if (params.data.createdAt == null) {
                this.eButton = document.createElement('button')
                this.eButton.className =
                    'block border-gray-400 text-sm text-gray-50 px-2 py-1 w-full rounded-md border bg-transparent hover:bg-gray-500 transition-colors duration-300'
                this.eButton.innerText = 'Add'
                this.eButton.addEventListener('click', async () => {
                    const bottomRow = gridApi.getPinnedBottomRow(0)!
                    const res = await fetch('/api/admin/certs', { method: 'POST', body: JSON.stringify(bottomRow.data) })
                    if (res.ok) {
                        const response_data = await res.json()
                        gridApi.applyTransaction({ add: [response_data.data] })
                        const row = gridApi.getRowNode(response_data.data.id)
                        row?.setSelected(true)
                        bottomRow.setData({ id: '', label: '', isManager: false, managerCert: null, replaces: null })
                        if (response_data.data.isManager) {
                            gridApi.getColumnDef('managerCert')?.cellEditorParams?.values?.push(response_data.data.id)
                        } else {
                            gridApi.getColumnDef('replaces')?.cellEditorParams?.values?.push(response_data.data.id)
                        }
                    } else {
                        alert('Invalid data')
                    }
                })
                this.eGui.appendChild(this.eButton)
            }
        }
        // ...
    }

    const colDefs: ag.ColDef<Prisma.Cert>[] = [
        {
            editable: false,
            headerName: '',
            cellRenderer: ButtonComponent,
            initialWidth: 100
        },
        {
            field: 'id',
            editable: true,
            headerName: 'Cert ID',
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
        pinnedBottomRowData: [{ id: '', label: '', isManager: false, managerCert: null, replaces: null }],

        defaultColDef: {
            valueFormatter: (params) =>
                params.node?.isRowPinned() && (params.value == null || params.value == '') ? (params.colDef.headerName ?? params.colDef.field!) + '...' : params.value
        },
        getRowStyle: ({ node }) => (node?.isRowPinned() ? { 'font-weight': '300', 'color': '#a0a0a0', 'font-style': 'italic' } : undefined),
        async onCellValueChanged(event) {
            if (event.rowPinned) {
                return
            }
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
