import { APIMember } from '~types'
import { openFullscreen } from '../util'
import { getAttendance, getMemberList, MemberState, setAttendance } from './clockapi'

export function getState(element: HTMLDivElement): MemberState {
    return (element.getAttribute('data-state') as MemberState) ?? 'absent'
}

export function getNextState(element: HTMLDivElement): MemberState {
    switch (getState(element)) {
        case 'absent':
            return 'present'
        case 'present':
            return 'no_credit'
        case 'no_credit':
            return 'absent'
    }
}

export function advanceState(element: HTMLDivElement): MemberState {
    const next = getNextState(element)
    setState(element, next)
    return next
}

export function setState(element: HTMLDivElement, state: MemberState) {
    return element.setAttribute('data-state', state)
}

declare global {
    interface Window {
        openFullscreen: () => void
        meeting_id: number
    }
}
window.openFullscreen = openFullscreen
let members: APIMember[]

export async function buildGrid() {
    // document.getElementById('button-grid')!.style.display = 'none'
    redrawRows()

    // Make member buttons
    document.getElementById('button-grid')!.replaceChildren()
    const memberButtons = members.map((member) => {
        // Init button
        const memberButton = document.createElement('div')
        memberButton.classList.add('memberButton')
        memberButton.id = member.email

        // Set click toggle
        memberButton.onclick = async (click) => {
            let button = click.target as HTMLDivElement
            if (button.classList.contains('buttonText')) {
                button = button.parentElement as HTMLDivElement
            }

            // Cluck API Call
            const ok = await setAttendance(button.id, advanceState(button))
            if (!ok) {
                await refreshState()
            }
        }

        // Add name text
        const text = document.createElement('div')
        text.classList.add('buttonText')
        text.innerHTML = member.first_name

        // Do other adding and styling things
        memberButton.appendChild(text)
        memberButton.style.setProperty('background-image', `url(${member.photo})`)
        return memberButton
    })
    document.getElementById('button-grid')!.replaceChildren(...memberButtons)
    setTimeout(refreshState)
}

;(async () => {
    members = await getMemberList()
    await buildGrid()
    addEventListener('resize', redrawRows)
})()

async function refreshState() {
    let states: Record<string, MemberState> = {}
    const noconnect = document.getElementById('noconnect')!
    try {
        const meeting = await getAttendance()
        states = meeting.attendance
        window.meeting_id = meeting.id
        document.getElementById('title')!.innerText = meeting.label
        noconnect.style.setProperty('visibility', 'hidden')
    } catch (err) {
        console.warn(err)
        noconnect.style.setProperty('visibility', 'visible')
        return
    }

    // Update buttons
    const buttons = document.getElementsByClassName('memberButton') as HTMLCollectionOf<HTMLDivElement>
    for (const button of buttons) {
        setState(button, states[button.id] ?? 'absent')
    }
}

export function redrawRows() {
    // Compute number of rows and columns, and cell size
    const n = members.length
    const x = document.documentElement.clientWidth
    const y = document.documentElement.clientHeight
    const ratio = x / y
    const ncolsFloat = Math.sqrt(n * ratio)
    const nrowsFloat = n / ncolsFloat

    // Find best option filling the whole height
    let nrows1 = Math.ceil(nrowsFloat)
    let ncols1 = Math.ceil(n / nrows1)
    while (nrows1 * ratio < ncols1) {
        nrows1++
        ncols1 = Math.ceil(n / nrows1)
    }
    const cellSize1 = y / nrows1

    // Find best option filling the whole width
    let ncols2 = Math.ceil(ncolsFloat)
    let nrows2 = Math.ceil(n / ncols2)
    while (ncols2 < nrows2 * ratio) {
        ncols2++
        nrows2 = Math.ceil(n / ncols2)
    }
    const cellSize2 = x / ncols2

    // Find the best values
    let nrows, ncols
    if (cellSize1 < cellSize2) {
        nrows = nrows2
        ncols = ncols2
    } else {
        nrows = nrows1
        ncols = ncols1
    }

    document.documentElement.style.setProperty('--width', ncols.toString())
    document.documentElement.style.setProperty('--height', nrows.toString())
}

// const socket = socket_io({ path: '/ws' })
// socket.on('cluck_change', (data: WSCluckChange) => {
//     const element = document.getElementById(data.email)
//     if (element) {
//         setButtonLoggedIn(element as HTMLDivElement, data.logging_in)
//     }
// })
