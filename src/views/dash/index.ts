import { ClockCircle, MemberCircle, placeCircles, placedCircles, sizeCircles, updateCircleList, updateCircles } from './circlepacker'
import { cyclePanel } from './chiefdelphi'
import { openFullscreen } from '../util'
import { getLoggedIn, getMemberList } from '~views/grid/clockapi'
import { APILoggedIn, APIMember } from '~types'

let members: Record<string, APIMember>
let loggedInCache: APILoggedIn[] = []

window['openFullscreen'] = openFullscreen

cyclePanel()
setInterval(cyclePanel, 1000 * 60) // chnage panel every 1 minutes
setInterval(regenCircles, 10) // refresh circles every 10ms

let prevTime = Date.now()

function regenCircles() {
    const now = Date.now()

    const membersToAdd = updateCircleList(new Map(loggedInCache.map((e) => [e.email, e.time_in])))
    const circlesToAdd = []
    for (const entry of membersToAdd) {
        const member = members[entry[0]]

        circlesToAdd.push(
            new MemberCircle(
                entry[1], // 1000 / 60 / 60
                member.email,
                member.first_name,
                member.photo
            )
        )
    }

    placeCircles(circlesToAdd)

    updateCircles(now - prevTime)

    sizeCircles()

    prevTime = now
}

async function update() {
    loggedInCache = await getLoggedIn()
}

async function start() {
    members = {}
    const memberlist = await getMemberList()
    memberlist.forEach((member) => {
        members[member.email] = member
    })
    loggedInCache = await getLoggedIn()
    placedCircles.push(new ClockCircle())

    setInterval(() => {
        update()
    }, 1000 * 3)
    window.addEventListener('resize', () => {
        regenCircles()
    })
}

start()
