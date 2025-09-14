"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { type Card as GameCard, type Player, type GameState, type PlayHistory, getPlayTypeName } from "@/lib/game-logic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CNFLIXLogo } from "@/components/cnflix-logo"
import Link from "next/link"
import toast from "react-hot-toast"
import { useReconnect } from "@/hooks/use-reconnect"

interface SpectatorModeProps {
  gameId: string
  spectatorName: string
}

export function SpectatorMode({ gameId, spectatorName }: SpectatorModeProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameWinner, setGameWinner] = useState<string | null>(null)
  const supabase = createClient()

  // 重连功能
  const { isConnected, isReconnecting, manualReconnect } = useReconnect({
    onReconnect: () => {
      fetchGameData()
    },
    onDisconnect: () => {
      toast.error('连接断开，正在尝试重连...')
    }
  })

  // 获取游戏数据
  const fetchGameData = useCallback(async () => {
    try {
      setIsLoading(true)

      // 获取游戏信息
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single()

      if (gameError) throw gameError

      // 获取玩家信息
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .order("position")

      if (playersError) throw playersError

      // 获取游戏状态
      const { data: gameStateData, error: gameStateError } = await supabase
        .from("game_state")
        .select("*")
        .eq("game_id", gameId)
        .single()

      if (gameStateError) throw gameStateError

      // 处理玩家数据
      const playersList = playersData.map((p: any) => ({
        id: p.id,
        name: p.player_name,
        position: p.position,
        cards: p.cards || [],
        isSpectator: p.is_spectator || false
      }))

      setPlayers(playersList)

      // 处理游戏状态
      if (gameStateData) {
        const newState: GameState = {
          // @ts-ignore
          id: gameStateData.id,
          // @ts-ignore
          currentPlayer: gameStateData.current_player,
          // @ts-ignore
          lastPlay: gameStateData.last_play || [],
          // @ts-ignore
          lastPlayer: gameStateData.last_player,
          // @ts-ignore
          turnCount: gameStateData.turn_count,
          // @ts-ignore
          playHistory: gameStateData.play_history || []
        }
        setGameState(newState)
      }

      // 检查获胜者
      const winner = playersList.find((p: any) => p.cards.length === 0)
      if (winner && !gameWinner) {
        setGameWinner(winner.name)
      }

    } catch (error) {
      console.error("Error fetching game data:", error)
      toast.error("获取游戏数据失败")
    } finally {
      setIsLoading(false)
    }
  }, [gameId, gameWinner])

  useEffect(() => {
    fetchGameData()

    // 订阅实时更新
    const channel = supabase
      .channel(`spectator-game-${gameId}`)
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        () => fetchGameData()
      )
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "game_state", filter: `game_id=eq.${gameId}` },
        () => fetchGameData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, fetchGameData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p>加载观战数据中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameWinner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">游戏结束！</h1>
            <p className="text-xl text-gray-600 mb-6">获胜者: {gameWinner}</p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                刷新观战
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">返回大厅</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
                <Link href="/">← 返回大厅</Link>
              </Button>
              <Button variant="ghost" asChild size="sm" className="sm:hidden">
                <Link href="/">←</Link>
              </Button>
              <CNFLIXLogo size="sm" className="sm:hidden" />
              <CNFLIXLogo size="md" className="hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                👁️ 观战模式
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {spectatorName}
              </Badge>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                  {isConnected ? '已连接' : '连接中...'}
                </span>
                <span className="text-xs sm:text-sm text-gray-600 sm:hidden">
                  {isConnected ? '✓' : '...'}
                </span>
              </div>
              {isReconnecting && (
                <Button onClick={manualReconnect} variant="outline" size="sm" className="px-2 sm:px-3">
                  重连
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* 游戏状态 */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-center flex-1">
                游戏进行中
              </CardTitle>
              <div className="text-sm text-gray-600">
                第 {gameState?.turnCount || 0} 轮
              </div>
            </div>
            <div className="text-center">
              <span className="text-lg font-medium">
                当前玩家: {players[gameState?.currentPlayer || 0]?.name || "Unknown"}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* 玩家信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {players.map((player, index) => (
            <Card 
              key={player.id}
              className={`transition-all duration-500 ease-out hover:shadow-lg ${
                gameState?.currentPlayer === player.position 
                  ? 'ring-2 ring-blue-500 shadow-lg transform scale-105' 
                  : 'hover:transform hover:scale-102'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <CardContent className="p-3 sm:p-4 text-center">
                <h3 className="font-medium mb-2 transition-all duration-300 text-sm sm:text-base">
                  {player.name}
                </h3>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
                  <Badge 
                    variant="secondary" 
                    className="transition-all duration-300 hover:scale-105 text-xs"
                  >
                    {player.cards.length} 张牌
                  </Badge>
                  {gameState?.currentPlayer === player.position && (
                    <Badge className="bg-blue-500 animate-pulse text-xs">
                      当前回合
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 上一手牌 */}
        {gameState?.lastPlay && gameState.lastPlay.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 text-center">上一手牌</h3>
              <div className="flex justify-center gap-2 flex-wrap">
                {gameState.lastPlay.map((card, index) => (
                  <div 
                    key={`last-play-${card.suit}-${card.rank}-${index}`}
                    className="bg-white border rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-mono shadow-sm"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm sm:text-lg font-bold">{card.display}</span>
                      <span
                        className={`text-lg sm:text-2xl ${
                          card.suit === "hearts" || card.suit === "diamonds" ? "text-red-500" : "text-black"
                        }`}
                      >
                        {card.suit === "hearts" && "♥"}
                        {card.suit === "diamonds" && "♦"}
                        {card.suit === "clubs" && "♣"}
                        {card.suit === "spades" && "♠"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 游戏历史记录 */}
        {gameState?.playHistory && gameState.playHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">游戏历史</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {gameState.playHistory.slice(-10).reverse().map((play, index) => (
                  <div 
                    key={`history-${play.turn}-${index}`}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600">第{play.turn}轮</span>
                      <span className="text-gray-600">{play.playerName}</span>
                      <Badge variant="outline" className="text-xs">
                        {play.playType}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {play.cards.map((card, cardIndex) => (
                        <span 
                          key={`history-card-${cardIndex}`}
                          className={`text-xs px-1 py-0.5 rounded ${
                            card.suit === "hearts" || card.suit === "diamonds" 
                              ? "bg-red-100 text-red-700" 
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {card.display}
                          {card.suit === "hearts" && "♥"}
                          {card.suit === "diamonds" && "♦"}
                          {card.suit === "clubs" && "♣"}
                          {card.suit === "spades" && "♠"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
