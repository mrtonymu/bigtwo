"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type Player } from "@/lib/game-logic"
import { cn } from "@/lib/utils"

interface PlayerInfoCardProps {
  player: Player
  position: "top" | "left" | "right" | "bottom"
  isCurrentPlayer?: boolean
  isActivePlayer?: boolean
  turnStatus?: string
  score?: number
  cardCount?: number
  className?: string
}

export function PlayerInfoCard({
  player,
  position,
  isCurrentPlayer = false,
  isActivePlayer = false,
  turnStatus,
  score = 0,
  cardCount,
  className
}: PlayerInfoCardProps) {
  // 根据位置计算样式
  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return "flex-col items-center"
      case "bottom":
        return "flex-col items-center"
      case "left":
        return "flex-col items-center"
      case "right":
        return "flex-col items-center"
      default:
        return "flex-col items-center"
    }
  }

  // 获取玩家编号显示
  const getPlayerNumber = () => {
    return player.position + 1
  }

  return (
    <Card 
      className={cn(
        "relative transition-all duration-300 hover:shadow-lg",
        "bg-white/90 backdrop-blur-sm border-2",
        isCurrentPlayer && "border-blue-500 bg-blue-50/90",
        isActivePlayer && "border-green-500 bg-green-50/90 shadow-green-200/50 shadow-lg",
        !isCurrentPlayer && !isActivePlayer && "border-gray-200",
        "min-w-[100px] max-w-[140px]",
        className
      )}
    >
      <CardContent className={cn("p-3 flex", getPositionStyles())}>
        {/* 玩家编号 */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2",
          isCurrentPlayer ? "bg-blue-500 text-white" : 
          isActivePlayer ? "bg-green-500 text-white" : 
          "bg-red-500 text-white"
        )}>
          {getPlayerNumber()}
        </div>

        {/* 玩家名称 */}
        <div className="text-center mb-2">
          <div className="text-xs font-medium text-gray-600 truncate max-w-[80px]">
            {player.name}
          </div>
        </div>

        {/* 分数显示 */}
        <div className="text-center mb-2">
          <div className="text-xs text-gray-500">Score</div>
          <div className="text-sm font-bold text-gray-800">{score}</div>
        </div>

        {/* 回合状态 */}
        {turnStatus && (
          <Badge 
            variant={isActivePlayer ? "default" : "secondary"}
            className="text-xs px-2 py-1 mb-2"
          >
            {turnStatus}
          </Badge>
        )}

        {/* 手牌数量 */}
        {cardCount !== undefined && (
          <div className="text-center">
            <div className="text-xs text-gray-500">Cards</div>
            <div className="text-sm font-bold text-gray-800">{cardCount}</div>
          </div>
        )}

        {/* 当前玩家指示器 */}
        {isCurrentPlayer && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        )}

        {/* 活跃玩家指示器 */}
        {isActivePlayer && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </CardContent>
    </Card>
  )
}

// 玩家信息卡片骨架屏
export function PlayerInfoCardSkeleton({ position }: { position: "top" | "left" | "right" | "bottom" }) {
  return (
    <Card className="min-w-[100px] max-w-[140px] bg-gray-100 animate-pulse">
      <CardContent className="p-3 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-gray-300 mb-2" />
        <div className="w-16 h-3 bg-gray-300 rounded mb-2" />
        <div className="w-12 h-4 bg-gray-300 rounded mb-2" />
        <div className="w-14 h-5 bg-gray-300 rounded" />
      </CardContent>
    </Card>
  )
}