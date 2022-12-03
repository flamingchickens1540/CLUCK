import { getBounds } from "./circlePacker"
import type { MemberCircle } from "./circlePacker"

const membersDiv = document.getElementById('members');

const MARGIN = 1;

const BUBBLE_COLORS = ['rgba(35,132,198,.5)', 'rgba(255,214,0,.5)', 'rgba(241,93,34,.5)', 'rgba(108,157,204,.5)']
function renderCircle(circle: MemberCircle) {
    const { maxX, maxY, minX, minY } = getBounds()
    const widthMult = membersDiv.clientWidth/membersDiv.clientHeight;

    const lengthYX = (maxY - minY) * widthMult;
    const lengthX = maxX - minX;

    const vwWidth = membersDiv.clientWidth/window.innerWidth * 100;

    const multiplier = vwWidth/(lengthYX > lengthX ? lengthYX : lengthX);
    
    const offsetX = (vwWidth - lengthX * multiplier)/2;
    const offsetY = (vwWidth - lengthYX * multiplier)/2;

    const elem = document.createElement('member')

    const radius = circle.r * 2 * multiplier - MARGIN;

    elem.className = 'memberCircle'
    elem.style.width = elem.style.height = radius + "vw";
    elem.style.left = (circle.x - minX) * multiplier + offsetX - radius/2 + "vw";
    elem.style.top = (circle.y - minY) * multiplier + offsetY - radius/2 + "vw";

    elem.style.backgroundImage = `url(${circle.imgurl})`
    // elem.innerHTML = 'hi'
    membersDiv.appendChild(elem)


    // bubble name
    // blue, yellow, orange, lightblue, red

    const name = document.createElement('name')
    name.innerHTML = circle.name
    name.className = 'bubblename'
    name.style.backgroundColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    elem.appendChild(name)
}

export function redrawCircles(circles) {
    membersDiv.innerHTML = ''
    
    circles.forEach(renderCircle)
}

export function getRatio() {
    console.log(membersDiv.clientWidth/membersDiv.clientHeight)
    return membersDiv.clientWidth/membersDiv.clientHeight;
}


