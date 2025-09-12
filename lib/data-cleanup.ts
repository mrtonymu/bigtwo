import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// 清理过期的游戏数据
export async function cleanupExpiredGames() {
  try {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    // 删除1天前的已完成游戏
    const { error: finishedGamesError } = await supabase
      .from('games')
      .delete()
      .eq('status', 'finished')
      .lt('updated_at', oneDayAgo.toISOString())
    
    if (finishedGamesError) {
      console.error('清理已完成游戏失败:', finishedGamesError)
      return false
    }

    // 删除3天前的等待中游戏（可能被遗弃）
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    const { error: waitingGamesError } = await supabase
      .from('games')
      .delete()
      .eq('status', 'waiting')
      .lt('created_at', threeDaysAgo.toISOString())
    
    if (waitingGamesError) {
      console.error('清理等待中游戏失败:', waitingGamesError)
      return false
    }

    // 清理孤立的玩家记录
    const { error: orphanPlayersError } = await supabase
      .from('players')
      .delete()
      .not('game_id', 'in', 
        supabase
          .from('games')
          .select('id')
      )
    
    if (orphanPlayersError) {
      console.error('清理孤立玩家记录失败:', orphanPlayersError)
      return false
    }

    // 清理孤立的游戏状态记录
    const { error: orphanGameStateError } = await supabase
      .from('game_state')
      .delete()
      .not('game_id', 'in',
        supabase
          .from('games')
          .select('id')
      )
    
    if (orphanGameStateError) {
      console.error('清理孤立游戏状态失败:', orphanGameStateError)
      return false
    }

    console.log('数据清理完成')
    return true
  } catch (error) {
    console.error('数据清理失败:', error)
    return false
  }
}

// 获取数据库统计信息
export async function getDatabaseStats() {
  try {
    const [gamesResult, playersResult, gameStateResult] = await Promise.all([
      supabase.from('games').select('*', { count: 'exact' }),
      supabase.from('players').select('*', { count: 'exact' }),
      supabase.from('game_state').select('*', { count: 'exact' })
    ])

    return {
      games: gamesResult.count || 0,
      players: playersResult.count || 0,
      gameStates: gameStateResult.count || 0,
      errors: [gamesResult.error, playersResult.error, gameStateResult.error].filter(Boolean)
    }
  } catch (error) {
    console.error('获取数据库统计失败:', error)
    return null
  }
}

// 定期清理任务
export function startPeriodicCleanup() {
  // 每小时清理一次
  const cleanupInterval = setInterval(async () => {
    console.log('开始定期数据清理...')
    await cleanupExpiredGames()
  }, 60 * 60 * 1000) // 1小时

  // 页面关闭时清理定时器
  const cleanup = () => {
    clearInterval(cleanupInterval)
  }

  window.addEventListener('beforeunload', cleanup)
  
  return cleanup
}
