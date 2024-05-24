import { Circle, ClockCircle, getBounds } from "./circlePacker"
import { MemberCircle } from "./circlePacker"
import {getArrivals, busSigns} from "./trimet"


function renderClock(circle: ClockCircle, alone?:boolean) {
    
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


