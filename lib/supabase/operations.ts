import { createClient } from './client'
import {
  type Game,
  type Player, 
  type GameState,
  type GameInsert,
  type PlayerInsert,
  type GameStateInsert,
  type GameUpdate,
  type PlayerUpdate,
  type GameStateUpdate,
  type SupabaseResponse,
  type SupabaseListResponse,
  type QueryOptions,
  type PaginatedResponse
} from './database.types'
import { ErrorHandler, createAppError, ErrorCode } from '@/lib/utils/error-handler'
import { withPooledConnection } from '@/lib/utils/connection-pool'
import { requestDeduplicator, GameRequestKeys } from '@/lib/utils/request-deduplicator'

/**
 * 类型安全的Supabase数据库操作封装
 * 
 * 注意：由于Supabase TypeScript类型推断的已知限制，
 * 我们在内部使用any断言，但对外提供完全类型安全的接口。
 * 这符合项目中其他Supabase使用模式，确保运行时稳定性。
 * 
 * 性能优化：
 * - 使用连接池减少连接开销
 * - 请求去重避免重复操作
 * - 智能缓存提升响应速度
 */
class SupabaseOperations {
  private client = createClient()

  // ==================== Game Operations ====================

  /**
   * 创建新游戏
   */
  async createGame(gameData: GameInsert): Promise<SupabaseResponse<Game>> {
    try {
      // 使用any断言解决Supabase类型推断问题
      // 这是项目中的标准做法，确保运行时正常工作
      const { data, error } = await (this.client as any)
        .from('games')
        .insert(gameData)
        .select()
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'createGame')
        return { data: null, error: handledError }
      }

      return { data: data as Game, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'createGame')
      return { data: null, error: handledError }
    }
  }

  /**
   * 更新游戏
   */
  async updateGame(gameId: string, updates: GameUpdate): Promise<SupabaseResponse<Game>> {
    try {
      const { data, error } = await (this.client as any)
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'updateGame')
        return { data: null, error: handledError }
      }

      return { data: data as Game, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'updateGame')
      return { data: null, error: handledError }
    }
  }

  /**
   * 获取游戏信息
   */
  async getGame(gameId: string): Promise<SupabaseResponse<Game>> {
    try {
      const { data, error } = await (this.client as any)
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'getGame')
        return { data: null, error: handledError }
      }

      return { data: data as Game, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'getGame')
      return { data: null, error: handledError }
    }
  }

  /**
   * 获取游戏列表
   */
  async getGames(options: QueryOptions = {}): Promise<PaginatedResponse<Game>> {
    try {
      let query = (this.client as any).from('games').select('*', { count: 'exact' })
      
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }
      
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true })
      }

      const { data, error, count } = await query

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'getGames')
        return { data: [], count: null, error: handledError }
      }

      return { data: (data as Game[]) || [], count, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'getGames')
      return { data: [], count: null, error: handledError }
    }
  }

  // ==================== Player Operations ====================

  /**
   * 添加玩家到游戏
   */
  async addPlayer(playerData: PlayerInsert): Promise<SupabaseResponse<Player>> {
    try {
      const { data, error } = await (this.client as any)
        .from('players')
        .insert(playerData)
        .select()
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'addPlayer')
        return { data: null, error: handledError }
      }

      return { data: data as Player, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'addPlayer')
      return { data: null, error: handledError }
    }
  }

  /**
   * 更新玩家信息
   */
  async updatePlayer(playerId: string, updates: PlayerUpdate): Promise<SupabaseResponse<Player>> {
    try {
      const { data, error } = await (this.client as any)
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'updatePlayer')
        return { data: null, error: handledError }
      }

      return { data: data as Player, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'updatePlayer')
      return { data: null, error: handledError }
    }
  }

  /**
   * 更新玩家手牌 - 常用操作的便捷方法
   */
  async updatePlayerCards(gameId: string, playerName: string, cards: any[]): Promise<SupabaseResponse<Player>> {
    try {
      const { data, error } = await (this.client as any)
        .from('players')
        .update({ cards })
        .eq('game_id', gameId)
        .eq('player_name', playerName)
        .select()
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'updatePlayerCards')
        return { data: null, error: handledError }
      }

      return { data: data as Player, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'updatePlayerCards')
      return { data: null, error: handledError }
    }
  }

  /**
   * 获取游戏中的所有玩家
   */
  async getGamePlayers(gameId: string): Promise<SupabaseListResponse<Player>> {
    try {
      const { data, error } = await (this.client as any)
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('position')

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'getGamePlayers')
        return { data: null, error: handledError }
      }

      return { data: (data as Player[]) || [], error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'getGamePlayers')
      return { data: null, error: handledError }
    }
  }

  /**
   * 删除玩家
   */
  async removePlayer(playerId: string): Promise<SupabaseResponse<void>> {
    try {
      const { error } = await (this.client as any)
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'removePlayer')
        return { data: null, error: handledError }
      }

      return { data: null, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'removePlayer')
      return { data: null, error: handledError }
    }
  }

  // ==================== Game State Operations ====================

  /**
   * 创建游戏状态
   */
  async createGameState(stateData: GameStateInsert): Promise<SupabaseResponse<GameState>> {
    try {
      const { data, error } = await (this.client as any)
        .from('game_state')
        .insert(stateData)
        .select()
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'createGameState')
        return { data: null, error: handledError }
      }

      return { data: data as GameState, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'createGameState')
      return { data: null, error: handledError }
    }
  }

  /**
   * 更新游戏状态
   */
  async updateGameState(gameId: string, updates: GameStateUpdate): Promise<SupabaseResponse<GameState>> {
    try {
      const { data, error } = await (this.client as any)
        .from('game_state')
        .update(updates)
        .eq('game_id', gameId)
        .select()
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'updateGameState')
        return { data: null, error: handledError }
      }

      return { data: data as GameState, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'updateGameState')
      return { data: null, error: handledError }
    }
  }

  /**
   * 获取游戏状态
   */
  async getGameState(gameId: string): Promise<SupabaseResponse<GameState>> {
    try {
      const { data, error } = await (this.client as any)
        .from('game_state')
        .select('*')
        .eq('game_id', gameId)
        .single()

      if (error) {
        const handledError = ErrorHandler.handleSupabaseError(error, 'getGameState')
        return { data: null, error: handledError }
      }

      return { data: data as GameState, error: null }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'getGameState')
      return { data: null, error: handledError }
    }
  }

  // ==================== Realtime Operations ====================

  /**
   * 订阅游戏更新
   */
  subscribeToGame(gameId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        callback
      )
      .subscribe()
  }

  /**
   * 订阅游戏状态更新
   */
  subscribeToGameState(gameId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`game-state-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_id=eq.${gameId}`
        },
        callback
      )
      .subscribe()
  }

  /**
   * 订阅玩家更新
   */
  subscribeToPlayers(gameId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`players-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        callback
      )
      .subscribe()
  }

  // ==================== Batch Operations ====================

  /**
   * 批量更新玩家手牌 - 优化游戏初始化性能
   */
  async updateAllPlayerCards(gameId: string, playersCards: { position: number; cards: any[] }[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    
    try {
      // 使用Promise.allSettled并发执行，提高性能
      const results = await Promise.allSettled(
        playersCards.map(async ({ position, cards }) => {
          const { error } = await (this.client as any)
            .from('players')
            .update({ cards })
            .eq('game_id', gameId)
            .eq('position', position)
          
          if (error) throw new Error(`Position ${position}: ${error.message}`)
          return { position, success: true }
        })
      )
      
      // 收集错误信息
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push(result.reason.message)
        }
      })
      
      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`Batch update failed: ${error}`] }
    }
  }

  /**
   * 获取游戏详情（优化版本 - 使用连接池和去重）
   */
  async getGameDetails(gameId: string): Promise<SupabaseResponse<{
    game: Game;
    players: Player[];
    gameState: GameState | null;
  }>> {
    return requestDeduplicator.dedupe(
      GameRequestKeys.gameDetails(gameId),
      async () => {
        return withPooledConnection(async (client) => {
          try {
            console.log(`🔍 获取游戏详情: ${gameId}`)
            
            // 并行获取所有数据以提升性能
            const [gameResult, playersResult, gameStateResult] = await Promise.all([
              (client as any).from('games').select().eq('id', gameId).single(),
              (client as any).from('players').select().eq('game_id', gameId).order('position'),
              (client as any).from('game_state').select().eq('game_id', gameId).single()
            ])

            // 检查游戏是否存在
            if (gameResult.error) {
              if (gameResult.error.code === 'PGRST116') {
                const notFoundError = createAppError(ErrorCode.GAME_NOT_FOUND, `游戏 ${gameId} 不存在`)
                return { data: null, error: notFoundError }
              }
              const handledError = ErrorHandler.handleSupabaseError(gameResult.error, 'getGameDetails')
              return { data: null, error: handledError }
            }

            // 检查玩家数据
            if (playersResult.error) {
              const handledError = ErrorHandler.handleSupabaseError(playersResult.error, 'getGameDetails')
              return { data: null, error: handledError }
            }

            // 游戏状态可能不存在（新游戏）
            const gameState = gameStateResult.error ? null : gameStateResult.data as GameState

            const result = {
              game: gameResult.data as Game,
              players: playersResult.data as Player[],
              gameState
            }

            console.log(`✅ 游戏详情获取成功: ${gameId}`)
            return { data: result, error: null }

          } catch (error) {
             console.error('❌ 获取游戏详情失败:', error)
             const handledError = ErrorHandler.handleSupabaseError(error, 'getGameDetails')
             return { data: null, error: handledError }
           }
        })
      },
      2000 // 2秒缓存
    )
  }

  /**
   * 验证并出牌（优化版本 - 使用去重防止重复提交）
   */
  async validateAndPlayCards(
    gameId: string, 
    playerName: string, 
    cards: any[], 
    expectedTurnCount: number
  ): Promise<SupabaseResponse<any>> {
    return requestDeduplicator.dedupe(
      GameRequestKeys.playCards(gameId, playerName, cards),
      async () => {
        return withPooledConnection(async (client) => {
          try {
            console.log(`🎮 玩家 ${playerName} 尝试出牌:`, cards)
            
            const { data, error } = await (client as any).rpc('validate_and_play_cards', {
              p_game_id: gameId,
              p_player_name: playerName,
              p_cards: cards,
              p_expected_turn_count: expectedTurnCount
            })

            if (error) {
              console.error('❌ 出牌验证失败:', error)
              const handledError = ErrorHandler.handleSupabaseError(error, 'validateAndPlayCards')
              return { data: null, error: handledError }
            }

            // 出牌成功后，清除相关缓存
            requestDeduplicator.invalidate(GameRequestKeys.gameDetails(gameId))
            requestDeduplicator.invalidate(GameRequestKeys.gameState(gameId))
            requestDeduplicator.invalidate(GameRequestKeys.players(gameId))

            console.log(`✅ 出牌成功:`, data)
            return { data, error: null }

          } catch (error) {
            console.error('❌ 出牌操作失败:', error)
            const handledError = ErrorHandler.handleSupabaseError(error, 'validateAndPlayCards')
            return { data: null, error: handledError }
          }
        })
      },
      500 // 短缓存，防止重复点击
    )
  }

  /**
   * 验证并执行跳过操作
   */
  async validateAndPass(
    gameId: string, 
    playerName: string, 
    expectedTurnCount: number
  ): Promise<SupabaseResponse<any>> {
    try {
      // 类似的验证逻辑
      const gameStateResult = await this.getGameState(gameId)
      if (gameStateResult.error) {
        return { data: null, error: gameStateResult.error }
      }
      
      if (!gameStateResult.data) {
        const error = createAppError(
          ErrorCode.GAME_NOT_FOUND, 
          '游戏状态不存在'
        )
        return { data: null, error: error }
      }

      const gameState = gameStateResult.data
      if (gameState.turn_count !== expectedTurnCount) {
        const error = createAppError(
          ErrorCode.INVALID_PLAY, 
          '回合已变化，请刷新后重试'
        )
        return { data: null, error: error }
      }

      const playersResult = await this.getGamePlayers(gameId)
      if (playersResult.error) {
        return { data: null, error: playersResult.error }
      }

      const players = playersResult.data || []
      const currentPlayer = players.find(p => p.player_name === playerName)
      if (!currentPlayer || gameState.current_player !== currentPlayer.position) {
        const error = createAppError(
          ErrorCode.NOT_YOUR_TURN, 
          '当前不是您的回合'
        )
        return { data: null, error: error }
      }

      // 更新游戏状态
      const nextPlayer = (gameState.current_player + 1) % players.length
      const updateResult = await this.updateGameState(gameId, {
        current_player: nextPlayer,
        turn_count: gameState.turn_count + 1
      })

      if (updateResult.error) {
        return { data: null, error: updateResult.error }
      }

      return { 
        data: { 
          nextPlayer, 
          turnCount: gameState.turn_count + 1 
        }, 
        error: null 
      }
    } catch (error) {
      const handledError = ErrorHandler.handleSupabaseError(error, 'validateAndPass')
      return { data: null, error: handledError }
    }
  }

  // ==================== Health Check ====================

  /**
   * 检查数据库连接状态
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { error } = await (this.client as any)
        .from('games')
        .select('id')
        .limit(1)
      
      if (error) {
        return { connected: false, error: error.message }
      }
      
      return { connected: true }
    } catch (error) {
      return { connected: false, error: `Connection check failed: ${error}` }
    }
  }
}

// 导出单例实例
export const supabaseOps = new SupabaseOperations()

// 导出所有方法，保持API一致性
export const {
  createGame,
  updateGame,
  getGame,
  getGames,
  addPlayer,
  updatePlayer,
  updatePlayerCards,
  getGamePlayers,
  removePlayer,
  createGameState,
  updateGameState,
  getGameState,
  subscribeToGame,
  subscribeToGameState,
  subscribeToPlayers,
  updateAllPlayerCards,
  getGameDetails,
  validateAndPlayCards,
  validateAndPass,
  checkConnection
} = supabaseOps