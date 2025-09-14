// Big Two game logic and card utilities

export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades"
  rank: number // 3=0, 4=1, ..., A=11, 2=12
  display: string
}

export interface GameState {
  id: string
  currentPlayer: number
  lastPlay: Card[]
  lastPlayer?: number
  turnCount: number
  playHistory?: PlayHistory[]
}

export interface PlayHistory {
  turn: number
  playerName: string
  playerPosition: number
  cards: Card[]
  playType: string
  timestamp: string
}

export interface Player {
  id: string
  name: string
  position: number
  cards: Card[]
  isSpectator: boolean
}

// Create a standard 52-card deck
export function createDeck(): Card[] {
  const suits: Card["suit"][] = ["diamonds", "clubs", "hearts", "spades"] // 方块 < 梅花 < 红心 < 黑桃
  const ranks = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] // 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2
  const displays = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"]

  const deck: Card[] = []
  suits.forEach((suit) => {
    ranks.forEach((rank, index) => {
      deck.push({
        suit,
        rank,
        display: displays[index],
      })
    })
  })

  return shuffleDeck(deck)
}

// Shuffle deck using Fisher-Yates algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Sort cards by suit and rank
export function sortCards(cards: Card[], sortBy: "suit" | "rank" | "auto" = "auto"): Card[] {
  const sorted = [...cards]
  
  if (sortBy === "suit") {
    // Sort by suit first, then by rank
    return sorted.sort((a, b) => {
      const suitOrder = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 }
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit]
      }
      return a.rank - b.rank
    })
  } else if (sortBy === "rank") {
    // Sort by rank first, then by suit
    return sorted.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank
      }
      const suitOrder = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 }
      return suitOrder[a.suit] - suitOrder[b.suit]
    })
  } else {
    // Auto sort: group by suit, then sort by rank within each suit
    return sorted.sort((a, b) => {
      const suitOrder = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 }
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit]
      }
      return a.rank - b.rank
    })
  }
}

// Auto arrange cards by grouping similar cards together
export function autoArrangeCards(cards: Card[]): Card[] {
  const sorted = [...cards]
  
  // Group cards by suit
  const suitGroups: { [key: string]: Card[] } = {
    spades: [],
    hearts: [],
    diamonds: [],
    clubs: []
  }
  
  sorted.forEach(card => {
    suitGroups[card.suit].push(card)
  })
  
  // Sort each suit group by rank
  Object.keys(suitGroups).forEach(suit => {
    suitGroups[suit].sort((a, b) => a.rank - b.rank)
  })
  
  // Combine groups in order: spades, hearts, diamonds, clubs
  const result: Card[] = []
  const suitOrder = ["spades", "hearts", "diamonds", "clubs"] as const
  
  suitOrder.forEach(suit => {
    result.push(...suitGroups[suit])
  })
  
  return result
}

// Deal cards to players
export function dealCards(deck: Card[], numPlayers: number): Card[][] {
  const hands: Card[][] = Array(numPlayers)
    .fill(null)
    .map(() => [])

  // Deal 13 cards to each player
  for (let i = 0; i < 13; i++) {
    for (let player = 0; player < numPlayers; player++) {
      if (deck.length > 0) {
        hands[player].push(deck.pop()!)
      }
    }
  }

  // Sort each hand
  hands.forEach((hand) => {
    hand.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank
      return (
        ["hearts", "diamonds", "clubs", "spades"].indexOf(a.suit) -
        ["hearts", "diamonds", "clubs", "spades"].indexOf(b.suit)
      )
    })
  })

  return hands
}

// Validate if a play is legal
export function isValidPlay(cards: Card[], lastPlay: Card[], playerCount: number = 4, remainingCards: Card[] = []): boolean {
  if (cards.length === 0) return false

  // First play of the game
  if (lastPlay.length === 0) {
    // For 2-3 player games, must start with ♦3
    // For 4 player games, can start with any valid combination
    if (playerCount < 4) {
      return isValidCombination(cards) && hasDiamond3(cards)
    } else {
    return isValidCombination(cards)
    }
  }

  // Must play same number of cards
  if (cards.length !== lastPlay.length) return false

  // Must be valid combination
  if (!isValidCombination(cards)) return false

  // Check spades rule: can't leave single spade as last card
  if (remainingCards.length === 1 && remainingCards[0].suit === "spades") {
    return false
  }

  // Must be higher than last play
  return isHigherCombination(cards, lastPlay)
}

// Check if cards form a valid combination
export function isValidCombination(cards: Card[]): boolean {
  if (cards.length === 1) return true // Single card
  if (cards.length === 2) return isPair(cards) // Pair
  if (cards.length === 3) return isThreeOfAKind(cards) // Three of a kind
  if (cards.length === 5) return isFiveCardHand(cards) // Five card hand (includes 金刚)
  return false // Invalid length
}

// Check if two cards form a pair
function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank
}

// Check if three cards form three of a kind
function isThreeOfAKind(cards: Card[]): boolean {
  return cards.length === 3 && cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank
}

// Check if cards contain ♦3 (for 2-3 player games)
function hasDiamond3(cards: Card[]): boolean {
  return cards.some(card => card.suit === "diamonds" && card.rank === 3)
}


// Check if five cards form a valid hand (straight, flush, full house, four of a kind + one)
function isFiveCardHand(cards: Card[]): boolean {
  if (cards.length !== 5) return false

  const sorted = [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))

  // Check for flush (同花)
  const isFlush = cards.every((card) => card.suit === cards[0].suit)

  // Check for straight (顺子) - handle A-2-3-4-5 and 10-J-Q-K-A
  const ranks = sorted.map(c => c.rank)
  
  // Handle special straights first
  const isSpecialStraight = 
    // A-2-3-4-5 straight
    (ranks[0] === 3 && ranks[1] === 4 && ranks[2] === 5 && ranks[3] === 6 && ranks[4] === 7) ||
    // 10-J-Q-K-A straight  
    (ranks[0] === 10 && ranks[1] === 11 && ranks[2] === 12 && ranks[3] === 13 && ranks[4] === 14)
  
  // Handle normal straight
  const isNormalStraight = ranks.every((rank, i) => {
    if (i === 0) return true
    return rank === ranks[i - 1] + 1
  })
  
  const isStraight = isSpecialStraight || isNormalStraight

  // Check for straight flush (同花顺)
  const isStraightFlush = isStraight && isFlush

  // Check for four of a kind + one (四条/金刚)
  const rankCounts = ranks.reduce(
    (acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )
  const counts = Object.values(rankCounts).sort()
  const isFourOfAKind = counts.length === 2 && counts[0] === 1 && counts[1] === 4

  // Check for full house (葫芦)
  const isFullHouse = counts.length === 2 && counts[0] === 2 && counts[1] === 3

  return isStraightFlush || isFourOfAKind || isFullHouse || isFlush || isStraight
}

// Check if combination A is higher than combination B
function isHigherCombination(cardsA: Card[], cardsB: Card[]): boolean {
  if (cardsA.length === 1) {
    return getCardValue(cardsA[0]) > getCardValue(cardsB[0])
  }

  if (cardsA.length === 2) {
    const maxA = Math.max(...cardsA.map(getCardValue))
    const maxB = Math.max(...cardsB.map(getCardValue))
    return maxA > maxB
  }

  if (cardsA.length === 3) {
    const maxA = Math.max(...cardsA.map(getCardValue))
    const maxB = Math.max(...cardsB.map(getCardValue))
    return maxA > maxB
  }

  // For five card hands, compare by type first, then by highest card
  return getHandValue(cardsA) > getHandValue(cardsB)
}

// Get numeric value for card comparison
function getCardValue(card: Card): number {
  // Suit order: diamonds < clubs < hearts < spades (方块 < 梅花 < 红心 < 黑桃)
  const suitValue = ["diamonds", "clubs", "hearts", "spades"].indexOf(card.suit)
  // Rank order: 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2
  // 2 is the highest, so it gets the highest value
  const rankValue = card.rank === 15 ? 13 : card.rank - 3 // 2=13, A=12, K=11, ..., 3=0
  return rankValue * 4 + suitValue
}


// Get hand value for five card combinations
function getHandValue(cards: Card[]): number {
  const sorted = [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))
  const isFlush = cards.every((card) => card.suit === cards[0].suit)
  
  // Check for straight (顺子) - handle A-2-3-4-5 and 10-J-Q-K-A
  const ranks = sorted.map(c => c.rank)
  const isStraight = ranks.every((rank, i) => {
    if (i === 0) return true
    const prevRank = ranks[i - 1]
    // Handle A-2-3-4-5 straight
    if (prevRank === 15 && rank === 3) return true
    // Handle normal straight
    return rank === prevRank + 1
  }) || 
  // Handle 10-J-Q-K-A straight
  ranks[0] === 10 && ranks[1] === 11 && ranks[2] === 12 && ranks[3] === 13 && ranks[4] === 14

  // Check for straight flush (同花顺) - highest
  if (isStraight && isFlush) {
    // For A-2-3-4-5 straight flush, use 5 as the high card
    if (ranks[0] === 3 && ranks[4] === 15) {
      return 9000 + getCardValue(sorted[0]) // Use 5 as high card
    }
    return 9000 + getCardValue(sorted[4]) // Use highest card
  }

  // Check for four of a kind + one (四条/金刚)
  const rankCounts = ranks.reduce(
    (acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )
  const counts = Object.values(rankCounts).sort()
  
  if (counts.length === 2 && counts[0] === 1 && counts[1] === 4) {
    const fourOfAKindRank = Object.keys(rankCounts).find((rank) => rankCounts[Number(rank)] === 4)
    return 8000 + getCardValue({ suit: "spades", rank: Number(fourOfAKindRank), display: "" }) // Four of a kind + one
  }

  // Check for full house (葫芦)
  if (counts.length === 2 && counts[0] === 2 && counts[1] === 3) {
  const tripleRank = Object.keys(rankCounts).find((rank) => rankCounts[Number(rank)] === 3)
    return 7000 + getCardValue({ suit: "spades", rank: Number(tripleRank), display: "" }) // Full house
  }

  // Flush (同花)
  if (isFlush) return 6000 + getCardValue(sorted[4]) // Flush

  // Straight (顺子)
  if (isStraight) {
    // For A-2-3-4-5 straight, use 5 as the high card
    if (ranks[0] === 3 && ranks[4] === 15) {
      return 5000 + getCardValue(sorted[0]) // Use 5 as high card
    }
    return 5000 + getCardValue(sorted[4]) // Use highest card
  }

  // High card
  return getCardValue(sorted[4])
}

// Get play type name for history
export function getPlayTypeName(cards: Card[]): string {
  if (cards.length === 0) return "Pass"
  if (cards.length === 1) return "单牌"
  if (cards.length === 2) return "对子"
  if (cards.length === 3) return "三条"
  if (cards.length === 5) {
    if (isStraightFlush(cards)) return "同花顺"
    if (isFourOfAKindPlusOne(cards)) return "金刚"
    if (isFullHouse(cards)) return "葫芦"
    if (isFlush(cards)) return "同花"
    if (isStraight(cards)) return "顺子"
  }
  if (cards.length === 4) return "四条"
  return "未知"
}

// Helper functions for play type detection
function isStraightFlush(cards: Card[]): boolean {
  if (cards.length !== 5) return false
  const sorted = [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))
  const isFlush = cards.every(card => card.suit === cards[0].suit)
  const ranks = sorted.map(c => c.rank)
  const isStraight = ranks.every((rank, i) => {
    if (i === 0) return true
    return rank === ranks[i - 1] + 1
  }) || 
  (ranks[0] === 3 && ranks[1] === 4 && ranks[2] === 5 && ranks[3] === 6 && ranks[4] === 7) ||
  (ranks[0] === 10 && ranks[1] === 11 && ranks[2] === 12 && ranks[3] === 13 && ranks[4] === 14)
  return isStraight && isFlush
}

function isFourOfAKindPlusOne(cards: Card[]): boolean {
  if (cards.length !== 5) return false
  const ranks = cards.map(c => c.rank)
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  const counts = Object.values(rankCounts).sort()
  return counts.length === 2 && counts[0] === 1 && counts[1] === 4
}

function isFullHouse(cards: Card[]): boolean {
  if (cards.length !== 5) return false
  const ranks = cards.map(c => c.rank)
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  const counts = Object.values(rankCounts).sort()
  return counts.length === 2 && counts[0] === 2 && counts[1] === 3
}

function isFlush(cards: Card[]): boolean {
  if (cards.length !== 5) return false
  return cards.every(card => card.suit === cards[0].suit)
}

function isStraight(cards: Card[]): boolean {
  if (cards.length !== 5) return false
  const sorted = [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))
  const ranks = sorted.map(c => c.rank)
  return ranks.every((rank, i) => {
    if (i === 0) return true
    return rank === ranks[i - 1] + 1
  }) || 
  (ranks[0] === 3 && ranks[1] === 4 && ranks[2] === 5 && ranks[3] === 6 && ranks[4] === 7) ||
  (ranks[0] === 10 && ranks[1] === 11 && ranks[2] === 12 && ranks[3] === 13 && ranks[4] === 14)
}

// 智能出牌提示
export interface CardHint {
  cards: Card[]
  type: string
  strength: number
  description: string
}

export function getCardHints(myCards: Card[], lastPlay: Card[], playerCount: number): CardHint[] {
  const hints: CardHint[] = []
  
  if (lastPlay.length === 0) {
    // 第一手牌，推荐最小的牌型
    return getFirstPlayHints(myCards)
  }
  
  const lastPlayType = getPlayTypeName(lastPlay)
  const lastPlayStrength = getPlayStrength(lastPlay)
  
  // 根据上一手牌的类型推荐
  switch (lastPlayType) {
    case "单牌":
      hints.push(...getSingleCardHints(myCards, lastPlayStrength))
      break
    case "对子":
      hints.push(...getPairHints(myCards, lastPlayStrength))
      break
    case "三条":
      hints.push(...getThreeOfAKindHints(myCards, lastPlayStrength))
      break
    case "顺子":
      hints.push(...getStraightHints(myCards, lastPlayStrength))
      break
    case "同花":
      hints.push(...getFlushHints(myCards, lastPlayStrength))
      break
    case "葫芦":
      hints.push(...getFullHouseHints(myCards, lastPlayStrength))
      break
    case "四条":
      hints.push(...getFourOfAKindHints(myCards, lastPlayStrength))
      break
    case "金刚":
      hints.push(...getFourOfAKindPlusOneHints(myCards, lastPlayStrength))
      break
    case "同花顺":
      hints.push(...getStraightFlushHints(myCards, lastPlayStrength))
      break
  }
  
  // 按强度排序，返回前5个建议
  return hints
    .sort((a, b) => a.strength - b.strength)
    .slice(0, 5)
}

// 第一手牌提示
function getFirstPlayHints(myCards: Card[]): CardHint[] {
  const hints: CardHint[] = []
  
  // 推荐单牌
  const singles = myCards.map(card => ({
    cards: [card],
    type: "单牌",
    strength: getCardValue(card),
    description: `出单张 ${card.display}`
  }))
  hints.push(...singles.slice(0, 3))
  
  // 推荐对子
  const pairs = findPairs(myCards)
  hints.push(...pairs.slice(0, 2))
  
  // 推荐三条
  const threes = findThreeOfAKind(myCards)
  hints.push(...threes.slice(0, 1))
  
  return hints
}

// 单牌提示
function getSingleCardHints(myCards: Card[], lastStrength: number): CardHint[] {
  return myCards
    .filter(card => getCardValue(card) > lastStrength)
    .map(card => ({
      cards: [card],
      type: "单牌",
      strength: getCardValue(card),
      description: `出单张 ${card.display}`
    }))
    .sort((a, b) => a.strength - b.strength)
}

// 对子提示
function getPairHints(myCards: Card[], lastStrength: number): CardHint[] {
  const pairs = findPairs(myCards)
  return pairs.filter(pair => pair.strength > lastStrength)
}

// 三条提示
function getThreeOfAKindHints(myCards: Card[], lastStrength: number): CardHint[] {
  const threes = findThreeOfAKind(myCards)
  return threes.filter(three => three.strength > lastStrength)
}

// 顺子提示
function getStraightHints(myCards: Card[], lastStrength: number): CardHint[] {
  const straights = findStraights(myCards)
  return straights.filter(straight => straight.strength > lastStrength)
}

// 同花提示
function getFlushHints(myCards: Card[], lastStrength: number): CardHint[] {
  const flushes = findFlushes(myCards)
  return flushes.filter(flush => flush.strength > lastStrength)
}

// 葫芦提示
function getFullHouseHints(myCards: Card[], lastStrength: number): CardHint[] {
  const fullHouses = findFullHouses(myCards)
  return fullHouses.filter(fh => fh.strength > lastStrength)
}

// 四条提示
function getFourOfAKindHints(myCards: Card[], lastStrength: number): CardHint[] {
  const fours = findFourOfAKind(myCards)
  return fours.filter(four => four.strength > lastStrength)
}

// 金刚提示
function getFourOfAKindPlusOneHints(myCards: Card[], lastStrength: number): CardHint[] {
  const fourPlusOnes = findFourOfAKindPlusOne(myCards)
  return fourPlusOnes.filter(fpo => fpo.strength > lastStrength)
}

// 同花顺提示
function getStraightFlushHints(myCards: Card[], lastStrength: number): CardHint[] {
  const straightFlushes = findStraightFlushes(myCards)
  return straightFlushes.filter(sf => sf.strength > lastStrength)
}

// 辅助函数：查找各种牌型
function findPairs(cards: Card[]): CardHint[] {
  const pairs: CardHint[] = []
  const rankCounts = cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  Object.entries(rankCounts).forEach(([rank, count]) => {
    if (count >= 2) {
      const pairCards = cards.filter(c => c.rank === parseInt(rank)).slice(0, 2)
      pairs.push({
        cards: pairCards,
        type: "对子",
        strength: getCardValue(pairCards[0]),
        description: `出对子 ${pairCards[0].display}${pairCards[1].display}`
      })
    }
  })
  
  return pairs
}

function findThreeOfAKind(cards: Card[]): CardHint[] {
  const threes: CardHint[] = []
  const rankCounts = cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  Object.entries(rankCounts).forEach(([rank, count]) => {
    if (count >= 3) {
      const threeCards = cards.filter(c => c.rank === parseInt(rank)).slice(0, 3)
      threes.push({
        cards: threeCards,
        type: "三条",
        strength: getCardValue(threeCards[0]),
        description: `出三条 ${threeCards[0].display}${threeCards[1].display}${threeCards[2].display}`
      })
    }
  })
  
  return threes
}

function findStraights(cards: Card[]): CardHint[] {
  const straights: CardHint[] = []
  const sorted = [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))
  
  for (let i = 0; i <= sorted.length - 5; i++) {
    const fiveCards = sorted.slice(i, i + 5)
    if (isStraight(fiveCards)) {
      straights.push({
        cards: fiveCards,
        type: "顺子",
        strength: getPlayStrength(fiveCards),
        description: `出顺子 ${fiveCards.map(c => c.display).join('-')}`
      })
    }
  }
  
  return straights
}

function findFlushes(cards: Card[]): CardHint[] {
  const flushes: CardHint[] = []
  const suitGroups = cards.reduce((acc, card) => {
    if (!acc[card.suit]) acc[card.suit] = []
    acc[card.suit].push(card)
    return acc
  }, {} as Record<string, Card[]>)
  
  Object.values(suitGroups).forEach(suitCards => {
    if (suitCards.length >= 5) {
      const sorted = suitCards.sort((a, b) => getCardValue(a) - getCardValue(b))
      for (let i = 0; i <= sorted.length - 5; i++) {
        const fiveCards = sorted.slice(i, i + 5)
        flushes.push({
          cards: fiveCards,
          type: "同花",
          strength: getPlayStrength(fiveCards),
          description: `出同花 ${fiveCards.map(c => c.display).join('')}`
        })
      }
    }
  })
  
  return flushes
}

function findFullHouses(cards: Card[]): CardHint[] {
  const fullHouses: CardHint[] = []
  const rankCounts = cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const threeRanks = Object.entries(rankCounts).filter(([, count]) => count >= 3)
  const pairRanks = Object.entries(rankCounts).filter(([, count]) => count >= 2)
  
  threeRanks.forEach(([threeRank]) => {
    pairRanks.forEach(([pairRank]) => {
      if (threeRank !== pairRank) {
        const threeCards = cards.filter(c => c.rank === parseInt(threeRank)).slice(0, 3)
        const pairCards = cards.filter(c => c.rank === parseInt(pairRank)).slice(0, 2)
        fullHouses.push({
          cards: [...threeCards, ...pairCards],
          type: "葫芦",
          strength: getCardValue(threeCards[0]),
          description: `出葫芦 ${threeCards[0].display}${threeCards[1].display}${threeCards[2].display}+${pairCards[0].display}${pairCards[1].display}`
        })
      }
    })
  })
  
  return fullHouses
}

function findFourOfAKind(cards: Card[]): CardHint[] {
  const fours: CardHint[] = []
  const rankCounts = cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  Object.entries(rankCounts).forEach(([rank, count]) => {
    if (count >= 4) {
      const fourCards = cards.filter(c => c.rank === parseInt(rank)).slice(0, 4)
      fours.push({
        cards: fourCards,
        type: "四条",
        strength: getCardValue(fourCards[0]),
        description: `出四条 ${fourCards[0].display}${fourCards[1].display}${fourCards[2].display}${fourCards[3].display}`
      })
    }
  })
  
  return fours
}

function findFourOfAKindPlusOne(cards: Card[]): CardHint[] {
  const fourPlusOnes: CardHint[] = []
  const rankCounts = cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const fourRanks = Object.entries(rankCounts).filter(([, count]) => count >= 4)
  const singleRanks = Object.entries(rankCounts).filter(([, count]) => count >= 1)
  
  fourRanks.forEach(([fourRank]) => {
    singleRanks.forEach(([singleRank]) => {
      if (fourRank !== singleRank) {
        const fourCards = cards.filter(c => c.rank === parseInt(fourRank)).slice(0, 4)
        const singleCard = cards.find(c => c.rank === parseInt(singleRank))
        if (singleCard) {
          fourPlusOnes.push({
            cards: [...fourCards, singleCard],
            type: "金刚",
            strength: getCardValue(fourCards[0]),
            description: `出金刚 ${fourCards[0].display}${fourCards[1].display}${fourCards[2].display}${fourCards[3].display}+${singleCard.display}`
          })
        }
      }
    })
  })
  
  return fourPlusOnes
}

function findStraightFlushes(cards: Card[]): CardHint[] {
  const straightFlushes: CardHint[] = []
  const suitGroups = cards.reduce((acc, card) => {
    if (!acc[card.suit]) acc[card.suit] = []
    acc[card.suit].push(card)
    return acc
  }, {} as Record<string, Card[]>)
  
  Object.values(suitGroups).forEach(suitCards => {
    if (suitCards.length >= 5) {
      const sorted = suitCards.sort((a, b) => getCardValue(a) - getCardValue(b))
      for (let i = 0; i <= sorted.length - 5; i++) {
        const fiveCards = sorted.slice(i, i + 5)
        if (isStraightFlush(fiveCards)) {
          straightFlushes.push({
            cards: fiveCards,
            type: "同花顺",
            strength: getPlayStrength(fiveCards),
            description: `出同花顺 ${fiveCards.map(c => c.display).join('-')}`
          })
        }
      }
    }
  })
  
  return straightFlushes
}
