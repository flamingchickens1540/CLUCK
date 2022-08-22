function getInfo(siteHTML) {
    let ret = {}

    let doc = document.createElement( 'html' );
    doc.innerHTML = siteHTML

    ret.body = doc.querySelector('.cooked, .post').innerHTML
    ret.title = doc.querySelector('#topic-title').children[0].children[0].innerHTML
    ret.topics = '<div class="topics">' + doc.querySelector('.topic-category').innerHTML + '</div>'

    return ret;
}

async function refreshDelphi() {
    let html = await (await fetch('/dash/delphi')).text()
    let info = getInfo(html)
    document.getElementById('delphiTitle').innerHTML = info.title + info.topics
    document.getElementById('delphiBody').innerHTML = info.body
}

refreshDelphi()
setInterval(refreshDelphi,1000 * 60 * 5) // refresh post every 5 minutes