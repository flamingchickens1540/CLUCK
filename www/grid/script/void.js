/* globals skipAuth getApiKey */
/* exported clock */
async function clock(name, clockingIn) {
    if (skipAuth) {
        return;
    }
    let body = {
        name: name,
        loggingin: clockingIn,
        api_key: getApiKey()
    }
    return await fetch(api_url+'/void', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

window.buttonStates = {
	false: [
		{styleName:"transition-duration",val:"2s"},
		{ styleName: "filter", val: "grayscale(100%)" },
		{
			styleName: "box-shadow",
			val: "inset 0 0 0 1000px rgba(255, 255, 255, 0.4), 0px 0px 10px rgba(255, 0, 0,.5)",
		},
		{styleName:"transform",val:"rotate(0)"},

	],
	true: [
		{styleName:"transition-duration",val:"0s"},
		{ styleName: "filter", val: "grayscale(0%)" },
		{
			styleName: "box-shadow",
			val: "inset 0 0 0 1000px rgba(255, 255, 255, 0.0), 0px 0px 15px 7px rgb(255, 0, 0)",
		},
		{styleName:"transform",val:"rotate(0)"},

	],
};

setInterval(()=>
Array.from(document.querySelectorAll('person-button')).filter(b=>b.loggedIn).forEach((b,index)=>b.style.transform = `rotate(${Math.sin((Date.now()+(index*100000)%234234)/100)*10}deg)`),50)