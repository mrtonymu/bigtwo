"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { WerewolfGame, WerewolfPlayer, WerewolfRole, getGameStatus, getPlayerInfo } from "@/lib/werewolf-logic"
import { CNFLIXLogo } from "@/components/cnflix-logo"
import toast from "react-hot-toast"

interface WerewolfGameProps {
  gameId: string
  playerName: string
}

export function WerewolfGameComponent({ gameId, playerName }: WerewolfGameProps) {
  const [game, setGame] = useState<WerewolfGame | null>(null)
  const [playerInfo, setPlayerInfo] = useState<any>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchGameData()
    
    // 订阅实时更新
    const channel = supabase
      .channel(`werewolf-game-${gameId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'werewolf_games' },
        () => fetchGameData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const fetchGameData = async () => {
    try {
      const { data, error } = await supabase
        .from('werewolf_games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (error) throw error
      
      setGame(data)
      
      if (data) {
        const info = getPlayerInfo(data, data.players.find(p => p.name === playerName)?.id || '')
        setPlayerInfo(info)
      }
    } catch (error) {
      console.error('Error fetching game data:', error)
      toast.error('获取游戏数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  const performAction = async (action: string, targetId?: string) => {
    if (!game) return

    try {
      const { error } = await supabase
        .from('werewolf_games')
        .update({
          night_actions: game.nightActions,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId)

      if (error) throw error
      
      toast.success('行动已记录')
      fetchGameData()
    } catch (error) {
      console.error('Error performing action:', error)
      toast.error('行动失败')
    }
  }

  const castVote = async () => {
    if (!game || !selectedTarget) return

    try {
      const voterId = game.players.find(p => p.name === playerName)?.id
      if (!voterId) return

      const { error } = await supabase
        .from('werewolf_games')
        .update({
          votes: [...game.votes, { voterId, targetId: selectedTarget, day: game.dayCount }],
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId)

      if (error) throw error
      
      toast.success('投票已记录')
      setSelectedTarget("")
      fetchGameData()
    } catch (error) {
      console.error('Error casting vote:', error)
      toast.error('投票失败')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p>加载游戏中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!game || !playerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">游戏未找到</h2>
            <p className="text-gray-600 mb-4">请检查游戏ID是否正确</p>
            <Button onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = getGameStatus(game)
  const currentPlayer = game.players.find(p => p.name === playerName)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.href = '/'}>
              ← 返回大厅
            </Button>
            <CNFLIXLogo size="md" />
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold">狼人杀</h1>
            <p className="text-sm text-gray-600">第 {game.dayCount} 天</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 游戏状态 */}
          <Card>
            <CardHeader>
              <CardTitle>游戏状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">当前阶段</p>
                <Badge variant={game.phase === 'night' ? 'destructive' : 'default'}>
                  {game.phase === 'night' ? '夜晚' : game.phase === 'day' ? '白天' : '投票中'}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">存活玩家</p>
                <p className="text-lg font-semibold">{status.alivePlayers.length} 人</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">你的角色</p>
                <Badge variant="outline" className="text-lg">
                  {currentPlayer?.role === 'werewolf' ? '🐺 狼人' :
                   currentPlayer?.role === 'seer' ? '🔮 预言家' :
                   currentPlayer?.role === 'witch' ? '🧙‍♀️ 女巫' :
                   currentPlayer?.role === 'hunter' ? '🏹 猎人' : '👤 村民'}
                </Badge>
              </div>

              {game.winner && (
                <div className="p-4 bg-green-100 rounded-lg">
                  <p className="font-semibold text-green-800">
                    {game.winner === 'werewolves' ? '🐺 狼人获胜！' : '👥 村民获胜！'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 玩家列表 */}
          <Card>
            <CardHeader>
              <CardTitle>玩家列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {playerInfo.alivePlayers.map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className={player.isAlive ? 'text-green-600' : 'text-red-600'}>
                        {player.isAlive ? '🟢' : '🔴'}
                      </span>
                      <span className="font-medium">{player.name}</span>
                      {player.role && (
                        <Badge variant="outline" className="text-xs">
                          {player.role === 'werewolf' ? '🐺' :
                           player.role === 'seer' ? '🔮' :
                           player.role === 'witch' ? '🧙‍♀️' :
                           player.role === 'hunter' ? '🏹' : '👤'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 行动区域 */}
          <Card>
            <CardHeader>
              <CardTitle>行动</CardTitle>
            </CardHeader>
            <CardContent>
              {game.phase === 'night' && currentPlayer?.isAlive && (
                <div className="space-y-4">
                  {currentPlayer.role === 'werewolf' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">选择要杀死的玩家</p>
                      <select 
                        value={selectedTarget} 
                        onChange={(e) => setSelectedTarget(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">选择目标</option>
                        {status.alivePlayers
                          .filter(p => p.role !== 'werewolf')
                          .map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>
                          ))}
                      </select>
                      <Button 
                        onClick={() => performAction('kill', selectedTarget)}
                        className="w-full mt-2"
                        disabled={!selectedTarget}
                      >
                        杀死
                      </Button>
                    </div>
                  )}

                  {currentPlayer.role === 'seer' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">选择要查验的玩家</p>
                      <select 
                        value={selectedTarget} 
                        onChange={(e) => setSelectedTarget(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">选择目标</option>
                        {status.alivePlayers
                          .filter(p => p.id !== currentPlayer.id)
                          .map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>
                          ))}
                      </select>
                      <Button 
                        onClick={() => performAction('check', selectedTarget)}
                        className="w-full mt-2"
                        disabled={!selectedTarget}
                      >
                        查验
                      </Button>
                    </div>
                  )}

                  {currentPlayer.role === 'witch' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">女巫行动</p>
                      <Button 
                        onClick={() => performAction('heal')}
                        className="w-full"
                        variant="outline"
                      >
                        🧪 使用解药
                      </Button>
                      <Button 
                        onClick={() => performAction('poison')}
                        className="w-full"
                        variant="destructive"
                      >
                        ☠️ 使用毒药
                      </Button>
                    </div>
                  )}

                  {(currentPlayer.role === 'hunter' || currentPlayer.role === 'villager') && (
                    <p className="text-gray-600 text-center">夜晚无行动</p>
                  )}
                </div>
              )}

              {(game.phase === 'day' || game.phase === 'voting') && currentPlayer?.isAlive && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">投票淘汰玩家</p>
                  <select 
                    value={selectedTarget} 
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">选择目标</option>
                    {status.alivePlayers
                      .filter(p => p.id !== currentPlayer.id)
                      .map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                  </select>
                  <Button 
                    onClick={castVote}
                    className="w-full"
                    disabled={!selectedTarget}
                  >
                    投票
                  </Button>
                </div>
              )}

              {!currentPlayer?.isAlive && (
                <p className="text-gray-600 text-center">你已死亡，无法行动</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
