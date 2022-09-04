/* exported clock cluckedIn ping*/
const api_server = ''

const clock = async (name, clockingIn) => {
    await fetch(`${api_server}/clock?name=${encodeURIComponent(name)}&loggingin=${encodeURIComponent(clockingIn)}`)
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