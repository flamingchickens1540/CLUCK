/* exported openFullscreen */
function openFullscreen() {
    let elem = document.documentElement
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}




/* globals clock ping cluckedIn checkAuth */
let buttonJustPressed = false;

let members

async function run() {
    const authed = await checkAuth();
    if (!authed) {
        document.location.replace("/grid/login");
    }
    // Fetch Members
    members = await (await fetch('/api/members')).json()
    
    
    redrawRows()
    
    
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
        let memberButton = document.createElement('person-button');
        memberButton.fullname = member.name;
        memberButton.id = member.fullname
        
        // Set click toggle
        memberButton.onclick = async (click) => {
            // fullscreen()
            
            buttonJustPressed = true;
            
            let button = click.target;
            if (click.target.classList.contains('button-text')) {
                button = click.target.parentElement;
            }
            
            // Toggle logged in             
            button.loggedIn = !button.loggedIn
            // Update style
            buttonStates[button.loggedIn].forEach(styleSpec => {
                button.style.setProperty(styleSpec.styleName, styleSpec.val)
            })
            // Cluck API Call
            
            const res = await clock(button.fullname, button.loggedIn)
            if (!res.ok) {
                await refreshMembers()
            }
        }
        
        // Add name text
        let text = document.createElement('person-name')
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
        if (!member.img) { memberButton.style.setProperty('background-image', `url(/assets/img/defaultpicture.jpg)`) }
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
    
    async function refreshMembers() {
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
        redrawRows()
    }
    
    
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    while (true) {
        // Get data and update buttons
        // Query data to map of { Name:TimeCluckedIn } 
        await refreshMembers()
        await sleep(5000)
        while (buttonJustPressed) {
            buttonJustPressed = false;
            await sleep(2000);
        }
    }
    
}
run()


function redrawRows() {
    // Compute number of rows and columns, and cell size
    var n = members.length;
    var x = document.body.scrollWidth
    var y = document.body.scrollHeight
    var ratio = x / y;
    var ncols_float = Math.sqrt(n * ratio);
    var nrows_float = n / ncols_float;
    
    // Find best option filling the whole height
    var nrows1 = Math.ceil(nrows_float);
    var ncols1 = Math.ceil(n / nrows1);
    while (nrows1 * ratio < ncols1) {
        nrows1++;
        ncols1 = Math.ceil(n / nrows1);
    }
    var cell_size1 = y / nrows1;
    
    // Find best option filling the whole width
    var ncols2 = Math.ceil(ncols_float);
    var nrows2 = Math.ceil(n / ncols2);
    while (ncols2 < nrows2 * ratio) {
        ncols2++;
        nrows2 = Math.ceil(n / ncols2);
    }
    var cell_size2 = x / ncols2;
    
    // Find the best values
    var nrows, ncols, cell_size;
    if (cell_size1 < cell_size2) {
        nrows = nrows2;
        ncols = ncols2;
        cell_size = cell_size2;
    } else {
        nrows = nrows1;
        ncols = ncols1;
        cell_size = cell_size1;
    }
    
    
    document.documentElement.style.setProperty('--width', ncols)
    document.documentElement.style.setProperty('--height', nrows)
}

setTimeout(async ()=>{
    await fetch('/api/members/refresh')
    window.location.reload(1)
},60*60*1000)