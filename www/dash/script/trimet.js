async function updateTrimet() {
    const res = await fetch('/api/trimet');
    const data = (await res.json())["resultSet"];
    let stops = {}
    data["location"].forEach((location => {
        stops[location.id] = {
            id: location.id,
            desc: location.desc,
            arrivals: []
        }
    }))
    data["arrival"].forEach((arrival) => {
        stops[arrival.locid].arrivals.push({
            time: new Date(arrival.estimated ?? arrival.scheduled),
            route: arrival.route,
            status: arrival.status,
        })
    })


    stops = Object.values(stops)
    document.getElementById('trimet-stops').innerHTML = ""
    const html = stops.map(stop => {
        const element = document.createElement('div');
        element.className = 'trimet-stop';

        const descriptionNode = document.createElement("div");
        descriptionNode.innerText = stop.id + ": " + stop.desc
        descriptionNode.className = 'trimet-stop-description'
        
        element.appendChild(descriptionNode);
        const arrivalsList = document.createElement('div');
        stop.arrivals.sort((a, b) => a.time - b.time)
        stop.arrivals.forEach(arrival => {
            const arrivalTime = arrival.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'})
            const arrivalDelta = (arrival.time.getTime() - Date.now()) / 1000
            const minutes = Math.floor( (arrivalDelta/60) % 60 );
            const hours = Math.floor( (arrivalDelta/(60*60)) % 24 );
            const timeDeltaString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
            const arrivalNode = document.createElement("div")
            arrivalNode.appendChild(document.createTextNode(`Route ${arrival.route}: ${arrivalTime} (${timeDeltaString})`))
            arrivalsList.appendChild(arrivalNode)

        })
        element.appendChild(arrivalsList)
        console.log(element)
        document.getElementById('trimet-stops').appendChild(element);
    })
    
}