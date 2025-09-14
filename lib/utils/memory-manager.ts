// 内存管理和清理机制
import { useEffect, useRef, useCallback } from 'react'

// 计时器管理器
export class TimerManager {
  private timers = new Set<NodeJS.Timeout>()
  private intervals = new Set<NodeJS.Timeout>()

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      callback()
    }, delay)
    this.timers.add(timer)
    return timer
  }

  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay)
    this.intervals.add(interval)
    return interval
  }

  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer)
    this.timers.delete(timer)
  }

  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval)
    this.intervals.delete(interval)
  }

  clearAll(): void {
    // 清理所有定时器
    this.timers.forEach(timer => clearTimeout(timer))
    this.intervals.forEach(interval => clearInterval(interval))
    
    this.timers.clear()
    this.intervals.clear()
  }

  getActiveCount(): { timers: number; intervals: number } {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size
    }
  }
}

// 事件监听器管理器
export class EventListenerManager {
  private listeners = new Map<EventTarget, Array<{
    event: string
    listener: EventListenerOrEventListenerObject
    options?: boolean | AddEventListenerOptions
  }>>()

  addEventListener(
    target: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(event, listener, options)

    if (!this.listeners.has(target)) {
      this.listeners.set(target, [])
    }
    
    this.listeners.get(target)!.push({ event, listener, options })
  }

  removeEventListener(
    target: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    target.removeEventListener(event, listener)

    const targetListeners = this.listeners.get(target)
    if (targetListeners) {
      const index = targetListeners.findIndex(
        item => item.event === event && item.listener === listener
      )
      if (index !== -1) {
        targetListeners.splice(index, 1)
      }

      if (targetListeners.length === 0) {
        this.listeners.delete(target)
      }
    }
  }

  clearAll(): void {
    this.listeners.forEach((listeners, target) => {
      listeners.forEach(({ event, listener }) => {
        target.removeEventListener(event, listener)
      })
    })
    this.listeners.clear()
  }

  getActiveCount(): number {
    let count = 0
    this.listeners.forEach(listeners => {
      count += listeners.length
    })
    return count
  }
}

// WebSocket 连接管理器
export class WebSocketManager {
  private connections = new Set<WebSocket>()

  add(ws: WebSocket): void {
    this.connections.add(ws)
    
    // 当连接关闭时自动移除
    const originalClose = ws.close.bind(ws)
    ws.close = (code?: number, reason?: string) => {
      this.connections.delete(ws)
      originalClose(code, reason)
    }
  }

  remove(ws: WebSocket): void {
    this.connections.delete(ws)
  }

  closeAll(): void {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    })
    this.connections.clear()
  }

  getActiveCount(): number {
    return this.connections.size
  }
}

// Supabase 订阅管理器
export class SupabaseSubscriptionManager {
  private subscriptions = new Set<{ unsubscribe: () => void }>()

  add(subscription: { unsubscribe: () => void }): void {
    this.subscriptions.add(subscription)
  }

  remove(subscription: { unsubscribe: () => void }): void {
    this.subscriptions.delete(subscription)
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe()
      } catch (error) {
        console.warn('Error unsubscribing:', error)
      }
    })
    this.subscriptions.clear()
  }

  getActiveCount(): number {
    return this.subscriptions.size
  }
}

// 统一资源管理器
export class ResourceManager {
  private timerManager = new TimerManager()
  private eventManager = new EventListenerManager()
  private wsManager = new WebSocketManager()
  private subscriptionManager = new SupabaseSubscriptionManager()

  get timers() {
    return this.timerManager
  }

  get events() {
    return this.eventManager
  }

  get websockets() {
    return this.wsManager
  }

  get subscriptions() {
    return this.subscriptionManager
  }

  cleanup(): void {
    this.timerManager.clearAll()
    this.eventManager.clearAll()
    this.wsManager.closeAll()
    this.subscriptionManager.unsubscribeAll()
  }

  getResourceStats() {
    return {
      timers: this.timerManager.getActiveCount(),
      events: this.eventManager.getActiveCount(),
      websockets: this.wsManager.getActiveCount(),
      subscriptions: this.subscriptionManager.getActiveCount()
    }
  }
}

// React Hook: 使用资源管理器
export function useResourceManager() {
  const managerRef = useRef<ResourceManager>()

  if (!managerRef.current) {
    managerRef.current = new ResourceManager()
  }

  useEffect(() => {
    const manager = managerRef.current!

    return () => {
      manager.cleanup()
    }
  }, [])

  return managerRef.current
}

// React Hook: 安全的定时器
export function useSafeTimer() {
  const manager = useResourceManager()

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    return manager.timers.setTimeout(callback, delay)
  }, [manager])

  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    return manager.timers.setInterval(callback, delay)
  }, [manager])

  const safeClearTimeout = useCallback((timer: NodeJS.Timeout) => {
    manager.timers.clearTimeout(timer)
  }, [manager])

  const safeClearInterval = useCallback((interval: NodeJS.Timeout) => {
    manager.timers.clearInterval(interval)
  }, [manager])

  return {
    setTimeout: safeSetTimeout,
    setInterval: safeSetInterval,
    clearTimeout: safeClearTimeout,
    clearInterval: safeClearInterval
  }
}

// React Hook: 安全的事件监听
export function useSafeEventListener() {
  const manager = useResourceManager()

  const addEventListener = useCallback((
    target: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    manager.events.addEventListener(target, event, listener, options)
  }, [manager])

  const removeEventListener = useCallback((
    target: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject
  ) => {
    manager.events.removeEventListener(target, event, listener)
  }, [manager])

  return {
    addEventListener,
    removeEventListener
  }
}

// React Hook: 安全的 Supabase 订阅
export function useSafeSupabaseSubscription() {
  const manager = useResourceManager()

  const addSubscription = useCallback((subscription: { unsubscribe: () => void }) => {
    manager.subscriptions.add(subscription)
    return subscription
  }, [manager])

  return {
    addSubscription
  }
}