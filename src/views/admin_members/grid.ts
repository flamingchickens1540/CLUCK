import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { getMemberPhoto } from '~lib/util'

export function getColumns(params: { photo_column_formatter?: unknown }) {
    const out: ag.ColDef<Prisma.Member>[] = [
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
            field: 'use_slack_photo',
            editable: true,
            headerName: 'Slack Photo Approved',
            initialWidth: 100
        },
        {
            field: 'is_primary_team',
            editable: true,
            headerName: 'Primary Team?',
            initialWidth: 100
        }
    ]
    if (params.photo_column_formatter) {
        out.unshift({
            headerName: '',
            valueGetter: (params) => getMemberPhoto(params.data as never, true) ?? '',
            editable: false,
            cellRenderer: params.photo_column_formatter,
            initialWidth: 100
        })
    }

    return out
}

export class ProfilePhotoComponent implements ag.ICellRendererComp<Prisma.Member> {
    private eGui!: HTMLElement
    private eImage!: HTMLImageElement
    private eBlank!: HTMLDivElement

    getGui(): HTMLElement {
        return this.eGui
    }
    destroy?(): void {
        this.eGui.remove()
    }
    refresh(params: ag.ICellRendererParams): boolean {
        this.eImage.src = params.value
        if (params.value) {
            this.eBlank.style.display = 'none'
            this.eImage.style.display = 'block'
        } else {
            this.eImage.style.display = 'none'
            this.eBlank.style.display = 'block'
        }

        return true
    }
    // ...
    init(params: ag.ICellRendererParams) {
        // create the cell

        this.eGui = document.createElement('div')
        this.eGui.className = 'h-full w-full overflow-hidden'

        const childClass = 'rounded-sm mx-auto object-contain h-full aspect-square border-[3px] ' + (params.data.slack_id != null ? 'border-green-500' : 'border-red-500')
        this.eImage = document.createElement('img')

        this.eImage.src = params.value
        this.eImage.alt = 'Profile Photo'
        this.eImage.className = childClass

        this.eBlank = document.createElement('div')
        this.eBlank.className = childClass

        if (params.value) {
            this.eBlank.style.display = 'none'
            this.eImage.style.display = 'block'
        } else {
            this.eImage.style.display = 'none'
            this.eBlank.style.display = 'block'
        }
        this.eGui.appendChild(this.eImage)
        this.eGui.appendChild(this.eBlank)
    }
    // ...
}
