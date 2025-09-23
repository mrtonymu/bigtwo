// 连接池管理器 - 优化数据库连接性能
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface ConnectionPoolConfig {
  maxConnections: number
  idleTimeout: number // 空闲超时时间（毫秒）
  connectionTimeout: number // 连接超时时间（毫秒）
  retryAttempts: number
}

interface PooledConnection {
  client: SupabaseClient
  lastUsed: number
  inUse: boolean
  id: string
}

export class ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map()
  private config: ConnectionPoolConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: 5,
      idleTimeout: 30000, // 30秒
      connectionTimeout: 10000, // 10秒
      retryAttempts: 3,
      ...config
    }

    this.startCleanupProcess()
  }

  /**
   * 获取可用连接
   */
  async getConnection(): Promise<SupabaseClient> {
    // 查找空闲连接
    for (const [id, conn] of this.connections) {
      if (!conn.inUse) {
        conn.inUse = true
        conn.lastUsed = Date.now()
        console.log(`🔄 复用连接: ${id}`)
        return conn.client
      }
    }

    // 如果没有空闲连接且未达到最大连接数，创建新连接
    if (this.connections.size < this.config.maxConnections) {
      return this.createNewConnection()
    }

    // 等待连接释放
    return this.waitForConnection()
  }

  /**
   * 释放连接
   */
  releaseConnection(client: SupabaseClient): void {
    for (const [id, conn] of this.connections) {
      if (conn.client === client) {
        conn.inUse = false
        conn.lastUsed = Date.now()
        console.log(`✅ 释放连接: ${id}`)
        return
      }
    }
  }

  /**
   * 创建新连接
   */
  private createNewConnection(): SupabaseClient {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10 // 限制事件频率
          }
        },
        db: {
          schema: 'public'
        }
      }
    )

    const connection: PooledConnection = {
      client,
      lastUsed: Date.now(),
      inUse: true,
      id
    }

    this.connections.set(id, connection)
    console.log(`🆕 创建新连接: ${id} (总数: ${this.connections.size})`)
    
    return client
  }

  /**
   * 等待连接可用
   */
  private async waitForConnection(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const checkForConnection = () => {
        // 检查是否有空闲连接
        for (const [id, conn] of this.connections) {
          if (!conn.inUse) {
            conn.inUse = true
            conn.lastUsed = Date.now()
            console.log(`⏳ 等待后获得连接: ${id}`)
            resolve(conn.client)
            return
          }
        }

        // 检查超时
        if (Date.now() - startTime > this.config.connectionTimeout) {
          reject(new Error('连接池获取连接超时'))
          return
        }

        // 继续等待
        setTimeout(checkForConnection, 100)
      }

      checkForConnection()
    })
  }

  /**
   * 启动清理进程
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections()
    }, 10000) // 每10秒清理一次
  }

  /**
   * 清理空闲连接
   */
  private cleanupIdleConnections(): void {
    const now = Date.now()
    const toRemove: string[] = []

    for (const [id, conn] of this.connections) {
      if (!conn.inUse && (now - conn.lastUsed) > this.config.idleTimeout) {
        toRemove.push(id)
      }
    }

    for (const id of toRemove) {
      this.connections.delete(id)
      console.log(`🗑️ 清理空闲连接: ${id}`)
    }

    if (toRemove.length > 0) {
      console.log(`🧹 清理完成，剩余连接: ${this.connections.size}`)
    }
  }

  /**
   * 获取连接池统计信息
   */
  getStats() {
    const total = this.connections.size
    const inUse = Array.from(this.connections.values()).filter(conn => conn.inUse).length
    const idle = total - inUse

    return {
      total,
      inUse,
      idle,
      maxConnections: this.config.maxConnections,
      utilizationRate: total > 0 ? (inUse / total * 100).toFixed(1) + '%' : '0%'
    }
  }

  /**
   * 关闭连接池
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // 关闭所有连接
    for (const [id, conn] of this.connections) {
      // Supabase客户端没有显式的close方法，但我们可以清理引用
      console.log(`🔌 关闭连接: ${id}`)
    }

    this.connections.clear()
    console.log('💀 连接池已销毁')
  }
}

// 全局连接池实例
export const connectionPool = new ConnectionPool({
  maxConnections: 3, // 适合小型多人游戏
  idleTimeout: 60000, // 1分钟
  connectionTimeout: 5000, // 5秒
  retryAttempts: 2
})

/**
 * 使用连接池的Hook
 */
export function usePooledConnection() {
  const getConnection = async () => {
    return connectionPool.getConnection()
  }

  const releaseConnection = (client: SupabaseClient) => {
    connectionPool.releaseConnection(client)
  }

  const getPoolStats = () => {
    return connectionPool.getStats()
  }

  return {
    getConnection,
    releaseConnection,
    getPoolStats
  }
}

/**
 * 带连接池的操作包装器
 */
export async function withPooledConnection<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await connectionPool.getConnection()
  
  try {
    const result = await operation(client)
    return result
  } finally {
    connectionPool.releaseConnection(client)
  }
}