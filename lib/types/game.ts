// 游戏相关类型定义
import { type Card as GameCard, type Player, type GameState } from '@/lib/game-logic'

// 网络优化相关类型
export interface NetworkOptimizationOptions {
  gameId: string
  playerId: string
  onSync?: (data: GameSyncData) => void
  onConflict?: (localData: GameSyncData, serverData: GameSyncData) => GameSyncData
  maxRetries?: number
  syncInterval?: number
}

export interface GameSyncData {
  gameState: GameState
  players: Player[]
  lastUpdated: number
}

export interface OfflineOperation {
  type: 'play_cards' | 'pass' | 'update_cards'
  timestamp: number
  playerId: string
  playerPosition?: number
  cards?: GameCard[]
  expectedTurnCount?: number
  playerName?: string
}

// 游戏网络管理器类型
export interface GameNetworkManagerProps {
  gameId: string
  playerName: string
  onGameSync?: (data: GameSyncData) => void
}

// 游戏统计类型
export interface GameStats {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  averageCardsLeft: number
  bestFinish: number
  recentGames: GameResult[]
}

export interface GameResult {
  gameId: string
  position: number
  cardsLeft: number
  playTime: number
  date: string
}

// 主题相关类型
export interface ThemeConfig {
  id: string
  name: string
  description: string
  cardStyle: {
    background: string
    border: string
    text: string
    shadow: string
  }
  tableStyle: {
    background: string
    accent: string
  }
  preview: string
}

// 错误处理类型
export interface GameError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: number
}

// 数据库操作类型
export interface PlayerCardsUpdate {
  position: number
  cards: GameCard[]
}

export interface DatabaseOperationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: string[]
}

// 订阅回调类型
export type SubscriptionCallback<T = unknown> = (payload: T) => void

// 游戏房间类型扩展
export interface ExtendedGameRoom {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  spectators: number
  status: "waiting" | "in-progress" | "finished"
  created_at: string
  gameState?: GameState
}

// 拖拽相关类型
export interface DraggableCardProps {
  card: GameCard
  index: number
  isSelected: boolean
  onClick: () => void
  currentTheme: {
    id: string
    name: string
    description: string
    cardStyle: {
      background: string
      border: string
      text: string
      shadow: string
    }
    tableStyle: {
      background: string
      accent: string
    }
    preview: string
  }
}

// 游戏表格组件类型
export interface GameTableProps {
  gameId: string
  playerName: string
}

// 观战模式类型
export interface SpectatorModeProps {
  gameId: string
}

// 狼人杀相关类型（如果需要）
export interface WerewolfPlayer {
  id: string
  name: string
  role: string
  isAlive: boolean
  position: number
}

export interface WerewolfRoom {
  id: string
  name: string
  players: WerewolfPlayer[]
  maxPlayers: number
  status: "waiting" | "in-progress" | "finished"
  created_at: string
}