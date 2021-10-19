// fetch('https://zenquotes.io/api/quotes',{'mode':'no-cors'}).then(res=>res.json().then(json=>{
//     document.getElementById('toptext').innerHTML = json[0].q
// }))

// MONTH, DAY, HOUR, MINUTE, SECOND TIME CLOCK
let monthday = document.getElementById("monthday")
let hourminute = document.getElementById("hourminute")
let seconds = document.getElementById("seconds")
const totwo = (num) => { if (new String(num).length == 1) { return "0" + new String(num) } else { return num } }
async function updateClock() {
    let now = new Date();
    hourminute.innerHTML = `${((now.getHours() - 1)%12+12)%12 + 1}:${totwo(now.getMinutes())}`
    seconds.innerHTML = `:${totwo(now.getSeconds())}`
    monthday.innerHTML = `${now.toLocaleString('default', { month: 'short' })}<br>${now.getDate()}`;
}
setInterval(updateClock, 1000)

// LoggedIn
let peeps = document.getElementById('peeps')
// Regularly refresh members
let members = {}
let memberMap = {}
const refreshMembers = () => new Promise(ress => fetch('/members').then(res => res.json().then(json => { members = json; json.forEach(member => { memberMap[member.name] = member }); ress() })));
setInterval(refreshMembers, 60 * 60 * 1000)
// function addperson(name, picturepath) {

// }
async function rebuildList() {
    await refreshMembers();
    let loggedInMap = await (await fetch('/loggedin')).json()
    let loggedInList = Object.keys(loggedInMap)
    root = Math.sqrt(loggedInList.length)
    wid = Math.ceil(root)
    hei = Math.round(root)
    document.documentElement.style.setProperty('--lx', wid)
    document.documentElement.style.setProperty('--ly', hei)

    peeps.innerHTML = '';
    for (let name in loggedInMap) {
        let validname = name.replace(/\ /g, '_')
        let membercell = document.createElement(validname + "_cell");
        membercell.classList.add('membercell')
        let memberimage = document.createElement(validname + "_image");
        memberimage.classList.add('memberimage')
        let membername = document.createElement(validname + "_text");
        membername.innerHTML = name;
        membername.classList.add('personname')

        // console.log(memberMap)
        // console.log(name)
        // console.log(memberMap[name])

        let memberObj = memberMap[name];
        let imagepath = "/img/boi.jpg";
        if (memberObj && memberObj.img) {
            imagepath = memberObj.img;
        }
        // let imagepath = "/img/boi.jpg";
        // memberimage.style.backgroundImage = `url("/img/boi.jpg")`
        memberimage.style.backgroundImage = `url("${imagepath}")`
        membercell.appendChild(memberimage);
        membercell.appendChild(membername);
        peeps.appendChild(membercell);

    }
}
rebuildList()
setInterval(rebuildList, 5000)

//WEATHER
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/onecall?lat=45.5100&lon=-122.7675&exclude=minutely,daily,alerts&appid=ee289981155e95411c6e8afe4e9a5a93'
let weather = document.getElementById('weather')
function getImageUrl(icon) {
    return `http://openweathermap.org/img/wn/${icon}@2x.png`;
}
function getImageUrlFromObj(obj) {
    return getImageUrl(obj.weather[0].icon)
}
function getTimeFromObj(obj) {
    let hours = new Date(obj.dt * 1000).getHours();
    let ampm = hours < 12 ? 'am' : 'pm';
    return `${(((hours - 1) % 12)+12)%12 + 1}${ampm}`
    // return `${(hours-1)%12+1}${ampm}`
}


function getWeatherCell(obj, isnow) {
    let weathercell = document.createElement('weathercell')
    weathercell.classList.add('weathercell')
    let weathertime = document.createElement('weathertime')
    weathertime.classList.add('weathertime')
    let weathericon = document.createElement('weathericon')
    weathericon.classList.add('weathericon')

    weathericon.style.backgroundImage = `url(${getImageUrlFromObj(obj)})`
    weathertime.innerHTML = getTimeFromObj(obj)
    if (isnow) { weathertime.innerHTML = "NOW" }

    weathercell.appendChild(weathericon);
    weathercell.appendChild(weathertime);

    return weathercell;
}
async function updateWeather() {
    let weatherdata = await (await fetch(weatherApiUrl)).json()
    console.log(weatherdata)

    // for(let weatherelement of document.getElementsByClassName('weathercell')) {
    //     // weatherelement.remove()
    //     weather.removeChild(weatherelement)
    // }
    weather.innerHTML = `<weathertitle class="paneltitle">Weather:</weathertitle>`
    weather.appendChild(getWeatherCell(weatherdata.current, true))
    for (let i = 1; i <= 4; i++) {
        weather.appendChild(getWeatherCell(weatherdata.hourly[i]))
    }
}
updateWeather()
setInterval(updateWeather, 5 * 60 * 1000)