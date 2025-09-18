"use client"

import { useState, useEffect } from 'react'
import { useNetworkOptimization } from '@/hooks/use-network-optimization'
import { NetworkStatusIndicator } from '@/components/network-status-indicator'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Wifi, WifiOff, Clock } from 'lucide-react'
import { ErrorHandler } from '@/lib/utils/error-handler'
import { GameSyncData } from '@/lib/types/game'

interface GameNetworkManagerProps {
  gameId: string
  playerId: string
  onGameSync?: (data: GameSyncData) => void
  onNetworkIssue?: (issue: string) => void
}

export function GameNetworkManager({ 
  gameId, 
  playerId, 
  onGameSync,
  onNetworkIssue 
}: GameNetworkManagerProps) {
  const [showDetailedStatus, setShowDetailedStatus] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastIssueTime, setLastIssueTime] = useState<number | null>(null)

  const {
    networkStatus,
    syncStatus,
    lastSyncTime,
    pendingOperations,
    queueOfflineOperation,
    manualSync,
    performFullSync
  } = useNetworkOptimization({
    gameId,
    playerId,
    onSync: (data) => {
      onGameSync?.(data)
      setReconnectAttempts(0) // 重置重连计数
      ErrorHandler.showSuccess('游戏数据已同步', '🔄')
    },
    onConflict: (localData, serverData) => {
      ErrorHandler.showError(new Error('检测到数据冲突，正在解决...'), '数据冲突')
      onNetworkIssue?.('数据冲突')
      return serverData // 简单策略：优先使用服务器数据
    },
    maxRetries: 5,
    syncInterval: 3000 // 游戏中更频繁的同步
  })

  // 监听网络状态变化
  useEffect(() => {
    if (networkStatus === 'offline') {
      setLastIssueTime(Date.now())
      onNetworkIssue?.('网络断开')
      ErrorHandler.showError(new Error('网络连接断开，游戏将在后台继续'), '网络状态')
    } else if (networkStatus === 'unstable') {
      onNetworkIssue?.('网络不稳定')
      ErrorHandler.showInfo('网络连接不稳定，正在优化...', '⚠️')
    }
  }, [networkStatus, onNetworkIssue])

  // 监听同步状态
  useEffect(() => {
    if (syncStatus === 'failed') {
      setReconnectAttempts(prev => prev + 1)
      setLastIssueTime(Date.now())
      onNetworkIssue?.('同步失败')
    }
  }, [syncStatus, onNetworkIssue])

  const handleManualReconnect = async () => {
    const loadingToast = ErrorHandler.showLoading('正在重新连接...')
    try {
      await manualSync()
      ErrorHandler.dismissLoading(loadingToast)
      ErrorHandler.showSuccess('重连成功！')
    } catch (error) {
      ErrorHandler.dismissLoading(loadingToast)
      ErrorHandler.showError(error, '重连失败')
    }
  }

  const getTimeSinceLastSync = () => {
    const timeDiff = Date.now() - lastSyncTime
    const seconds = Math.floor(timeDiff / 1000)
    if (seconds < 60) return `${seconds}秒前`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}分钟前`
  }

  const getConnectionQuality = () => {
    if (networkStatus === 'offline') return { color: 'red', text: '离线', icon: <WifiOff className="h-4 w-4" /> }
    if (networkStatus === 'unstable') return { color: 'yellow', text: '不稳定', icon: <AlertTriangle className="h-4 w-4" /> }
    if (syncStatus === 'syncing') return { color: 'blue', text: '同步中', icon: <Wifi className="h-4 w-4 animate-pulse" /> }
    if (syncStatus === 'failed') return { color: 'red', text: '同步失败', icon: <AlertTriangle className="h-4 w-4" /> }
    return { color: 'green', text: '良好', icon: <Wifi className="h-4 w-4" /> }
  }

  const quality = getConnectionQuality()

  // 紧凑模式显示（游戏进行时）
  if (!showDetailedStatus) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div 
          className="flex items-center gap-2 px-3 py-2 bg-white shadow-lg rounded-lg border cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setShowDetailedStatus(true)}
        >
          <div className={`text-${quality.color}-500`}>
            {quality.icon}
          </div>
          <span className="text-sm font-medium">{quality.text}</span>
          {pendingOperations.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingOperations.length}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  // 详细状态面板
  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-80 shadow-xl">
        <CardContent className="p-4 space-y-3">
          {/* 头部 */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm">网络状态</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDetailedStatus(false)}
            >
              ✕
            </Button>
          </div>

          {/* 主要状态指示器 */}
          <NetworkStatusIndicator 
            networkStatus={networkStatus}
            syncStatus={syncStatus}
            onManualSync={handleManualReconnect}
          />

          {/* 详细信息 */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">最后同步:</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {getTimeSinceLastSync()}
              </span>
            </div>
            
            {pendingOperations.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">待处理操作:</span>
                <Badge variant="secondary">{pendingOperations.length}</Badge>
              </div>
            )}

            {reconnectAttempts > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">重连次数:</span>
                <span className="text-orange-600">{reconnectAttempts}</span>
              </div>
            )}

            {lastIssueTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">上次问题:</span>
                <span className="text-red-600">
                  {Math.floor((Date.now() - lastIssueTime) / 1000)}秒前
                </span>
              </div>
            )}
          </div>

          {/* 网络优化提示 */}
          {networkStatus !== 'online' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <div className="font-medium text-yellow-800 mb-1">网络优化已启用</div>
              <div className="text-yellow-700">
                • 您的操作已缓存，网络恢复后将自动同步<br/>
                • 游戏状态会定期检查更新<br/>
                • 如有冲突将优先使用最新数据
              </div>
            </div>
          )}

          {/* 手动操作按钮 */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleManualReconnect}
              disabled={syncStatus === 'syncing'}
              className="flex-1"
            >
              {syncStatus === 'syncing' ? '同步中...' : '立即同步'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={performFullSync}
              disabled={syncStatus === 'syncing'}
              className="flex-1"
            >
              完整同步
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}