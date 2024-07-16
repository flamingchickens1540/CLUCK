import Prisma from '@prisma/client'
import * as ag from 'ag-grid-community'
import { safeParseInt, toTitleCase } from '~lib/util'
import { getMemberPhoto } from '~lib/util'

export function getColumns(params: { include_photo: boolean }) {
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
    ]
    if (params.include_photo) {
        out.unshift({
            headerName: '',
            valueGetter: (params) => getMemberPhoto(params.data as never) ?? '',
            editable: false,
            cellRenderer: ProfilePhotoComponent,
            initialWidth: 100
        })
    }

    return out
}

export class ProfilePhotoComponent implements ag.ICellRendererComp<Prisma.Member> {
    private eGui!: HTMLElement

    getGui(): HTMLElement {
        return this.eGui
    }
    destroy?(): void {
        this.eGui.remove()
    }
    refresh(): boolean {
        throw new Error('Method not implemented.')
    }
    // ...
    init(props: ag.ICellRendererParams) {
        // create the cell

        this.eGui = document.createElement('div')
        this.eGui.className = 'h-full w-full overflow-hidden'
        const img = document.createElement(props.value ? 'img' : 'div')
        if ('src' in img && 'alt' in img) {
            img.src = props.value
            img.alt = 'Profile Photo'
        }
        img.className = 'mx-auto object-contain h-full aspect-square border-[3px] ' + (props.data.slack_id != null ? 'border-green-500' : 'border-red-500')
        this.eGui.appendChild(img)
    }
    // ...
}
