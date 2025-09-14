// 数据库操作优化系统
import { useCallback, useRef, useEffect } from 'react'

// 防抖功能
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout
  
  const debouncedFunc = ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T & { cancel: () => void }
  
  debouncedFunc.cancel = () => {
    clearTimeout(timeoutId)
  }
  
  return debouncedFunc
}

// 节流功能
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0
  
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }) as T
}

// 批量操作管理器
export class BatchOperationManager<T> {
  private operations: T[] = []
  private timer: NodeJS.Timeout | null = null
  private readonly batchSize: number
  private readonly delay: number
  private readonly processor: (batch: T[]) => Promise<void>

  constructor(
    processor: (batch: T[]) => Promise<void>,
    options: {
      batchSize?: number
      delay?: number
    } = {}
  ) {
    this.processor = processor
    this.batchSize = options.batchSize || 10
    this.delay = options.delay || 1000
  }

  // 添加操作到批次
  add(operation: T): void {
    this.operations.push(operation)
    
    // 如果达到批次大小，立即处理
    if (this.operations.length >= this.batchSize) {
      this.flush()
    } else {
      // 否则设置定时器
      this.scheduleFlush()
    }
  }

  // 安排刷新
  private scheduleFlush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    
    this.timer = setTimeout(() => {
      this.flush()
    }, this.delay)
  }

  // 立即处理所有待处理操作
  private async flush(): Promise<void> {
    if (this.operations.length === 0) return
    
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    const batch = [...this.operations]
    this.operations = []
    
    try {
      await this.processor(batch)
    } catch (error) {
      console.error('Batch operation failed:', error)
      // 可以选择重试或记录失败的操作
    }
  }

  // 强制刷新
  async forceFlush(): Promise<void> {
    await this.flush()
  }

  // 获取待处理操作数量
  getPendingCount(): number {
    return this.operations.length
  }
}

// 数据缓存管理器
export class DataCacheManager<K, V> {
  private cache = new Map<K, { data: V; timestamp: number; ttl: number }>()
  private readonly defaultTTL: number

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5分钟默认TTL
    this.defaultTTL = defaultTTL
  }

  // 设置缓存
  set(key: K, value: V, ttl?: number): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  // 获取缓存
  get(key: K): V | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  // 删除缓存
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 获取缓存统计
  getStats() {
    const now = Date.now()
    let valid = 0
    let expired = 0
    
    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++
      } else {
        valid++
      }
    }
    
    return { valid, expired, total: this.cache.size }
  }
}

// React Hook: 防抖数据库保存
export function useDebouncedSave<T>(
  saveFunction: (data: T) => Promise<void>,
  delay: number = 1000
) {
  const debouncedSave = useRef(
    debounce(async (data: T) => {
      try {
        await saveFunction(data)
      } catch (error) {
        console.error('Debounced save failed:', error)
      }
    }, delay)
  )

  // 清理定时器
  useEffect(() => {
    return () => {
      debouncedSave.current.cancel()
    }
  }, [])

  return debouncedSave.current
}

// React Hook: 批量操作
export function useBatchOperation<T>(
  processor: (batch: T[]) => Promise<void>,
  options?: {
    batchSize?: number
    delay?: number
  }
) {
  const manager = useRef(new BatchOperationManager(processor, options))

  // 清理操作
  useEffect(() => {
    return () => {
      manager.current.forceFlush()
    }
  }, [])

  return {
    add: (operation: T) => manager.current.add(operation),
    flush: () => manager.current.forceFlush(),
    getPendingCount: () => manager.current.getPendingCount()
  }
}

// React Hook: 数据缓存
export function useDataCache<K, V>(defaultTTL?: number) {
  const cache = useRef(new DataCacheManager<K, V>(defaultTTL))

  // 定期清理过期缓存
  useEffect(() => {
    const interval = setInterval(() => {
      cache.current.cleanup()
    }, 60000) // 每分钟清理一次

    return () => clearInterval(interval)
  }, [])

  return {
    set: (key: K, value: V, ttl?: number) => cache.current.set(key, value, ttl),
    get: (key: K) => cache.current.get(key),
    delete: (key: K) => cache.current.delete(key),
    clear: () => cache.current.clear(),
    getStats: () => cache.current.getStats()
  }
}

// 智能数据同步器
export class SmartDataSynchronizer<T> {
  private lastSavedData: string | null = null
  private saveFunction: (data: T) => Promise<void>
  private debouncedSave: ReturnType<typeof debounce>
  
  constructor(
    saveFunction: (data: T) => Promise<void>,
    delay: number = 1000
  ) {
    this.saveFunction = saveFunction
    this.debouncedSave = debounce(this.performSave.bind(this), delay)
  }

  // 智能保存 - 只在数据真正改变时保存
  save(data: T): void {
    const serializedData = JSON.stringify(data)
    
    // 如果数据没有变化，跳过保存
    if (this.lastSavedData === serializedData) {
      return
    }
    
    this.debouncedSave(data)
  }

  // 强制保存
  async forceSave(data: T): Promise<void> {
    this.debouncedSave.cancel()
    await this.performSave(data)
  }

  private async performSave(data: T): Promise<void> {
    try {
      await this.saveFunction(data)
      this.lastSavedData = JSON.stringify(data)
    } catch (error) {
      console.error('Smart save failed:', error)
      throw error
    }
  }

  // 取消待处理的保存
  cancel(): void {
    this.debouncedSave.cancel()
  }
}

// React Hook: 智能数据同步
export function useSmartDataSync<T>(
  saveFunction: (data: T) => Promise<void>,
  delay?: number
) {
  const synchronizer = useRef(new SmartDataSynchronizer(saveFunction, delay))

  useEffect(() => {
    return () => {
      synchronizer.current.cancel()
    }
  }, [])

  return {
    save: (data: T) => synchronizer.current.save(data),
    forceSave: (data: T) => synchronizer.current.forceSave(data),
    cancel: () => synchronizer.current.cancel()
  }
}