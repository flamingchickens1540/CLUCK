import { ClockCircle, MemberCircle, placeCircles, placedCircles, sizeCircles, updateCircleList, updateCircles } from './circlepacker'
import { cyclePanel } from './chiefdelphi'
import { openFullscreen } from '../util'
import { getLoggedIn, getMemberList } from '~views/grid/clockapi'
import { APIMember, WSCluckChange } from '~types'
import socket_io from 'socket.io-client'

let members: Record<string, APIMember>
let loggedInCache: Record<string, Date> = {}

window['openFullscreen'] = openFullscreen

setTimeout(cyclePanel)
setInterval(cyclePanel, 1000 * 60) // chnage panel every 1 minutes
setInterval(populateCircles, 50) // refresh circles at 20Hz

let prevTime = Date.now()

function populateCircles() {
    const membersToAdd = updateCircleList(loggedInCache)
    const circlesToAdd = membersToAdd.map((entry) => {
        const member = members[entry]

        return new MemberCircle(
            loggedInCache[entry].getTime(), // 1000 / 60 / 60
            member.email,
            member.first_name,
            member.photo
        )
    })
    placeCircles(circlesToAdd)

    const now = Date.now()
    updateCircles(now - prevTime)
    sizeCircles()
    prevTime = now
}

async function update() {
    try {
        const loggedIn = await getLoggedIn()
        loggedInCache = Object.fromEntries(loggedIn.map((entry) => [entry.email, new Date(entry.time_in)]))
        document.getElementById('logo')!.style.display = 'block'
        document.body.style.backgroundColor = 'black'
    } catch (e) {
        console.warn(e)
        document.getElementById('logo')!.style.display = 'none'
        document.body.style.backgroundColor = 'red'
    }
}

async function start() {
    members = {}
    const memberlist = await getMemberList()
    memberlist.forEach((member) => {
        members[member.email] = member
    })
    setTimeout(update)
    setInterval(() => {
        update()
    }, 1000 * 30)
    window.addEventListener('resize', () => {
        populateCircles()
    })
}

const socket = socket_io({ path: '/ws' })
socket.on('cluck_change', (data: WSCluckChange) => {
    if (data.logging_in) {
        loggedInCache[data.email] = new Date()
    } else {
        delete loggedInCache[data.email]
    }
})

socket.on('disconnect', () => {
    document.getElementById('logo')!.style.display = 'none'
    document.body.style.backgroundColor = 'red'
})
socket.on('connect', () => {
    document.getElementById('logo')!.style.display = 'block'
    document.body.style.backgroundColor = 'black'
})

setTimeout(start)
