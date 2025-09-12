"use client"

import { useEffect } from 'react'
import { startPeriodicCleanup } from '@/lib/data-cleanup'

export function DataCleanupProvider() {
  useEffect(() => {
    // 启动定期数据清理
    const cleanup = startPeriodicCleanup()
    
    // 组件卸载时清理定时器
    return cleanup
  }, [])

  return null
}
