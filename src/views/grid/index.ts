import { APIMember, WSCluckChange } from '~types'
import { openFullscreen } from '../util'
import { clock, getLoggedIn, getMemberList, refreshMemberList } from './clockapi'
import { registerGestures } from './gestures'
import { applyRandomStyles, isButtonLoggedIn, setButtonLoggedIn } from './style'
import socket_io from 'socket.io-client'

declare global {
    interface Window {
        skipAuth: boolean
        gestureDetected: boolean
        openFullscreen: () => void
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
            if (window.gestureDetected) {
                // Avoid registering clicks when swiping
                return
            }
            let button = click.target as HTMLDivElement
            if (button.classList.contains('buttonText')) {
                button = button.parentElement as HTMLDivElement
            }

            // Cluck API Call
            const ok = await clock(button.id, !isButtonLoggedIn(button))
            if (!ok) {
                await refreshLoggedIn()
            }
        }

        // Add name text
        const text = document.createElement('div')
        text.classList.add('buttonText')
        text.innerHTML = member.first_name

        // Randomize mix and match text styles
        applyRandomStyles(text)

        // Do other adding and styling things
        memberButton.appendChild(text)
        memberButton.style.setProperty('background-image', `url(${member.photo})`)
        return memberButton
    })
    document.getElementById('button-grid')!.replaceChildren(...memberButtons)
    setTimeout(refreshLoggedIn)
}

;(async () => {
    members = await getMemberList()
    await buildGrid()
    registerGestures()
    addEventListener('resize', redrawRows)
})()

async function refreshLoggedIn() {
    const membersIn = new Set<string>()
    const noconnect = document.getElementById('noconnect')!
    try {
        const loggedIn = await getLoggedIn()
        loggedIn.forEach((member) => membersIn.add(member.email))
        noconnect.style.setProperty('visibility', 'hidden')
    } catch (err) {
        console.warn(err)
        noconnect.style.setProperty('visibility', 'visible')
        return
    }

    // Update buttons
    const buttons = document.getElementsByClassName('memberButton') as HTMLCollectionOf<HTMLDivElement>
    for (const button of buttons) {
        setButtonLoggedIn(button, membersIn.has(button.id))
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

export async function refreshMemberListAndRerun() {
    members = await refreshMemberList()
    await buildGrid()
}

setInterval(refreshMemberListAndRerun, 60 * 60 * 1000)

const socket = socket_io('//localhost:3001')
socket.on('cluck_change', (data: WSCluckChange) => {
    const element = document.getElementById(data.email)
    if (element) {
        setButtonLoggedIn(element as HTMLDivElement, data.logging_in)
    }
})
