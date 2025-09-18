// 通用类型定义
import { type Database } from '@/lib/supabase/types'

// Supabase 客户端类型
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 游戏相关类型
export type GameRow = Tables<'games'>
export type PlayerRow = Tables<'players'>
export type GameStateRow = Tables<'game_state'>
export type WerewolfGameRow = Tables<'werewolf_games'>

// API 响应类型
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// 错误类型定义
export interface AppError {
  code: string
  message: string
  details?: any
}

// 游戏房间信息类型
export interface GameRoom {
  id: string
  name: string
  players: number
  maxPlayers: number
  spectators: number
  status: "waiting" | "in_progress" | "finished"
  created_at: string
}

// 用户输入验证类型
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// 组件 Props 类型
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// 游戏选项类型
export interface GameOptions {
  allowSpectators: boolean
  gameSpeed: "slow" | "normal" | "fast"
  autoPass: boolean
  showCardCount: boolean
  cardSorting: "suit" | "rank" | "auto"
  autoArrange: boolean
}