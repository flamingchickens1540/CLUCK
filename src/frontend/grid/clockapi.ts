/* exported clock cluckedIn ping refreshMemberList getApiKey checkAuth*/

import { getApiEndpoint } from "../../consts";
import { getClockEndpoint } from "./style";
import type { LoggedIn, Member } from "../../types";

window.skipAuth = false;

function getCookie(name) {
    const result = document.cookie.match(new RegExp(name + '=([^;]+)'));
    if(!result) {return null}
    return result[1];
}

export function getApiKey() {
    return getCookie("apiKey")
}

export async function clock(name, clockingIn) {
    if (window.skipAuth) {
        return;
    }
    const body = {
        name: name,
        loggingin: clockingIn,
        api_key: getApiKey()
    }
    return await fetch(getApiEndpoint(getClockEndpoint()), {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

export const cluckedIn = async ():Promise<LoggedIn> => {
    const res = await fetch(getApiEndpoint("loggedin"))
    if (!res.ok) {
        throw new Error("Could not get logged in")
    }
    const json = await res.json()
    return json;
}
export const ping = async () => {
    try {
        await fetch(getApiEndpoint("ping"))
    } catch (e) {
        return false;
    }
    return true;
}
export const refreshMemberList = async ():Promise<Member[]> => {
    const res = await fetch(getApiEndpoint("members/refresh"))
    if (!res.ok) {
        throw new Error("Could not get members list")
    }
    const json = await res.json()
    return json;
}
export const checkAuth = async (key = getApiKey()):Promise<boolean> => {
    if (key == "skip") {
        window.skipAuth = true;
        return true;
    }
    const res = await fetch(getApiEndpoint("/auth"), {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            api_key: key
        })
    })
    return res.ok
}