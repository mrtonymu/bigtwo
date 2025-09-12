import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ReconnectOptions {
  onReconnect?: () => void
  onDisconnect?: () => void
  maxRetries?: number
  retryDelay?: number
}

export function useReconnect(options: ReconnectOptions = {}) {
  const [isConnected, setIsConnected] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  
  const {
    onReconnect,
    onDisconnect,
    maxRetries = 5,
    retryDelay = 2000
  } = options

  const supabase = createClient()

  const checkConnection = useCallback(async () => {
    try {
      // 简单的连接测试
      const { error } = await supabase
        .from('games')
        .select('id')
        .limit(1)
      
      if (error) throw error
      
      if (!isConnected) {
        setIsConnected(true)
        setRetryCount(0)
        setIsReconnecting(false)
        toast.success('连接已恢复')
        onReconnect?.()
      }
    } catch (error) {
      if (isConnected) {
        setIsConnected(false)
        onDisconnect?.()
        toast.error('连接断开，正在尝试重连...')
      }
      
      if (retryCount < maxRetries) {
        setIsReconnecting(true)
        setRetryCount(prev => prev + 1)
        
        setTimeout(() => {
          checkConnection()
        }, retryDelay * Math.pow(2, retryCount)) // 指数退避
      } else {
        setIsReconnecting(false)
        toast.error('重连失败，请刷新页面')
      }
    }
  }, [isConnected, retryCount, maxRetries, retryDelay, onReconnect, onDisconnect, supabase])

  useEffect(() => {
    // 定期检查连接状态
    const interval = setInterval(checkConnection, 10000) // 每10秒检查一次
    
    // 监听网络状态
    const handleOnline = () => {
      if (!isConnected) {
        checkConnection()
      }
    }
    
    const handleOffline = () => {
      setIsConnected(false)
      onDisconnect?.()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection, isConnected, onDisconnect])

  const manualReconnect = useCallback(() => {
    setRetryCount(0)
    setIsReconnecting(true)
    checkConnection()
  }, [checkConnection])

  return {
    isConnected,
    isReconnecting,
    retryCount,
    manualReconnect
  }
}
