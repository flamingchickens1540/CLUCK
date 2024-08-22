import { apiFetch } from '~views/util'

type DelphiInfo = {
    body?: HTMLElement
    title?: HTMLElement
    topics: string
    url: string
}
enum PanelType {
    Delphi,
    Img
}
let PANEL_TYPE: PanelType = PanelType.Delphi
//const panelTypeOrder = [PanelType.Delphi];
//let panelTypeI = -1;

function getInfo(siteHTML: string) {
    const ret: DelphiInfo = {
        topics: '',
        url: ''
    }

    const doc = document.createElement('html')
    doc.innerHTML = siteHTML

    ret.body = doc.querySelector('.cooked, .post') as HTMLElement
    ret.title = doc.querySelector('#topic-title')!.children[0] as HTMLElement
    ret.topics = '<div class="topics">' + doc.querySelector('.topic-category')!.innerHTML + '</div>'
    ret.url = doc.querySelector('myurl')!.innerHTML

    const commentNum = 3
    for (let n = 2; n < commentNum + 2; n++) {
        const commentElem = doc.querySelector(`#post_${n}`) as HTMLElement
        const comment = document.createElement(`post`)
        if (commentElem == null) {
            break
        }

        // comment body
        const commentBody = commentElem.querySelector('.post')!
        commentBody.classList.add('post_body')
        comment.append(commentBody)

        const posterName = (commentElem.querySelector(`.creator > span > span`) as HTMLElement)?.innerHTML ?? ''
        let commentTime = commentElem.querySelector(`.post-time`)?.innerHTML.trim() ?? ''
        commentTime = commentTime.replace(/\d\d\d\d, /, '')

        ret.body.appendChild(document.createElement('br'))

        const breakElem = document.createElement('hr')
        breakElem.className = 'comment_break'
        ret.body.appendChild(breakElem)

        const postTimeElem = document.createElement('span')
        postTimeElem.className = 'comment_time'
        postTimeElem.innerText = commentTime
        comment.insertBefore(postTimeElem, comment.firstElementChild)

        const posterNameElem = document.createElement('span')
        posterNameElem.className = 'commenter_name'
        posterNameElem.innerText = posterName + ':'
        comment.insertBefore(posterNameElem, comment.firstElementChild)

        const avatar = document.createElement('img')
        avatar.style.height = '3.3vh'
        avatar.style.paddingRight = '1vh'
        avatar.style.verticalAlign = 'middle'
        avatar.src = `https://www.chiefdelphi.com/user_avatar/www.chiefdelphi.com/${posterName}/90/169322_2.png`
        comment.insertBefore(avatar, comment.firstElementChild)

        comment.classList.add('post_comment')
        ret.body.appendChild(comment)
    }

    return ret
}

export async function cyclePanel() {
    //panelTypeI++;
    //PANEL_TYPE = panelTypeOrder[panelTypeI%panelTypeOrder.length];

    //if(PANEL_TYPE == PanelType.Delphi) {await refreshDelphi()}
    //if(PANEL_TYPE == PanelType.Img) {await refreshImage()}

    //setPanelType(PANEL_TYPE)
    await refreshDelphi()
}

async function refreshDelphi() {
    const html = (await apiFetch('/chiefdelphi', 'GET', null))!.body
    const info = getInfo(html)
    document.getElementById('delphiTitle')!.innerHTML = info.title!.innerHTML + info.topics
    ;(document.getElementById('delphiTitle')!.parentElement as HTMLLinkElement).onclick = () => {
        window.open(info.url, '_blank')
    }
    document.getElementById('delphiBody')!.innerHTML = info.body!.innerHTML

    resetScroll()
}
// async function refreshImage() {
//     const url = await (await fetch(getResourceURL('/dash/image'))).text()
//     ;(document.querySelector('.theimage') as HTMLImageElement).src = url
// }

export function setPanelType(type: PanelType) {
    PANEL_TYPE = type
    const children = Array.from(document.querySelector('#delphicontent')!.children)
    if (type == PanelType.Delphi) {
        // (document.querySelector('#delphicontent') as HTMLElement).style.display = 'block'
        children
            .filter((ch) => !ch.classList.contains('theimage'))
            .forEach((child) => {
                ;(child as HTMLElement).style.display = 'block'
            })
        children
            .filter((ch) => ch.classList.contains('theimage'))
            .forEach((child) => {
                ;(child as HTMLElement).style.display = 'none'
            })
    }
    if (type == PanelType.Img) {
        // (document.querySelector('#delphicontent') as HTMLElement).style.display = 'flex'
        document.getElementById('delphicontent')!.style.height = '100%'
        document.getElementById('delphicontent')!.style.width = '100%'
        children
            .filter((ch) => ch.classList.contains('theimage'))
            .forEach((child) => {
                ;(child as HTMLElement).style.display = 'flex'
            })
        children
            .filter((ch) => !ch.classList.contains('theimage'))
            .forEach((child) => {
                ;(child as HTMLElement).style.display = 'none'
            })
    }
}
setPanelType(PanelType.Img)

export function setPanelVisibility(visible: boolean) {
    document.getElementById('delphi')!.style.display = visible ? '' : 'none'
}

function setBottomFade() {
    document.getElementById('bottom_fade')!.style.visibility = window.innerWidth / window.innerHeight > 1.8 ? 'visible' : 'hidden'
    document.getElementById('bottom_fade')!.style.height = Math.max(0, Math.min(80 * (window.innerWidth / window.innerHeight - 1.7), 25)) + 'vh'
    // 40 at 2, zero at 1.5
}
setBottomFade()
addEventListener('resize', setBottomFade)

const autoScrollState = {
    down: true,
    timeStarted: Date.now(),
    downSpeed: 0.036, // height/sec
    upSpeed: 1, // height/sec
    topWait: 5,
    bottomWait: 6
}
function resetScroll() {
    autoScrollState.timeStarted = Date.now()
    autoScrollState.down = true
}
const delphiBody = document.getElementById('delphiBody')!
function autoScroll() {
    const element = delphiBody
    if (autoScrollState.down) {
        const scrollTo = Math.max(
            0,
            (element.clientHeight *
                autoScrollState.downSpeed *
                (Date.now() -
                    1000 * autoScrollState.topWait - // pause at top for topWait seconds
                    autoScrollState.timeStarted)) /
                1000
        )
        if (element.clientHeight + scrollTo > element.scrollHeight) {
            // if reached end, reverse scroll direction
            autoScrollState.down = false
            autoScrollState.timeStarted = Date.now()
        } else {
            element.scrollTop = scrollTo
        }
    } else {
        const scrollTo =
            element.scrollHeight -
            element.clientHeight -
            (element.clientHeight * autoScrollState.upSpeed * Math.max(0, Date.now() - 1000 * autoScrollState.bottomWait - autoScrollState.timeStarted)) / 1000
        if (scrollTo < 0) {
            // if reached end, reverse scroll direction
            autoScrollState.down = true
            autoScrollState.timeStarted = Date.now()
        } else {
            element.scrollTop = scrollTo
        }
    }
}
setInterval(autoScroll, 10)
