/* exported clock cluckedIn ping api_server*/
var skipAuth = false;

function getCookie(name) {
    var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
    if(!result) {return null}
    return result[1];
}
const clock = async (name, clockingIn) => {
    if (skipAuth) {
        return;
    }
    let body = {
        name: name,
        loggingin: clockingIn,
        api_key: getCookie("funneeText")
    }
    return await fetch(api_url+'/clock', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

const cluckedIn = async () => {
    let res = await fetch(api_url + "/loggedin")
    if (!res.ok) {
        throw new Error("Could not get logged in")
    }
    let json = await res.json()
    return json;
}
const ping = async () => {
    try {
        await fetch(api_url + "/ping")
    } catch (e) {
        return false;
    }
    return true;
}
const refreshMemberList = async () => {
    const res = await fetch(api_url+"/members/refresh")
    if (res.ok) {
        await run(await res.json())
    }
}
const checkAuth = async (key = getCookie("funneeText")) => {
    if (key == "skip") {
        skipAuth = true;
        return true;
    }
    const res = await fetch(api_url+"/auth", {
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