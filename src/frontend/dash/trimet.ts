const appId = 'B393B2CE96A258A72BAB481CA'
const stopId = '5378'
export const busSigns = ['20 Gresham TC','20 Beaverton TC']

let cache = {}
let lastQueried = 0;

async function queryArrivals(stopId) {
    let url = `https://developer.trimet.org/ws/v2/arrivals/?locIDs=${stopId}&appId=${appId}`
    let json = await (await fetch(url)).json()
    return json
}

async function refetchArrivals() {
    let res = await queryArrivals(stopId);
    let timesOnly = res.resultSet.arrival.reduce( // credit https://dev.to/_bigblind/quick-tip-transform-an-array-into-an-object-using-reduce-2gh6
        (acc, post) => {
            let {shortSign, estimated} = post;
            return {...acc, [shortSign]: [...(acc[shortSign] || []), estimated]};
        }, {}
    )
    cache = timesOnly;
    lastQueried = Date.now()
}

export async function getArrivals() {
    if((Date.now() - lastQueried)>(1000 * 30)) {
        await refetchArrivals()
    }
    return cache;
}