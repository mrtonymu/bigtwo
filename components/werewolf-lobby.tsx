"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { CNFLIXLogo } from "@/components/cnflix-logo"

interface WerewolfRoom {
  id: string
  name: string
  players: number
  maxPlayers: number
  status: 'waiting' | 'in-progress' | 'finished'
  created_at: string
}

export function WerewolfLobby() {
  const [playerName, setPlayerName] = useState("")
  const [gameName, setGameName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [rooms, setRooms] = useState<WerewolfRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const createGame = async () => {
    if (!playerName.trim() || !gameName.trim()) {
      toast.error("请输入玩家名称和房间名称")
      return
    }

    setIsCreating(true)
    const loadingToast = toast.loading("正在创建狼人杀房间...")

    try {
      const { data: gameData, error } = await supabase
        .from('werewolf_games')
        .insert({
          name: gameName.trim(),
          players: [{
            id: 'player_0',
            name: playerName.trim(),
            role: 'villager', // 临时角色，游戏开始时会重新分配
            isAlive: true,
            isProtected: false,
            isVoted: false
          }],
          phase: 'waiting',
          day_count: 0,
          night_actions: [],
          votes: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success("狼人杀房间创建成功！")
      router.push(`/werewolf/${gameData.id}?player=${encodeURIComponent(playerName.trim())}`)
    } catch (error) {
      console.error("Error creating werewolf game:", error)
      toast.dismiss(loadingToast)
      toast.error("创建房间失败，请重试")
    } finally {
      setIsCreating(false)
    }
  }

  const joinGame = async (gameId: string) => {
    if (!playerName.trim()) {
      toast.error("请先输入玩家名称")
      return
    }

    const loadingToast = toast.loading("正在加入房间...")

    try {
      // 获取当前游戏数据
      const { data: currentGame, error: fetchError } = await supabase
        .from('werewolf_games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (fetchError) throw fetchError

      if (currentGame.players.length >= 8) {
        toast.dismiss(loadingToast)
        toast.error("房间已满")
        return
      }

      // 添加玩家
      const newPlayer = {
        id: `player_${currentGame.players.length}`,
        name: playerName.trim(),
        role: 'villager',
        isAlive: true,
        isProtected: false,
        isVoted: false
      }

      const { error: updateError } = await supabase
        .from('werewolf_games')
        .update({
          players: [...currentGame.players, newPlayer],
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId)

      if (updateError) throw updateError

      toast.dismiss(loadingToast)
      toast.success("成功加入房间！")
      router.push(`/werewolf/${gameId}?player=${encodeURIComponent(playerName.trim())}`)
    } catch (error) {
      console.error("Error joining game:", error)
      toast.dismiss(loadingToast)
      toast.error("加入房间失败，请重试")
    }
  }

  const spectateGame = (gameId: string) => {
    router.push(`/werewolf/${gameId}?spectator=true`)
  }

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('werewolf_games')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const gameRooms: WerewolfRoom[] = (data || []).map((game: any) => ({
        id: game.id,
        name: game.name,
        players: game.players.length,
        maxPlayers: 8,
        status: game.phase === 'waiting' ? 'waiting' : 
                game.phase === 'finished' ? 'finished' : 'in-progress',
        created_at: game.created_at
      }))

      setRooms(gameRooms)
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast.error("获取房间列表失败")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500'
      case 'in-progress':
        return 'bg-red-500'
      case 'finished':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return '等待中'
      case 'in-progress':
        return '游戏中'
      case 'finished':
        return '已结束'
      default:
        return '未知'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center mb-8">
          <CNFLIXLogo size="xl" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mb-2">🐺 狼人杀</h1>
          <p className="text-gray-600">经典推理游戏，找出隐藏的狼人！</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="玩家名称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              className="text-center"
            />
            <Input
              placeholder="房间名称"
              value={gameName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={30}
              className="text-center"
            />
            <Button 
              onClick={createGame} 
              disabled={isCreating || !playerName.trim() || !gameName.trim()}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isCreating ? "创建中..." : "创建狼人杀房间"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="game-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CNFLIXLogo size="sm" />
              <CardTitle>狼人杀房间</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRooms} disabled={isLoading}>
              <span className={`text-sm ${isLoading ? "animate-spin" : ""}`}>🔄</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
              <div>房间名称</div>
              <div>玩家</div>
              <div>观众</div>
              <div>状态</div>
              <div>操作</div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                加载中...
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无狼人杀房间，创建一个新房间开始吧！
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="grid grid-cols-5 gap-4 items-center py-3 border-b last:border-b-0 hover:bg-muted/50 rounded-lg px-2 transition-colors"
                >
                  <div className="font-medium truncate">{room.name}</div>
                  <div className="text-sm">
                    {room.players}/{room.maxPlayers}
                  </div>
                  <div className="text-sm">0</div>
                  <div>
                    <Badge variant="secondary" className={`${getStatusColor(room.status)} text-white`}>
                      {getStatusText(room.status)}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {room.status === 'waiting' && room.players < room.maxPlayers ? (
                      <Button 
                        size="sm" 
                        onClick={() => joinGame(room.id)} 
                        disabled={!playerName.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        加入游戏
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => spectateGame(room.id)}
                      >
                        <span className="mr-1">👁</span>
                        观看
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
