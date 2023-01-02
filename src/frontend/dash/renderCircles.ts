import { Circle, ClockCircle, getBounds } from "./circlePacker"
import { MemberCircle } from "./circlePacker"

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


function renderClock(circle: ClockCircle, alone?:boolean) {
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

    elem.className = 'clockCircle'
    elem.innerHTML = 
    `<div class="time">
        <div class="colon">
            
        </div>
        <div class="numbers">
            <div class="hours" id="hoursCircleText">
            11:35
            </div>
         
        </div>
    </div>`
//     <div class="minutes">
// </div>
    elem.style.width = elem.style.height = radius + "vw";
    elem.style.left = (circle.x - minX) * multiplier + offsetX - radius/2 + "vw";
    elem.style.top = (circle.y - minY) * multiplier + offsetY - radius/2 + "vw";
    elem.style.fontSize = Math.min(radius) + "vw"

    if(alone){elem.classList.add('clockCircleAlone')}

    // elem.style.backgroundImage = `url(${circle.imgurl})`
    // elem.innerHTML = 'hi'
    membersDiv.appendChild(elem)
    formatClock()
}
function formatClock() {
    let now = new Date()
    let timetext = document.querySelector('#hoursCircleText')
    timetext.innerHTML = 
    '' + (((now.getHours()-1) % 12)+1) + ':' + (now.getMinutes().toString().length == 1 ? '0' : '') + now.getMinutes()
    if(('' + (((now.getHours()-1) % 12)+1)).length == 2) {
        timetext.classList.add('timeSmallerText')
    } else {
        timetext.classList.remove('timeSmallerText')
    }
}
setInterval(formatClock,1000)

export function redrawCircles(circles:Circle[]) {
    membersDiv.innerHTML = ''
    
    circles.forEach((circle:Circle)=>{
        if(circle instanceof MemberCircle) {
            renderCircle(circle as MemberCircle);
        } else if (circle instanceof ClockCircle) {
            renderClock(circle as ClockCircle,circles.length==1);
        }
    })
}

export function getRatio() {
    console.log(membersDiv.clientWidth/membersDiv.clientHeight)
    return membersDiv.clientWidth/membersDiv.clientHeight;
}


