import { useState, useEffect, useCallback } from 'react'
import { supabaseOps } from '@/lib/supabase/operations'
import { GameRules, PRESET_RULES } from '@/lib/game-rules'
import toast from 'react-hot-toast'

interface RoomSettings {
  name: string
  isPrivate: boolean
  password?: string
  maxPlayers: number
  rules: GameRules
  allowSpectators: boolean
}

interface GameRoom {
  id: string
  name: string
  host?: string
  currentPlayers: number
  maxPlayers: number
  status: 'waiting' | 'in_progress' | 'finished'  // 修复：使用下划线而不是连字符
  isPrivate?: boolean
  rules?: GameRules
  created_at: string
}

/**
 * 游戏房间管理Hook
 * 提供房间创建、加入、快速匹配等功能
 */
export function useGameRooms() {
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取可用房间列表
  const fetchAvailableRooms = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await supabaseOps.getGames({
        limit: 20,
        orderBy: 'created_at',
        ascending: false
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      // 过滤出等待中的房间并转换数据格式
      const waitingRooms = result.data
        .filter(game => 
          game.status === 'waiting' && 
          game.current_players < game.max_players
        )
        .map(game => ({
          id: game.id,
          name: game.name,
          currentPlayers: game.current_players,
          maxPlayers: game.max_players,
          status: game.status,
          created_at: game.created_at,
          rules: PRESET_RULES.classic // 默认规则
        }))

      setAvailableRooms(waitingRooms)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取房间列表失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 创建房间
  const createRoom = useCallback(async (settings: RoomSettings, playerName: string): Promise<string | null> => {
    try {
      const gameData = {
        name: settings.name,
        status: 'waiting' as const,
        max_players: settings.maxPlayers,
        current_players: 1,
        spectators: 0
      }

      const result = await supabaseOps.createGame(gameData)
      
      if (result.error || !result.data) {
        throw new Error(result.error?.message || '创建游戏失败')
      }

      const gameId = result.data.id

      // 添加房主为第一个玩家
      const playerResult = await supabaseOps.addPlayer({
        game_id: gameId,
        player_name: playerName,
        position: 0,
        cards: [],
        is_spectator: false
      })

      if (playerResult.error) {
        throw new Error(playerResult.error.message)
      }

      toast.success('房间创建成功！')
      return gameId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建房间失败'
      toast.error(errorMessage)
      return null
    }
  }, [])

  // 加入房间
  const joinRoom = useCallback(async (roomId: string, playerName: string, password?: string): Promise<boolean> => {
    try {
      // 获取房间信息
      const gameResult = await supabaseOps.getGame(roomId)
      if (gameResult.error || !gameResult.data) {
        throw new Error('房间不存在')
      }

      const game = gameResult.data
      if (game.status !== 'waiting') {
        throw new Error('游戏已开始，无法加入')
      }

      if (game.current_players >= game.max_players) {
        throw new Error('房间已满')
      }

      // 获取现有玩家
      const playersResult = await supabaseOps.getGamePlayers(roomId)
      if (playersResult.error) {
        throw new Error('获取玩家信息失败')
      }

      const players = playersResult.data || []
      
      // 检查玩家名称是否重复
      if (players.some(p => p.player_name === playerName)) {
        throw new Error('玩家名称已存在')
      }

      // 添加玩家
      const playerResult = await supabaseOps.addPlayer({
        game_id: roomId,
        player_name: playerName,
        position: players.length,
        cards: [],
        is_spectator: false
      })

      if (playerResult.error) {
        throw new Error(playerResult.error.message)
      }

      // 更新游戏玩家数量
      await supabaseOps.updateGame(roomId, {
        current_players: players.length + 1
      })

      toast.success('成功加入房间！')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加入房间失败'
      toast.error(`加入房间失败: ${errorMessage}`)
      return false
    }
  }, [])

  // 快速匹配
  const quickMatch = useCallback(async (playerName: string, preferredRules?: string): Promise<string | null> => {
    setIsSearching(true)
    try {
      // 先尝试找到合适的房间
      await fetchAvailableRooms()
      
      let suitableRoom = availableRooms.find(room => 
        room.currentPlayers < room.maxPlayers &&
        (!preferredRules || room.rules?.id === preferredRules)
      )

      if (suitableRoom) {
        const success = await joinRoom(suitableRoom.id, playerName)
        if (success) {
          return suitableRoom.id
        }
      }

      // 没有合适的房间，创建新房间
      const roomSettings: RoomSettings = {
        name: `${playerName}的房间`,
        isPrivate: false,
        maxPlayers: 4,
        rules: preferredRules ? 
          Object.values(PRESET_RULES).find(r => r.id === preferredRules) || PRESET_RULES.classic 
          : PRESET_RULES.classic,
        allowSpectators: true
      }

      const newRoomId = await createRoom(roomSettings, playerName)
      if (newRoomId) {
        toast.success('未找到合适房间，已为您创建新房间')
        return newRoomId
      }

      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '快速匹配失败'
      toast.error(errorMessage)
      return null
    } finally {
      setIsSearching(false)
    }
  }, [availableRooms, joinRoom, createRoom, fetchAvailableRooms])

  // 刷新房间列表
  const refreshRooms = useCallback(async () => {
    await fetchAvailableRooms()
  }, [fetchAvailableRooms])

  // 初始化加载
  useEffect(() => {
    fetchAvailableRooms()
  }, [fetchAvailableRooms])

  return {
    availableRooms,
    isLoading,
    isSearching,
    error,
    refreshRooms,
    joinRoom,
    quickMatch,
    createRoom
  }
}