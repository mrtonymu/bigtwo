"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type Card as GameCard, type PlayHistory } from "@/lib/game-logic"
import { cn } from "@/lib/utils"

interface GameCenterAreaProps {
  lastPlay: GameCard[]
  lastPlayerName?: string
  lastPlayerPosition?: number
  playHistory?: PlayHistory[]
  currentTurn: number
  gameStatus: "waiting" | "playing" | "finished"
  className?: string
}

export function GameCenterArea({
  lastPlay,
  lastPlayerName,
  lastPlayerPosition,
  playHistory = [],
  currentTurn,
  gameStatus,
  className
}: GameCenterAreaProps) {
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

  // 渲染单张卡片
  const renderCard = (card: GameCard, index: number) => (
    <div
      key={`${card.suit}-${card.rank}-${index}`}
      className={cn(
        "relative bg-white rounded-lg border-2 border-gray-300 shadow-md",
        "w-12 h-16 flex flex-col items-center justify-center",
        "text-xs font-bold transition-transform hover:scale-105",
        index > 0 && "-ml-2" // 重叠效果
      )}
      style={{ zIndex: index }}
    >
      <div className={cn("text-center", getSuitColor(card.suit))}>
        <div className="text-[10px] leading-none">{card.display}</div>
        <div className="text-sm leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
    </div>
  )

  // 获取游戏状态显示
  const getGameStatusDisplay = () => {
    switch (gameStatus) {
      case "waiting":
        return { text: "等待开始", color: "bg-yellow-500" }
      case "playing":
        return { text: "游戏中", color: "bg-green-500" }
      case "finished":
        return { text: "游戏结束", color: "bg-red-500" }
      default:
        return { text: "未知", color: "bg-gray-500" }
    }
  }

  const statusDisplay = getGameStatusDisplay()

  return (
    <Card className={cn(
      "bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300",
      "min-h-[200px] flex flex-col justify-center items-center",
      className
    )}>
      <CardContent className="p-6 w-full">
        {/* 游戏状态和回合信息 */}
        <div className="flex justify-between items-center mb-4">
          <Badge className={cn("text-white", statusDisplay.color)}>
            {statusDisplay.text}
          </Badge>
          <div className="text-sm text-gray-600">
            回合 {currentTurn}
          </div>
        </div>

        {/* 中央卡片区域 */}
        <div className="flex flex-col items-center justify-center min-h-[120px]">
          {lastPlay.length > 0 ? (
            <>
              {/* 上一手牌玩家信息 */}
              {lastPlayerName && (
                <div className="mb-3 text-center">
                  <div className="text-sm text-gray-600">上一手牌</div>
                  <div className="text-lg font-bold text-gray-800">
                    玩家 {(lastPlayerPosition ?? 0) + 1} - {lastPlayerName}
                  </div>
                </div>
              )}

              {/* 卡片展示 */}
              <div className="flex items-center justify-center mb-3">
                {lastPlay.map((card, index) => renderCard(card, index))}
              </div>

              {/* 牌型信息 */}
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  {lastPlay.length === 1 ? "单张" :
                   lastPlay.length === 2 ? "对子" :
                   lastPlay.length === 3 ? "三条" :
                   lastPlay.length === 5 ? "五张牌" :
                   `${lastPlay.length}张牌`}
                </Badge>
              </div>
            </>
          ) : (
            /* 无卡片时的占位内容 */
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🃏</div>
              <div className="text-lg font-medium">等待出牌</div>
              <div className="text-sm">玩家可以开始出牌</div>
            </div>
          )}
        </div>

        {/* 游戏历史快速预览 */}
        {playHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-300">
            <div className="text-xs text-gray-600 mb-2">最近动作</div>
            <div className="flex gap-2 overflow-x-auto">
              {playHistory.slice(-3).map((history, index) => (
                <div
                  key={`${history.turn}-${index}`}
                  className="flex-shrink-0 bg-white/50 rounded px-2 py-1 text-xs"
                >
                  <div className="font-medium">{history.playerName}</div>
                  <div className="text-gray-600">{history.playType}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 游戏中央区域骨架屏
export function GameCenterAreaSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 min-h-[200px] animate-pulse">
      <CardContent className="p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="w-16 h-6 bg-gray-300 rounded" />
          <div className="w-12 h-4 bg-gray-300 rounded" />
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[120px]">
          <div className="w-24 h-4 bg-gray-300 rounded mb-3" />
          <div className="flex gap-2 mb-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-12 h-16 bg-gray-300 rounded" />
            ))}
          </div>
          <div className="w-16 h-6 bg-gray-300 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}