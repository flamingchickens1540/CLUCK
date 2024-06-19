type GridStyle = 'void' | 'normal'
console.log(new URL(document.URL).searchParams)
const gridstyle = new URL(document.URL).searchParams.get('void') != null ? 'void' : 'normal'
document.body.setAttribute('data-gridstyle', gridstyle)

export function getClockMode(): GridStyle {
    return gridstyle
}

export function isButtonLoggedIn(element: HTMLDivElement): boolean {
    return element.getAttribute('data-loggedin') == 'true'
}

export function setButtonLoggedIn(element: HTMLDivElement, state: boolean) {
    return element.setAttribute('data-loggedin', state.toString())
}

if (gridstyle == 'void') {
    setInterval(() => {
        Array.from(document.querySelectorAll('.memberButton') as NodeListOf<HTMLDivElement>).forEach((b, index) => {
            b.style.transform = isButtonLoggedIn(b) ? `rotate(${Math.sin((Date.now() + ((index * 100000) % 234234)) / 1000) * 10}deg)` : 'rotate(0)'
        })
    }, 50)
}

export function applyRandomStyles(e: HTMLDivElement) {
    e.classList.add(randomChoice('labelLeft', 'labelRight', 'labelCenter'))
    e.classList.add(randomChoice('labelTop', 'labelBottom'))
    e.style.fontFamily = randomChoice('gilroy', 'cocogoose', 'tcm')
}

function randomChoice<T>(...options: T[]): T {
    return options[Math.floor(Math.random() * options.length)]
}
