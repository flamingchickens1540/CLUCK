import * as Prisma from '~prisma'
import * as ag from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'

async function main() {
    class ButtonComponent implements ag.ICellRendererComp<Prisma.Cert> {
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
            const rowID = params.data.id
            console.log(rowID)
            this.eGui = document.createElement('div')
            this.eGui.className = 'w-full h-full flex items-center justify-center'
            this.eButton = document.createElement('button')
            this.eButton.className = 'block border-red-400 text-sm text-red-50 px-2 py-1 w-full rounded-md border bg-transparent hover:bg-red-500 transition-colors duration-300'
            this.eButton.innerText = 'Delete'
            this.eButton.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete this meeting?')) {
                    return
                }
                const res = await fetch('/api/admin/meetings', { method: 'DELETE', body: JSON.stringify(gridApi.getRowNode(rowID)?.data) })
                if (res.ok) {
                    const nullDate = new Date(0)
                    gridApi.applyTransaction({
                        remove: [
                            {
                                id: rowID,
                                date: nullDate,
                                mandatory: false,
                                createdAt: nullDate,
                                updatedAt: nullDate
                            }
                        ]
                    })
                } else {
                    alert(res)
                }
            })
            this.eGui.appendChild(this.eButton)
        }
        // ...
    }
    const colDefs: ag.ColDef<Prisma.Meetings>[] = [
        {
            field: 'id',
            editable: false,
            headerName: 'ID',
            initialWidth: 50,
            cellStyle: { color: '#a0a0a0' }
        },
        {
            field: 'date',
            editable: true,
            cellEditor: 'agDateStringCellEditor',
            headerName: 'Date',
            sort: 'asc',
            initialSort: 'asc',
            valueParser: (params) => new Date(params.newValue),
            valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-US', { timeZone: 'UTC' })
        },
        {
            field: 'mandatory',
            editable: true,
            headerName: 'Is Mandatory?'
        },
        {
            headerName: '',
            sortable: false,
            cellRenderer: ButtonComponent
        }
    ]
    // Grid Options: Contains all of the Data Grid configurations
    const gridOptions: ag.GridOptions<Prisma.Meetings> = {
        getRowId: (params) => params.data.id.toString(),
        // Column Definitions: Defines the columns to be displayed.
        columnDefs: colDefs,
        getRowStyle: ({ node }) => (node?.isRowPinned() ? { 'font-weight': '300', 'color': '#a0a0a0', 'font-style': 'italic' } : undefined),
        async onCellValueChanged(event) {
            if (event.rowPinned) {
                return
            }
            const res = await fetch('/api/admin/meetings', { method: 'PUT', body: JSON.stringify(event.data) })
            const cert = await res.json()
            if (cert.error) {
                event.node.setDataValue(event.column.getColDef().field!, event.oldValue)
            }
            gridApi.applyTransaction({ update: [cert] })
        }
    }
    // Your Javascript code to create the Data Grid
    const gridApi = ag.createGrid(document.querySelector('#mygrid')!, gridOptions)
    fetch('/api/admin/meetings').then(async (resp) => {
        const meetings: Prisma.Meetings[] = await resp.json()
        gridApi.setGridOption('rowData', meetings)
    })
}
main()
