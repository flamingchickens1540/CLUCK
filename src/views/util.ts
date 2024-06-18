import { APIRoutes } from '@/types'

export function openFullscreen() {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
        elem.requestFullscreen() // @ts-expect-error nonstandard feature
    } else if (elem.webkitRequestFullscreen) {
        // @ts-expect-error nonstandard feature
        elem.webkitRequestFullscreen() // @ts-expect-error nonstandard feature
    } else if (elem.msRequestFullscreen) {
        // @ts-expect-error nonstandard feature
        elem.msRequestFullscreen()
    }
}

type Req<T> = T extends { req: unknown } ? T['req'] : never
type Res<T> = T extends { resp: unknown } ? T['resp'] : never

export async function apiFetch<Route extends keyof APIRoutes, Method extends keyof APIRoutes[Route] & string>(endpoint: Route, method: Method, body: Req<APIRoutes[Route][Method]>): Promise<Res<APIRoutes[Route][Method]> | undefined> {
    const response = await fetch('/api' + endpoint, {
        method: method,
        body: body == null ? undefined : JSON.stringify(body),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    if (!response.ok) {
        console.error(method, endpoint, response.status, response.statusText)
        return undefined
    }
    console.log(method, endpoint, response.status, response.statusText)
    return (await response.json()) as Res<APIRoutes[Route][Method]>
}
