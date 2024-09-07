import {getArrivals, busSigns} from "./trimet"

const membersDiv = document.getElementById('members');
const DELTA_AVG = 0.25;

export class Vector2D {
    x : number;
    y : number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    getDistanceFrom(vector : Vector2D) {
        return Math.sqrt((this.x - vector.x)**2 + (this.y - vector.y)**2);
    }

    normalized() {
        const divisor = new Vector2D().getDistanceFrom(this);

        return new Vector2D(this.x / divisor, this.y / divisor);
    }

    scaled(scalar : number) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    added(vector : Vector2D) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    }
}

export abstract class Circle {
    position : Vector2D;
    velocity : Vector2D;
    acceleration : Vector2D;
    
    r: number;

    readonly element : HTMLElement;

    constructor(r) {
        this.element = membersDiv.appendChild(document.createElement("name"));

        this.r = r;
        this.position = new Vector2D();
        this.acceleration = new Vector2D();
        this.velocity = new Vector2D();
    }

    get mass() {
        return Math.PI * this.r**2;
        // return 200;
    }

    get charge() {
        return this.r**2 / 5;
    }

    destroy() {
        this.element.remove();
    }

    abstract updateSize();
}

export class MemberCircle extends Circle {
    loginTime : number;
    name : string;

    constructor(loginTime, name, imgurl) {
        super(Math.sqrt(.2) * 10);

        this.loginTime = loginTime;

        this.element.style.backgroundImage = `url(${imgurl})`;
        this.element.className = 'memberCircle'

        const nameBubble = this.element.appendChild(document.createElement('name'));
        this.name = nameBubble.innerHTML = name
        nameBubble.className = 'bubblename'
        nameBubble.style.backgroundColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
        // name.style.fontSize = `${Math.min(30*multiplier, 20)}px`;
        nameBubble.style.fontSize = '1rem';
    }

    updateSize() {
        this.r = Math.sqrt((Date.
        now() - this.loginTime) / 360000 + .2) * 20;
    }
}

export class ClockCircle extends Circle{
    constructor() {
        super(Math.sqrt(.2) * 10);
        this.element.className = 'clockCircle'
        this.element.innerHTML = 
        `<div class="timestack">
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
        <img src="../static/img/trimet-logo.png" class="trimetlogo">
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

        setTimeout(() => {
            let now = new Date()
            let timetext = document.querySelector('#hoursCircleText')
            timetext.innerHTML = 
            '' + (((now.getHours()+12-1) % 12)+1) + ':' + (now.getMinutes().toString().length == 1 ? '0' : '') + now.getMinutes()
            if(('' + (((now.getHours()+12-1) % 12)+1)).length == 2) {
                timetext.classList.add('timeSmallerText')
            } else {
                timetext.classList.remove('timeSmallerText')
            }
            (async () => {
                let arrivals = await getArrivals()
                const timeElems = [];
                document.querySelectorAll('.bustime.east').forEach(timeElems.push);
                document.querySelectorAll('.bustime.west').forEach(timeElems.push);

                for(let busSignIndex = 0; busSignIndex < timeElems.length; busSignIndex++) {
                    let arrivalsCardinal;
                    if(busSignIndex < 2)
                        arrivalsCardinal = arrivals[busSigns[0]];
                    else
                        arrivalsCardinal = arrivals[busSigns[1]];

                    let minutesTill = Math.max(0,Math.round((arrivalsCardinal[busSignIndex % 2] - Date.now())/1000/60));

                    timeElems[0].innerHTML = minutesTill + '&nbsp;min'
                    if(minutesTill <= 5)
                        timeElems[0].classList.add("soonish");
                    else
                        timeElems[0].classList.remove("soonish");
                }
            })();
        },
        15000);
    }

    updateSize() {
        this.r = 20;
        this.r = Math.max(...placedCircles.map(circle => circle.r * 1.5));
    }
}

export let placedCircles: Circle[] = [];

const BUBBLE_COLORS = ['rgba(35,132,198,.5)', 'rgba(255,214,0,.5)', 'rgba(241,93,34,.5)', 'rgba(108,157,204,.5)']
const FORCE_MULTIPLIER = 0.1;
const FRICTION = 0.8;
const TIME_SCALE = 1;
const MARGIN = 0.5;
const SNAP_DISTANCE = 3;


export function getBounds() {
    if(placedCircles.length == 0) {
        return {
            minX : 0,
            maxX : 0,
            minY : 0,
            maxY : 0
        }
    }

    const bounds = {
        minX : Infinity,
        maxX : -Infinity,
        minY : Infinity,
        maxY : -Infinity
    }

    for(const circle of placedCircles) {
        bounds.maxX = Math.max(circle.position.x + circle.r, bounds.maxX);
        bounds.minX = Math.min(circle.position.x - circle.r, bounds.minX);
        bounds.maxY = Math.max(circle.position.y + circle.r, bounds.maxY);
        bounds.minY = Math.min(circle.position.y - circle.r, bounds.minY);
    }

    return bounds;
}

let aspectRatio = 1;
function updateAspectRatio() {
    aspectRatio = membersDiv.clientWidth / membersDiv.clientHeight;
}

const BOUNDARY_FIELD = 0.005;

export function applyBoundaryForce(circle : Circle) {
    const acceleration = circle.position
    .scaled(-circle.charge / circle.mass * BOUNDARY_FIELD * FORCE_MULTIPLIER);

    acceleration.y *= aspectRatio;

    circle.acceleration = acceleration.scaled(1 / (3 + 2**acceleration.getDistanceFrom(new Vector2D())));
    // .scaled(1/Math.sqrt(acceleration.getDistanceFrom(new Vector2D())));
}

export function updateCircleList(loggedIn : [string, number][]) {
    placedCircles = placedCircles.filter(
        circle => {
            if(circle instanceof MemberCircle) {
                if(!loggedIn.find(entry => entry[0] == circle.name)) {
                    circle.destroy();
                    return false;
                }
            }
            return true;
        }
    );

    return loggedIn.filter(
        entry => !placedCircles.find(
            circle => circle instanceof MemberCircle && circle.name == entry[0]
        )
    );
}

export function placeCircles(circles : Circle[]) {
    circles = circles.sort((circleA, circleB) => circleB.r - circleA.r);

    const bounds = getBounds();

    const newPlacedCircles = [];
    let maxNewBoundSpace = Math.max(...circles.map(circle => circle.r));

    for(const circle of circles) {
        const offsetX = Math.random() * maxNewBoundSpace + circle.r;
        const offsetY = Math.random() * maxNewBoundSpace + circle.r;
        
        circle.position.x = Math.random() > 0.5 ? offsetX + bounds.maxX : bounds.minX - offsetX;
        circle.position.y = Math.random() > 0.5 ? offsetY + bounds.maxY : bounds.minY - offsetY;

        newPlacedCircles.push(circle);
        maxNewBoundSpace += circle.r;
    }

    placedCircles.push(...newPlacedCircles);
}

export function updateCircles(time : number) {
    if(time > 1000) return;

    placedCircles.forEach(circle => circle.updateSize());

    const sortedCircles = placedCircles.sort((a, b) => a.r - b.r);

    let sizeSum = 0;

    for(const circle of sortedCircles)
        circle.r -= (circle.r - (sizeSum += circle.r)/(sortedCircles.length+1)) * DELTA_AVG;

    time *= TIME_SCALE;
    
    const center = new Vector2D(
        placedCircles.map(circle => circle.position.x).reduce((sum, r) => sum + r, 0) / placedCircles.length,
        placedCircles.map(circle => circle.position.y).reduce((sum, r) => sum + r, 0) / placedCircles.length
    ).scaled(-1);
    // const centerX = 0;
    // const centerY = 0;
    updateAspectRatio();
    placedCircles.forEach(circle => {

        circle.position = circle.position
        .added(
            circle.velocity.scaled(time)
        )
        .added(
            circle.acceleration.scaled(FRICTION * time**2 / 2)
        )
        .added(center);

        circle.velocity = circle.velocity
        .added(
            circle.acceleration.scaled(time)
        )
        .scaled(FRICTION);

        applyBoundaryForce(circle);
    });

    for(let circleIndex = 0; circleIndex < placedCircles.length; circleIndex++) {
        const circle = placedCircles[circleIndex];

        for(let secondaryIndex = circleIndex+1; secondaryIndex < placedCircles.length; secondaryIndex++) {
            const otherCircle = placedCircles[secondaryIndex];

            const distance = circle.position.getDistanceFrom(otherCircle.position);

            const force = circle.charge * otherCircle.charge / distance**2 * FORCE_MULTIPLIER;

            const forceDirection = new Vector2D(otherCircle.position.x - circle.position.x, otherCircle.position.y - circle.position.y).normalized();

            circle.acceleration.x -= force * forceDirection.x / circle.mass;
            circle.acceleration.y -= force * forceDirection.y / circle.mass;
            otherCircle.acceleration.x -= force * -forceDirection.x / otherCircle.mass;
            otherCircle.acceleration.y -= force * -forceDirection.y / otherCircle.mass;
        }
    }
}

let renderedCircles = [];

export async function sizeCircles() {
    const sizedCircles = [];
    for(const circle of placedCircles) {
        let minScale = Infinity;

        placedCircles.forEach(otherCircle => {
            if(otherCircle == circle)
                return Infinity;
            minScale = Math.min(circle.position.getDistanceFrom(otherCircle.position) / (circle.r + otherCircle.r), minScale);
        });
        
        sizedCircles.push({
            circle,
            radius : circle.r * (minScale == Infinity ? 1 : minScale)
        });
    }

    let maxX = 0, maxY = 0, minX = 0, minY = 0;

    sizedCircles.forEach(circle => {
        maxX = Math.max(circle.circle.position.x + circle.radius, maxX);
        minX = Math.min(circle.circle.position.x - circle.radius, minX);
        maxY = Math.max(circle.circle.position.y + circle.radius, maxY);
        minY = Math.min(circle.circle.position.y - circle.radius, minY);
    });

    const widthMult = membersDiv.clientWidth/membersDiv.clientHeight;

    const lengthYX = (maxY - minY) * widthMult;
    const lengthX = maxX - minX;

    const vwWidth = membersDiv.clientWidth/window.innerWidth * 100;

    const multiplier = vwWidth/(lengthYX > lengthX ? lengthYX : lengthX);
    
    const offsetX = (vwWidth - lengthX * multiplier)/2;
    const offsetY = (vwWidth - lengthYX * multiplier)/2;

    let snapCircles = false;
    for(const circle of sizedCircles) {
        const elem = circle.circle.element;

        let diameter = circle.radius * multiplier * 2 - MARGIN;

        elem.style.width = elem.style.height = `${diameter}vw`;

        elem.style.left = `${(circle.circle.position.x - minX) * multiplier + offsetX - diameter/2}vw`;
        elem.style.top = `${(circle.circle.position.y - minY) * multiplier + offsetY - diameter/2}vw`;

        if(circle.circle instanceof ClockCircle) {
            elem.style.fontSize = diameter + "vw";
        }

        let rendered = renderedCircles.find(renderedCircle => circle.circle == renderedCircle.circle);
        const computedStyle = elem.computedStyleMap();
        if(rendered == undefined) {
            renderedCircles.push({
                circle : circle.circle,
                top : computedStyle.get("top").value,
                left : computedStyle.get("left").value,
                dia : computedStyle.get("width").value
            })
        } else {
            if(!(Math.abs(computedStyle.get("top").value - rendered.top) < SNAP_DISTANCE && Math.abs(computedStyle.get("left").value - rendered.left) < SNAP_DISTANCE)) {
                snapCircles = true;
            }
        }
    }

    renderedCircles.filter(rendered => rendered.circle.element);
    
    if(snapCircles) {
        renderedCircles.forEach((rendered, index) => {
            const computedStyle = rendered.circle.element.computedStyleMap();
            if(computedStyle.get("top") == undefined) {
                renderedCircles.splice(index, 1);
                return;
            }
            rendered.top = computedStyle.get("top").value;
            rendered.left = computedStyle.get("left").value;
            rendered.dia = computedStyle.get("width").value;
        });
    } else {
        renderedCircles.forEach(rendered => {
            const style = rendered.circle.element.style;
            
            style.top = `${rendered.top}px`;
            style.left = `${rendered.left}px`;
            style.width = style.height = `${rendered.dia}px`;
        });
    }
}