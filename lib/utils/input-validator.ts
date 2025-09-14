// 输入验证系统
import { type ValidationResult } from '@/lib/types/common'

// 验证规则接口
export interface ValidationRule {
  validate: (value: string) => boolean
  message: string
}

// 常见验证规则
export const ValidationRules = {
  // 长度验证
  minLength: (min: number): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: `最少需要${min}个字符`
  }),

  maxLength: (max: number): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: `最多${max}个字符`
  }),

  // 字符类型验证
  noSpecialChars: {
    validate: (value: string) => /^[a-zA-Z0-9\u4e00-\u9fa5\s]*$/.test(value),
    message: '只能包含字母、数字、中文和空格'
  },

  noSpaces: {
    validate: (value: string) => !/\s/.test(value),
    message: '不能包含空格'
  },

  // 安全性验证
  noHtml: {
    validate: (value: string) => !/<[^>]*>/.test(value),
    message: '不能包含HTML标签'
  },

  noScript: {
    validate: (value: string) => !/script|javascript|onclick|onerror|onload/i.test(value),
    message: '包含不安全的内容'
  },

  noSql: {
    validate: (value: string) => !/select|insert|update|delete|drop|union|exec|script/i.test(value),
    message: '包含不安全的SQL关键字'
  },

  // 格式验证
  alphanumeric: {
    validate: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
    message: '只能包含字母和数字'
  },

  chinese: {
    validate: (value: string) => /^[\u4e00-\u9fa5]+$/.test(value),
    message: '只能包含中文字符'
  },

  // 游戏相关验证
  playerName: {
    validate: (value: string) => {
      // 1-20个字符，只能包含中文、英文、数字
      return /^[\u4e00-\u9fa5a-zA-Z0-9]{1,20}$/.test(value.trim())
    },
    message: '玩家名称应为1-20个字符，只能包含中文、英文或数字'
  },

  roomName: {
    validate: (value: string) => {
      // 1-30个字符，可以包含中文、英文、数字、空格，但不能全是空格
      const trimmed = value.trim()
      return trimmed.length >= 1 && trimmed.length <= 30 && /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/.test(trimmed)
    },
    message: '房间名称应为1-30个字符，只能包含中文、英文、数字或空格'
  }
}

// 验证器类
export class InputValidator {
  private rules: ValidationRule[] = []

  // 添加验证规则
  addRule(rule: ValidationRule): this {
    this.rules.push(rule)
    return this
  }

  // 添加多个验证规则
  addRules(rules: ValidationRule[]): this {
    this.rules.push(...rules)
    return this
  }

  // 验证输入
  validate(value: string): ValidationResult {
    const errors: string[] = []

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 清空规则
  clear(): this {
    this.rules = []
    return this
  }
}

// 预定义验证器
export const Validators = {
  // 玩家名称验证器
  playerName: new InputValidator()
    .addRules([
      ValidationRules.playerName,
      ValidationRules.noHtml,
      ValidationRules.noScript,
      ValidationRules.noSql
    ]),

  // 房间名称验证器
  roomName: new InputValidator()
    .addRules([
      ValidationRules.roomName,
      ValidationRules.noHtml,
      ValidationRules.noScript,
      ValidationRules.noSql
    ]),

  // 密码验证器
  password: new InputValidator()
    .addRules([
      ValidationRules.minLength(1),
      ValidationRules.maxLength(100),
      ValidationRules.noHtml,
      ValidationRules.noScript
    ])
}

// 快速验证函数
export function validatePlayerName(name: string): ValidationResult {
  return Validators.playerName.validate(name)
}

export function validateRoomName(name: string): ValidationResult {
  return Validators.roomName.validate(name)
}

export function validatePassword(password: string): ValidationResult {
  return Validators.password.validate(password)
}

// React Hook: 实时输入验证
export function useInputValidation(validator: InputValidator) {
  return {
    validate: (value: string) => validator.validate(value),
    isValid: (value: string) => validator.validate(value).isValid,
    getErrors: (value: string) => validator.validate(value).errors
  }
}

// 安全过滤器 - 清理输入数据
export class InputSanitizer {
  // 移除HTML标签
  static stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '')
  }

  // 转义HTML特殊字符
  static escapeHtml(input: string): string {
    const div = document.createElement('div')
    div.textContent = input
    return div.innerHTML
  }

  // 移除SQL关键字（基础防护）
  static removeSqlKeywords(input: string): string {
    const sqlKeywords = /\b(select|insert|update|delete|drop|union|exec|script|alter|create)\b/gi
    return input.replace(sqlKeywords, '')
  }

  // 限制长度
  static limitLength(input: string, maxLength: number): string {
    return input.slice(0, maxLength)
  }

  // 清理玩家名称
  static sanitizePlayerName(name: string): string {
    return this.limitLength(
      this.stripHtml(
        this.removeSqlKeywords(name.trim())
      ),
      20
    )
  }

  // 清理房间名称
  static sanitizeRoomName(name: string): string {
    return this.limitLength(
      this.stripHtml(
        this.removeSqlKeywords(name.trim())
      ),
      30
    )
  }
}

// 批量验证
export function validateMultiple(inputs: { value: string; validator: InputValidator; name: string }[]): {
  isValid: boolean
  errors: Record<string, string[]>
} {
  const errors: Record<string, string[]> = {}
  let isValid = true

  for (const input of inputs) {
    const result = input.validator.validate(input.value)
    if (!result.isValid) {
      errors[input.name] = result.errors
      isValid = false
    }
  }

  return { isValid, errors }
}