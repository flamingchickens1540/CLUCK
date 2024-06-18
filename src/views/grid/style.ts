type GridStyle = 'void' | 'normal'
const gridstyle = new URL(document.URL).searchParams.get('void') ? 'void' : 'normal'

type ButtonStates = {
    [key in 'true' | 'false']: StyleRule[]
}
type StyleRule = {
    styleName: string
    val: string
}

export function getClockMode(): GridStyle {
    return gridstyle
}

const normalButtonStates: ButtonStates = {
    false: [
        { styleName: 'filter', val: 'grayscale(100%)' },
        {
            styleName: 'box-shadow',
            val: 'inset 0 0 0 1000px rgba(255, 255, 255, 0.4), 0px 0px 10px rgba(255, 0, 0,.5)'
        }
    ],
    true: [
        { styleName: 'filter', val: 'grayscale(0%)' },
        {
            styleName: 'box-shadow',
            val: 'inset 0 0 0 1000px rgba(255, 255, 255, 0.0), 0px 0px 15px 7px rgb(0, 255, 136)'
        }
    ]
}

const voidButtonStates: ButtonStates = {
    false: [
        { styleName: 'transition-duration', val: '2s' },
        { styleName: 'filter', val: 'grayscale(100%)' },
        {
            styleName: 'box-shadow',
            val: 'inset 0 0 0 1000px rgba(255, 255, 255, 0.4), 0px 0px 10px rgba(255, 0, 0,.5)'
        },
        { styleName: 'transform', val: 'rotate(0)' }
    ],
    true: [
        { styleName: 'transition-duration', val: '0s' },
        { styleName: 'filter', val: 'grayscale(0%)' },
        {
            styleName: 'box-shadow',
            val: 'inset 0 0 0 1000px rgba(255, 255, 255, 0.0), 0px 0px 15px 7px rgb(255, 0, 0)'
        },
        { styleName: 'transform', val: 'rotate(0)' }
    ]
}

const gridStyles: { [key in GridStyle]: ButtonStates } = {
    void: voidButtonStates,
    normal: normalButtonStates
}
export function isButtonLoggedIn(element: HTMLButtonElement): boolean {
    return element.getAttribute('data-loggedin') == 'true'
}

export function setButtonLoggedIn(element: HTMLButtonElement, state: boolean) {
    return element.setAttribute('data-loggedin', state.toString())
}

export function updateButtonStyles(button: HTMLButtonElement): void {
    const styleRules = gridStyles[gridstyle][isButtonLoggedIn(button) ? 'true' : 'false']
    styleRules.forEach((rule) => {
        button.style.setProperty(rule.styleName, rule.val)
    })
}

// if (gridstyle == 'void') {
//     setInterval(() => {
//         Array.from(document.querySelectorAll('person-button') as NodeListOf<HTMLMemberButtonElement>)
//             .filter((b) => b.loggedIn)
//             .forEach((b, index) => {
//                 b.style.transform = `rotate(${Math.sin((Date.now() + ((index * 100000) % 234234)) / 100) * 10}deg)`
//             })
//     }, 50)
// }

// Button Position
// Setup Randomized Button Style Options
const horizPos = {
    left: [
        { styleName: 'right', val: 'auto' },
        { styleName: 'border-top-left-radius', val: '0' },
        { styleName: 'border-bottom-left-radius', val: '0' }
    ],
    right: [
        { styleName: 'left', val: 'auto' },
        { styleName: 'border-top-right-radius', val: '0' },
        { styleName: 'border-bottom-right-radius', val: '0' }
    ],
    center: []
}
const verticalPos = {
    bottom: [
        { styleName: 'bottom', val: '0' },
        { styleName: 'border-bottom-right-radius', val: '0' },
        { styleName: 'border-bottom-left-radius', val: '0' }
    ]
}
const font = {
    gilroy: [{ styleName: 'font-family', val: 'gilroy' }],
    cocogoose: [{ styleName: 'font-family', val: 'cocogoose' }],
    tcm: [{ styleName: 'font-family', val: 'tcm' }],
    basics: [{ styleName: 'font-family', val: 'basics-serif' }]
}
export const randomizedStyleCategories: { [key: string]: StyleRule[] }[] = [horizPos, verticalPos, font]
