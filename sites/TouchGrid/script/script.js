let buttonJustPressed = false;

// import { signin_secret, token, bruh } from './secrets.js'
// const importit = (module) => { return new Promise(ret => { require([module], ret) }) }

// Shiffle list code yoinked from online
function shuffle(array) { let currentIndex = array.length, randomIndex; while (currentIndex != 0) { randomIndex = Math.floor(Math.random() * currentIndex); currentIndex--;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]; } return array; }

function fullscreen() {
    let elem = document.documentElement
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

async function run() {
    // Fetch Members
    let members = await (await fetch('/members')).json()
    members = members.filter((val)=>val.pict);

    // Calculate & Set grid size
    root = Math.sqrt(members.length)
    wid = Math.ceil(root)
    hei = Math.round(root)
    document.documentElement.style.setProperty('--width', wid)
    document.documentElement.style.setProperty('--height', hei)


    // Setup Randomized Button Style Options
    const horizPos =
    {
        left: [{ styleName: 'right', val: 'auto' }, { styleName: 'border-top-left-radius', val: 0 }, { styleName: 'border-bottom-left-radius', val: 0 },],
        right: [{ styleName: 'left', val: 'auto' }, { styleName: 'border-top-right-radius', val: 0 }, { styleName: 'border-bottom-right-radius', val: 0 },],
        center: []
    }
    const verticalPos =
    {
        top: [{ styleName: 'border-top-right-radus', val: 0 }, { styleName: 'border-top-left-radus', val: 0 },],
        bottom: [{ styleName: 'bottom', 'val': 0 }, { styleName: 'border-bottom-right-radius', val: 0 }, { styleName: 'border-bottom-left-radius', val: 0 },]
    }
    const font =
    {
        gilroy: [{ styleName: 'font-family', val: 'gilroy' }],
        cocogoose: [{ styleName: 'font-family', val: 'cocogoose' }],
        tcm: [{ styleName: 'font-family', val: 'tcm' }],
        basics: [{ styleName: 'font-family', val: 'basics-serif' }],
    }
    const styleCatagories = [horizPos, verticalPos, font]

    // Button toggling on and off styling
    const buttonStates = {
        false: [
            { styleName: 'filter', val: 'grayscale(100%)' },
            { styleName: 'box-shadow', val: 'inset 0 0 0 1000px rgba(255, 255, 255, 0.4), 0px 0px 10px rgba(255, 0, 0,.5)' },
        ],
        true: [
            { styleName: 'filter', val: 'grayscale(0%)' },
            { styleName: 'box-shadow', val: 'inset 0 0 0 1000px rgba(255, 255, 255, 0.0), 0px 0px 15px 7px rgb(0, 255, 136)' },
        ]
    }

    // Make member buttons 
    members.forEach(member => {
        // Init button
        memberButton = document.createElement('person-button');
        memberButton.fullname = member.name;
        memberButton.id = member.fullname

        // Set click toggle
        memberButton.onclick = (click) => {
            // fullscreen()

            buttonJustPressed = true;
            // Go up path to find button object
            click.path.forEach(button => {
                if (button.className != 'button-in') { return }
                // Toggle logged in             
                button.loggedIn = !button.loggedIn
                // Update style
                buttonStates[button.loggedIn].forEach(styleSpec => {
                    button.style.setProperty(styleSpec.styleName, styleSpec.val)
                })
                // Cluck API Call
                clock(button.fullname, button.loggedIn)
            })
        }

        // Add name text
        text = document.createElement('person-name')
        text.className = 'button-text'
        text.innerHTML = member.firstname

        // Randomize mix and match text styles
        styleCatagories.forEach(styleCatagory => {
            let styleOptions = Object.values(styleCatagory)
            if (styleOptions.length == 0) { return }
            let toSet = styleOptions[Math.floor(Math.random() * styleOptions.length)]
            toSet.forEach(attribute => {
                text.style.setProperty(attribute.styleName, attribute.val)
            })
        })

        // Do other adding and styling things
        memberButton.appendChild(text)
        memberButton.style.setProperty('background-image', `url(${member.img})`)
        if (!member.img) { memberButton.style.setProperty('background-image', `url(https://media.wired.co.uk/photos/606d9c01f19707fe1aef2e63/4:3/w_2664,h_1998,c_limit/egg-insta.jpg)`) }
        // if (!member.img) { memberButton.style.setProperty('background-image', `url(/img/defpic.jpg)`) }
        memberButton.className = 'button-in'

        // Add button
        document.getElementById('button-grid').appendChild(memberButton)
    })



    //////////////////////////////////////////////////////////////////////////
    // Test CONNECTIVITY

    let noconnect = document.getElementById('noconnect');
    setInterval(async () => {
        if (await ping()) {
            noconnect.style.setProperty('visibility', 'hidden')
        } else {
            noconnect.style.setProperty('visibility', 'visible')
        }
    }, 1000)


    //////////////////////////////////////////////////////////////////////////






    // Update logged in every 30 seconds

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    while (true) {
        // Get data and update buttons
        // Query data to map of { Name:TimeCluckedIn } 
        try {
            let membersIn = await cluckedIn()
            // Update buttons
            let buttons = document.getElementsByTagName('person-button')
            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i]
                button.loggedIn = button.fullname in membersIn
                buttonStates[button.loggedIn].forEach(styleSpec => {
                    button.style.setProperty(styleSpec.styleName, styleSpec.val)

                })
            }
        } catch (err) { console.log(err) }
        await sleep(5000)
        while (buttonJustPressed) {
            buttonJustPressed = false;
            await sleep(2000);
        }
    }

}
run()

setTimeout(async ()=>{
    await fetch('/members/refresh')
    window.location.reload(1)
},60*60*1000)