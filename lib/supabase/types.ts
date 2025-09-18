// Import game-specific types
import { type Card, type PlayHistory } from '@/lib/game-logic'
import { type WerewolfPlayer, type NightAction, type Vote } from '@/lib/werewolf-logic'

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          name: string
          status: 'waiting' | 'in_progress' | 'finished'
          max_players: number
          current_players: number
          spectators: number
          game_options?: {
            allowSpectators: boolean
            gameSpeed: "slow" | "normal" | "fast"
            autoPass: boolean
            showCardCount: boolean
            cardSorting: "auto" | "suit" | "rank"
            autoArrange: boolean
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'waiting' | 'in_progress' | 'finished'
          max_players?: number
          current_players?: number
          spectators?: number
          game_options?: {
            allowSpectators: boolean
            gameSpeed: "slow" | "normal" | "fast"
            autoPass: boolean
            showCardCount: boolean
            cardSorting: "auto" | "suit" | "rank"
            autoArrange: boolean
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'waiting' | 'in_progress' | 'finished'
          max_players?: number
          current_players?: number
          spectators?: number
          game_options?: {
            allowSpectators: boolean
            gameSpeed: "slow" | "normal" | "fast"
            autoPass: boolean
            showCardCount: boolean
            cardSorting: "auto" | "suit" | "rank"
            autoArrange: boolean
          }
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          game_id: string
          player_name: string
          position: number
          cards: Card[]
          is_spectator: boolean
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_name: string
          position: number
          cards?: Card[]
          is_spectator?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_name?: string
          position?: number
          cards?: Card[]
          is_spectator?: boolean
          created_at?: string
        }
      }
      game_state: {
        Row: {
          id: string
          game_id: string
          current_player: number
          last_play: Card[]
          last_player: number | null
          turn_count: number
          play_history: PlayHistory[]
          deck: Card[]
          game_rules: any // 添加缺失的字段
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          current_player?: number
          last_play?: Card[]
          last_player?: number | null
          turn_count?: number
          play_history?: PlayHistory[]
          deck?: Card[]
          game_rules?: any // 添加缺失的字段
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          current_player?: number
          last_play?: Card[]
          last_player?: number | null
          turn_count?: number
          play_history?: PlayHistory[]
          deck?: Card[]
          game_rules?: any // 添加缺失的字段
          created_at?: string
          updated_at?: string
        }
      }
      werewolf_games: {
        Row: {
          id: string
          name: string
          players: WerewolfPlayer[]
          phase: string
          day_count: number
          night_actions: NightAction[]
          votes: Vote[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          players: WerewolfPlayer[]
          phase?: string
          day_count?: number
          night_actions?: NightAction[]
          votes?: Vote[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          players?: WerewolfPlayer[]
          phase?: string
          day_count?: number
          night_actions?: NightAction[]
          votes?: Vote[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

