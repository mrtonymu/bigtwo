"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { GameBrowser } from "@/components/game-browser"
import { GameOptions, type GameOptions as GameOptionsType, loadGameOptions } from "@/components/game-options"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useErrorHandlerHook } from "@/lib/utils/error-handler"
import toast from "react-hot-toast"
import { validatePlayerName, validateRoomName, InputSanitizer } from "@/lib/utils/input-validator"
import { CNFLIXLogo } from "@/components/cnflix-logo"

export function GameLobby() {
  const [playerName, setPlayerName] = useState("")
  const [gameName, setGameName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [gameOptions, setGameOptions] = useState<GameOptionsType>(() => {
    // 在客户端加载保存的游戏选项
    if (typeof window !== 'undefined') {
      return loadGameOptions()
    }
    // 服务端渲染时使用默认值
    return {
      allowSpectators: true,
      gameSpeed: "normal",
      autoPass: false,
      showCardCount: true,
      cardSorting: "auto",
      autoArrange: true,
    }
  })
  const supabase = createClient()
  const { handleSupabaseError } = useErrorHandlerHook()
  const router = useRouter()


  const handleNewGame = async () => {
    // 输入验证
    const playerNameValidation = validatePlayerName(playerName)
    const roomNameValidation = validateRoomName(gameName)
    
    if (!playerNameValidation.isValid) {
      toast.error(playerNameValidation.errors[0])
      return
    }
    
    if (!roomNameValidation.isValid) {
      toast.error(roomNameValidation.errors[0])
      return
    }

    // 清理输入数据
    const sanitizedPlayerName = InputSanitizer.sanitizePlayerName(playerName)
    const sanitizedRoomName = InputSanitizer.sanitizeRoomName(gameName)

    setIsCreating(true)
    const loadingToast = toast.loading("正在创建游戏房间...")
    
    try {
      // 使用新的API路由创建游戏
      const createGameResponse = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sanitizedRoomName,
          maxPlayers: 4,
          allowSpectators: gameOptions.allowSpectators,
          gameOptions: gameOptions
        })
      })

      const createGameResult = await createGameResponse.json()

      if (!createGameResult.success) {
        toast.error(createGameResult.error || '创建游戏失败')
        return
      }

      const gameData = createGameResult.data

      // 添加玩家到游戏
      const joinGameResponse = await fetch(`/api/games/${gameData.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: sanitizedPlayerName,
          isSpectator: false
        })
      })

      const joinGameResult = await joinGameResponse.json()

      if (!joinGameResult.success) {
        toast.error(joinGameResult.error || '加入游戏失败')
        return
      }

      toast.dismiss(loadingToast)
      toast.success("游戏房间创建成功！")
      
      // Navigate to game
      router.push(`/game/${gameData.id}?player=${encodeURIComponent(sanitizedPlayerName)}`)
    } catch (error) {
      console.error('创建游戏失败:', error)
      toast.error('创建游戏失败，请重试')
    } finally {
      toast.dismiss(loadingToast)
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
