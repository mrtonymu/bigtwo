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
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"]
  const ranks = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] // 3-K, A, 2
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
export function isValidPlay(cards: Card[], lastPlay: Card[]): boolean {
  if (cards.length === 0) return false

  // First play of the game
  if (lastPlay.length === 0) {
    return isValidCombination(cards)
  }

  // Must play same number of cards
  if (cards.length !== lastPlay.length) return false

  // Must be valid combination
  if (!isValidCombination(cards)) return false

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


// Check if five cards form a valid hand (straight, flush, full house, four of a kind + one)
function isFiveCardHand(cards: Card[]): boolean {
  const sorted = [...cards].sort((a, b) => a.rank - b.rank)

  // Check for straight
  const isStraight = sorted.every((card, i) => i === 0 || card.rank === sorted[i - 1].rank + 1)

  // Check for flush
  const isFlush = cards.every((card) => card.suit === cards[0].suit)

  // Check for full house
  const ranks = sorted.map((c) => c.rank)
  const rankCounts = ranks.reduce(
    (acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )
  const counts = Object.values(rankCounts).sort()
  const isFullHouse = counts.length === 2 && counts[0] === 2 && counts[1] === 3

  // Check for four of a kind + one (金刚)
  const isFourOfAKindPlusOne = counts.length === 2 && counts[0] === 1 && counts[1] === 4

  return isStraight || isFlush || isFullHouse || isFourOfAKindPlusOne
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
  // Suit order: hearts < diamonds < clubs < spades
  const suitValue = ["hearts", "diamonds", "clubs", "spades"].indexOf(card.suit)
  return card.rank * 4 + suitValue
}


// Get hand value for five card combinations
function getHandValue(cards: Card[]): number {
  const sorted = [...cards].sort((a, b) => a.rank - b.rank)
  const isFlush = cards.every((card) => card.suit === cards[0].suit)
  const isStraight = sorted.every((card, i) => i === 0 || card.rank === sorted[i - 1].rank + 1)

  if (isStraight && isFlush) return 8000 + sorted[4].rank // Straight flush
  if (isFlush) return 5000 + sorted[4].rank // Flush
  if (isStraight) return 4000 + sorted[4].rank // Straight

  // Check for four of a kind + one (金刚) and full house
  const ranks = sorted.map((c) => c.rank)
  const rankCounts = ranks.reduce(
    (acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  const counts = Object.values(rankCounts).sort()
  
  // Four of a kind + one (金刚)
  if (counts.length === 2 && counts[0] === 1 && counts[1] === 4) {
    const fourOfAKindRank = Object.keys(rankCounts).find((rank) => rankCounts[Number(rank)] === 4)
    return 7000 + Number(fourOfAKindRank) // Four of a kind + one (金刚)
  }

  // Full house
  const tripleRank = Object.keys(rankCounts).find((rank) => rankCounts[Number(rank)] === 3)
  if (tripleRank) return 6000 + Number(tripleRank) // Full house

  return Math.max(...cards.map(getCardValue)) // High card
}
