/* exported clock cluckedIn ping api_server*/
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
const refreshMembers = async () => {
    const res = await fetch(api_url+"/members/refresh")
}
const checkAuth = async (key = getCookie("funneeText")) => {
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