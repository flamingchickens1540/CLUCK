import type {
    BlockAction,
    BlockElementAction,
    ButtonAction,
    Middleware,
    SlackActionMiddlewareArgs,
    SlackCommandMiddlewareArgs,
    SlackEventMiddlewareArgs,
    SlackShortcut,
    SlackShortcutMiddlewareArgs,
    SlackViewMiddlewareArgs,
    ViewSubmitAction
} from '@slack/bolt'

type StringIndexed = Record<string, any>

export type CommandMiddleware = Middleware<SlackCommandMiddlewareArgs, StringIndexed>
export type ShortcutMiddleware = Middleware<SlackShortcutMiddlewareArgs<SlackShortcut>, StringIndexed>
export type ActionMiddleware<A extends BlockElementAction = ButtonAction> = Middleware<SlackActionMiddlewareArgs<BlockAction<A>>, StringIndexed>
export type ViewMiddleware = Middleware<SlackViewMiddlewareArgs<ViewSubmitAction>, StringIndexed>
export type EventMiddleware<EventType extends string = string> = Middleware<SlackEventMiddlewareArgs<EventType>, StringIndexed>
