import { getApiEndpoint } from "../../consts";
import type { LoggedIn, Member } from "../../types";
import { getBounds, MemberCircle, placeCircles } from "./circlePacker";
import { redrawCircles } from "./renderCircles";
import { refreshDelphi, setDelphiVisibility } from "./chiefdelphi"
import { openFullscreen } from "../util";

let members: Member[]
let loggedInCache: LoggedIn;

window["openFullscreen"] = openFullscreen

refreshDelphi()
setInterval(refreshDelphi, 1000 * 60 * 2) // refresh post every 1 minute

function regenCircles(loggedin: LoggedIn) {
    const desiredRatio = 1; // y / x
    const ratioError = .1;
    let tries = 0;
    let { maxX, maxY, minX, minY } = getBounds()
    let placedCircles: MemberCircle[] = [];
    do {
        tries++;
        const circles = []
        const now = Date.now()
        const loggedInEntries = Object.entries(loggedin)
        if(loggedInEntries.length > 15)
            setDelphiVisibility(false);
        else
            setDelphiVisibility(true);
        loggedInEntries.forEach(ent => {
            const member = members.find(o => o.name == ent[0])
            circles.push(new MemberCircle(
                (now - ent[1]) / 1000 / 60 / 60,
                member.firstname,
                member.img
            ))
        });
        placedCircles = placeCircles(circles);

        ({ maxX, maxY, minX, minY } = getBounds());

    } while (tries < 1000 && ((maxY - minY) / (maxX - minX) < (desiredRatio - ratioError / desiredRatio) || (maxY - minY) / (maxX - minX) > (desiredRatio + ratioError / desiredRatio))) // test to make sure the dimentions are chill
    redrawCircles(placedCircles)
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
    loggedInCache = {}

    update()

    setInterval(() => {
        regenCircles(loggedInCache)
    }, 1000 * 60);
    setInterval(() => {
        update()
    }, 1000 * 3);

}

start()