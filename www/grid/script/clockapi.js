/* exported clock cluckedIn ping*/
const api_server = '/api'
function getCookie(name) {
    var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
    if(!result) {return null}
    return result[1];
}
const clock = async (name, clockingIn) => {
    let body = {
        name: name,
        loggingin: clockingIn,
        api_key: getCookie("funneeText")
    }
    return await fetch(`${api_server}/clock`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

const cluckedIn = async () => {
    let res = await fetch(api_server + "/loggedin")
    let json = await res.json()
    return json;
}
const ping = async () => {
    try {
        await fetch(api_server + "/ping")
    } catch (e) {
        return false;
    }
    return true;
}
const checkAuth = async () => {
    const res = await fetch("/api/auth", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            api_key: getCookie("funneeText")
        })
    })
    return res.ok
}