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
  status: "waiting" | "in_progress" | "finished"  // 修复：使用下划线而不是连字符
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
    fetchGames()
  }, [])

  const fetchGames = async () => {
    console.log("[CNFLIX] Fetching games from API...")
    setIsLoading(true)
    try {
      const response = await fetch('/api/games')
      const result = await response.json()

      if (!result.success) {
        console.error("API error:", result.error)
        toast.error("获取房间列表失败")
        setGames([])
        return
      }

      console.log("[CNFLIX] Games data received:", result.data)

      const gameRooms: GameRoom[] = (result.data || []).map((game: any) => ({
        id: game.id,
        name: game.name,
        players: game.current_players || 0,
        maxPlayers: game.max_players || 4,
        spectators: game.spectators || 0,
        status: game.status as "waiting" | "in_progress" | "finished",  // 修复：使用下划线而不是连字符
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
      toast.error("请先输入玩家名称")
      return
    }
    router.push(`/game/${gameId}?player=${encodeURIComponent(playerName.trim())}&spectate=true`)
  }

  const joinGame = async (gameId: string) => {
    if (!playerName.trim()) {
      toast.error("请先输入玩家名称")
      return
    }

    const loadingToast = toast.loading("正在加入游戏房间...")

    try {
      // 使用新的API路由加入游戏
      const response = await fetch(`/api/games/${gameId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
          isSpectator: false
        })
      })

      const result = await response.json()

      if (!result.success) {
        toast.dismiss(loadingToast)
        if (result.error?.includes('已满')) {
          toast.error("房间已满，只能观看")
          spectateGame(gameId)
        } else {
          toast.error(result.error || '加入游戏失败')
        }
        return
      }

      toast.dismiss(loadingToast)
      toast.success("成功加入游戏房间！")
      router.push(`/game/${gameId}?player=${encodeURIComponent(playerName.trim())}`)
      
      // 刷新游戏列表
      fetchGames()
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
      case "in_progress":  // 修复：使用下划线而不是连字符
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
      case "in_progress":  // 修复：使用下划线而不是连字符
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
            <CardTitle>游戏房间</CardTitle>
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
            <div>玩家</div>
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
                    加入游戏
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
            <div className="text-center py-8 text-muted-foreground">暂无活跃游戏房间，创建一个新房间开始吧！</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
