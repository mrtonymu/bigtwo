// 请求去重器 - 避免重复的数据库操作
import { useState, useEffect, useRef, useCallback } from 'react'

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
  resolvers: Array<(value: T) => void>
  rejectors: Array<(error: any) => void>
}

interface RequestConfig {
  ttl?: number // 缓存时间（毫秒）
  maxPending?: number // 最大待处理请求数
  enableLogging?: boolean
}

export class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map()
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private config: RequestConfig

  constructor(config: RequestConfig = {}) {
    this.config = {
      ttl: 5000, // 默认5秒缓存
      maxPending: 50,
      enableLogging: false,
      ...config
    }

    // 定期清理过期的缓存和请求
    setInterval(() => {
      this.cleanup()
    }, 10000)
  }

  /**
   * 执行去重请求
   */
  async dedupe<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.getCacheKey(key)
    const requestTtl = ttl || this.config.ttl!

    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      if (this.config.enableLogging) {
        console.log(`🎯 缓存命中: ${key}`)
      }
      return cached.data
    }

    // 检查是否有相同的请求正在进行
    const pending = this.pendingRequests.get(cacheKey)
    if (pending) {
      if (this.config.enableLogging) {
        console.log(`⏳ 请求合并: ${key}`)
      }
      
      // 返回一个新的Promise，它会在原请求完成时resolve
      return new Promise<T>((resolve, reject) => {
        pending.resolvers.push(resolve)
        pending.rejectors.push(reject)
      })
    }

    // 创建新请求
    if (this.config.enableLogging) {
      console.log(`🚀 新请求: ${key}`)
    }

    const resolvers: Array<(value: T) => void> = []
    const rejectors: Array<(error: any) => void> = []

    const promise = requestFn()
      .then((result) => {
        // 缓存结果
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: requestTtl
        })

        // 通知所有等待的请求
        resolvers.forEach(resolve => resolve(result))
        
        // 清理待处理请求
        this.pendingRequests.delete(cacheKey)
        
        if (this.config.enableLogging) {
          console.log(`✅ 请求完成: ${key}`)
        }
        
        return result
      })
      .catch((error) => {
        // 通知所有等待的请求
        rejectors.forEach(reject => reject(error))
        
        // 清理待处理请求
        this.pendingRequests.delete(cacheKey)
        
        if (this.config.enableLogging) {
          console.log(`❌ 请求失败: ${key}`, error)
        }
        
        throw error
      })

    // 记录待处理请求
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now(),
      resolvers,
      rejectors
    })

    return promise
  }

  /**
   * 清除特定键的缓存
   */
  invalidate(key: string): void {
    const cacheKey = this.getCacheKey(key)
    this.cache.delete(cacheKey)
    
    if (this.config.enableLogging) {
      console.log(`🗑️ 缓存失效: ${key}`)
    }
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
    
    if (this.config.enableLogging) {
      console.log('🧹 清空所有缓存')
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxPending: this.config.maxPending
    }
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(key: string): string {
    return `dedup_${key}`
  }

  /**
   * 清理过期的缓存和请求
   */
  private cleanup(): void {
    const now = Date.now()
    
    // 清理过期缓存
    for (const [key, cached] of this.cache) {
      if ((now - cached.timestamp) > cached.ttl) {
        this.cache.delete(key)
      }
    }

    // 清理超时的待处理请求（超过30秒）
    for (const [key, pending] of this.pendingRequests) {
      if ((now - pending.timestamp) > 30000) {
        this.pendingRequests.delete(key)
      }
    }

    // 限制待处理请求数量
    if (this.pendingRequests.size > this.config.maxPending!) {
      const entries = Array.from(this.pendingRequests.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // 删除最旧的请求
      const toDelete = entries.slice(0, entries.length - this.config.maxPending!)
      toDelete.forEach(([key]) => {
        this.pendingRequests.delete(key)
      })
    }
  }
}

// 全局去重器实例
export const requestDeduplicator = new RequestDeduplicator({
  ttl: 3000, // 3秒缓存
  maxPending: 20,
  enableLogging: process.env.NODE_ENV === 'development'
})

/**
 * 游戏相关的去重键生成器
 */
export const GameRequestKeys = {
  gameDetails: (gameId: string) => `game_details_${gameId}`,
  gameState: (gameId: string) => `game_state_${gameId}`,
  players: (gameId: string) => `players_${gameId}`,
  playCards: (gameId: string, playerName: string, cards: any[]) => 
    `play_cards_${gameId}_${playerName}_${JSON.stringify(cards)}`,
  passCards: (gameId: string, playerName: string) => 
    `pass_cards_${gameId}_${playerName}`,
  updateCards: (gameId: string, playerName: string) => 
    `update_cards_${gameId}_${playerName}`
}

/**
 * 使用请求去重的Hook
 */
export function useRequestDeduplication() {
  const dedupe = useCallback(<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl?: number
  ) => {
    return requestDeduplicator.dedupe(key, requestFn, ttl)
  }, [])

  const invalidate = useCallback((key: string) => {
    requestDeduplicator.invalidate(key)
  }, [])

  const clear = useCallback(() => {
    requestDeduplicator.clear()
  }, [])

  const getStats = useCallback(() => {
    return requestDeduplicator.getStats()
  }, [])

  return {
    dedupe,
    invalidate,
    clear,
    getStats
  }
}

/**
 * 游戏操作去重Hook
 */
export function useGameRequestDeduplication(gameId: string) {
  const { dedupe, invalidate } = useRequestDeduplication()

  const dedupeGameDetails = useCallback((requestFn: () => Promise<any>) => {
    return dedupe(GameRequestKeys.gameDetails(gameId), requestFn)
  }, [gameId, dedupe])

  const dedupeGameState = useCallback((requestFn: () => Promise<any>) => {
    return dedupe(GameRequestKeys.gameState(gameId), requestFn)
  }, [gameId, dedupe])

  const dedupePlayers = useCallback((requestFn: () => Promise<any>) => {
    return dedupe(GameRequestKeys.players(gameId), requestFn)
  }, [gameId, dedupe])

  const dedupePlayCards = useCallback((
    playerName: string,
    cards: any[],
    requestFn: () => Promise<any>
  ) => {
    return dedupe(GameRequestKeys.playCards(gameId, playerName, cards), requestFn, 1000) // 短缓存
  }, [gameId, dedupe])

  const invalidateGameData = useCallback(() => {
    invalidate(GameRequestKeys.gameDetails(gameId))
    invalidate(GameRequestKeys.gameState(gameId))
    invalidate(GameRequestKeys.players(gameId))
  }, [gameId, invalidate])

  return {
    dedupeGameDetails,
    dedupeGameState,
    dedupePlayers,
    dedupePlayCards,
    invalidateGameData
  }
}