const appId = 'B393B2CE96A258A72BAB481CA'
const stopId = '5378'
export const ratelimit = 2 // seconds, trimet allows up to 1 million requests a day (BONKERS!) https://developer.trimet.org/why_an_appid.shtml
export const busSigns = { east: '20 Gresham TC', west: '20 To Beaverton TC' }

let cache: Record<string, Date[]> = {}
let lastQueried = 0

async function queryArrivals(stopId: string) {
    const url = `https://developer.trimet.org/ws/v2/arrivals/?locIDs=${stopId}&appId=${appId}&json=true&arrivals=2`
    return await (await fetch(url)).json()
}

type ResultSet = {
    arrival: {
        shortSign: string
        estimated: string
        scheduled: string
    }[]
}

async function refetchArrivals() {
    const res = await queryArrivals(stopId)
    const results = res.resultSet as ResultSet
    cache = {}
    results.arrival.forEach((arrival) => {
        arrival.estimated ??= arrival.scheduled
        cache[arrival.shortSign] ??= []
        cache[arrival.shortSign].push(new Date(arrival.estimated))
    })
    lastQueried = Date.now()
}

export async function getArrivals() {
    if (lastQueried == 0) {
        await refetchArrivals()
    } else if (Date.now() - lastQueried > 1000 * ratelimit) {
        setTimeout(refetchArrivals)
    }
    return cache
}
