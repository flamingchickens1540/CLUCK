import { getBounds } from "./circlePacker"
import type { MemberCircle } from "./circlePacker"

const membersDiv = document.getElementById('members')

const BUBBLE_COLORS = ['rgba(35,132,198,.5)', 'rgba(255,214,0,.5)', 'rgba(241,93,34,.5)', 'rgba(108,157,204,.5)']
function renderCircle(circle: MemberCircle) {
    const { maxX, maxY, minX, minY } = getBounds()
    const widthMult = membersDiv.clientWidth/membersDiv.clientHeight;

    let lengthYX = (maxY - minY) * widthMult;
    let lengthX = maxX - minX;

    let multiplier;

    if(lengthYX > lengthX) {
        console.log("hi")
        multiplier = membersDiv.clientWidth/window.innerWidth/(lengthYX) * 100;
    } else 
        multiplier = membersDiv.clientWidth/window.innerWidth/(maxX - minX) * 100;
    
    const elem = document.createElement('member')
    elem.className = 'memberCircle'
    elem.style.width = elem.style.height = circle.r * 2 * multiplier + "vw";
    elem.style.left = (circle.x - minX - circle.r) * multiplier + "vw";
    elem.style.top = (circle.y - minY - circle.r) * multiplier + "vw";

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


