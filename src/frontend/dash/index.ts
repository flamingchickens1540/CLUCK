import { getApiEndpoint } from "../../consts";
import type { LoggedIn, CluckMember } from "../../types";
import { Circle, ClockCircle, MemberCircle, placeCircles, setAspectRatio } from "./circlePacker";
import { redrawCircles, getRatio } from "./renderCircles";
import { refreshDelphi, setDelphiVisibility } from "./chiefdelphi"
import { openFullscreen } from "../util";

let members: CluckMember[]
let loggedInCache: LoggedIn;

window["openFullscreen"] = openFullscreen

refreshDelphi()
setInterval(refreshDelphi, 1000 * 60 * 2) // refresh post every 1 minute

function regenCircles(loggedin?: LoggedIn) {
    if(loggedin===undefined) {loggedin = loggedInCache}

    let placedCircles: Circle[] = [];

    const circles = []
    const now = Date.now()
    for(const ent in loggedin) {
        const member = members.find(o => o.name == ent)
        circles.push(new MemberCircle(
            (now - loggedin[ent]) / 360000, // 1000 / 60 / 60
            member.firstname,
            member.img
        ))
    }

    // calc clock circle size
    let rad = 1;
    if(circles.length > 0) {
        const average = array => array.reduce((a, b) => a + b) / array.length;
        let radii = circles.map((circle:Circle)=>circle.r)
        let avgRad = average(radii)
        let numRad = radii.length
        rad = avgRad * ((1 - 1/2.4) + Math.pow(numRad,1/3)/1)
    }
    circles.push(new ClockCircle(rad));
    // circles.push(new ClockCircle(circles.length==0 ? 1:0.4*Math.max(...circles.map((circle:Circle)=>circle.r))));
    console.log(circles)

    setDelphiVisibility(circles.length < 23)  // <-- setDelphiVisibility(getNameDensity(circles) < 1)

    setAspectRatio(getRatio());
    placedCircles = placeCircles(circles);
    redrawCircles(placedCircles)
}

const nameDensityMultiplier = 0.006;
// Estimates name density
function getNameDensity(circles : MemberCircle[]) {
    let nameSize = 0;
    let circleSizeSum = 0;
    let circleSizeSumSqr = 0;
    for(const circle of circles) {
        nameSize += circle.name.length * nameDensityMultiplier + 2;
        circleSizeSumSqr += Math.pow(circle.r, 2);
        circleSizeSum += circle.r;
    }

    return nameDensityMultiplier * nameSize / Math.sqrt(circleSizeSumSqr / circleSizeSum / circles.length);
}

function update() {
    fetch(getApiEndpoint('loggedin')).then(res => res.json().then(loggedin => {
        // return if there's no change
        if (JSON.stringify(loggedInCache) == JSON.stringify(loggedin)) { return }
        loggedInCache = loggedin
        regenCircles(loggedin)
    }));
}

async function start() {
    members = await (await fetch(getApiEndpoint("members"))).json()
    loggedInCache = null

    update()

    setInterval(() => {
        regenCircles(loggedInCache)
    }, 1000 * 60);
    setInterval(() => {
        update()
    }, 1000 * 3);
    window.addEventListener('resize',()=>{regenCircles()})
}

start()