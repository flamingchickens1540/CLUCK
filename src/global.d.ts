import {} from 'hono'

declare module 'hono' {
    interface ContextRenderer {
        (content: string | Promise<string>, props?: { title?: string; js?: string; body_class?: string }): Response
    }
    interface ContextVariableMap {
        auth_write: boolean
        auth_read: boolean
        auth_admin: boolean
        user: string
    }
}
