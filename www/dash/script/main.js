/* globals MemberCircle unplacedCircles:true placeCircles placedCircles:writable redrawCircles maxY maxX minY minX*/ // eslint-disable-line no-unused-vars
var members
var loggedInCache

function regenCircles(loggedin) {
    let desiredRatio = 1; // y / x
    let ratioError = .1;
    let tries = 0;
    do{
        tries++;
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
    } while (tries<1000 && ((maxY-minY) / (maxX-minX) < (desiredRatio-ratioError/desiredRatio) || (maxY-minY) / (maxX-minX) > (desiredRatio+ratioError/desiredRatio))) // test to make sure the dimentions are chill
    redrawCircles(placedCircles)
}

function update() {
    fetch(api_url+'/loggedin').then(res=>res.json().then(loggedin=>{
        // return if there's no change
        if(JSON.stringify(loggedInCache) == JSON.stringify(loggedin)) {return}
        loggedInCache = loggedin
        regenCircles(loggedin)
    }));
}

async function start() {
members = await (await fetch(api_url+'/members')).json()
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