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
            headerName: 'A',
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
        throw new Error('Method not implemented.')
    }
    refresh(): boolean {
        throw new Error('Method not implemented.')
    }
    // ...
    init(props: ag.ICellRendererParams) {
        // create the cell
        this.eGui = document.createElement('div')
        if (props.value) {
            this.eGui.innerHTML = `<img src="${props.value}" class="object-scale-down h-full w-full" alt="Profile Photo">`
        }
    }
    // ...
}
