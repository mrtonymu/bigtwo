"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { GameTable } from "@/components/game-table"
import { createClient } from "@/lib/supabase/client"
import { createDeck, dealCards } from "@/lib/game-logic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import toast from "react-hot-toast"
import { AppWrapper } from "@/components/app-wrapper"

export default function GamePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.id as string
  const playerName = searchParams.get("player") || ""
  const isSpectator = searchParams.get("spectate") === "true"

  const [gameStatus, setGameStatus] = useState<"loading" | "waiting" | "ready" | "not-found">("loading")
  const [playerCount, setPlayerCount] = useState(0)
  const [players, setPlayers] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    checkGameStatus()

    // Subscribe to player and game changes
    const channel = supabase
      .channel(`game-${gameId}-status`)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` }, () =>
        checkGameStatus(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` }, () =>
        checkGameStatus(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state", filter: `game_id=eq.${gameId}` }, () =>
        checkGameStatus(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const checkGameStatus = async () => {
    try {
      // Check if game exists
      const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).single()

      if (gameError || !gameData) {
        setGameStatus("not-found")
        return
      }

      // Get players
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .eq("is_spectator", false)
        .order("position")

      const currentPlayerCount = playersData?.length || 0
      setPlayerCount(currentPlayerCount)
      setPlayers(playersData || [])

      // For 2-3 players, need at least 2 players to start
      // For 4 players, need exactly 4 players to start
      if (gameData.status === "in-progress") {
        setGameStatus("ready")
      } else if (currentPlayerCount >= 2 && currentPlayerCount <= 4) {
        setGameStatus("ready")
      } else {
        setGameStatus("waiting")
      }
    } catch (error) {
      console.error("Error checking game status:", error)
      setGameStatus("not-found")
    }
  }

  const startGame = async () => {
    const loadingToast = toast.loading("正在开始游戏...")
    
    try {
      // Create deck and deal cards
      const deck = createDeck()
      const hands = dealCards(deck, playerCount)

      // Get all players
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .eq("is_spectator", false)
        .order("position")

      if (!playersData) return

      // Update each player with their cards
      for (let i = 0; i < playersData.length; i++) {
        await supabase.from("players").update({ cards: hands[i] }).eq("id", playersData[i].id)
      }

      // Create initial game state
      const { error: gameStateError } = await supabase.from("game_state").insert({
        game_id: gameId,
        current_player: 0,
        last_play: [],
        deck: deck.slice(playerCount * 13), // remaining cards
        turn_count: 0,
      })

      if (gameStateError) {
        console.error("Error creating game state:", gameStateError)
        throw gameStateError
      }

      // Update game status
      const { error: updateGameError } = await supabase.from("games").update({ status: "in-progress" }).eq("id", gameId)
      
      if (updateGameError) {
        console.error("Error updating game status:", updateGameError)
        throw updateGameError
      }
      
      toast.dismiss(loadingToast)
      toast.success("游戏开始！")
      setGameStatus("ready")
      
      // 刷新游戏状态，确保所有玩家都能看到更新
      setTimeout(() => {
        checkGameStatus()
      }, 1000)
    } catch (error) {
      console.error("Error starting game:", error)
      toast.dismiss(loadingToast)
      toast.error("开始游戏失败，请重试")
    }
  }

  if (gameStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading game...</div>
      </div>
    )
  }

  if (gameStatus === "not-found") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
            <p className="text-gray-600 mb-6">The game you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/">Back to Lobby</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameStatus === "waiting") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <div className="flex items-center justify-center mb-6">
              <span className="text-2xl mr-2">2♠</span>
              <h1 className="text-2xl font-bold">CNFLIX</h1>
            </div>

            <h2 className="text-xl font-semibold mb-4">Waiting for Players</h2>
            <p className="text-gray-600 mb-6">Players: {playerCount}/4</p>
            
            <div className="text-sm text-gray-500 mb-4">
              {playerCount < 2 ? "需要至少2名玩家开始游戏" : 
               playerCount < 4 ? "可以开始游戏（2-3人模式：需要从♦3开始）" : 
               "可以开始游戏（4人模式：可以任意组合开始）"}
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">Current Players:</h3>
              <div className="space-y-1">
                {players.map((player, index) => (
                  <div key={player.id} className="text-sm text-gray-600">
                    {index + 1}. {player.player_name}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {playerCount >= 2 && !isSpectator && (
                <Button onClick={startGame} className="w-full">
                  Start Game ({playerCount} players)
                </Button>
              )}
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/">Back to Lobby</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AppWrapper>
      <GameTable gameId={gameId} playerName={playerName} />
    </AppWrapper>
  )
}
