


setInterval(()=>
Array.from(document.querySelectorAll('person-button')).filter(b=>b.loggedIn).forEach((b,index)=>b.style.transform = `rotate(${Math.sin((Date.now()+(index*100000)%234234)/100)*10}deg)`),50)