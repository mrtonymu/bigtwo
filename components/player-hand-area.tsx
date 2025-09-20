"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Card as GameCard, type CardHint } from "@/lib/game-logic"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface PlayerHandAreaProps {
  cards: GameCard[]
  selectedCards: GameCard[]
  onCardSelect: (card: GameCard) => void
  onPlay: () => void
  onPass: () => void
  onSort: (sortBy: "suit" | "rank" | "auto") => void
  canPlay: boolean
  canPass: boolean
  hints?: CardHint[]
  isMyTurn: boolean
  className?: string
}

export function PlayerHandArea({
  cards,
  selectedCards,
  onCardSelect,
  onPlay,
  onPass,
  onSort,
  canPlay,
  canPass,
  hints = [],
  isMyTurn,
  className
}: PlayerHandAreaProps) {
  const [showHints, setShowHints] = useState(false)

  // 获取卡片花色符号
  const getSuitSymbol = (suit: GameCard["suit"]) => {
    switch (suit) {
      case "hearts": return "♥"
      case "diamonds": return "♦"
      case "clubs": return "♣"
      case "spades": return "♠"
      default: return ""
    }
  }

  // 获取卡片花色颜色
  const getSuitColor = (suit: GameCard["suit"]) => {
    return suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-black"
  }

  // 检查卡片是否被选中
  const isCardSelected = (card: GameCard) => {
    return selectedCards.some(
      selected => selected.suit === card.suit && selected.rank === card.rank
    )
  }

  // 渲染单张卡片
  const renderCard = (card: GameCard, index: number) => {
    const selected = isCardSelected(card)
    
    return (
      <div
        key={`${card.suit}-${card.rank}-${index}`}
        className={cn(
          "relative bg-white rounded-lg border-2 shadow-md cursor-pointer",
          "w-14 h-20 flex flex-col items-center justify-center",
          "text-sm font-bold transition-all duration-200",
          "hover:scale-105 hover:shadow-lg",
          "md:w-16 md:h-24 md:text-base",
          "lg:w-18 lg:h-26",
          selected ? "border-blue-500 bg-blue-50 -translate-y-2" : "border-gray-300",
          !isMyTurn && "cursor-not-allowed opacity-60",
          index > 0 && "-ml-2", // 重叠效果
          "touch-manipulation" // 移动端触摸优化
        )}
        style={{ zIndex: selected ? 100 : index }}
        onClick={() => isMyTurn && onCardSelect(card)}
        onTouchStart={() => isMyTurn && onCardSelect(card)} // 移动端触摸支持
      >
        <div className={cn("text-center", getSuitColor(card.suit))}>
          <div className="text-xs leading-none md:text-sm">{card.display}</div>
          <div className="text-lg leading-none md:text-xl">{getSuitSymbol(card.suit)}</div>
        </div>
        
        {/* 选中指示器 */}
        {selected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center md:w-5 md:h-5">
            <div className="w-2 h-2 bg-white rounded-full md:w-2.5 md:h-2.5" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn(
      "bg-gradient-to-t from-blue-50 to-white border-2",
      isMyTurn ? "border-blue-300 shadow-lg" : "border-gray-200",
      className
    )}>
      <CardContent className="p-4">
        {/* 操作栏 */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          {/* 左侧：排序按钮 */}
          <div className="flex flex-wrap gap-1 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSort("auto")}
              className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
            >
              自动排序
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSort("suit")}
              className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
            >
              花色
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSort("rank")}
              className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
            >
              点数
            </Button>
          </div>

          {/* 中间：手牌信息 */}
          <div className="flex items-center gap-1 md:gap-2">
            <Badge variant="secondary" className="text-xs md:text-sm px-2 py-0.5">
              手牌: {cards.length}
            </Badge>
            {selectedCards.length > 0 && (
              <Badge variant="default" className="text-xs md:text-sm px-2 py-0.5">
                已选: {selectedCards.length}
              </Badge>
            )}
          </div>

          {/* 右侧：提示按钮 */}
          {hints.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
            >
              提示 ({hints.length})
            </Button>
          )}
        </div>

        {/* 提示区域 */}
        {showHints && hints.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 mb-2">出牌建议:</div>
            <div className="space-y-1">
              {hints.slice(0, 3).map((hint, index) => (
                <div key={index} className="text-xs text-yellow-700 md:text-sm">
                  <span className="font-medium">{hint.type}</span>: {hint.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 手牌区域 */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 justify-center min-h-[80px] items-end">
            {cards.map((card, index) => renderCard(card, index))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={onPlay}
            disabled={!canPlay || !isMyTurn || selectedCards.length === 0}
            className="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base"
          >
            出牌
          </Button>
          <Button
            variant="outline"
            onClick={onPass}
            disabled={!canPass || !isMyTurn}
            className="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base"
          >
            过牌
          </Button>
        </div>

        {/* 回合状态提示 */}
        <div className="mt-3 text-center">
          {isMyTurn ? (
            <div className="text-sm text-green-600 font-medium md:text-base">
              轮到你了！请选择卡片出牌或过牌
            </div>
          ) : (
            <div className="text-sm text-gray-500 md:text-base">
              等待其他玩家操作...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 玩家手牌区域骨架屏
export function PlayerHandAreaSkeleton() {
  return (
    <Card className="bg-gradient-to-t from-gray-100 to-white border-2 border-gray-200 animate-pulse">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-8 bg-gray-300 rounded" />
            ))}
          </div>
          <div className="w-20 h-6 bg-gray-300 rounded" />
          <div className="w-16 h-8 bg-gray-300 rounded" />
        </div>
        
        <div className="mb-4">
          <div className="flex gap-1 justify-center min-h-[80px] items-end">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
              <div key={i} className="w-14 h-20 bg-gray-300 rounded -ml-2" />
            ))}
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <div className="w-20 h-10 bg-gray-300 rounded" />
          <div className="w-20 h-10 bg-gray-300 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}