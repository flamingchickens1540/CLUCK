import type {
    BlockAction,
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
import { StringIndexed } from '@slack/bolt/dist/types/helpers'

export type ButtonActionMiddlewareArgs = SlackActionMiddlewareArgs<BlockAction<ButtonAction>>

export type CommandMiddleware = Middleware<SlackCommandMiddlewareArgs, StringIndexed>
export type ShortcutMiddleware = Middleware<SlackShortcutMiddlewareArgs<SlackShortcut>, StringIndexed>
export type ActionMiddleware = Middleware<SlackActionMiddlewareArgs<BlockAction<ButtonAction>>, StringIndexed>
export type ViewMiddleware = Middleware<SlackViewMiddlewareArgs<ViewSubmitAction>, StringIndexed>
export type EventMiddleware<EventType extends string = string> = Middleware<SlackEventMiddlewareArgs<EventType>, StringIndexed>
