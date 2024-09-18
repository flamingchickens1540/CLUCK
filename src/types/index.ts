import { enum_MeetingAttendances_state } from '@prisma/client'
import { PostItem } from '~routes/api/dash'

export type HourCategory = 'lab' | 'external' | 'summer' | 'event' // must also change enum constraint when modifying

export type APIMember = {
    email: string
    first_name: string
    full_name: string
    photo: string
    photo_small: string
    isManager: boolean
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

export type APIMeetingAttendance = {
    email: string
    state: enum_MeetingAttendances_state
    meeting: number
}

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
    '/attendance': {
        POST: { req: APIMeetingAttendance; resp: APIClockResponse }
        GET: {
            req: null
            resp: {
                id: number
                label: string
                attendance: Record<string, enum_MeetingAttendances_state>
            }
        }
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
