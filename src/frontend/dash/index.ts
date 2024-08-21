import { getApiEndpoint } from "../../consts";
import type { LoggedIn, CluckMember } from "../../types";
import { Circle, ClockCircle, MemberCircle, placeCircles, placedCircles, sizeCircles, updateCircleList, updateCircles } from "./circlePacker";
import { cyclePanel, setPanelVisibility } from "./chiefdelphi"
import { openFullscreen } from "../util";

let members: CluckMember[]
let loggedInCache: LoggedIn;

window["openFullscreen"] = openFullscreen

cyclePanel()
setInterval(cyclePanel, 1000 * 60 * 1) // chnage panel every 1 minutes
setInterval(regenCircles, 10) // chnage panel every 1 minutes

let prevTime = Date.now();

function regenCircles() {

    const now = Date.now()
    
    const loginEntries = Object.entries(loggedInCache)
    .filter(entry => members.find(member => member.name == entry[0]))
    ;

    const circlesToAdd = updateCircleList(
        loginEntries
    )
    .map(entry => {
        const member = members.find(o => o.name == entry[0]);
        
        return new MemberCircle(
            entry[1], // 1000 / 60 / 60
            member.name,
            member.img
        );
    });

    placeCircles(circlesToAdd);

    updateCircles(now - prevTime);

    sizeCircles();

    prevTime = now;
}

function update() {
    fetch(getApiEndpoint('loggedin')).then(res => res.json().then(loggedin => {
        // return if there's no change
        if (JSON.stringify(loggedInCache) == JSON.stringify(loggedin)) { return }
        loggedInCache = loggedin
    }));
}

async function start() {
    members = await (await fetch(getApiEndpoint("members"))).json()
    loggedInCache = null
    placedCircles.push(new ClockCircle());
    update()

    setInterval(() => {
        update()
    }, 1000 * 3);
    window.addEventListener('resize',()=>{regenCircles()})
}

start()