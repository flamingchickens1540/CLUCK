import * as Prisma from '~prisma'
import * as ag from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'

async function main() {
    class ButtonComponent implements ag.ICellRendererComp<Prisma.Department> {
        private eGui!: HTMLElement
        private eButton!: HTMLElement

        getGui(): HTMLElement {
            return this.eGui
        }
        destroy?(): void {
            this.eGui.remove()
        }
        refresh(): boolean {
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
                    const res = await fetch('/api/admin/departments', { method: 'POST', body: JSON.stringify(bottomRow.data) })
                    if (res.ok) {
                        const response_data = await res.json()
                        gridApi.applyTransaction({ add: [response_data.data] })
                        const row = gridApi.getRowNode(response_data.data.id)
                        row?.setSelected(true)
                        bottomRow.setData({ id: '', name: '', slack_group: '' })
                    } else {
                        alert('Invalid data')
                    }
                })
                this.eGui.appendChild(this.eButton)
            }
        }
        // ...
    }

    const colDefs: ag.ColDef<Prisma.Department>[] = [
        {
            editable: false,
            headerName: '',
            cellRenderer: ButtonComponent,
            initialWidth: 100
        },
        {
            field: 'id',
            editable: false,
            headerName: 'Department ID',
            sort: 'asc'
        },
        {
            field: 'name',
            editable: true,
            cellEditor: 'agTextCellEditor',
            headerName: 'Label'
        },
        {
            field: 'slack_group',
            editable: true,
            headerName: 'Slack Group ID'
        }
    ]
    // Grid Options: Contains all of the Data Grid configurations
    const gridOptions: ag.GridOptions<Prisma.Department> = {
        getRowId: (params) => params.data.id,

        // Column Definitions: Defines the columns to be displayed.
        columnDefs: colDefs,
        pinnedBottomRowData: [{ id: '', name: '', slack_group: '' }],

        defaultColDef: {
            valueFormatter: (params) =>
                params.node?.isRowPinned() && (params.value == null || params.value == '') ? (params.colDef.headerName ?? params.colDef.field!) + '...' : params.value
        },
        getRowStyle: ({ node }) => (node?.isRowPinned() ? { 'font-weight': '300', 'color': '#a0a0a0', 'font-style': 'italic' } : undefined),
        async onCellValueChanged(event) {
            if (event.rowPinned) {
                return
            }
            const res = await fetch('/api/admin/departments', { method: 'PUT', body: JSON.stringify(event.data) })
            const cert = await res.json()
            if (cert.error) {
                event.node.setDataValue(event.column.getColDef().field!, event.oldValue)
            }
            gridApi.applyTransaction({ update: [cert] })
        }
    }
    // Your Javascript code to create the Data Grid
    const gridApi = ag.createGrid(document.querySelector('#mygrid')!, gridOptions)
    fetch('/api/admin/departments').then(async (resp) => {
        const deps: Prisma.Department[] = await resp.json()
        gridApi.setGridOption('rowData', deps)
    })
}
main()
