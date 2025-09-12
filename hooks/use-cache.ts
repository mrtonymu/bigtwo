import { useState, useEffect, useCallback } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 100

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) { // 默认5分钟
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // 清理过期项
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

const cacheManager = new CacheManager()

// 定期清理过期缓存
setInterval(() => {
  cacheManager.cleanup()
}, 60000) // 每分钟清理一次

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    enabled?: boolean
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { ttl = 5 * 60 * 1000, enabled = true } = options

  const fetchData = useCallback(async () => {
    if (!enabled) return

    // 先检查缓存
    const cachedData = cacheManager.get<T>(key)
    if (cachedData) {
      setData(cachedData)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      cacheManager.set(key, result, ttl)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [key, fetcher, ttl, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const invalidate = useCallback(() => {
    cacheManager.delete(key)
    fetchData()
  }, [key, fetchData])

  const mutate = useCallback((newData: T) => {
    setData(newData)
    cacheManager.set(key, newData, ttl)
  }, [key, ttl])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidate,
    mutate
  }
}

export { cacheManager }
