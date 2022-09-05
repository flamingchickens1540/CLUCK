/* exported clock cluckedIn ping*/
const api_server = '/api'

const clock = async (name, clockingIn) => {
    let body = {
        name: name,
        loggingin: clockingIn
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
    console.log(json)
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