

(async()=>{
    function setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        let expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    function redirect() {
        document.location.replace("/grid/")
    }
    let pass = document.getElementById('password');
    let butt = document.getElementById('submit')
    pass.oninput = () => { pass.setCustomValidity("")}
    butt.onclick = async function () {
        let req = await fetch("/api/auth", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: pass.value
            })
        })
        if(req.status == 200) {
            setCookie('funneeText',pass.value,100)
            redirect();
        } else {
            pass.setCustomValidity("Incorrect password")
        }
    }
})();