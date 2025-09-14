"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { GameBrowser } from "@/components/game-browser"
import { GameOptions, type GameOptions as GameOptionsType } from "@/components/game-options"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useErrorHandler } from "@/lib/utils/error-handler"
import toast from "react-hot-toast"
import { validatePlayerName, validateRoomName, InputSanitizer } from "@/lib/utils/input-validator"
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
    cardSorting: "auto",
    autoArrange: true,
  })
  const supabase = createClient()
  const { handleSupabaseError } = useErrorHandler()
  const router = useRouter()


  const handleNewGame = async () => {
    // 输入验证
    const playerNameValidation = validatePlayerName(playerName)
    const roomNameValidation = validateRoomName(gameName)
    
    if (!playerNameValidation.isValid) {
      handleSupabaseError(new Error(playerNameValidation.errors[0]), "玩家名称验证")
      return
    }
    
    if (!roomNameValidation.isValid) {
      handleSupabaseError(new Error(roomNameValidation.errors[0]), "房间名称验证")
      return
    }

    // 清理输入数据
    const sanitizedPlayerName = InputSanitizer.sanitizePlayerName(playerName)
    const sanitizedRoomName = InputSanitizer.sanitizeRoomName(gameName)

    setIsCreating(true)
    const loadingToast = toast.loading("正在创建观影房间...")
    
    try {
      // Create new game
      // 临时使用 any 类型断言，等待 Supabase 类型配置完善
      const { data: gameData, error: gameError } = await (supabase as any)
        .from("games")
        .insert({
          name: sanitizedRoomName,
          status: "waiting" as const,
          max_players: 4,
          current_players: 1,
        })
        .select()
        .single()

      if (gameError) {
        handleSupabaseError(gameError, "创建游戏")
        return
      }

      const { error: playerError } = await (supabase as any).from("players").insert({
        game_id: gameData!.id,
        player_name: sanitizedPlayerName,
        position: 0,
        is_spectator: false,
      })

      if (playerError) {
        handleSupabaseError(playerError, "添加玩家")
        return
      }

      toast.dismiss(loadingToast)
      toast.success("观影房间创建成功！")
      
      // Navigate to game
      router.push(`/game/${gameData!.id}?player=${encodeURIComponent(sanitizedPlayerName)}`)
    } catch (error) {
      handleSupabaseError(error, "创建房间")
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
