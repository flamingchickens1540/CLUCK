/* globals maxX minX maxY minY */
/* exported redrawCircles */
let membersDiv = document.getElementById('members')

let BUBBLE_COLORS = ['rgba(35,132,198,.5)','rgba(255,214,0,.5)','rgba(241,93,34,.5)','rgba(108,157,204,.5)']
function renderCircle(circle) {
    let maxLength = Math.max(maxX-minX,maxY-minY)
    let multiplier = 1/maxLength*48
    let xOffset = (maxLength - (maxX-minX))/2 // center shape on x axis

    let elem = document.createElement('member')
    elem.className = 'memberCircle'
    elem.style.width = circle.r*2*multiplier + 'vw'
    elem.style.height = circle.r*2*multiplier + 'vw'
    elem.style.left = (circle.x-minX + xOffset)*multiplier     - (circle.r*2*multiplier)/2 + 'vw'
    elem.style.top = (circle.y-minY )*multiplier        - (circle.r*2*multiplier)/2 + 'vw'
    elem.style.backgroundImage = `url(${circle.imgurl})`
    // elem.innerHTML = 'hi'
    membersDiv.appendChild(elem)


      // bubble name
    // blue, yellow, orange, lightblue, red

    let name = document.createElement('name')
    name.innerHTML = circle.name
    name.className = 'bubblename'
    name.style.backgroundColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    elem.appendChild(name)
}

function redrawCircles(circles) {
    membersDiv.innerHTML = ''
    circles.forEach(renderCircle)
}


