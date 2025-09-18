// Supabase 数据库类型定义和工具类型
import { Database } from './types'

// 提取表类型的工具类型
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 具体表类型别名
export type Game = Tables<'games'>
export type Player = Tables<'players'>
export type GameState = Tables<'game_state'>
export type WerewolfGame = Tables<'werewolf_games'>

// 插入类型别名
export type GameInsert = TablesInsert<'games'>
export type PlayerInsert = TablesInsert<'players'>
export type GameStateInsert = TablesInsert<'game_state'>
export type WerewolfGameInsert = TablesInsert<'werewolf_games'>

// 更新类型别名
export type GameUpdate = TablesUpdate<'games'>
export type PlayerUpdate = TablesUpdate<'players'>
export type GameStateUpdate = TablesUpdate<'game_state'>
export type WerewolfGameUpdate = TablesUpdate<'werewolf_games'>

// Supabase 操作结果类型
export interface SupabaseResponse<T> {
  data: T | null
  error: AppError | null
}

export interface SupabaseListResponse<T> {
  data: T[] | null
  error: AppError | null
}

// 导入AppError类型
import { AppError } from '@/lib/utils/error-handler'

// 查询构建器类型
export type SupabaseQueryBuilder<T> = ReturnType<ReturnType<typeof import('@supabase/supabase-js').createClient<Database>>['from']>

// 游戏状态枚举
export const GameStatus = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',  // 修复：使用下划线而不是连字符
  FINISHED: 'finished'
} as const

export type GameStatusType = typeof GameStatus[keyof typeof GameStatus]

// 常用查询选项
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  ascending?: boolean
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  count: number | null
  error: Error | null
}