import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { GridApi } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.min.css'
import 'ag-grid-community/styles/ag-theme-quartz.min.css'
import { toTitleCase } from '~lib/util'
import { getColumns } from '~views/admin_members/grid'
import { enum_Member_Team } from '@prisma/client'

const getDefaultRow = () => ({ use_slack_photo: false, team: enum_Member_Team.junior }) as never
export async function initNewMemberTable(mainTable: GridApi) {
    class ButtonComponent implements ag.ICellRendererComp<Prisma.Member> {
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

        init() {
            this.eGui = document.createElement('div')
            this.eGui.className = 'w-full h-full flex items-center justify-center'
            this.eButton = document.createElement('button')
            this.eButton.className = 'block border-gray-400 text-sm text-gray-50 px-2 py-1 w-full rounded-md border bg-transparent hover:bg-gray-500 transition-colors duration-300'
            this.eButton.innerText = 'Add'
            this.eButton.addEventListener('click', async () => {
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
            this.eGui.appendChild(this.eButton)
        }
    }

    const gridOptions: ag.GridOptions<Prisma.Member> = {
        columnDefs: getColumns({ photo_column_formatter: ButtonComponent }),
        rowData: [getDefaultRow()],
        headerHeight: 0,
        rowHeight: 50,
        autoSizePadding: 0,
        defaultColDef: {
            valueFormatter: (params) => (params.value == null || params.value == '' ? (params.colDef.headerName ?? toTitleCase(params.colDef.field!)) + '...' : params.value)
        },
        getRowStyle: () => ({ 'font-weight': '300', 'color': '#a0a0a0', 'font-style': 'italic' })
    }

    const grid = ag.createGrid(document.querySelector('#new-member-grid')!, gridOptions)
}
