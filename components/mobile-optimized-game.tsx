'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Card } from '@/lib/game-logic'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { ProgressBar, LoadingSpinner } from '@/components/visual-feedback'

interface MobileGameTableProps {
  cards: Card[]
  onPlayCards: (cards: Card[]) => void
  onPass: () => void
  currentPlayer: number
  myPosition: number
  playerName: string
  sortBy: 'rank' | 'suit'
  onSortChange: (sortBy: 'rank' | 'suit') => void
  selectedCards: Card[]
  onCardSelect: (card: Card) => void
  timeLeft: number
  totalTime: number
  gameStatus: 'waiting' | 'playing' | 'finished'
}

export function MobileGameTable({
  cards,
  onPlayCards,
  onPass,
  currentPlayer,
  myPosition,
  playerName,
  sortBy,
  onSortChange,
  selectedCards,
  onCardSelect,
  timeLeft,
  totalTime,
  gameStatus
}: MobileGameTableProps) {
  const { theme } = useTheme()
  const [isCardSelectionOpen, setIsCardSelectionOpen] = useState(false)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const sortedCards = [...cards].sort((a, b) => {
    if (sortBy === 'rank') {
      if (a.rank !== b.rank) return a.rank - b.rank
      return ["hearts", "diamonds", "clubs", "spades"].indexOf(a.suit) -
        ["hearts", "diamonds", "clubs", "spades"].indexOf(b.suit)
    } else {
      return ["hearts", "diamonds", "clubs", "spades"].indexOf(a.suit) -
        ["hearts", "diamonds", "clubs", "spades"].indexOf(b.suit) ||
        a.rank - b.rank
    }
  })

  // Handle touch events for better mobile experience
  const handleTouchStart = (e: React.TouchEvent, card: Card) => {
    // Prevent default to avoid scrolling while interacting with cards
    e.preventDefault()
  }

  const handleCardAction = (action: 'play' | 'select' | 'deselect', card?: Card) => {
    if (!card) return
    
    if (action === 'play') {
      onPlayCards([card])
    } else if (action === 'select') {
      onCardSelect(card)
    } else if (action === 'deselect') {
      onCardSelect(card)
    }
  }

  // Check if it's the current player's turn
  const isMyTurn = currentPlayer === myPosition && gameStatus === 'playing'

  // Simple card component for mobile view
  const MobileCard = ({ card, index, isSelected, onClick }: { 
    card: Card, 
    index: number, 
    isSelected: boolean, 
    onClick: () => void 
  }) => {
    const isRedSuit = card.suit === "hearts" || card.suit === "diamonds"
    
    return (
      <button
        key={`${card.suit}-${card.rank}-${index}`}
        onClick={onClick}
        className={`playing-card ${isRedSuit ? "red-suit" : "black-suit"} ${
          isSelected ? "selected" : ""
        } w-12 h-16 sm:w-14 sm:h-20 rounded-md border-2 flex flex-col items-center justify-center text-xs sm:text-sm ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        } shadow-md active:scale-95 transition-all duration-200 touch-manipulation`}
      >
        <span className={`font-bold ${isRedSuit ? "text-red-600" : "text-gray-800"}`}>
          {card.display}
        </span>
        <span className={`text-lg ${isRedSuit ? "text-red-500" : "text-gray-700"}`}>
          {card.suit === "hearts" && "♥"}
          {card.suit === "diamonds" && "♦"}
          {card.suit === "clubs" && "♣"}
          {card.suit === "spades" && "♠"}
        </span>
      </button>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* Game Info Bar */}
      <div className="flex justify-between items-center bg-card rounded-lg p-3 shadow">
        <div>
          <h3 className="font-bold">玩家: {playerName}</h3>
          <p className="text-sm text-muted-foreground">
            {isMyTurn ? '轮到你了!' : '等待其他玩家...'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm">手牌: {cards.length}</p>
          <div className="w-16">
            <ProgressBar value={timeLeft} max={totalTime} color="bg-green-500" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-card rounded-lg p-3 shadow">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">按点数</SelectItem>
            <SelectItem value="suit">按花色</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSortChange(sortBy === 'rank' ? 'suit' : 'rank')}
          >
            {sortBy === 'rank' ? '♠' : '123'}
          </Button>
          
          {isMyTurn && (
            <>
              <Button 
                size="sm"
                onClick={() => setIsCardSelectionOpen(true)}
                disabled={selectedCards.length === 0}
              >
                出牌
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onPass}
              >
                跳过
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Card Selection Dialog */}
      <Dialog open={isCardSelectionOpen} onOpenChange={setIsCardSelectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择要出的牌</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {selectedCards.map((card, index) => (
              <MobileCard
                key={`${card.suit}-${card.rank}-${index}`}
                card={card}
                index={index}
                isSelected={true}
                onClick={() => onCardSelect(card)}
              />
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCardSelectionOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              onPlayCards(selectedCards)
              setIsCardSelectionOpen(false)
            }}>
              确认出牌
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Menu Dialog */}
      <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg"
            size="icon"
          >
            +
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>游戏操作</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => onSortChange('rank')}>按点数排列</Button>
            <Button onClick={() => onSortChange('suit')}>按花色排列</Button>
            <Button 
              variant="secondary" 
              onClick={onPass}
              disabled={!isMyTurn}
            >
              跳过回合
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setIsCardSelectionOpen(true)}
              disabled={!isMyTurn || selectedCards.length === 0}
            >
              出牌
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cards Display */}
      <div className="bg-card rounded-lg p-4 shadow">
        <h4 className="font-semibold mb-2">我的手牌</h4>
        {cards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>没有手牌</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {sortedCards.map((card, index) => (
              <div 
                key={`${card.suit}-${card.rank}-${index}`}
                onTouchStart={(e) => handleTouchStart(e, card)}
                onClick={() => handleCardAction('select', card)}
              >
                <MobileCard
                  card={card}
                  index={index}
                  isSelected={selectedCards.some(
                    c => c.suit === card.suit && c.rank === card.rank
                  )}
                  onClick={() => onCardSelect(card)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Status Overlay */}
      {gameStatus === 'waiting' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-xl text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4">等待游戏开始...</p>
          </div>
        </div>
      )}
    </div>
  )
}