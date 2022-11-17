import { getResourceURL } from "../../consts"


type DelphiInfo = {
    body: HTMLElement
    title: HTMLElement
    topics: string
};
function getInfo(siteHTML) {
    const ret: DelphiInfo = {
        body: null,
        title: null,
        topics: "",
    };

    const doc = document.createElement('html');
    doc.innerHTML = siteHTML;

    ret.body = doc.querySelector('.cooked, .post');
    ret.title = doc.querySelector('#topic-title').children[0].children[0] as HTMLElement;
    ret.topics = '<div class="topics">' + doc.querySelector('.topic-category').innerHTML + '</div>';

    const commentNum = 3;
        for(let n = 3; n<commentNum+3;n++){
            const comment = doc.querySelector(`#main-outlet > div:nth-child(${n}) > .post`) as HTMLElement;
            if(comment == null) {
                break;
            }
            const posterName = (doc.querySelector(`#main-outlet > div:nth-child(${n}) .creator > span > span`) as HTMLElement)?.innerHTML ?? ''
            let commentTime = doc.querySelector(`#main-outlet > div:nth-child(${n}) .post-time`)?.innerHTML.trim() ?? ''
            commentTime = commentTime.replace(/\d\d\d\d\,\ /,'')

            ret.body.appendChild(document.createElement("br"));

            let breakElem = document.createElement("hr")
            breakElem.className = 'comment_break'
            ret.body.appendChild(breakElem);

            let postTimeElem = document.createElement("span")
            postTimeElem.className = 'comment_time'
            postTimeElem.innerText = commentTime
            comment.insertBefore(postTimeElem,comment.firstElementChild);

            let posterNameElem = document.createElement("span")
            posterNameElem.className = 'commenter_name'
            posterNameElem.innerText = posterName + ':'
            comment.insertBefore(posterNameElem,comment.firstElementChild);

            const avatar = document.createElement('img')
            avatar.style.height='3.3vh'
            avatar.style.paddingRight='1vh'
            avatar.style.verticalAlign='middle'
            avatar.src = `https://www.chiefdelphi.com/user_avatar/www.chiefdelphi.com/${posterName}/90/169322_2.png`
            comment.insertBefore(avatar,comment.firstElementChild);

            comment.classList.add("post_comment");
            ret.body.appendChild(comment);

        }
    

    return ret;
}

export async function refreshDelphi() {
    const html = await (await fetch(getResourceURL('/dash/delphi'))).text();
    const info = getInfo(html);
    document.getElementById('delphiTitle').innerHTML = info.title.innerHTML + info.topics;
    document.getElementById('delphiBody').innerHTML = info.body.innerHTML;
    
    
    resetScroll()
}

export function setDelphiVisibility(visible : boolean) {
    document.getElementById('delphi').style.display = visible ? "" : "none";
}


function setBottomFade() {
    document.getElementById('bottom_fade').style.visibility = window.innerWidth / window.innerHeight > 1.8 ? 'visible' : 'hidden';
    document.getElementById('bottom_fade').style.height = Math.max(0, Math.min(80 * (window.innerWidth / window.innerHeight - 1.7), 25)) + 'vh';
    // 40 at 2, zero at 1.5
}
setBottomFade();
addEventListener('resize', setBottomFade);


const autoScrollState = {
    down: true,
    timeStarted: Date.now(),
    downSpeed: 0.036, // height/sec
    upSpeed: 1, // height/sec
    topWait: 5,
    bottomWait: 6,
}
function resetScroll() {
    autoScrollState.timeStarted = Date.now();
    autoScrollState.down = true;
}
const delphiBody = document.getElementById('delphiBody');
function autoScroll() {
    const element = delphiBody;
    if (autoScrollState.down) {
        const scrollTo = Math.max(0,
            element.clientHeight * autoScrollState.downSpeed * (
                (Date.now() - 1000 * autoScrollState.topWait) // pause at top for topWait seconds
                - autoScrollState.timeStarted) / 1000
        );
        if (element.clientHeight + scrollTo > element.scrollHeight) { // if reached end, reverse scroll direction
            autoScrollState.down = false;
            autoScrollState.timeStarted = Date.now();
        } else {
            element.scrollTop = scrollTo;
        }
    } else {
        const scrollTo = (element.scrollHeight - element.clientHeight) - (element.clientHeight * autoScrollState.upSpeed * Math.max(0, (Date.now() - (1000 * autoScrollState.bottomWait) - autoScrollState.timeStarted)) / 1000);
        if (scrollTo < 0) { // if reached end, reverse scroll direction
            autoScrollState.down = true;
            autoScrollState.timeStarted = Date.now();
        } else {
            element.scrollTop = scrollTo;
        }
    }
}
// setInterval(autoScroll, 10);