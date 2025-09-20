// lib/utils/smart-cache.ts
// 智能数据缓存机制
import { useState, useEffect } from 'react';

// 缓存条目接口
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // 过期时间（毫秒）
  dependencies?: string[]; // 依赖项列表
}

// 缓存配置接口
export interface CacheConfig {
  ttl?: number; // 默认过期时间（毫秒）
  maxSize?: number; // 最大缓存条目数
  enableLogging?: boolean; // 是否启用日志
}

// 默认配置
const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 100,
  enableLogging: false,
};

// 智能缓存类
export class SmartCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private static instance: SmartCache;

  private constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupInterval();
  }

  // 获取单例实例
  static getInstance(config?: CacheConfig): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache(config);
    }
    return SmartCache.instance;
  }

  // 设置缓存项
  set<T>(key: string, data: T, ttl?: number, dependencies?: string[]): void {
    const expiry = Date.now() + (ttl || this.config.ttl || DEFAULT_CONFIG.ttl!);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
      dependencies,
    });

    // 检查是否超过最大大小
    if (this.cache.size > (this.config.maxSize || DEFAULT_CONFIG.maxSize!)) {
      this.evictOldest();
    }

    if (this.config.enableLogging) {
      console.log(`[SmartCache] Set cache for key: ${key}, expiry: ${new Date(expiry).toISOString()}`);
    }
  }

  // 获取缓存项
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.config.enableLogging) {
        console.log(`[SmartCache] Cache miss for key: ${key}`);
      }
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      if (this.config.enableLogging) {
        console.log(`[SmartCache] Cache expired for key: ${key}`);
      }
      return null;
    }

    if (this.config.enableLogging) {
      console.log(`[SmartCache] Cache hit for key: ${key}`);
    }
    
    return entry.data;
  }

  // 删除缓存项
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result && this.config.enableLogging) {
      console.log(`[SmartCache] Deleted cache for key: ${key}`);
    }
    return result;
  }

  // 清除所有缓存
  clear(): void {
    this.cache.clear();
    if (this.config.enableLogging) {
      console.log(`[SmartCache] Cleared all cache`);
    }
  }

  // 根据依赖项清除缓存
  invalidateByDependency(dependency: string): void {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies && entry.dependencies.includes(dependency)) {
        this.cache.delete(key);
        invalidatedCount++;
        
        if (this.config.enableLogging) {
          console.log(`[SmartCache] Invalidated cache for key: ${key} due to dependency: ${dependency}`);
        }
      }
    }
    
    if (this.config.enableLogging) {
      console.log(`[SmartCache] Invalidated ${invalidatedCount} entries due to dependency: ${dependency}`);
    }
  }

  // 获取缓存统计信息
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalRequests: number;
  } {
    // 这里可以实现更详细的统计信息
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize || DEFAULT_CONFIG.maxSize!,
      hitRate: 0, // 需要实现请求计数才能计算命中率
      totalRequests: 0,
    };
  }

  // 清理过期条目
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0 && this.config.enableLogging) {
      console.log(`[SmartCache] Cleaned up ${cleanedCount} expired entries`);
    }
  }

  // 驱逐最旧的条目
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.config.enableLogging) {
        console.log(`[SmartCache] Evicted oldest entry: ${oldestKey}`);
      }
    }
  }

  // 启动定期清理间隔
  private startCleanupInterval(): void {
    // 每分钟清理一次过期条目
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }
}

// 创建全局缓存实例
export const smartCache = SmartCache.getInstance();

// React Hook: 使用智能缓存
export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
  dependencies?: string[]
): {
  data: T | null;
  loading: boolean;
  error: any;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 首先检查缓存
      const cachedData = smartCache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // 如果缓存中没有，则获取新数据
      const freshData = await fetcher();
      smartCache.set(key, freshData, ttl, dependencies);
      setData(freshData);
    } catch (err) {
      setError(err);
      console.error(`[useSmartCache] Error fetching data for key: ${key}`, err);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const refresh = async () => {
    try {
      const freshData = await fetcher();
      smartCache.set(key, freshData, ttl, dependencies);
      setData(freshData);
    } catch (err) {
      setError(err);
      console.error(`[useSmartCache] Error refreshing data for key: ${key}`, err);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchData();
  }, [key]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

// React Hook: 批量缓存处理
export function useBatchCache<T>(
  keys: string[],
  fetchers: Array<() => Promise<T>>,
  ttl?: number
): {
  data: Record<string, T>;
  loading: boolean;
  errors: Record<string, any>;
  refreshAll: () => Promise<void>;
} {
  const [data, setData] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, any>>({});

  // 获取所有数据
  const fetchAllData = async () => {
    setLoading(true);
    const newData: Record<string, T> = {};
    const newErrors: Record<string, any> = {};

    try {
      // 并行获取所有数据
      const promises = keys.map(async (key, index) => {
        try {
          // 首先检查缓存
          const cachedData = smartCache.get<T>(key);
          if (cachedData) {
            newData[key] = cachedData;
            return;
          }

          // 如果缓存中没有，则获取新数据
          const freshData = await fetchers[index]();
          smartCache.set(key, freshData, ttl);
          newData[key] = freshData;
        } catch (err) {
          newErrors[key] = err;
          console.error(`[useBatchCache] Error fetching data for key: ${key}`, err);
        }
      });

      await Promise.all(promises);
      setData(newData);
      setErrors(newErrors);
    } catch (err) {
      console.error('[useBatchCache] Error fetching batch data', err);
    } finally {
      setLoading(false);
    }
  };

  // 刷新所有数据
  const refreshAll = async () => {
    const newData: Record<string, T> = {};
    const newErrors: Record<string, any> = {};

    try {
      const promises = keys.map(async (key, index) => {
        try {
          const freshData = await fetchers[index]();
          smartCache.set(key, freshData, ttl);
          newData[key] = freshData;
        } catch (err) {
          newErrors[key] = err;
          console.error(`[useBatchCache] Error refreshing data for key: ${key}`, err);
        }
      });

      await Promise.all(promises);
      setData(newData);
      setErrors(newErrors);
    } catch (err) {
      console.error('[useBatchCache] Error refreshing batch data', err);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchAllData();
  }, [keys.join(',')]);

  return {
    data,
    loading,
    errors,
    refreshAll,
  };
}

