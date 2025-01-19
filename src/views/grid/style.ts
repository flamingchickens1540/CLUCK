import type { enum_Member_Team } from '@prisma/client'

type GridStyle = 'void' | 'normal'
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
    // e.classList.add(randomChoice('labelTop', 'labelBottom'))
    e.style.fontFamily = randomChoice('gilroy', 'cocogoose', 'tcm')
}

function randomChoice<T>(...options: T[]): T {
    return options[Math.floor(Math.random() * options.length)]
}
type Style = {
    textShadow: string
    buttonShadow: string
}
export function getStyle(isManager: boolean, team: enum_Member_Team): Style {
    if (isManager) {
        return { textShadow: 'rgba(255, 141, 70, 0.6)', buttonShadow: 'rgb(255, 145, 0)' }
    }
    if (team == 'primary') {
        return { textShadow: 'rgba(255, 70, 70, 0.6)', buttonShadow: 'rgb(208, 35, 29)' }
    }
    if (team == 'junior') {
        return { textShadow: 'rgba(200, 70, 255, 0.6)', buttonShadow: 'rgb(191, 0, 255)' }
    }
    if (team == 'community') {
        return { textShadow: 'rgba(48, 192, 70, 0.6)', buttonShadow: 'rgb(5, 183, 64)' }
    }
    return { textShadow: 'rgba(132, 132, 132, 0.6)', buttonShadow: 'rgb(122, 122, 122)' }
}
