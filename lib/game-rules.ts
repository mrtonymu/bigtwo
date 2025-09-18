// 自定义游戏规则系统
import { Card } from './game-logic'

export interface GameRules {
  id: string
  name: string
  description: string
  
  // 基础规则
  playerCount: {
    min: number
    max: number
    default: number
  }
  
  // 牌型规则
  allowedCombinations: {
    single: boolean           // 单牌
    pair: boolean            // 对子
    threeOfAKind: boolean    // 三条
    straight: boolean        // 顺子
    flush: boolean           // 同花
    fullHouse: boolean       // 葫芦
    fourOfAKind: boolean     // 四条
    straightFlush: boolean   // 同花顺
  }
  
  // 特殊规则
  specialRules: {
    mustStartWithDiamond3: boolean     // 必须方块3开始
    lastCardSpadeRule: boolean         // 最后一张牌不能是黑桃
    passOnThreeConsecutive: boolean    // 三次连续pass自动跳过
    allowBombs: boolean                // 允许炸弹（四条打任意牌型）
    doubleOnLastCard: boolean          // 最后一张牌双倍积分
  }
  
  // 计分规则
  scoring: {
    baseScore: number                  // 基础分数
    cardCountMultiplier: number        // 剩余手牌倍数
    finishBonuses: {
      first: number                    // 第一名奖励
      second?: number                  // 第二名奖励（4人游戏）
    }
    penalties: {
      lastPlace: number                // 最后一名惩罚
      tooManyCards: number             // 剩余牌过多惩罚
    }
  }
  
  // 时间限制
  timeRules: {
    enabled: boolean
    turnTime: number                   // 每回合时间（秒）
    gameTime?: number                  // 总游戏时间（秒）
    timeoutAction: 'auto_pass' | 'kick_player'
  }
}

// 预设规则
export const PRESET_RULES: { [key: string]: GameRules } = {
  classic: {
    id: 'classic',
    name: '经典规则',
    description: '标准大老二游戏规则',
    playerCount: { min: 2, max: 4, default: 4 },
    allowedCombinations: {
      single: true,
      pair: true,
      threeOfAKind: true,
      straight: true,
      flush: true,
      fullHouse: true,
      fourOfAKind: true,
      straightFlush: true
    },
    specialRules: {
      mustStartWithDiamond3: true,
      lastCardSpadeRule: true,
      passOnThreeConsecutive: false,
      allowBombs: false,
      doubleOnLastCard: false
    },
    scoring: {
      baseScore: 0,
      cardCountMultiplier: 1,
      finishBonuses: { first: 0, second: 0 },
      penalties: { lastPlace: 0, tooManyCards: 0 }
    },
    timeRules: {
      enabled: false,
      turnTime: 30,
      timeoutAction: 'auto_pass'
    }
  },
  
  fast: {
    id: 'fast',
    name: '快速模式',
    description: '节奏更快的游戏规则',
    playerCount: { min: 2, max: 4, default: 3 },
    allowedCombinations: {
      single: true,
      pair: true,
      threeOfAKind: true,
      straight: true,
      flush: true,
      fullHouse: true,
      fourOfAKind: true,
      straightFlush: true
    },
    specialRules: {
      mustStartWithDiamond3: false,
      lastCardSpadeRule: false,
      passOnThreeConsecutive: true,
      allowBombs: true,
      doubleOnLastCard: true
    },
    scoring: {
      baseScore: 0,
      cardCountMultiplier: 1,
      finishBonuses: { first: 0 },
      penalties: { lastPlace: 0, tooManyCards: 0 }
    },
    timeRules: {
      enabled: true,
      turnTime: 15,
      timeoutAction: 'auto_pass'
    }
  },
  
  casual: {
    id: 'casual',
    name: '休闲模式',
    description: '更轻松的朋友聚会规则',
    playerCount: { min: 2, max: 4, default: 4 },
    allowedCombinations: {
      single: true,
      pair: true,
      threeOfAKind: true,
      straight: true,
      flush: true,
      fullHouse: true,
      fourOfAKind: true,
      straightFlush: true
    },
    specialRules: {
      mustStartWithDiamond3: false,
      lastCardSpadeRule: false,
      passOnThreeConsecutive: false,
      allowBombs: true,
      doubleOnLastCard: false
    },
    scoring: {
      baseScore: 0,
      cardCountMultiplier: 1,
      finishBonuses: { first: 0 },
      penalties: { lastPlace: 0, tooManyCards: 0 }
    },
    timeRules: {
      enabled: false,
      turnTime: 60,
      timeoutAction: 'auto_pass'
    }
  }
}

// 规则验证
export class GameRulesValidator {
  static validateRules(rules: GameRules): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 验证玩家数量
    if (rules.playerCount.min < 2) {
      errors.push('最少玩家数量不能少于2人')
    }
    if (rules.playerCount.max > 4) {
      errors.push('最多玩家数量不能超过4人（标准52张牌限制）')
    }
    if (rules.playerCount.default < rules.playerCount.min || 
        rules.playerCount.default > rules.playerCount.max) {
      errors.push('默认玩家数量必须在最小和最大值之间')
    }
    
    // 验证牌型组合
    const combinations = Object.values(rules.allowedCombinations)
    if (!combinations.some(Boolean)) {
      errors.push('至少需要启用一种牌型')
    }
    
    // 验证计分规则
    if (rules.scoring.baseScore <= 0) {
      errors.push('基础分数必须大于0')
    }
    
    // 验证时间规则
    if (rules.timeRules.enabled && rules.timeRules.turnTime <= 0) {
      errors.push('回合时间必须大于0')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  static isValidPlay(cards: Card[], lastPlay: Card[], rules: GameRules): boolean {
    // 根据自定义规则验证出牌
    const combination = getCombinationType(cards)
    
    // 检查是否允许该牌型
    if (!rules.allowedCombinations[combination]) {
      return false
    }
    
    // 检查特殊规则
    if (rules.specialRules.mustStartWithDiamond3 && lastPlay.length === 0) {
      return cards.some(card => card.suit === 'diamonds' && card.rank === 3)
    }
    
    if (rules.specialRules.lastCardSpadeRule && cards.length === 1) {
      // 如果这是最后一张牌且是黑桃，则无效
      // 这需要额外的上下文信息来判断是否是最后一张牌
    }
    
    return true
  }
}

// 获取牌型类型
function getCombinationType(cards: Card[]): keyof GameRules['allowedCombinations'] {
  if (cards.length === 1) return 'single'
  if (cards.length === 2) return 'pair'
  if (cards.length === 3) return 'threeOfAKind'
  if (cards.length === 5) {
    // 需要更复杂的逻辑来判断五张牌的具体类型
    return 'straight' // 简化处理
  }
  return 'single' // 默认
}

// 规则管理器
export class GameRulesManager {
  private static customRules: Map<string, GameRules> = new Map()
  
  static getAllRules(): GameRules[] {
    return [
      ...Object.values(PRESET_RULES),
      ...Array.from(this.customRules.values())
    ]
  }
  
  static getRules(id: string): GameRules | null {
    return PRESET_RULES[id] || this.customRules.get(id) || null
  }
  
  static addCustomRules(rules: GameRules): { success: boolean; error?: string } {
    const validation = GameRulesValidator.validateRules(rules)
    
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') }
    }
    
    this.customRules.set(rules.id, rules)
    return { success: true }
  }
  
  static removeCustomRules(id: string): boolean {
    return this.customRules.delete(id)
  }
  
  static exportRules(id: string): string | null {
    const rules = this.getRules(id)
    if (!rules) return null
    
    return JSON.stringify(rules, null, 2)
  }
  
  static importRules(jsonString: string): { success: boolean; error?: string; rules?: GameRules } {
    try {
      const rules = JSON.parse(jsonString) as GameRules
      const validation = GameRulesValidator.validateRules(rules)
      
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') }
      }
      
      return { success: true, rules }
    } catch (error) {
      return { success: false, error: '无效的JSON格式' }
    }
  }
}

// 计分系统
export class GameScoring {
  static calculateScore(
    playerCards: number, 
    position: number, 
    totalPlayers: number,
    rules: GameRules
  ): number {
    // 简化计分系统：直接基于剩余牌数计分
    // 类似DaiDi.io的简单计分方式
    return playerCards
  }

  // 保留原有复杂计分方法，以备需要时使用
  static calculateComplexScore(
    playerCards: number, 
    position: number, 
    totalPlayers: number,
    rules: GameRules
  ): number {
    let score = rules.scoring.baseScore
    
    // 根据排名计算奖励/惩罚
    if (position === 1) {
      score += rules.scoring.finishBonuses.first
    } else if (position === 2 && rules.scoring.finishBonuses.second) {
      score += rules.scoring.finishBonuses.second
    } else if (position === totalPlayers) {
      score += rules.scoring.penalties.lastPlace
    }
    
    // 根据剩余手牌计算惩罚
    const cardPenalty = playerCards * rules.scoring.cardCountMultiplier
    score -= cardPenalty
    
    // 剩余牌过多额外惩罚
    if (playerCards >= 10) {
      score += rules.scoring.penalties.tooManyCards
    }
    
    return score
  }
}