let membersDiv = document.getElementById('members')

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
}

function redrawCircles(circles) {
    membersDiv.innerHTML = ''
    circles.forEach(renderCircle)
}



