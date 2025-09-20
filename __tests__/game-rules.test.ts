import { describe, it, expect } from '@jest/globals'
import { 
  GameRulesManager, 
  GameRulesValidator,
  PRESET_RULES,
  GameScoring
} from '../lib/game-rules'
import { Card } from '../lib/game-logic'

describe('Game Rules System', () => {
  describe('Preset Rules', () => {
    it('should have classic, fast, and casual preset rules', () => {
      expect(PRESET_RULES.classic).toBeDefined()
      expect(PRESET_RULES.fast).toBeDefined()
      expect(PRESET_RULES.casual).toBeDefined()
    })

    it('should have valid classic rules', () => {
      const rules = PRESET_RULES.classic
      expect(rules.playerCount.min).toBe(2)
      expect(rules.playerCount.max).toBe(4)
      expect(rules.specialRules.mustStartWithDiamond3).toBe(true)
    })

    it('should have valid fast rules', () => {
      const rules = PRESET_RULES.fast
      expect(rules.timeRules.enabled).toBe(true)
      expect(rules.timeRules.turnTime).toBe(15)
      expect(rules.specialRules.allowBombs).toBe(true)
    })

    it('should have valid casual rules', () => {
      const rules = PRESET_RULES.casual
      expect(rules.specialRules.mustStartWithDiamond3).toBe(false)
      expect(rules.timeRules.enabled).toBe(false)
    })
  })

  describe('GameRulesValidator', () => {
    it('should validate valid rules', () => {
      const rules = PRESET_RULES.classic
      const result = GameRulesValidator.validateRules(rules)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid player count', () => {
      const rules = {
        ...PRESET_RULES.classic,
        playerCount: { min: 5, max: 1, default: 3 }
      }
      const result = GameRulesValidator.validateRules(rules)
      expect(result.valid).toBe(false)
      // 只检查我们期望的错误
      expect(result.errors.some(error => error.includes('默认玩家数量必须在最小和最大值之间'))).toBe(true)
    })

    it('should detect when no combinations are allowed', () => {
      const rules = {
        ...PRESET_RULES.classic,
        allowedCombinations: {
          single: false,
          pair: false,
          threeOfAKind: false,
          straight: false,
          flush: false,
          fullHouse: false,
          fourOfAKind: false,
          straightFlush: false
        }
      }
      const result = GameRulesValidator.validateRules(rules)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('至少需要启用一种牌型')
    })
  })

  describe('GameRulesManager', () => {
    it('should get all preset rules', () => {
      const rules = GameRulesManager.getAllRules()
      expect(rules).toHaveLength(3)
      expect(rules.map(r => r.id)).toEqual(['classic', 'fast', 'casual'])
    })

    it('should get specific rules by ID', () => {
      const rules = GameRulesManager.getRules('classic')
      expect(rules).toBeDefined()
      expect(rules?.id).toBe('classic')
    })

    it('should add and remove custom rules', () => {
      const customRules = {
        id: 'test-custom',
        name: 'Test Custom Rules',
        description: 'Test custom game rules',
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
          allowBombs: false,
          doubleOnLastCard: false
        },
        scoring: {
          baseScore: 10, // 修改为大于0的值
          cardCountMultiplier: 1,
          finishBonuses: { first: 0 },
          penalties: { lastPlace: 0, tooManyCards: 0 }
        },
        timeRules: {
          enabled: false,
          turnTime: 30,
          timeoutAction: 'auto_pass' as const
        }
      }

      // Add custom rules
      const addResult = GameRulesManager.addCustomRules(customRules)
      expect(addResult.success).toBe(true)

      // Verify custom rules are included
      const allRules = GameRulesManager.getAllRules()
      expect(allRules).toHaveLength(4)
      expect(allRules.find(r => r.id === 'test-custom')).toBeDefined()

      // Remove custom rules
      const removed = GameRulesManager.removeCustomRules('test-custom')
      expect(removed).toBe(true)

      // Verify custom rules are removed
      const remainingRules = GameRulesManager.getAllRules()
      expect(remainingRules).toHaveLength(3)
      expect(remainingRules.find(r => r.id === 'test-custom')).toBeUndefined()
    })

    it('should export and import rules', () => {
      const rules = PRESET_RULES.classic
      const exported = GameRulesManager.exportRules('classic')
      expect(exported).toBeDefined()
      expect(typeof exported).toBe('string')

      if (exported) {
        const importResult = GameRulesManager.importRules(exported)
        expect(importResult.success).toBe(true)
        expect(importResult.rules).toBeDefined()
        expect(importResult.rules?.id).toBe('classic')
      }
    })
  })

  describe('GameScoring', () => {
    it('should calculate simple score based on remaining cards', () => {
      const score = GameScoring.calculateScore(5, 1, 4, PRESET_RULES.classic)
      expect(score).toBe(5)
    })

    it('should calculate complex score with bonuses and penalties', () => {
      const rules = {
        ...PRESET_RULES.classic,
        scoring: {
          baseScore: 100,
          cardCountMultiplier: 2,
          finishBonuses: { first: 50, second: 25 },
          penalties: { lastPlace: -30, tooManyCards: -10 }
        }
      }

      // First place with few cards
      const firstPlaceScore = GameScoring.calculateComplexScore(3, 1, 4, rules)
      expect(firstPlaceScore).toBe(100 + 50 - (3 * 2)) // 194

      // Last place with many cards
      const lastPlaceScore = GameScoring.calculateComplexScore(12, 4, 4, rules)
      expect(lastPlaceScore).toBe(100 - 30 - (12 * 2) - 10) // 36
    })
  })
})