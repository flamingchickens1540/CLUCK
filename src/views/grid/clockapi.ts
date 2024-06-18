/* exported clock cluckedIn ping refreshMemberList getApiKey checkAuth*/

import type { APIClockLabRequest, APIMember, APILoggedIn } from '@/types'
import { apiFetch } from '@/views/util'
import { getClockMode } from '@/views/grid/style'



export async function clock(email: string, clockingIn: boolean):Promise<boolean> {
    const outMode = getClockMode() == "normal" ? "out" : "void"
    const body:APIClockLabRequest = {
        email: email,
        action: clockingIn ? "in" : outMode
    }
    const res = await apiFetch("/clock/lab", "POST", body)
    return res?.success ?? false
}

export async function getLoggedIn(): Promise<APILoggedIn[]> {
    const res = await apiFetch("/clock/lab", "GET", null)
    if (!res) {
        throw new Error("error loading data")
    }
    return res
}

export async function refreshMemberList(): Promise<APIMember[]> {
    const res = await apiFetch("/members/refresh", "GET", null)
    if (!res) {
        throw new Error("error loading data")
    }
    return res
}

export async function getMemberList(): Promise<APIMember[]> {
    const res = await apiFetch("/members", "GET", null)
    if (!res) {
        throw new Error("error loading data")
    }
    return res
}
