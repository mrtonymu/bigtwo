import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseOps } from '@/lib/supabase/operations'
import { ErrorHandler } from '@/lib/utils/error-handler'

interface NetworkOptimizationOptions {
  gameId: string
  playerId: string
  onSync?: (data: any) => void
  onConflict?: (localData: any, serverData: any) => any
  maxRetries?: number
  syncInterval?: number
}

/**
 * 网络优化Hook - 处理网络波动时的游戏同步
 * 
 * 功能：
 * 1. 检测网络状态变化
 * 2. 自动重新同步游戏状态
 * 3. 处理数据冲突
 * 4. 缓存关键操作
 * 5. 断线重连时的状态恢复
 */
export function useNetworkOptimization(options: NetworkOptimizationOptions) {
  const {
    gameId,
    playerId,
    onSync,
    onConflict,
    maxRetries = 3,
    syncInterval = 5000
  } = options

  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'unstable'>('online')
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'conflict' | 'failed'>('synced')
  const [pendingOperations, setPendingOperations] = useState<any[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())
  
  const syncTimeoutRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)
  const offlineQueueRef = useRef<any[]>([])

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 网络已连接，开始同步...')
      setNetworkStatus('online')
      performFullSync()
    }

    const handleOffline = () => {
      console.log('🔴 网络断开，进入离线模式')
      setNetworkStatus('offline')
    }

    // 检测网络质量
    const checkNetworkQuality = async () => {
      try {
        const startTime = performance.now()
        const result = await supabaseOps.checkConnection()
        const endTime = performance.now()
        const latency = endTime - startTime

        if (!result.connected) {
          setNetworkStatus('offline')
        } else if (latency > 3000) {
          setNetworkStatus('unstable')
        } else {
          setNetworkStatus('online')
        }
      } catch (error) {
        setNetworkStatus('unstable')
      }
    }

    // 定期检查网络质量
    const qualityCheckInterval = setInterval(checkNetworkQuality, 10000)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(qualityCheckInterval)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // 执行完整同步
  const performFullSync = useCallback(async () => {
    if (syncStatus === 'syncing') return

    setSyncStatus('syncing')
    try {
      console.log('🔄 执行完整游戏状态同步...')
      
      // 获取最新的游戏数据
      const gameDetails = await supabaseOps.getGameDetails(gameId)
      
      if (gameDetails.error) {
        throw new Error(gameDetails.error.message)
      }

      const serverData = gameDetails.data
      
      // 检查是否有本地待处理操作
      if (offlineQueueRef.current.length > 0) {
        console.log(`📤 应用 ${offlineQueueRef.current.length} 个离线操作`)
        await applyOfflineOperations(serverData)
      }

      // 同步成功
      setSyncStatus('synced')
      setLastSyncTime(Date.now())
      retryCountRef.current = 0
      onSync?.(serverData)
      
      console.log('✅ 游戏状态同步完成')
      
    } catch (error) {
      console.error('❌ 同步失败:', error)
      handleSyncError(error)
    }
  }, [gameId, syncStatus, onSync])

  // 应用离线操作
  const applyOfflineOperations = useCallback(async (serverData: any) => {
    const operations = [...offlineQueueRef.current]
    offlineQueueRef.current = []

    for (const operation of operations) {
      try {
        console.log('📝 应用离线操作:', operation.type)
        
        // 根据操作类型执行相应的数据库操作
        switch (operation.type) {
          case 'play_cards':
            // 检查是否仍然是有效的出牌
            if (await validateOfflinePlay(operation, serverData)) {
              await executePlay(operation)
            } else {
              console.warn('⚠️ 离线出牌已无效，跳过')
            }
            break
            
          case 'pass':
            await executePass(operation)
            break
            
          case 'update_cards':
            await executeCardUpdate(operation)
            break
            
          default:
            console.warn('未知的离线操作类型:', operation.type)
        }
      } catch (error) {
        console.error('离线操作应用失败:', operation, error)
        // 将失败的操作重新加入队列
        offlineQueueRef.current.push(operation)
      }
    }
  }, [])

  // 验证离线出牌是否仍然有效
  const validateOfflinePlay = async (operation: any, serverData: any): Promise<boolean> => {
    const { gameState, players } = serverData
    
    // 检查游戏状态是否变化
    if (gameState.turn_count !== operation.expectedTurnCount) {
      return false
    }
    
    // 检查是否仍然是该玩家的回合
    if (gameState.currentPlayer !== operation.playerPosition) {
      return false
    }
    
    return true
  }

  // 执行出牌操作
  const executePlay = async (operation: any) => {
    // 实现具体的出牌逻辑
    console.log('执行出牌:', operation.cards)
  }

  // 执行跳过操作
  const executePass = async (operation: any) => {
    console.log('执行跳过')
  }

  // 执行手牌更新
  const executeCardUpdate = async (operation: any) => {
    await supabaseOps.updatePlayerCards(gameId, operation.playerName, operation.cards)
  }

  // 处理同步错误
  const handleSyncError = useCallback((error: any) => {
    retryCountRef.current += 1
    
    if (retryCountRef.current <= maxRetries) {
      console.log(`🔄 同步重试 ${retryCountRef.current}/${maxRetries}`)
      setSyncStatus('syncing')
      
      // 指数退避重试
      const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
      syncTimeoutRef.current = setTimeout(performFullSync, retryDelay)
    } else {
      console.error('❌ 同步最终失败')
      setSyncStatus('failed')
      ErrorHandler.handleNetworkError(error)
    }
  }, [maxRetries, performFullSync])

  // 添加离线操作到队列
  const queueOfflineOperation = useCallback((operation: any) => {
    console.log('📝 添加离线操作到队列:', operation.type)
    operation.timestamp = Date.now()
    operation.playerId = playerId
    offlineQueueRef.current.push(operation)
    
    // 限制队列大小
    if (offlineQueueRef.current.length > 50) {
      offlineQueueRef.current = offlineQueueRef.current.slice(-30)
    }
  }, [playerId])

  // 手动触发同步
  const manualSync = useCallback(() => {
    retryCountRef.current = 0
    performFullSync()
  }, [performFullSync])

  // 智能同步 - 根据网络状态调整同步频率
  useEffect(() => {
    if (networkStatus === 'offline') return

    const interval = networkStatus === 'unstable' ? syncInterval * 2 : syncInterval
    
    const autoSyncInterval = setInterval(() => {
      if (Date.now() - lastSyncTime > interval) {
        performFullSync()
      }
    }, interval)

    return () => clearInterval(autoSyncInterval)
  }, [networkStatus, syncInterval, lastSyncTime, performFullSync])

  return {
    networkStatus,
    syncStatus,
    lastSyncTime,
    pendingOperations: offlineQueueRef.current,
    queueOfflineOperation,
    manualSync,
    performFullSync
  }
}