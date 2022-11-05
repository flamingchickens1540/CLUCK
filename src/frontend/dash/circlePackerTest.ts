// note: circle radii are normalized on render
const MARGIN = .7

let placedCircles: MemberCircle[] = []
let maxX = 0;
let minX = 0;
let maxY = 0;
let minY = 0;

export function getBounds() {
    return {
        maxX,
        maxY,
        minX,
        minY
    }
}

export class MemberCircle {
    x: number;
    y: number;
    r: number;
    touching: MemberCircle[] = [];
    name: string;
    imgurl: string;
    constructor(hours, name, imgurl) {
        this.name = name;
        this.imgurl = imgurl;
        this.r = (Math.sqrt(hours + .2)) * 10;
    }
}

function getDistanceFrom(circle1, x, y) {
    return Math.sqrt(Math.pow(circle1.x - x, 2) + Math.pow(circle1.y - y, 2));
}

function placeCircle(circle) {
    if(!placedCircles.length) {
        circle.x = circle.y = 0;
        return;
    }
    if(placedCircles.length == 1) {
        // circle.touching[circle.touching.length] = placedCircles[0].r, but stupider
        const distance = Math.pow(MARGIN + (placedCircles[0].touching[placedCircles[0].touching.length] = circle).r + circle.r, 2);

        const rand = Math.random();

        circle.x = Math.round(Math.random()) ? Math.sqrt(rand * distance) : -Math.sqrt(rand * distance);
        circle.y = Math.round(Math.random()) ? Math.sqrt((1 - rand) * distance) : -Math.sqrt((1 - rand) * distance);
        return;
    }

    for(let index1 = 0; index1 != placedCircles.length; index1++) {
        const circle1 = placedCircles[index1];
        for(let index2 = index1+1; index2 != placedCircles.length; index2++) {
            const circle2 = placedCircles[index2];
            const distanceFrom = circle1.r + circle2.r + MARGIN; 

            const radius1 = circle1.r + circle.r + MARGIN;
            const radius2 = circle2.r + circle.r + MARGIN;

            // a : distance from fulcrum
            const a = (Math.pow(radius1, 2) - Math.pow(radius2, 2) + Math.pow(distanceFrom, 2))/(2*distanceFrom);

            // dx : delta X
            const dx = circle1.x-circle2.x;
            const dy = circle1.y-circle2.y;

            // p : slope for perpendicular bisector of circle1 and circle2
            const p = -dx/dy;

            // 
            const multiplier = a/distanceFrom;

            let posX = circle1.x - multiplier * dx;
            let posY = circle1.y - multiplier * dy;

            let circleX = posX + Math.sqrt(Math.pow(radius1, 2) - Math.pow(a, 2))/Math.sqrt(1 + Math.pow(p, 2));
            let circleY = posY + p * Math.sqrt(Math.pow(radius1, 2) - Math.pow(a, 2))/Math.sqrt(1 + Math.pow(p, 2));

            if(isVacant(circle, circleX, circleY)) {
                circle.x = circleX;
                circle.y = circleY;
                circle1.touching[circle1.touching.length] = circle;
                return;
            }

            // console.log(a)
            // console.log(p)
            // console.log(radius1)
            // console.log(radius2)

            // improvments?
            circleX = posX - Math.sqrt(Math.pow(radius1, 2) - Math.pow(a, 2))/Math.sqrt(1 + Math.pow(p, 2));
            circleY = posY - p * Math.sqrt(Math.pow(radius1, 2) - Math.pow(a, 2))/Math.sqrt(1 + Math.pow(p, 2));

            if(isVacant(circle, circleX, circleY)) {
                circle.x = circleX;
                circle.y = circleY;
                circle1.touching[circle1.touching.length] = circle;
                return;
            }
        }
    }
}

function isVacant(circle, x, y) {
    for(let circle1 of placedCircles) {
        console.log(getDistanceFrom(circle1, x, y));
        if(getDistanceFrom(circle1, x, y) + 0.1 < circle.r + circle1.r + MARGIN)
            return false;
    }
    return true;
}

// assumes unplacedCircles is EMPTY
// and placedCircles is FILLED
export function placeCircles(circles: MemberCircle[]) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
    // normalize
    placedCircles = [];
    const unplacedCircles = circles.sort((a, b) => b.r - a.r);

    for(let circle = unplacedCircles.shift(); circle; circle = unplacedCircles.shift()) {
        // circle.x = circle.y = 0;
        placeCircle(circle);
        placedCircles[placedCircles.length] = circle;
        // console.log(circle.x)
        // console.log(circle.y)
        // console.log(circle.r)
        maxX = Math.max(maxX, circle.x + circle.r)
        maxY = Math.max(maxY, circle.y + circle.r)
        minX = Math.min(minX, circle.x - circle.r)
        minY = Math.min(minY, circle.y - circle.r)
    }
    console.log(placedCircles);

    console.log(getBounds());
    return placedCircles;
}

