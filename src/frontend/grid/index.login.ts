import { getResourceURL } from "../../consts";
import { checkAuth } from "./clockapi";

(async()=>{
    function setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        const expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    function generateApiKey(id, key) {
        return window.btoa(id)+":"+window.btoa(key)
    }
    function redirect() {
        document.location.assign(getResourceURL("grid/"))
    }
    const id = document.getElementById('id') as HTMLInputElement;
    const pass = document.getElementById('password') as HTMLInputElement;
    const butt = document.getElementById('submit')
    const skip = document.getElementById('skip')
    pass.oninput = () => { pass.setCustomValidity("")}
    skip.onclick = () => {
        setCookie("apiKey", "skip", 100)
        redirect()
    }
    butt.onclick = async function () {
        const apiKey = generateApiKey(id.value, pass.value)
        const authed = await checkAuth(apiKey)
        if(authed) {
            setCookie('apiKey',apiKey,100)
            redirect();
        } else {
            pass.setCustomValidity("Incorrect password")
        }
    }
})();