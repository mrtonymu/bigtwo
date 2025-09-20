import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { EnhancedErrorHandler, ErrorCode, errorHandler, useErrorHandlerHook, ErrorHandler } from '../lib/utils/error-handler'
import toast from 'react-hot-toast'

// Mock toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn()
}))

describe('Enhanced Error Handler', () => {
  let consoleSpy: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Spy on console.error
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore console.error
    consoleSpy.mockRestore()
  })

  describe('Error Creation', () => {
    it('should create error with correct properties', () => {
      const error = errorHandler.createError(
        'Test error message',
        'error',
        ErrorCode.NETWORK_ERROR,
        { test: 'context' }
      )

      expect(error.message).toBe('Test error message')
      expect(error.level).toBe('error')
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(error.context).toEqual({ test: 'context' })
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Error Logging', () => {
    it('should log error to console', () => {
      const error = errorHandler.createError(
        'Test error',
        'error',
        ErrorCode.UNKNOWN_ERROR
      )

      errorHandler.logError(error)

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should handle generic errors', () => {
      const error = new Error('Generic error')
      const result = errorHandler.wrapSync(() => {
        throw error
      })

      expect(result).toBeNull()
    })

    it('should handle network errors', () => {
      const error = new Error('Network error: fetch failed')
      errorHandler.wrapSync(() => {
        throw error
      })

      // 使用ErrorHandler.handle来处理错误
      ErrorHandler.handle(error)
      expect(toast.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置')
    })

    it('should handle Supabase errors', () => {
      const error = new Error('PGRST error from Supabase')
      errorHandler.wrapSync(() => {
        throw error
      })

      // 使用ErrorHandler.handle来处理错误
      ErrorHandler.handle(error)
      expect(toast.error).toHaveBeenCalledWith('服务器连接失败，请稍后重试')
    })

    it('should handle existing AppErrors', () => {
      // Create a proper AppError
      const originalError = new Error('Custom message') as any
      originalError.code = ErrorCode.INVALID_INPUT
      originalError.context = undefined
      
      errorHandler.wrapSync(() => {
        throw originalError
      })

      // 使用ErrorHandler.handle来处理错误
      ErrorHandler.handle(originalError)
      expect(toast.error).toHaveBeenCalledWith('Custom message')
    })
  })

  describe('Error Recovery', () => {
    it('should attempt recovery for known error codes', async () => {
      const error = errorHandler.createError(
        'Network error',
        'error',
        'NETWORK_ERROR'
      )

      const result = await errorHandler.attemptRecovery(error)
      expect(result).toBe(true)
    })

    it('should not attempt recovery for unknown error codes', async () => {
      const error = errorHandler.createError(
        'Unknown error',
        'error',
        'UNKNOWN_CODE'
      )

      const result = await errorHandler.attemptRecovery(error)
      expect(result).toBe(false)
    })
  })

  describe('Async Operations', () => {
    it('should wrap async operations and handle errors', async () => {
      const operation = async () => {
        throw new Error('Async error')
      }

      const result = await errorHandler.wrapAsync(operation)
      expect(result).toBeNull()
    })

    it('should wrap async operations and return successful results', async () => {
      const operation = async () => {
        return 'success'
      }

      const result = await errorHandler.wrapAsync(operation)
      expect(result).toBe('success')
    })
  })

  describe('Sync Operations', () => {
    it('should wrap sync operations and handle errors', () => {
      const operation = () => {
        throw new Error('Sync error')
      }

      const result = errorHandler.wrapSync(operation)
      expect(result).toBeNull()
    })

    it('should wrap sync operations and return successful results', () => {
      const operation = () => {
        return 'success'
      }

      const result = errorHandler.wrapSync(operation)
      expect(result).toBe('success')
    })
  })

  describe('useErrorHandlerHook', () => {
    it('should provide error handling functions', () => {
      // This is a basic test since we can't fully test React hooks without a testing library
      const hook = useErrorHandlerHook()
      
      expect(typeof hook.handleError).toBe('function')
      expect(typeof hook.handleSupabaseError).toBe('function')
      expect(typeof hook.handleGameError).toBe('function')
      expect(typeof hook.handleNetworkError).toBe('function')
      expect(typeof hook.handleValidationError).toBe('function')
      expect(typeof hook.handleAuthError).toBe('function')
      expect(typeof hook.showSuccess).toBe('function')
      expect(typeof hook.showInfo).toBe('function')
      expect(typeof hook.showLoading).toBe('function')
      expect(typeof hook.dismissLoading).toBe('function')
    })
  })
})