import { type enum_Member_Team } from '@prisma/client'
import { type PostItem } from '~routes/api/dash'

export type HourCategory = 'lab' | 'external' | 'summer' | 'event' // must also change enum constraint when modifying

export type APIMember = {
    email: string
    first_name: string
    full_name: string
    photo: string
    photo_small: string
    isManager: boolean
    team: enum_Member_Team
}

export type APIClockLabRequest = {
    action: 'in' | 'out' | 'void'
    email: string
}

export type APIClockExternalSubmitRequest = {
    email: string
    message: string
    hours: number
}

export type APIClockExternalRespondRequest = {
    id: number
    action: 'approve' | 'deny'
    category: HourCategory
}
export type APIClockResponse = { success: false; error: string; log_id?: number } | { success: true; log_id: number }

type APIMembersResponse = APIMember[]
export type APILoggedIn = { id: string; email: string; time_in: string }

interface APIMethod {
    req: unknown
    resp: unknown
}
interface APIRoute {
    POST?: APIMethod
    GET?: APIMethod
    PUT?: APIMethod
}

export interface APIRoutes extends Record<string, APIRoute> {
    '/clock/lab': {
        POST: { req: APIClockLabRequest; resp: APIClockResponse }
        GET: { req: null; resp: APILoggedIn[] }
    }
    '/members': {
        GET: { req: null; resp: APIMembersResponse }
    }
    '/members/refresh': {
        GET: { req: null; resp: APIMembersResponse }
    }
    '/dash/chiefdelphi': {
        GET: { req: null; resp: PostItem }
    }
}

export type WSCluckChange = { email: string; logging_in: boolean }
