// 增强的错误处理模块
import { ErrorHandler, ErrorCode, AppError } from '@/lib/utils/error-handler'
import { toast } from 'react-hot-toast'

// 错误日志级别
export enum ErrorLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

// 错误日志条目
interface ErrorLogEntry {
  id: string
  timestamp: number
  level: ErrorLogLevel
  code: ErrorCode
  message: string
  context?: string
  details?: any
  stack?: string
  userId?: string
  sessionId?: string
}

// 错误恢复策略
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  SKIP = 'SKIP',
  ABORT = 'ABORT'
}

// 错误恢复配置
interface ErrorRecoveryConfig {
  maxRetries: number
  retryDelay: number
  strategy: RecoveryStrategy
  fallback?: () => any
}

// 默认错误恢复配置
const DEFAULT_RECOVERY_CONFIG: ErrorRecoveryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  strategy: RecoveryStrategy.RETRY
}

// 增强的错误处理器
export class EnhancedErrorHandler extends ErrorHandler {
  private static errorLogs: ErrorLogEntry[] = []
  private static readonly MAX_LOGS = 1000

  // 记录详细错误日志
  static logError(
    level: ErrorLogLevel,
    code: ErrorCode,
    message: string,
    context?: string,
    details?: any,
    stack?: string
  ): void {
    const logEntry: ErrorLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      code,
      message,
      context,
      details,
      stack,
      userId: typeof window !== 'undefined' ? localStorage.getItem('user_id') || undefined : undefined,
      sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('session_id') || undefined : undefined
    }

    // 添加到日志数组
    this.errorLogs.unshift(logEntry)
    
    // 限制日志数量
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs = this.errorLogs.slice(0, this.MAX_LOGS)
    }

    // 在开发环境下输出到控制台
    if (process.env.NODE_ENV === 'development') {
      switch (level) {
        case ErrorLogLevel.DEBUG:
          console.debug(`[${context || 'App'}] ${message}`, { code, details, stack });
          break;
        case ErrorLogLevel.INFO:
          console.info(`[${context || 'App'}] ${message}`, { code, details, stack });
          break;
        case ErrorLogLevel.WARN:
          console.warn(`[${context || 'App'}] ${message}`, { code, details, stack });
          break;
        case ErrorLogLevel.ERROR:
          console.error(`[${context || 'App'}] ${message}`, { code, details, stack });
          break;
        case ErrorLogLevel.FATAL:
          console.error(`[FATAL] [${context || 'App'}] ${message}`, { code, details, stack });
          break;
      }
    }

    // 生产环境下发送到日志服务（这里可以集成实际的日志服务）
    if (process.env.NODE_ENV === 'production') {
      // this.sendToLoggingService(logEntry)
    }
  }

  // 获取错误日志
  static getErrorLogs(level?: ErrorLogLevel): ErrorLogEntry[] {
    if (!level) return [...this.errorLogs]
    return this.errorLogs.filter(log => log.level === level)
  }

  // 清空错误日志
  static clearErrorLogs(): void {
    this.errorLogs = []
  }

  // 导出错误日志
  static exportErrorLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2)
  }

  // 增强的错误处理
  static handle(error: any, context?: string): AppError {
    let appError: AppError

    // 判断错误类型
    if (error instanceof Error) {
      // Supabase 错误
      if (error.message.includes('PGRST') || error.message.includes('supabase')) {
        appError = this.createAppError(ErrorCode.SUPABASE_ERROR, undefined, error)
      }
      // 网络错误
      else if (error.message.includes('fetch') || error.message.includes('network')) {
        appError = this.createAppError(ErrorCode.NETWORK_ERROR, undefined, error)
      }
      // 其他错误
      else {
        appError = this.createAppError(ErrorCode.UNKNOWN_ERROR, error.message, error)
      }
    } 
    // 如果已经是 AppError
    else if (error.code && Object.values(ErrorCode).includes(error.code as ErrorCode)) {
      appError = error as AppError
    }
    // 未知错误
    else {
      appError = this.createAppError(ErrorCode.UNKNOWN_ERROR, undefined, error)
    }

    // 记录详细错误日志
    this.logError(
      ErrorLogLevel.ERROR,
      appError.code,
      appError.message,
      context,
      appError.details,
      appError.stack
    )

    // 显示用户友好的错误消息
    toast.error(appError.message)

    return appError
  }

  // 带恢复机制的错误处理
  static async handleWithRecovery<T>(
    operation: () => Promise<T>,
    config: Partial<ErrorRecoveryConfig> = {},
    context?: string
  ): Promise<T | null> {
    const recoveryConfig: ErrorRecoveryConfig = { 
      ...DEFAULT_RECOVERY_CONFIG, 
      ...config 
    }

    for (let attempt = 0; attempt <= recoveryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        // 记录重试日志
        this.logError(
          ErrorLogLevel.WARN,
          ErrorCode.UNKNOWN_ERROR,
          `Operation failed (attempt ${attempt + 1}/${recoveryConfig.maxRetries + 1})`,
          context,
          { error, attempt }
        )

        // 如果是最后一次尝试，执行恢复策略
        if (attempt === recoveryConfig.maxRetries) {
          switch (recoveryConfig.strategy) {
            case RecoveryStrategy.FALLBACK:
              if (recoveryConfig.fallback) {
                try {
                  return recoveryConfig.fallback() as T
                } catch (fallbackError) {
                  this.logError(
                    ErrorLogLevel.ERROR,
                    ErrorCode.UNKNOWN_ERROR,
                    'Fallback operation also failed',
                    context,
                    { error, fallbackError }
                  )
                }
              }
              break
              
            case RecoveryStrategy.SKIP:
              return null
              
            case RecoveryStrategy.ABORT:
              throw error
              
            default:
              throw error
          }
        }

        // 等待重试
        if (recoveryConfig.retryDelay > 0) {
          await new Promise(resolve => 
            setTimeout(resolve, recoveryConfig.retryDelay * Math.pow(2, attempt))
          )
        }
      }
    }

    return null
  }

  // 创建应用错误
  static createAppError(
    code: ErrorCode, 
    customMessage?: string, 
    details?: any
  ): AppError {
    const error = new Error(customMessage || this.getErrorMessage(code)) as AppError
    error.code = code
    error.details = details
    return error
  }

  // 获取错误消息
  private static getErrorMessage(code: ErrorCode): string {
    const ERROR_MESSAGES: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ErrorCode.CONNECTION_TIMEOUT]: '连接超时，请重试',
      [ErrorCode.INVALID_INPUT]: '输入信息有误，请检查后重试',
      [ErrorCode.UNAUTHORIZED]: '未授权访问，请先登录',
      [ErrorCode.FORBIDDEN]: '权限不足，无法执行此操作',
      [ErrorCode.NOT_FOUND]: '请求的资源不存在',
      [ErrorCode.GAME_NOT_FOUND]: '游戏房间不存在或已结束',
      [ErrorCode.INVALID_PLAY]: '出牌无效，请选择有效的牌型',
      [ErrorCode.NOT_YOUR_TURN]: '当前不是您的回合',
      [ErrorCode.ROOM_FULL]: '房间已满，无法加入',
      [ErrorCode.DATABASE_ERROR]: '数据库操作失败，请稍后重试',
      [ErrorCode.SUPABASE_ERROR]: '服务器连接失败，请稍后重试',
      [ErrorCode.UNKNOWN_ERROR]: '发生未知错误，请稍后重试'
    }
    
    return ERROR_MESSAGES[code] || '发生未知错误'
  }
}

// React Hook: 增强的错误处理
export function useEnhancedErrorHandler() {
  const handleError = (error: any, context?: string) => {
    return EnhancedErrorHandler.handle(error, context)
  }

  const handleWithRecovery = async <T>(
    operation: () => Promise<T>,
    config?: Partial<ErrorRecoveryConfig>,
    context?: string
  ) => {
    return EnhancedErrorHandler.handleWithRecovery(operation, config, context)
  }

  const getErrorLogs = (level?: ErrorLogLevel) => {
    return EnhancedErrorHandler.getErrorLogs(level)
  }

  const clearErrorLogs = () => {
    EnhancedErrorHandler.clearErrorLogs()
  }

  const exportErrorLogs = () => {
    return EnhancedErrorHandler.exportErrorLogs()
  }

  return {
    handleError,
    handleWithRecovery,
    getErrorLogs,
    clearErrorLogs,
    exportErrorLogs,
    // 继承原有的错误处理方法
    ...ErrorHandler
  }
}

// 导出类型和常量
export type { ErrorRecoveryConfig }
export { ErrorCode, AppError, RecoveryStrategy }