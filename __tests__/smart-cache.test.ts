import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { SmartCache, useSmartCache, useBatchCache } from '../lib/utils/smart-cache'

describe('Smart Cache', () => {
  let cache: SmartCache

  beforeEach(() => {
    // Reset the singleton instance for each test
    (SmartCache as any).instance = null
    cache = SmartCache.getInstance()
  })

  describe('SmartCache', () => {
    it('should set and get cache entries', () => {
      cache.set('test-key', 'test-value', 1000)
      const value = cache.get('test-key')
      expect(value).toBe('test-value')
    })

    it('should return null for non-existent keys', () => {
      const value = cache.get('non-existent')
      expect(value).toBeNull()
    })

    it('should expire cache entries after TTL', () => {
      jest.useFakeTimers()
      cache.set('expiring-key', 'expiring-value', 1) // 1ms TTL
      jest.advanceTimersByTime(2) // Advance time by 2ms
      const value = cache.get('expiring-key')
      expect(value).toBeNull()
      jest.useRealTimers()
    })

    it('should delete cache entries', () => {
      cache.set('delete-key', 'delete-value')
      const deleted = cache.delete('delete-key')
      expect(deleted).toBe(true)
      const value = cache.get('delete-key')
      expect(value).toBeNull()
    })

    it('should invalidate cache by dependency', () => {
      cache.set('dep-key-1', 'value-1', 1000, ['dep1'])
      cache.set('dep-key-2', 'value-2', 1000, ['dep1', 'dep2'])
      cache.set('dep-key-3', 'value-3', 1000, ['dep3'])

      cache.invalidateByDependency('dep1')

      expect(cache.get('dep-key-1')).toBeNull()
      expect(cache.get('dep-key-2')).toBeNull()
      expect(cache.get('dep-key-3')).toBe('value-3')
    })

    it('should get cache statistics', () => {
      const stats = cache.getStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('totalRequests')
    })

    it('should clear all cache', () => {
      cache.set('key-1', 'value-1')
      cache.set('key-2', 'value-2')
      
      expect(cache.get('key-1')).toBe('value-1')
      expect(cache.get('key-2')).toBe('value-2')
      
      cache.clear()
      
      expect(cache.get('key-1')).toBeNull()
      expect(cache.get('key-2')).toBeNull()
    })

    it('should evict oldest entries when maxSize is exceeded', () => {
      // Reset the singleton instance with a small maxSize
      (SmartCache as any).instance = null
      const smallCache = SmartCache.getInstance({ maxSize: 2 })
      smallCache.set('key-1', 'value-1')
      smallCache.set('key-2', 'value-2')
      smallCache.set('key-3', 'value-3') // This should evict key-1
      
      expect(smallCache.get('key-1')).toBeNull()
      expect(smallCache.get('key-2')).toBe('value-2')
      expect(smallCache.get('key-3')).toBe('value-3')
    })
  })

  // Note: Testing React hooks like useSmartCache and useBatchCache would require
  // a more complex testing setup with React testing library and jest.useFakeTimers()
  // For simplicity, we're focusing on testing the underlying SmartCache class
})