"use client"

import { Button } from '@/components/ui/button'

interface NetworkStatusIndicatorProps {
  networkStatus: 'online' | 'offline' | 'unstable'
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'failed'
  onManualSync: () => void
}

/**
 * 网络状态指示器组件
 * 显示当前网络连接和同步状态
 */
export function NetworkStatusIndicator({ 
  networkStatus, 
  syncStatus, 
  onManualSync 
}: NetworkStatusIndicatorProps) {
  const getStatusColor = () => {
    if (networkStatus === 'offline') return 'text-red-500'
    if (networkStatus === 'unstable' || syncStatus === 'syncing') return 'text-yellow-500'
    if (syncStatus === 'failed') return 'text-red-500'
    return 'text-green-500'
  }

  const getStatusText = () => {
    if (networkStatus === 'offline') return '离线'
    if (syncStatus === 'syncing') return '同步中...'
    if (syncStatus === 'failed') return '同步失败'
    if (networkStatus === 'unstable') return '网络不稳定'
    return '已连接'
  }

  const getStatusIcon = () => {
    if (networkStatus === 'offline') return '🔴'
    if (syncStatus === 'syncing') return '🔄'
    if (syncStatus === 'failed') return '❌'
    if (networkStatus === 'unstable') return '🟡'
    return '🟢'
  }

  return (
    <div className={`flex items-center gap-2 ${getStatusColor()}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')} ${
        syncStatus === 'syncing' ? 'animate-pulse' : ''
      }`} />
      <span className="text-xs font-medium">{getStatusIcon()} {getStatusText()}</span>
      {(syncStatus === 'failed' || networkStatus === 'unstable') && (
        <button 
          onClick={onManualSync}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="手动重连"
        >
          重连
        </button>
      )}
    </div>
  )
}