import type { SlackActionMiddlewareArgs, BlockAction, ButtonAction, StaticSelectAction } from '@slack/bolt'

export type ButtonActionMiddlewareArgs = SlackActionMiddlewareArgs<BlockAction<ButtonAction>>
export type StaticSelectActionMiddlewareArgs = SlackActionMiddlewareArgs<BlockAction<StaticSelectAction>>

export type LeaderboardType = 'total' | 'weekly' | 'lab' | 'external' | 'department'
export type Department = 'fab' | 'controls' | 'robotsw' | 'appsw' | 'community' | 'companal' | 'outreach'
