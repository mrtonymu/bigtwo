"use client"

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface GameStats {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  totalPlays: number
  averagePlaysPerGame: number
  favoritePlayType: string
  longestWinStreak: number
  currentWinStreak: number
  recentGames: Array<{
    gameId: string
    result: 'win' | 'loss'
    plays: number
    duration: number
    date: string
  }>
}

interface GameStatsProps {
  playerName: string
  isOpen: boolean
  onClose: () => void
}

export function GameStats({ playerName, isOpen, onClose }: GameStatsProps) {
  const [stats, setStats] = useState<GameStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchStats()
    }
  }, [isOpen, playerName])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // 获取玩家参与的所有游戏
      const { data: playerGames, error: playerError } = await supabase
        .from('players')
        .select(`
          game_id,
          cards,
          games!inner(
            id,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('player_name', playerName)

      if (playerError) throw playerError

      // 获取游戏状态数据
      const gameIds = playerGames?.map(pg => pg.game_id) || []
      const { data: gameStates, error: stateError } = await supabase
        .from('game_state')
        .select('*')
        .in('game_id', gameIds)

      if (stateError) throw stateError

      // 计算统计数据
      const stats = calculateStats(playerGames || [], gameStates || [])
      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (playerGames: any[], gameStates: any[]): GameStats => {
    const completedGames = playerGames.filter(pg => pg.games.status === 'finished')
    const wins = completedGames.filter(pg => (pg.cards || []).length === 0).length
    const losses = completedGames.length - wins
    const totalGames = completedGames.length
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0

    // 计算出牌次数
    let totalPlays = 0
    const playTypes: Record<string, number> = {}
    const recentGames: any[] = []

    completedGames.forEach(pg => {
      const gameState = gameStates.find(gs => gs.game_id === pg.game_id)
      if (gameState?.play_history) {
        const playerPlays = gameState.play_history.filter((play: any) => 
          play.playerName === playerName
        )
        totalPlays += playerPlays.length

        // 统计牌型
        playerPlays.forEach((play: any) => {
          playTypes[play.playType] = (playTypes[play.playType] || 0) + 1
        })

        // 添加到最近游戏
        recentGames.push({
          gameId: pg.game_id,
          result: (pg.cards || []).length === 0 ? 'win' : 'loss',
          plays: playerPlays.length,
          duration: new Date(pg.games.updated_at).getTime() - new Date(pg.games.created_at).getTime(),
          date: pg.games.updated_at
        })
      }
    })

    const favoritePlayType = Object.entries(playTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '无'

    // 计算连胜
    let currentWinStreak = 0
    let longestWinStreak = 0
    let tempStreak = 0

    recentGames
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(game => {
        if (game.result === 'win') {
          tempStreak++
          if (currentWinStreak === 0) currentWinStreak = tempStreak
        } else {
          longestWinStreak = Math.max(longestWinStreak, tempStreak)
          tempStreak = 0
        }
      })
    longestWinStreak = Math.max(longestWinStreak, tempStreak)

    return {
      totalGames,
      wins,
      losses,
      winRate: Math.round(winRate * 100) / 100,
      totalPlays,
      averagePlaysPerGame: totalGames > 0 ? Math.round((totalPlays / totalGames) * 100) / 100 : 0,
      favoritePlayType,
      longestWinStreak,
      currentWinStreak,
      recentGames: recentGames.slice(0, 10)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">📊 游戏统计</CardTitle>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>加载统计数据中...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* 总体统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                  <div className="text-sm text-gray-600">总游戏数</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
                  <div className="text-sm text-gray-600">获胜次数</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
                  <div className="text-sm text-gray-600">失败次数</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.winRate}%</div>
                  <div className="text-sm text-gray-600">胜率</div>
                </div>
              </div>

              {/* 出牌统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.totalPlays}</div>
                  <div className="text-sm text-gray-600">总出牌次数</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{stats.averagePlaysPerGame}</div>
                  <div className="text-sm text-gray-600">平均每局出牌</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{stats.favoritePlayType}</div>
                  <div className="text-sm text-gray-600">最爱牌型</div>
                </div>
              </div>

              {/* 连胜统计 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.longestWinStreak}</div>
                  <div className="text-sm text-gray-600">最长连胜</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">{stats.currentWinStreak}</div>
                  <div className="text-sm text-gray-600">当前连胜</div>
                </div>
              </div>

              {/* 最近游戏 */}
              {stats.recentGames.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">最近游戏记录</h3>
                  <div className="space-y-2">
                    {stats.recentGames.map((game, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={game.result === 'win' ? 'default' : 'secondary'}>
                            {game.result === 'win' ? '胜利' : '失败'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {game.plays} 次出牌
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round(game.duration / 1000 / 60)} 分钟
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(game.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.totalGames === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🎮</div>
                  <p>还没有游戏记录</p>
                  <p className="text-sm">开始你的第一局游戏吧！</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-red-500">
              <p>加载统计数据失败</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
