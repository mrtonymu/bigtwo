'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { connectionPool } from '@/lib/utils/connection-pool'
import { requestDeduplicator } from '@/lib/utils/request-deduplicator'

interface PerformanceMetrics {
  networkLatency: number
  memoryUsage: {
    used: number
    total: number
  }
  connectionPool: {
    total: number
    inUse: number
    idle: number
    utilizationRate: string
  }
  requestCache: {
    cacheSize: number
    pendingRequests: number
  }
  lastUpdated: number
}

interface PerformanceMonitorProps {
  gameId?: string
  className?: string
}

export function PerformanceMonitor({ gameId, className }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 测量网络延迟
  const measureNetworkLatency = async (): Promise<number> => {
    const start = performance.now()
    try {
      await fetch('/api/test-supabase')
      const end = performance.now()
      return end - start
    } catch {
      return -1
    }
  }

  // 获取内存使用情况（浏览器环境的近似值）
  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024)
      }
    }
    return { used: 0, total: 0 }
  }

  // 收集性能指标
  const collectMetrics = async () => {
    setIsLoading(true)
    try {
      const [latency] = await Promise.all([
        measureNetworkLatency()
      ])

      const poolStats = connectionPool.getStats()
      const cacheStats = requestDeduplicator.getStats()
      const memoryUsage = getMemoryUsage()

      setMetrics({
        networkLatency: latency,
        memoryUsage,
        connectionPool: poolStats,
        requestCache: cacheStats,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error('收集性能指标失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 定期更新指标
  useEffect(() => {
    if (!isVisible) return

    collectMetrics()
    const interval = setInterval(collectMetrics, 5000) // 每5秒更新

    return () => clearInterval(interval)
  }, [isVisible])

  // 获取延迟状态
  const getLatencyStatus = (latency: number) => {
    if (latency < 0) return { color: 'destructive', text: '离线' }
    if (latency < 100) return { color: 'default', text: '优秀' }
    if (latency < 300) return { color: 'secondary', text: '良好' }
    return { color: 'destructive', text: '较慢' }
  }

  // 获取内存使用状态
  const getMemoryStatus = (used: number, total: number) => {
    if (total === 0) return { color: 'secondary', text: '未知' }
    const usage = (used / total) * 100
    if (usage < 50) return { color: 'default', text: '正常' }
    if (usage < 80) return { color: 'secondary', text: '中等' }
    return { color: 'destructive', text: '较高' }
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={className}
      >
        📊 性能监控
      </Button>
    )
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">性能监控</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={collectMetrics}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔄'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {metrics ? (
          <>
            {/* 网络延迟 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">网络延迟</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {metrics.networkLatency >= 0 ? `${metrics.networkLatency.toFixed(0)}ms` : '离线'}
                </span>
                <Badge variant={getLatencyStatus(metrics.networkLatency).color as any}>
                  {getLatencyStatus(metrics.networkLatency).text}
                </Badge>
              </div>
            </div>

            {/* 内存使用 */}
            {metrics.memoryUsage.total > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">内存使用</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">
                    {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB
                  </span>
                  <Badge variant={getMemoryStatus(metrics.memoryUsage.used, metrics.memoryUsage.total).color as any}>
                    {getMemoryStatus(metrics.memoryUsage.used, metrics.memoryUsage.total).text}
                  </Badge>
                </div>
              </div>
            )}

            {/* 连接池状态 */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">连接池</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>总连接:</span>
                  <span className="font-mono">{metrics.connectionPool.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>使用中:</span>
                  <span className="font-mono">{metrics.connectionPool.inUse}</span>
                </div>
                <div className="flex justify-between">
                  <span>空闲:</span>
                  <span className="font-mono">{metrics.connectionPool.idle}</span>
                </div>
                <div className="flex justify-between">
                  <span>利用率:</span>
                  <span className="font-mono">{metrics.connectionPool.utilizationRate}</span>
                </div>
              </div>
            </div>

            {/* 请求缓存 */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">请求缓存</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>缓存条目:</span>
                  <span className="font-mono">{metrics.requestCache.cacheSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>待处理:</span>
                  <span className="font-mono">{metrics.requestCache.pendingRequests}</span>
                </div>
              </div>
            </div>

            {/* 更新时间 */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              更新时间: {new Date(metrics.lastUpdated).toLocaleTimeString()}
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            {isLoading ? '正在收集性能数据...' : '点击刷新按钮获取性能数据'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PerformanceMonitor