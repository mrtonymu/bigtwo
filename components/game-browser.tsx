"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { GameRoomSkeleton } from "@/components/game-room-skeleton"
import { CNFLIXLogo } from "@/components/cnflix-logo"

interface GameRoom {
  id: string
  name: string
  players: number
  maxPlayers: number
  spectators: number
  status: "waiting" | "in-progress" | "finished"
  created_at: string
}

interface GameBrowserProps {
  playerName: string
}

export function GameBrowser({ playerName }: GameBrowserProps) {
  const [games, setGames] = useState<GameRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // 简化初始化，直接设置loading为false
    setIsLoading(false)
    setGames([])
  }, [])

  const fetchGames = async () => {
    console.log("[CNFLIX] Fetching games from database...")
    try {
      const { data: gamesData, error } = await supabase
        .from("games")
        .select(`
          id,
          name,
          status,
          max_players,
          current_players,
          spectators,
          created_at
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        toast.error("获取房间列表失败")
        setGames([])
        return
      }

      console.log("[CNFLIX] Games data received:", gamesData)

      const gameRooms: GameRoom[] = (gamesData || []).map((game) => ({
        id: game.id,
        name: game.name,
        players: game.current_players,
        maxPlayers: game.max_players,
        spectators: game.spectators || 0,
        status: game.status as "waiting" | "in-progress" | "finished",
        created_at: game.created_at,
      }))

      setGames(gameRooms)
    } catch (error) {
      console.error("Error fetching games:", error)
      toast.error("网络连接失败，请检查网络")
      setGames([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshGames = () => {
    setIsLoading(true)
    fetchGames()
  }

  const spectateGame = (gameId: string) => {
    if (!playerName.trim()) {
      toast.error("请先输入观影者名称")
      return
    }
    router.push(`/game/${gameId}?player=${encodeURIComponent(playerName.trim())}&spectate=true`)
  }

  const joinGame = async (gameId: string) => {
    if (!playerName.trim()) {
      toast.error("请先输入观影者名称")
      return
    }

    const loadingToast = toast.loading("正在加入观影房间...")

    try {
      const { data: playersData } = await supabase
        .from("players")
        .select("position")
        .eq("game_id", gameId)
        .eq("is_spectator", false)

      const nextPosition = playersData?.length || 0

      if (nextPosition >= 4) {
        toast.dismiss(loadingToast)
        toast.error("房间已满，只能观看")
        spectateGame(gameId)
        return
      }

      // Add player to game
      const { error: playerError } = await supabase.from("players").insert({
        game_id: gameId,
        player_name: playerName.trim(),
        position: nextPosition,
        is_spectator: false,
      })

      if (playerError) throw playerError

      // Update game player count (don't auto-start, let host decide)
      await supabase
        .from("games")
        .update({
          current_players: nextPosition + 1,
          status: "waiting", // Always keep as waiting, let host start
        })
        .eq("id", gameId)

      toast.dismiss(loadingToast)
      toast.success("成功加入观影房间！")
      router.push(`/game/${gameId}?player=${encodeURIComponent(playerName.trim())}`)
    } catch (error) {
      console.error("Error joining game:", error)
      toast.dismiss(loadingToast)
      toast.error("加入房间失败，请重试")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500"
      case "in-progress":
        return "bg-green-500"
      case "finished":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "等待中"
      case "in-progress":
        return "游戏中"
      case "finished":
        return "已结束"
      default:
        return "未知"
    }
  }

  return (
    <Card className="game-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CNFLIXLogo size="sm" />
            <CardTitle>观影房间</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={refreshGames} disabled={isLoading}>
            <span className={`text-sm ${isLoading ? "animate-spin" : ""}`}>🔄</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 表头 */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
            <div>房间名称</div>
            <div>观影者</div>
            <div>观众</div>
            <div>状态</div>
            <div>操作</div>
          </div>

          {/* 游戏列表 */}
          {games.map((game) => (
            <div
              key={game.id}
              className="grid grid-cols-5 gap-4 items-center py-3 border-b last:border-b-0 hover:bg-muted/50 rounded-lg px-2 transition-colors"
            >
              <div className="font-medium truncate">{game.name}</div>
              <div className="text-sm">
                {game.players}/{game.maxPlayers}
              </div>
              <div className="text-sm">{game.spectators}</div>
              <div>
                <Badge variant="secondary" className={`${getStatusColor(game.status)} text-white`}>
                  {getStatusText(game.status)}
                </Badge>
              </div>
              <div className="flex gap-2">
                {game.status === "waiting" && game.players < game.maxPlayers ? (
                  <Button size="sm" onClick={() => joinGame(game.id)} disabled={!playerName.trim()}>
                    加入观影
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => spectateGame(game.id)}
                    disabled={!playerName.trim()}
                  >
                    <span className="mr-1">👁</span>
                    观看
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isLoading && <GameRoomSkeleton />}

          {games.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">暂无活跃观影房间，创建一个新房间开始吧！</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
