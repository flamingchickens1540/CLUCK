import { busSigns, getArrivals } from './trimet'

const membersDiv = document.getElementById('members')!

export class Vector2D {
    x: number
    y: number

    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    getDistanceFrom(vector: Vector2D) {
        return Math.sqrt((this.x - vector.x) ** 2 + (this.y - vector.y) ** 2)
    }

    normalized() {
        const divisor = new Vector2D().getDistanceFrom(this)

        return new Vector2D(this.x / divisor, this.y / divisor)
    }

    scaled(scalar: number) {
        return new Vector2D(this.x * scalar, this.y * scalar)
    }

    added(vector: Vector2D) {
        return new Vector2D(this.x + vector.x, this.y + vector.y)
    }
}

export abstract class Circle {
    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D

    r: number

    readonly element: HTMLElement

    constructor(r: number) {
        this.element = membersDiv.appendChild(document.createElement('name'))

        this.r = r
        this.position = new Vector2D()
        this.acceleration = new Vector2D()
        this.velocity = new Vector2D()
    }

    get mass() {
        return Math.PI * this.r ** 2
        // return 200;
    }

    get charge() {
        return this.r ** 2 / 5
    }

    destroy() {
        this.element.remove()
    }

    abstract updateSize(): void
}

export class MemberCircle extends Circle {
    loginTime: number
    name: string
    email: string

    constructor(loginTime: number, email: string, name: string, imgurl: string) {
        super(Math.sqrt(0.2) * 10)

        this.loginTime = loginTime
        this.email = email
        this.element.id = email
        this.element.style.backgroundImage = `url(${imgurl})`
        this.element.className = 'memberCircle'

        const nameBubble = this.element.appendChild(document.createElement('name'))
        this.name = nameBubble.innerHTML = name
        nameBubble.className = 'bubblename'
        nameBubble.style.backgroundColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
        // name.style.fontSize = `${Math.min(30*multiplier, 20)}px`;
        nameBubble.style.fontSize = '25px'
    }

    updateSize() {
        this.r = Math.sqrt((Date.now() - this.loginTime) / 360000 + 0.2) * 20
    }
}

export class ClockCircle extends Circle {
    constructor() {
        super(Math.sqrt(0.2) * 10)
        this.element.className = 'clockCircle'
        this.element.innerHTML = `<div class="timestack">
        <div class="time">
            <div class="colon">
                
            </div>
            <div class="numbers">
                <div class="hours" id="hoursCircleText">
                11:35
                </div>
                
            </div>
        </div>
        <div class="businfo">
        <div class="busstack">
            <div class="busname">
            Gresham
        <img alt="trimet" src="../static/img/trimet-logo.png" class="trimetlogo">
            </div>
            <div class="bustime east ">--&nbsp;min</div>
            <div class="bustime smoler east">--&nbsp;min</div>

        </div>
        <div class="busstack weststack">
            <div class="busname">Beaverton</div>
            <div class="bustime west">-- min</div>
            <div class="bustime smoler west">-- min</div>

        </div>
        </div>
        </div>`
        const updateBusElements = async (elements: Element[], busSign: string) => {
            const arrivals = await getArrivals()
            elements.forEach((element, index) => {
                const elemArrivals = arrivals[busSign]
                const minutesTill = Math.max(0, Math.round((elemArrivals[index].getTime() - Date.now()) / 1000 / 60))
                element.innerHTML = minutesTill + '&nbsp;min'
                if (minutesTill <= 5) {
                    element.classList.add('soonish')
                } else {
                    element.classList.remove('soonish')
                }
            })
        }
        const updateBusTimes = async () => {
            const now = new Date()
            const timetext = document.querySelector('#hoursCircleText')!
            timetext.innerHTML = '' + (((now.getHours() + 12 - 1) % 12) + 1) + ':' + (now.getMinutes().toString().length == 1 ? '0' : '') + now.getMinutes()
            if (('' + (((now.getHours() + 12 - 1) % 12) + 1)).length == 2) {
                timetext.classList.add('timeSmallerText')
            } else {
                timetext.classList.remove('timeSmallerText')
            }

            await updateBusElements([...document.querySelectorAll('.bustime.east')], busSigns.east)
            await updateBusElements([...document.querySelectorAll('.bustime.west')], busSigns.west)
        }
        setTimeout(updateBusTimes)
        setInterval(updateBusTimes, 15000)
    }

    updateSize() {
        this.r = 20
        this.r = Math.max(...placedCircles.map((circle) => circle.r * 1.2))
    }
}

export let placedCircles: Circle[] = []

const BUBBLE_COLORS = ['rgba(35,132,198,.5)', 'rgba(255,214,0,.5)', 'rgba(241,93,34,.5)', 'rgba(108,157,204,.5)']
const FORCE_MULTIPLIER = 0.1
const FRICTION = 0.8
const TIME_SCALE = 1
const MARGIN = 1

export function getBounds() {
    if (placedCircles.length == 0) {
        return {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        }
    }

    const bounds = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
    }

    for (const circle of placedCircles) {
        bounds.maxX = Math.max(circle.position.x + circle.r, bounds.maxX)
        bounds.minX = Math.min(circle.position.x - circle.r, bounds.minX)
        bounds.maxY = Math.max(circle.position.y + circle.r, bounds.maxY)
        bounds.minY = Math.min(circle.position.y - circle.r, bounds.minY)
    }

    return bounds
}

let aspectRatio = 1
function updateAspectRatio() {
    aspectRatio = membersDiv.clientWidth / membersDiv.clientHeight
}

const BOUNDARY_FIELD = 0.005

export function applyBoundaryForce(circle: Circle) {
    const acceleration = circle.position.scaled((-circle.charge / circle.mass) * BOUNDARY_FIELD * FORCE_MULTIPLIER)

    acceleration.y *= aspectRatio

    circle.acceleration = acceleration.scaled(1 / (3 + 2 ** acceleration.getDistanceFrom(new Vector2D())))
    // .scaled(1/Math.sqrt(acceleration.getDistanceFrom(new Vector2D())));
}

export function updateCircleList(loggedIn: Record<string, Date>): string[] {
    const filled: Record<string, boolean> = {}
    placedCircles = placedCircles.filter((circle) => {
        if (circle instanceof MemberCircle) {
            if (loggedIn[circle.email] == undefined) {
                circle.destroy()
                return false
            }
            filled[circle.email] = true
        }
        return true
    })

    return Object.keys(loggedIn).filter((email) => !filled[email])
}

export function placeCircles(circles: Circle[]) {
    circles = circles.sort((circleA, circleB) => circleB.r - circleA.r)

    const bounds = getBounds()

    const newPlacedCircles = []
    let maxNewBoundSpace = Math.max(...circles.map((circle) => circle.r))

    for (const circle of circles) {
        const offsetX = Math.random() * maxNewBoundSpace + circle.r
        const offsetY = Math.random() * maxNewBoundSpace + circle.r

        circle.position.x = Math.random() > 0.5 ? offsetX + bounds.maxX : bounds.minX - offsetX
        circle.position.y = Math.random() > 0.5 ? offsetY + bounds.maxY : bounds.minY - offsetY

        newPlacedCircles.push(circle)
        maxNewBoundSpace += circle.r
    }

    placedCircles.push(...newPlacedCircles)
}

export function updateCircles(time: number) {
    if (time > 100) return

    placedCircles.forEach((circle) => circle.updateSize())

    time *= TIME_SCALE

    const center = new Vector2D(
        placedCircles.map((circle) => circle.position.x).reduce((sum, r) => sum + r, 0) / placedCircles.length,
        placedCircles.map((circle) => circle.position.y).reduce((sum, r) => sum + r, 0) / placedCircles.length
    ).scaled(-1)
    // const centerX = 0;
    // const centerY = 0;
    updateAspectRatio()
    placedCircles.forEach((circle) => {
        circle.position = circle.position
            .added(circle.velocity.scaled(time))
            .added(circle.acceleration.scaled((FRICTION * time ** 2) / 2))
            .added(center)

        circle.velocity = circle.velocity.added(circle.acceleration.scaled(time)).scaled(FRICTION)

        applyBoundaryForce(circle)
    })

    for (let circleIndex = 0; circleIndex < placedCircles.length; circleIndex++) {
        const circle = placedCircles[circleIndex]

        for (let secondaryIndex = circleIndex + 1; secondaryIndex < placedCircles.length; secondaryIndex++) {
            const otherCircle = placedCircles[secondaryIndex]

            const distance = circle.position.getDistanceFrom(otherCircle.position)

            const force = ((circle.charge * otherCircle.charge) / distance ** 2) * FORCE_MULTIPLIER

            const forceDirection = new Vector2D(otherCircle.position.x - circle.position.x, otherCircle.position.y - circle.position.y).normalized()

            circle.acceleration.x -= (force * forceDirection.x) / circle.mass
            circle.acceleration.y -= (force * forceDirection.y) / circle.mass
            otherCircle.acceleration.x -= (force * -forceDirection.x) / otherCircle.mass
            otherCircle.acceleration.y -= (force * -forceDirection.y) / otherCircle.mass
        }
    }
}

export function sizeCircles() {
    const { maxX, maxY, minX, minY } = getBounds()
    const widthMult = membersDiv.clientWidth / membersDiv.clientHeight

    const lengthYX = (maxY - minY) * widthMult
    const lengthX = maxX - minX

    const vwWidth = (membersDiv.clientWidth / window.innerWidth) * 100

    const multiplier = vwWidth / (lengthYX > lengthX ? lengthYX : lengthX)

    const offsetX = (vwWidth - lengthX * multiplier) / 2
    const offsetY = (vwWidth - lengthYX * multiplier) / 2

    for (const circle of placedCircles) {
        const elem = circle.element
        const radius = circle.r * 2 * multiplier - MARGIN

        elem.style.width = elem.style.height = `${radius}vw`
        elem.style.left = `${(circle.position.x - minX) * multiplier + offsetX - radius / 2}vw`
        elem.style.top = `${(circle.position.y - minY) * multiplier + offsetY - radius / 2}vw`

        if (circle instanceof ClockCircle) circle.element.style.fontSize = Math.min(radius) + 'vw'
    }
}
function circlesTouching(circle: Circle, circles: Circle[]) {
    return !circles.every((otherCircle) => circle.r + otherCircle.r <= circle.position.getDistanceFrom(otherCircle.position))
}
