"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { type Card as GameCard, type Player, type GameState, isValidPlay, createDeck, dealCards, sortCards, autoArrangeCards } from "@/lib/game-logic"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameOptions, type GameOptions as GameOptionsType } from "@/components/game-options"
import Link from "next/link"
import toast from "react-hot-toast"
import { useReconnect } from "@/hooks/use-reconnect"
import { GameTableSkeleton } from "@/components/game-room-skeleton"
import { CNFLIXLogo } from "@/components/cnflix-logo"

interface GameTableProps {
  gameId: string
  playerName: string
}

export function GameTable({ gameId, playerName }: GameTableProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myCards, setMyCards] = useState<GameCard[]>([])
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([])
  const [myPosition, setMyPosition] = useState<number>(-1)
  const [gameWinner, setGameWinner] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameOptions, setGameOptions] = useState<GameOptionsType>({
    allowSpectators: true,
    gameSpeed: "normal",
    autoPass: false,
    showCardCount: true,
    cardSorting: "auto",
    autoArrange: true,
  })
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
  const fetchGameData = async () => {
    try {
      setIsLoading(true)
      
      // 并行获取玩家和游戏状态数据
      const [playersResult, gameStateResult] = await Promise.all([
        supabase
          .from("players")
          .select("*")
          .eq("game_id", gameId)
          .order("position"),
        supabase
          .from("game_state")
          .select("*")
          .eq("game_id", gameId)
          .single()
      ])

      if (playersResult.error) throw playersResult.error
      
      const playersData = playersResult.data || []
      const gameStateData = gameStateResult.data

      // 如果游戏状态不存在，说明游戏还没开始
      if (gameStateResult.error && gameStateResult.error.code === 'PGRST116') {
        console.log("Game state not found, game not started yet")
        setGameState(null)
        setPlayers(playersData.map((p) => ({
          id: p.id,
          name: p.player_name,
          position: p.position,
          cards: p.cards || [],
          isSpectator: p.is_spectator,
        })))
        setIsLoading(false)
        return
      }

      if (gameStateResult.error) throw gameStateResult.error

      // 转换玩家数据格式
      const playersList = playersData.map((p) => ({
        id: p.id,
        name: p.player_name,
        position: p.position,
        cards: p.cards || [],
        isSpectator: p.is_spectator,
      }))

      setPlayers(playersList)

      // 检查获胜者
      const winner = playersList.find((p) => p.cards.length === 0)
      if (winner && !gameWinner) {
        setGameWinner(winner.name)
        // Update game status to finished
        await supabase.from("games").update({ status: "finished" }).eq("id", gameId)
      }

      if (gameStateData) {
        setGameState({
          id: gameStateData.id,
          currentPlayer: gameStateData.current_player,
          lastPlay: gameStateData.last_play || [],
          lastPlayer: gameStateData.last_player,
          turnCount: gameStateData.turn_count,
        })
      }

      // 找到当前玩家的位置和手牌
      const myPlayer = playersData.find(p => p.player_name === playerName)
      if (myPlayer) {
        setMyPosition(myPlayer.position)
        let sortedCards = myPlayer.cards || []
        if (gameOptions.autoArrange) {
          sortedCards = autoArrangeCards(sortedCards)
        } else {
          sortedCards = sortCards(sortedCards, gameOptions.cardSorting)
        }
        setMyCards(sortedCards)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching game data:", error)
      toast.error("获取游戏数据失败")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [gameId, playerName])

  useEffect(() => {
    // Subscribe to game updates
    const channel = supabase
      .channel(`game-${gameId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` }, () =>
        fetchGameData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_state", filter: `game_id=eq.${gameId}` },
        () => fetchGameData(),
      )
      .subscribe()

    fetchGameData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])


  const handleCardClick = (card: GameCard) => {
    // 添加点击反馈动画
    const cardElement = document.querySelector(`[data-card-id="${card.suit}-${card.rank}"]`)
    if (cardElement) {
      cardElement.classList.add('card-selected')
      setTimeout(() => {
        cardElement.classList.remove('card-selected')
      }, 300)
    }

    setSelectedCards((prev) => {
      const isSelected = prev.some((c) => c.suit === card.suit && c.rank === card.rank)
      if (isSelected) {
        return prev.filter((c) => !(c.suit === card.suit && c.rank === card.rank))
      } else {
        return [...prev, card]
      }
    })
  }

  const handlePlay = async () => {
    if (!gameState || selectedCards.length === 0) return

    try {
      // Calculate remaining cards after this play
      const remainingCards = myCards.filter(
        (card) => !selectedCards.some((selected) => selected.suit === card.suit && selected.rank === card.rank),
      )

      // Validate play
      if (!isValidPlay(selectedCards, gameState.lastPlay, players.length, remainingCards)) {
        if (remainingCards.length === 1 && remainingCards[0].suit === "spades") {
          toast.error("不能留下单张♠作为最后一张牌！")
        } else {
          toast.error("出牌无效！请选择有效的牌型")
        }
        return
      }

      // Update player's cards
      const newCards = myCards.filter(
        (card) => !selectedCards.some((selected) => selected.suit === card.suit && selected.rank === card.rank),
      )

      // Update player
      const { error: playerError } = await supabase
        .from("players")
        .update({ cards: newCards })
        .eq("game_id", gameId)
        .eq("player_name", playerName)

      if (playerError) {
        console.error("Error updating player cards:", playerError)
        toast.error("更新手牌失败")
        return
      }

      // Update game state
      const nextPlayer = (gameState.currentPlayer + 1) % players.length
      const { error: gameStateError } = await supabase
        .from("game_state")
        .update({
          current_player: nextPlayer,
          last_play: selectedCards,
          last_player: myPosition,
          turn_count: gameState.turnCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameId)

      if (gameStateError) {
        console.error("Error updating game state:", gameStateError)
        toast.error("更新游戏状态失败")
        return
      }

      setSelectedCards([])
      toast.success("出牌成功！")
    } catch (error) {
      console.error("Error playing cards:", error)
      toast.error("出牌失败，请重试")
    }
  }

  const handlePass = async () => {
    if (!gameState) return

    try {
      const nextPlayer = (gameState.currentPlayer + 1) % players.length
      const { error } = await supabase
        .from("game_state")
        .update({
          current_player: nextPlayer,
          turn_count: gameState.turnCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameId)

      if (error) {
        console.error("Error passing turn:", error)
        toast.error("跳过回合失败")
        return
      }

      toast.success("已跳过回合")
    } catch (error) {
      console.error("Error passing turn:", error)
      toast.error("跳过回合失败，请重试")
    }
  }

  const startNewGame = async () => {
    const loadingToast = toast.loading("正在开始新游戏...")
    
    try {
      // 重置游戏状态
      setGameWinner(null)
      setSelectedCards([])
      
      // 创建新牌组并发牌
      const deck = createDeck()
      const shuffledDeck = deck.sort(() => Math.random() - 0.5)
      const hands = dealCards(shuffledDeck, players.length)

      // 更新每个玩家的手牌
      for (let i = 0; i < players.length; i++) {
        await supabase
          .from("players")
          .update({ cards: hands[i] })
          .eq("game_id", gameId)
          .eq("position", i)
      }

      // 重置游戏状态
      await supabase
        .from("game_state")
        .update({
          current_player: 0,
          last_play: [],
          last_player: null,
          turn_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameId)

      // 更新游戏状态为进行中
      await supabase
        .from("games")
        .update({ status: "in-progress" })
        .eq("id", gameId)

      toast.dismiss(loadingToast)
      toast.success("新游戏开始！")
      
      // 刷新游戏数据
      fetchGameData()
    } catch (error) {
      console.error("Error starting new game:", error)
      toast.dismiss(loadingToast)
      toast.error("开始新游戏失败，请重试")
    }
  }

  const isMyTurn = gameState?.currentPlayer === myPosition

  if (isLoading) {
    return <GameTableSkeleton />
  }

  // Show winner screen
  if (gameWinner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">游戏结束！</h1>
            <p className="text-xl text-gray-600 mb-6">获胜者: {gameWinner}</p>
            <div className="space-y-3">
              <Button onClick={startNewGame} className="w-full">
                开始新游戏
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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/">← 返回大厅</Link>
              </Button>
              <CNFLIXLogo size="md" />
            </div>
            <div className="flex items-center gap-4">
              {/* 连接状态指示器 */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? '已连接' : '连接断开'}
                </span>
                {isReconnecting && (
                  <span className="text-sm text-blue-600">重连中...</span>
                )}
                {!isConnected && !isReconnecting && (
                  <Button size="sm" variant="outline" onClick={manualReconnect}>
                    重连
                  </Button>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowOptions(true)}>
                <span className="mr-2">⚙️</span>
                观影设置
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        <Card className="mb-6 status-change">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Game Status</CardTitle>
              <div className="flex gap-4 text-sm text-gray-600">
                <span className="transition-all duration-300">Turn: {gameState?.turnCount || 0}</span>
                <span className="transition-all duration-300 font-medium">
                  Current: {players[gameState?.currentPlayer || 0]?.name || "Unknown"}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {players
            .filter((p) => p.position !== myPosition)
            .map((player, index) => (
              <Card 
                key={player.id}
                className={`transition-all duration-500 ease-out hover:shadow-lg status-change-animation ${
                  gameState?.currentPlayer === player.position 
                    ? 'ring-2 ring-blue-500 shadow-lg transform scale-105' 
                    : 'hover:transform hover:scale-102'
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-medium mb-2 transition-all duration-300">{player.name}</h3>
                  <div className="flex justify-center items-center gap-2">
                    {gameOptions.showCardCount && (
                      <Badge 
                        variant="secondary" 
                        className="transition-all duration-300 hover:scale-105"
                      >
                        {player.cards.length} cards
                      </Badge>
                    )}
                    {gameState?.currentPlayer === player.position && (
                      <Badge className="bg-blue-500 animate-pulse">
                        Current Turn
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {gameState?.lastPlay && gameState.lastPlay.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 text-center">Last Play</h3>
              <div className="flex justify-center gap-2 flex-wrap">
                {gameState.lastPlay.map((card, index) => (
                  <div 
                    key={`last-play-${card.suit}-${card.rank}-${index}`}
                    className="bg-white border rounded-lg p-3 text-sm font-mono shadow-sm transform transition-all duration-500 ease-out hover:scale-105 hover:shadow-md card-play-animation"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold">{card.display}</span>
                      <span
                        className={`text-2xl ${
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-center flex-1">Your Cards ({myCards.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sorted = sortCards(myCards, gameOptions.cardSorting)
                    setMyCards(sorted)
                    toast.success("手牌已排序")
                  }}
                  className="text-xs"
                >
                  🔄 排序
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const arranged = autoArrangeCards(myCards)
                    setMyCards(arranged)
                    toast.success("手牌已自动整理")
                  }}
                  className="text-xs"
                >
                  🎯 整理
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {myCards.map((card, index) => (
                <button
                  key={`${card.suit}-${card.rank}-${index}`}
                  data-card-id={`${card.suit}-${card.rank}`}
                  onClick={() => handleCardClick(card)}
                  className={`bg-white border rounded-lg p-3 text-sm font-mono transition-all duration-300 ease-in-out shadow-sm hover:shadow-lg transform card-deal-animation ${
                    selectedCards.some((c) => c.suit === card.suit && c.rank === card.rank)
                      ? "ring-2 ring-blue-500 -translate-y-3 scale-105 shadow-xl bg-blue-50"
                      : "hover:-translate-y-2 hover:scale-105 hover:shadow-md"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold">{card.display}</span>
                    <span
                      className={`text-2xl ${
                        card.suit === "hearts" || card.suit === "diamonds" ? "text-red-500" : "text-black"
                      }`}
                    >
                      {card.suit === "hearts" && "♥"}
                      {card.suit === "diamonds" && "♦"}
                      {card.suit === "clubs" && "♣"}
                      {card.suit === "spades" && "♠"}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {isMyTurn ? (
              <div className="flex justify-center gap-3">
                <Button 
                  onClick={handlePlay} 
                  disabled={selectedCards.length === 0} 
                  className={`px-6 transition-all duration-300 ${
                    selectedCards.length > 0 
                      ? 'play-button bg-green-600 hover:bg-green-700 shadow-lg' 
                      : 'bg-gray-400'
                  }`}
                >
                  Play Cards ({selectedCards.length})
                </Button>
                <Button 
                  onClick={handlePass} 
                  variant="outline" 
                  className="px-6 bg-transparent hover:bg-gray-100 transition-all duration-300"
                >
                  Pass
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Badge variant="secondary" className="px-4 py-2 status-change">
                  Waiting for other players...
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GameOptions isOpen={showOptions} onClose={() => setShowOptions(false)} onSave={setGameOptions} />
    </div>
  )
}
