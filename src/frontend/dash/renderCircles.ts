import { Circle, ClockCircle, getBounds } from "./circlePacker"
import { MemberCircle } from "./circlePacker"
import {getArrivals, busSigns} from "./trimet"
const membersDiv = document.getElementById('members');

const MARGIN = 1;

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
    elem.style.left = (circle.position.x - minX) * multiplier + offsetX - radius/2 + "vw";
    elem.style.top = (circle.position.y - minY) * multiplier + offsetY - radius/2 + "vw";

    elem.style.backgroundImage = `url(${circle.imgurl})`
    // elem.innerHTML = 'hi'
    membersDiv.appendChild(elem)


    // bubble name
    // blue, yellow, orange, lightblue, red

    const name = document.createElement('name')
    name.innerHTML = circle.name
    name.className = 'bubblename'
    name.style.backgroundColor = circle.bubbleColor;
    // name.style.fontSize = `${Math.min(30*multiplier, 20)}px`;
    name.style.fontSize = '10px';
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
//     <div class="minutes">
// </div>
    elem.style.width = elem.style.height = radius + "vw";
    elem.style.left = (circle.position.x - minX) * multiplier + offsetX - radius/2 + "vw";
    elem.style.top = (circle.position.y - minY) * multiplier + offsetY - radius/2 + "vw";
    elem.style.fontSize = Math.min(radius) + "vw"

    if(alone){elem.classList.add('clockCircleAlone')}

    // elem.style.backgroundImage = `url(${circle.imgurl})`
    // elem.innerHTML = 'hi'
    membersDiv.appendChild(elem)
    formatClock()
    setBusInfo()
}
function formatClock() {
    let now = new Date()
    let timetext = document.querySelector('#hoursCircleText')
    timetext.innerHTML = 
    '' + (((now.getHours()+12-1) % 12)+1) + ':' + (now.getMinutes().toString().length == 1 ? '0' : '') + now.getMinutes()
    if(('' + (((now.getHours()+12-1) % 12)+1)).length == 2) {
        timetext.classList.add('timeSmallerText')
    } else {
        timetext.classList.remove('timeSmallerText')
    }
}
async function setBusInfo() {
    let arrivals = await getArrivals()
    let timeElemsWest = document.querySelectorAll('.bustime.west')
    let timeElemsEast = document.querySelectorAll('.bustime.east')
    
    arrivals[busSigns[0]].forEach((v,i)=>{
        if(i>=2) {return} // only set first 2 arrivals
        let minutesTill = Math.max(0,Math.round((v - Date.now())/1000/60));
        timeElemsEast[i].innerHTML = minutesTill + '&nbsp;min'
        if(minutesTill <= 5) {
            timeElemsEast[i].classList.add('soonish')
        } else {
            timeElemsEast[i].classList.remove('soonish')
        }
    })
    arrivals[busSigns[1]].forEach((v,i)=>{
        if(i>=2) {return} // only set first 2 arrivals
        let minutesTill = Math.max(0,Math.round((v - Date.now())/1000/60));
        timeElemsWest[i].innerHTML = minutesTill + '&nbsp;min'
        if(minutesTill <= 5) {
            timeElemsWest[i].classList.add('soonish')
        } else {
            timeElemsWest[i].classList.remove('soonish')
        }
    })
}

setInterval(formatClock,1000)
setInterval(setBusInfo,1000)

export function redrawCircles(circles:Circle[]) {
    membersDiv.innerHTML = ''
    
    circles.forEach((circle:Circle)=>{
        if(circle instanceof MemberCircle) {
            renderCircle(circle as MemberCircle);
        } else if (circle instanceof ClockCircle) {
            // renderClock(circle as ClockCircle,circles.length==1);
        }
    })
}

export function getRatio() {
    return membersDiv.clientWidth/membersDiv.clientHeight;
}


