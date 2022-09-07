/* globals MemberCircle unplacedCircles placeCircles placedCircles redrawCircles*/
var members
var loggedInCache

function regenCircles(loggedin) {
    let circles = []
    let now = Date.now()
    Object.entries(loggedin).forEach(ent=>{
        let member = members.find(o=>o.name==ent[0])
        circles.push(new MemberCircle(
            (now - ent[1])/1000/60/60,
            member.firstname,
            member.img
        ))
    });
    placedCircles = []
    unplacedCircles = []
    placeCircles(circles)
    redrawCircles(placedCircles)
}

function update() {
    fetch('/api/loggedin').then(res=>res.json().then(loggedin=>{
        // return if there's no change
        if(JSON.stringify(loggedInCache) == JSON.stringify(loggedin)) {return}
        loggedInCache = loggedin
        regenCircles(loggedin)
    }));
}

async function start() {
members = await (await fetch('/api/members')).json()
loggedInCache = []

update()

setInterval(()=>{
    regenCircles(loggedInCache)
},1000 * 60 );
setInterval(()=>{
    update()
},1000 * 3 );

}

start()