"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { GameBrowser } from "@/components/game-browser"
import { GameOptions, type GameOptions as GameOptionsType } from "@/components/game-options"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { CNFLIXLogo } from "@/components/cnflix-logo"

export function GameLobby() {
  const [playerName, setPlayerName] = useState("")
  const [gameName, setGameName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [gameOptions, setGameOptions] = useState<GameOptionsType>({
    allowSpectators: true,
    gameSpeed: "normal",
    autoPass: false,
    showCardCount: true,
  })
  const supabase = createClient()
  const router = useRouter()


  const handleNewGame = async () => {
    if (!playerName.trim() || !gameName.trim()) {
      toast.error("请输入观影者名称和房间名称")
      return
    }

    setIsCreating(true)
    const loadingToast = toast.loading("正在创建观影房间...")
    
    try {
      // Create new game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          name: gameName.trim(),
          status: "waiting",
          max_players: 4,
          current_players: 1,
        })
        .select()
        .single()

      if (gameError) throw gameError

      const { error: playerError } = await supabase.from("players").insert({
        game_id: gameData.id,
        player_name: playerName.trim(),
        position: 0,
        is_spectator: false,
      })

      if (playerError) throw playerError

      toast.dismiss(loadingToast)
      toast.success("观影房间创建成功！")
      
      // Navigate to game
      router.push(`/game/${gameData.id}?player=${encodeURIComponent(playerName.trim())}`)
    } catch (error) {
      console.error("Error creating game:", error)
      toast.dismiss(loadingToast)
      toast.error("创建房间失败，请重试")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center mb-8">
          <CNFLIXLogo size="xl" />
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="观影者名称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              className="text-center"
            />
            <Input
              placeholder="观影房间名称"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              maxLength={30}
              className="text-center"
            />
            <Button
              className="w-full bg-slate-600 hover:bg-slate-700 text-white"
              size="lg"
              onClick={handleNewGame}
              disabled={!playerName.trim() || !gameName.trim() || isCreating}
            >
              {isCreating ? "创建中..." : "创建观影房间"}
            </Button>
            <Button
              onClick={() => window.location.href = '/werewolf'}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              🐺 狼人杀游戏
            </Button>
            <button
              onClick={() => setShowOptions(true)}
              className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
            >
              观影设置
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Game Browser */}
      <GameBrowser playerName={playerName} />

      <GameOptions isOpen={showOptions} onClose={() => setShowOptions(false)} onSave={setGameOptions} />
    </div>
  )
}
