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
        const divider = new Vector2D().getDistanceFrom(this);

        return new Vector2D(this.x / divider, this.y / divider);
    }

    scaled(scalar : number) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
}

export class Circle {
    position : Vector2D;
    velocity : Vector2D;
    acceleration : Vector2D;
    
    r: number;
    constructor(r) {
        this.r = r;
        this.position = new Vector2D();
        this.acceleration = new Vector2D();
        this.velocity = new Vector2D();
    }

    get mass() {
        return Math.PI * this.r**3;
    }

    get charge() {
        return this.r**3 / 10;
    }
}

export class MemberCircle extends Circle {
    name: string;
    imgurl: string;

    bubbleColor : string;
    constructor(hours, name, imgurl) {
        super((Math.sqrt(hours + .2)) * 10);
        this.name = name;
        this.imgurl = imgurl;

        this.bubbleColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    }
}

export class ClockCircle extends Circle{
}

export let placedCircles: Circle[] = [];


const BUBBLE_COLORS = ['rgba(35,132,198,.5)', 'rgba(255,214,0,.5)', 'rgba(241,93,34,.5)', 'rgba(108,157,204,.5)']
const FORCE_MULTIPLIER = 0.1;
const BOUNDARY_FIELD = 0.02;
const FRICTION = 0.25;
let TIME_SCALE = 1;

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

function getAspectRatio() {
    const container = document.getElementById("members");

    return container.clientWidth / container.clientHeight;
}

export function updateCircleList(loggedIn : [string, number][]) {
    placedCircles = placedCircles.filter(
        circle => !(circle instanceof MemberCircle) || loggedIn.find(entry => entry[0] == circle.name)
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
    const maxNewBoundSpace = Math.max(...circles.map(circle => circle.r));

    for(const circle of circles) {
        // do {
            const offsetX = Math.random() * maxNewBoundSpace + circle.r;
            const offsetY = Math.random() * maxNewBoundSpace + circle.r;
            
            circle.position.x = Math.random() > 0.5 ? offsetX + bounds.maxX : bounds.minX - offsetX;
            circle.position.y = Math.random() > 0.5 ? offsetY + bounds.maxY : bounds.minY - offsetY;
        // } while (circlesTouching(circle, newPlacedCircles));

        newPlacedCircles.push(circle);
    }

    placedCircles.push(...newPlacedCircles);
}

export function updateCircles(time : number) {
    if(time > 100) return;
    placedCircles.forEach(circle => {
        if(circle instanceof MemberCircle) {
            circle.r += time / 360000;
        }
    })
    time *= TIME_SCALE;
    const centerX = placedCircles.map(circle => circle.position.x).reduce((sum, r) => sum + r, 0) / placedCircles.length;
    const centerY = placedCircles.map(circle => circle.position.y).reduce((sum, r) => sum + r, 0) / placedCircles.length;
    // const centerX = 0;
    // const centerY = 0;

    const aspectRatio = getAspectRatio();
    placedCircles.forEach(circle => {
        circle.position.x += circle.velocity.x * time + circle.acceleration.x/2 * FRICTION * time**2 - centerX;
        circle.position.y += circle.velocity.y * time + circle.acceleration.y/2 * FRICTION * time**2 - centerY;

        circle.velocity.x = (circle.velocity.x + circle.acceleration.x * time) * FRICTION;
        circle.velocity.y = (circle.velocity.y + circle.acceleration.y * time) * FRICTION;

        const boundaryFieldForce = new Vector2D((-circle.position.x - centerX) * circle.charge / circle.mass * BOUNDARY_FIELD * FORCE_MULTIPLIER, (-circle.position.y - centerY) * circle.charge / circle.mass * BOUNDARY_FIELD * aspectRatio * FORCE_MULTIPLIER);

        // const forceValue = boundaryFieldForce.getDistanceFrom(new Vector2D());

        circle.acceleration = 
            boundaryFieldForce
            // .scaled(forceValue)
            // .scaled(Math.sqrt(forceValue));
            // .normalized().scaled(BOUNDARY_FIELD);
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

function circlesTouching(circle : Circle, circles : Circle[]) {
    return !circles.every(otherCircle => circle.r + otherCircle.r <= circle.position.getDistanceFrom(otherCircle.position));
}