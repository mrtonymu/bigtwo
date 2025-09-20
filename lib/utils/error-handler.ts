// 统一错误处理机制
import toast from 'react-hot-toast'

// 错误类型定义
export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  
  // 业务错误
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  
  // 游戏相关错误
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  INVALID_PLAY = 'INVALID_PLAY',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  ROOM_FULL = 'ROOM_FULL',
  
  // 数据库错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  
  // 未知错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export type ErrorLevel = 'info' | 'warn' | 'error' | 'critical';

export interface AppError extends Error {
  level: ErrorLevel;
  code?: string;
  timestamp: Date;
  context?: Record<string, any>;
  recoveryStrategy?: string;
}

export class EnhancedErrorHandler {
  private static instance: EnhancedErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];

  private constructor() {}

  static getInstance(): EnhancedErrorHandler {
    if (!EnhancedErrorHandler.instance) {
      EnhancedErrorHandler.instance = new EnhancedErrorHandler();
    }
    return EnhancedErrorHandler.instance;
  }

  // 创建标准化错误对象
  createError(
    message: string,
    level: ErrorLevel = 'error',
    code?: string,
    context?: Record<string, any>
  ): AppError {
    const error = new Error(message) as AppError;
    error.level = level;
    error.code = code;
    error.timestamp = new Date();
    error.context = context;
    return error;
  }

  // 记录错误日志
  logError(error: AppError): void {
    const logEntry = {
      timestamp: error.timestamp.toISOString(),
      level: error.level,
      message: error.message,
      code: error.code,
      stack: error.stack,
      context: error.context,
    };

    // 在控制台输出错误
    console.error(`[${error.level.toUpperCase()}] ${error.message}`, logEntry);

    // 通知所有监听器
    this.errorListeners.forEach(listener => listener(error));

    // 在生产环境中，可能还会发送到日志服务
    if (process.env.NODE_ENV === 'production') {
      // 这里可以添加发送到日志服务的代码
    }
  }

  // 添加错误监听器
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  // 移除错误监听器
  removeErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  // 尝试恢复错误
  async attemptRecovery(error: AppError): Promise<boolean> {
    try {
      // 根据错误代码执行不同的恢复策略
      switch (error.code) {
        case 'NETWORK_ERROR':
          // 网络错误，可以尝试重新连接
          console.info('Attempting to recover from network error...');
          // 这里可以添加重新连接逻辑
          return true;
          
        case 'DB_ERROR':
          // 数据库错误，可以尝试重新查询
          console.info('Attempting to recover from database error...');
          // 这里可以添加重新查询逻辑
          return true;
          
        case 'GAME_STATE_ERROR':
          // 游戏状态错误，可以尝试重新同步
          console.info('Attempting to recover from game state error...');
          // 这里可以添加重新同步逻辑
          return true;
          
        default:
          // 默认情况下，记录错误但不执行特殊恢复
          console.warn(`No recovery strategy for error code: ${error.code}`);
          return false;
      }
    } catch (recoveryError) {
      console.error('Error during recovery attempt:', recoveryError);
      return false;
    }
  }

  // 包装异步操作以进行错误处理
  async wrapAsync<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error: any) {
      const appError: AppError = {
        ...error,
        level: error.level || 'error',
        timestamp: new Date(),
        context: {
          ...context,
          originalError: error.message,
        },
      };
      
      this.logError(appError);
      // 显示用户友好的错误消息
      toast.error(appError.message);
      await this.attemptRecovery(appError);
      return null;
    }
  }

  // 包装同步操作以进行错误处理
  wrapSync<T>(
    operation: () => T,
    context?: Record<string, any>
  ): T | null {
    try {
      return operation();
    } catch (error: any) {
      const appError: AppError = {
        ...error,
        level: error.level || 'error',
        timestamp: new Date(),
        context: {
          ...context,
          originalError: error.message,
        },
      };
      
      this.logError(appError);
      // 显示用户友好的错误消息
      toast.error(appError.message);
      return null;
    }
  }
}

// 创建全局错误处理实例
export const errorHandler = EnhancedErrorHandler.getInstance();



// 错误消息映射
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

// 创建应用错误
export function createAppError(
  code: ErrorCode, 
  customMessage?: string, 
  details?: any
): AppError {
  const error = new Error(customMessage || ERROR_MESSAGES[code]) as AppError
  error.code = code
  error.context = { details }
  return error
}

// 错误处理器类
export class ErrorHandler {
  // 处理错误并显示用户友好的消息
  static handle(error: any, context?: string): AppError {
    let appError: AppError

    // 判断错误类型
    if (error instanceof Error) {
      // Supabase 错误
      if (error.message.includes('PGRST') || error.message.includes('supabase')) {
        appError = createAppError(ErrorCode.SUPABASE_ERROR, undefined, error)
      }
      // 网络错误
      else if (error.message.includes('fetch') || error.message.includes('network')) {
        appError = createAppError(ErrorCode.NETWORK_ERROR, undefined, error)
      }
      // 其他错误
      else {
        appError = createAppError(ErrorCode.UNKNOWN_ERROR, error.message, error)
      }
    } 
    // 如果已经是 AppError
    else if (error.code && Object.values(ErrorCode).includes(error.code)) {
      appError = error
    }
    // 未知错误
    else {
      appError = createAppError(ErrorCode.UNKNOWN_ERROR, undefined, error)
    }

    // 记录错误日志
    console.error(`[${context || 'App'}] Error:`, {
      code: appError.code,
      message: appError.message,
      details: appError.context?.details,
      stack: appError.stack
    })

    // 显示用户友好的错误消息
    toast.error(appError.message)

    return appError
  }

  // 处理特定类型的错误
  static handleSupabaseError(error: any, operation: string): AppError {
    console.error(`[Supabase ${operation}] Error:`, error)

    let errorCode = ErrorCode.SUPABASE_ERROR
    let message = ERROR_MESSAGES[ErrorCode.SUPABASE_ERROR]

    // 根据具体错误代码提供更精确的错误信息
    if (error?.code === 'PGRST116') {
      errorCode = ErrorCode.NOT_FOUND
      message = '数据不存在'
    } else if (error?.code === '23505') {
      errorCode = ErrorCode.INVALID_INPUT
      message = '数据已存在，请勿重复操作'
    } else if (error?.message?.includes('timeout')) {
      errorCode = ErrorCode.CONNECTION_TIMEOUT
    }

    const appError = createAppError(errorCode, message, error)
    
    // 只在客户端环境下显示toast
    if (typeof window !== 'undefined') {
      toast.error(appError.message)
    }
    
    return appError
  }

  // 处理游戏相关错误
  static handleGameError(error: any, action: string): AppError {
    console.error(`[Game ${action}] Error:`, error)

    let errorCode = ErrorCode.UNKNOWN_ERROR
    let message = `${action}失败，请重试`

    // 根据操作类型提供具体错误信息
    if (action.includes('出牌')) {
      errorCode = ErrorCode.INVALID_PLAY
      message = ERROR_MESSAGES[ErrorCode.INVALID_PLAY]
    } else if (action.includes('加入')) {
      errorCode = ErrorCode.ROOM_FULL
      message = ERROR_MESSAGES[ErrorCode.ROOM_FULL]
    }

    const appError = createAppError(errorCode, message, error)
    toast.error(appError.message)
    
    return appError
  }

  // 显示用户友好的错误提示
  static showError(error: AppError | Error | unknown, context?: string): void {
    const appError = this.handle(error, context)
    
    // 只在客户端环境下显示toast
    if (typeof window === 'undefined') {
      return
    }
    
    // 根据错误类型选择不同的提示方式
    switch (appError.code) {
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.CONNECTION_TIMEOUT:
        toast.error(appError.message, {
          duration: 5000,
          icon: '🌐'
        })
        break
        
      case ErrorCode.GAME_NOT_FOUND:
      case ErrorCode.ROOM_FULL:
        toast.error(appError.message, {
          duration: 4000,
          icon: '🎮'
        })
        break
        
      case ErrorCode.INVALID_PLAY:
      case ErrorCode.NOT_YOUR_TURN:
        toast.error(appError.message, {
          duration: 3000,
          icon: '🃏'
        })
        break
        
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.FORBIDDEN:
        toast.error(appError.message, {
          duration: 4000,
          icon: '🔒'
        })
        break
        
      default:
        toast.error(appError.message, {
          duration: 4000,
          icon: '⚠️'
        })
    }
    
    // 在开发环境下输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Details:', {
        code: appError.code,
        message: appError.message,
        details: appError.context?.details,
        context,
        stack: appError.stack
      })
    }
  }

  // 处理网络错误
  static handleNetworkError(error: any): AppError {
    console.error('[Network] Error:', error)
    
    let errorCode = ErrorCode.NETWORK_ERROR
    let message = ERROR_MESSAGES[ErrorCode.NETWORK_ERROR]
    
    // 根据错误类型细分
    if (error?.message?.includes('timeout') || error?.code === 'TIMEOUT') {
      errorCode = ErrorCode.CONNECTION_TIMEOUT
      message = ERROR_MESSAGES[ErrorCode.CONNECTION_TIMEOUT]
    } else if (error?.message?.includes('offline') || !navigator.onLine) {
      message = '网络连接已断开，请检查网络连接'
    }
    
    const appError = createAppError(errorCode, message, error)
    toast.error(appError.message, {
      duration: 5000,
      icon: '🌐'
    })
    
    return appError
  }

  // 处理输入验证错误
  static handleValidationError(errors: string[], context?: string): AppError {
    const message = errors.length > 1 
      ? `输入验证失败：${errors.join('、')}`
      : errors[0]
    
    const appError = createAppError(ErrorCode.INVALID_INPUT, message, { errors, context })
    
    toast.error(appError.message, {
      duration: 4000,
      icon: '⚠️'
    })
    
    return appError
  }

  // 处理权限错误
  static handleAuthError(error: any, action?: string): AppError {
    console.error('[Auth] Error:', error)
    
    let errorCode = ErrorCode.UNAUTHORIZED
    let message = ERROR_MESSAGES[ErrorCode.UNAUTHORIZED]
    
    if (error?.status === 403 || error?.code === 'FORBIDDEN') {
      errorCode = ErrorCode.FORBIDDEN
      message = action ? `无权限执行操作：${action}` : ERROR_MESSAGES[ErrorCode.FORBIDDEN]
    }
    
    const appError = createAppError(errorCode, message, error)
    
    toast.error(appError.message, {
      duration: 4000,
      icon: '🔒'
    })
    
    return appError
  }

  // 显示成功提示
  static showSuccess(message: string, icon?: string): void {
    if (typeof window !== 'undefined') {
      toast.success(message, {
        duration: 3000,
        icon: icon || '✅'
      })
    }
  }

  // 显示信息提示
  static showInfo(message: string, icon?: string): void {
    if (typeof window !== 'undefined') {
      toast(message, {
        duration: 3000,
        icon: icon || 'ℹ️'
      })
    }
  }

  // 显示加载提示
  static showLoading(message: string): string {
    if (typeof window !== 'undefined') {
      return toast.loading(message)
    }
    return ''
  }

  // 关闭加载提示
  static dismissLoading(toastId: string): void {
    if (typeof window !== 'undefined') {
      toast.dismiss(toastId)
    }
  }
}

// 工具函数：安全执行异步操作
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation()
    return { data }
  } catch (error) {
    const appError = ErrorHandler.handle(error, context)
    return { error: appError }
  }
}

// React Hook: 统一错误处理
export function useErrorHandlerHook() {
  const handleError = (error: any, context?: string) => {
    return ErrorHandler.handle(error, context)
  }

  const handleSupabaseError = (error: any, operation: string) => {
    return ErrorHandler.handleSupabaseError(error, operation)
  }

  const handleGameError = (error: any, action: string) => {
    return ErrorHandler.handleGameError(error, action)
  }

  const handleNetworkError = (error: any) => {
    return ErrorHandler.handleNetworkError(error)
  }

  const handleValidationError = (errors: string[], context?: string) => {
    return ErrorHandler.handleValidationError(errors, context)
  }

  const handleAuthError = (error: any, action?: string) => {
    return ErrorHandler.handleAuthError(error, action)
  }

  const showSuccess = (message: string, icon?: string) => {
    ErrorHandler.showSuccess(message, icon)
  }

  const showInfo = (message: string, icon?: string) => {
    ErrorHandler.showInfo(message, icon)
  }

  const showLoading = (message: string) => {
    return ErrorHandler.showLoading(message)
  }

  const dismissLoading = (toastId: string) => {
    ErrorHandler.dismissLoading(toastId)
  }

  return {
    handleError,
    handleSupabaseError,
    handleGameError,
    handleNetworkError,
    handleValidationError,
    handleAuthError,
    showSuccess,
    showInfo,
    showLoading,
    dismissLoading
  }
}