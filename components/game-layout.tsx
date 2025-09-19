"use client"

import { PlayerInfoCard } from "@/components/player-info-card"
import { GameCenterArea } from "@/components/game-center-area"
import { PlayerHandArea } from "@/components/player-hand-area"
import { type Player, type Card as GameCard, type PlayHistory, type CardHint } from "@/lib/game-logic"
import { cn } from "@/lib/utils"

interface GameLayoutProps {
  // 游戏状态
  gameState: {
    id: string
    currentPlayer: number
    lastPlay: GameCard[]
    lastPlayer?: number
    turnCount: number
    playHistory?: PlayHistory[]
    status: "waiting" | "playing" | "finished"
  } | null
  
  // 玩家信息
  players: Player[]
  myPosition: number
  
  // 手牌相关
  myCards: GameCard[]
  selectedCards: GameCard[]
  cardHints: CardHint[]
  
  // UI状态
  isMyTurn: boolean
  isHost: boolean
  timeRemaining: number
  isConnected: boolean
  isReconnecting: boolean
  backgroundMusic: boolean
  currentTheme: any
  gameOptions: any
  showHints: boolean
  showOptions: boolean
  showStats: boolean
  showThemeSelector: boolean
  clickAnimation?: string
  sensors: any
  
  // 操作回调
  onCardClick: (card: GameCard) => void
  onDragEnd: (event: any) => void
  onPlay: () => void
  onPass: () => void
  onToggleHints: () => void
  onApplyHint: (hint: CardHint) => void
  onSortCards: (type: "suit" | "rank" | "auto") => void
  onStartNewGame: () => void
  onEndGame: () => void
  onToggleBackgroundMusic: () => void
  onShowStats: () => void
  onShowThemeSelector: () => void
  onShowOptions: () => void
  onManualReconnect: () => void
  onCloseOptions: () => void
  onCloseStats: () => void
  onCloseThemeSelector: () => void
  onSaveGameOptions: (options: any) => void
  onThemeChange: (theme: any) => void
  
  // 其他
  gameId: string
  playerName: string
  className?: string
}

export function GameLayout({
  gameState,
  players,
  myPosition,
  myCards,
  selectedCards,
  cardHints,
  isMyTurn,
  isHost,
  timeRemaining,
  isConnected,
  isReconnecting,
  backgroundMusic,
  currentTheme,
  gameOptions,
  showHints,
  showOptions,
  showStats,
  showThemeSelector,
  clickAnimation,
  sensors,
  onCardClick,
  onDragEnd,
  onPlay,
  onPass,
  onToggleHints,
  onApplyHint,
  onSortCards,
  onStartNewGame,
  onEndGame,
  onToggleBackgroundMusic,
  onShowStats,
  onShowThemeSelector,
  onShowOptions,
  onManualReconnect,
  onCloseOptions,
  onCloseStats,
  onCloseThemeSelector,
  onSaveGameOptions,
  onThemeChange,
  gameId,
  playerName,
  className
}: GameLayoutProps) {
  // 如果游戏状态为空，显示加载状态
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  // 获取当前玩家
  const currentPlayer = players[myPosition]
  
  // 获取其他玩家（按顺序排列）
  const otherPlayers = players.filter((_, index) => index !== myPosition)

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden",
      className
    )}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full blur-3xl" />
      </div>

      {/* 游戏布局 */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* 顶部玩家区域 */}
         <div className="flex-1 flex items-start justify-center pt-8">
           {otherPlayers.length > 0 && (
             <PlayerInfoCard
               player={otherPlayers[0]}
               position="top"
               isCurrentPlayer={gameState.currentPlayer === players.indexOf(otherPlayers[0])}
               isActivePlayer={gameState.currentPlayer === players.indexOf(otherPlayers[0])}
               turnStatus={gameState.currentPlayer === players.indexOf(otherPlayers[0]) ? "出牌中" : "等待"}
               cardCount={otherPlayers[0].cards.length}
             />
           )}
         </div>

         {/* 中间游戏区域 */}
         <div className="flex-1 flex items-center">
           {/* 左侧玩家 */}
           <div className="flex-1 flex justify-start pl-8">
             {otherPlayers.length > 1 && (
               <PlayerInfoCard
                 player={otherPlayers[1]}
                 position="left"
                 isCurrentPlayer={gameState.currentPlayer === players.indexOf(otherPlayers[1])}
                 isActivePlayer={gameState.currentPlayer === players.indexOf(otherPlayers[1])}
                 turnStatus={gameState.currentPlayer === players.indexOf(otherPlayers[1]) ? "出牌中" : "等待"}
                 cardCount={otherPlayers[1].cards.length}
               />
             )}
           </div>

           {/* 中央游戏区域 */}
           <div className="flex-2 flex justify-center">
             <GameCenterArea
               lastPlay={gameState.lastPlay}
               lastPlayerName={gameState.lastPlayer !== undefined ? players[gameState.lastPlayer]?.name : undefined}
               lastPlayerPosition={gameState.lastPlayer}
               playHistory={gameState.playHistory}
               currentTurn={gameState.turnCount}
               gameStatus={gameState.status}
             />
           </div>

           {/* 右侧玩家 */}
           <div className="flex-1 flex justify-end pr-8">
             {otherPlayers.length > 2 && (
               <PlayerInfoCard
                 player={otherPlayers[2]}
                 position="right"
                 isCurrentPlayer={gameState.currentPlayer === players.indexOf(otherPlayers[2])}
                 isActivePlayer={gameState.currentPlayer === players.indexOf(otherPlayers[2])}
                 turnStatus={gameState.currentPlayer === players.indexOf(otherPlayers[2]) ? "出牌中" : "等待"}
                 cardCount={otherPlayers[2].cards.length}
               />
             )}
           </div>
         </div>

         {/* 底部当前玩家区域 */}
         <div className="flex-1 flex items-end justify-center pb-8">
           <PlayerHandArea
             cards={myCards}
             selectedCards={selectedCards}
             hints={cardHints}
             isMyTurn={isMyTurn}
             canPlay={selectedCards.length > 0 && isMyTurn}
             canPass={isMyTurn && gameState.lastPlay.length > 0}
             onCardSelect={onCardClick}
             onPlay={onPlay}
             onPass={onPass}
             onSort={onSortCards}
           />
         </div>
      </div>

      {/* 游戏状态覆盖层 */}
      {gameState.status === "waiting" && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">等待其他玩家加入</h2>
            <p className="text-gray-600">游戏将在所有玩家准备就绪后开始</p>
          </div>
        </div>
      )}

      {gameState.status === "finished" && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">游戏结束</h2>
            <p className="text-gray-600 mb-6">恭喜获胜者！</p>
            {isHost && (
              <div className="space-x-4">
                <button
                  onClick={onStartNewGame}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  开始新游戏
                </button>
                <button
                  onClick={onEndGame}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  结束游戏
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 其他UI组件 */}
      {showOptions && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-xl font-bold mb-4">游戏选项</h2>
            <button
              onClick={onCloseOptions}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showStats && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-xl font-bold mb-4">游戏统计</h2>
            <button
              onClick={onCloseStats}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showThemeSelector && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-xl font-bold mb-4">主题选择</h2>
            <button
              onClick={onCloseThemeSelector}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}