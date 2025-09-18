import { NextRequest, NextResponse } from 'next/server'
import { supabaseOps } from '@/lib/supabase/operations'
import { createDeck, dealCards } from '@/lib/game-logic'

// POST /api/games/[id]/start - 开始游戏
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id

    if (!gameId) {
      return NextResponse.json({
        success: false,
        error: '游戏ID不能为空',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 获取游戏详情
    const gameResult = await supabaseOps.getGameDetails(gameId)
    if (gameResult.error) {
      return NextResponse.json({
        success: false,
        error: gameResult.error.message,
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    const { game, players } = gameResult.data!
    const activePlayers = players.filter((p: any) => !p.is_spectator)

    if (activePlayers.length < 2) {
      return NextResponse.json({
        success: false,
        error: '至少需要2名玩家才能开始游戏',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    if (game.status !== 'waiting') {
      return NextResponse.json({
        success: false,
        error: '游戏已经开始或已结束',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 创建牌组并发牌
    const originalDeck = createDeck()
    const playerCount = activePlayers.length
    const hands = dealCards(originalDeck, playerCount)

    // 更新每个玩家的手牌
    const updatePromises = activePlayers.map((player: any, index: number) => 
      supabaseOps.updatePlayer(player.id, { cards: hands[index] })
    )

    const updateResults = await Promise.all(updatePromises)
    const failedUpdates = updateResults.filter((result: any) => result.error)
    
    if (failedUpdates.length > 0) {
      return NextResponse.json({
        success: false,
        error: '更新玩家手牌失败',
        details: failedUpdates.map((r: any) => r.error?.message).join(', '),
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // 创建游戏状态
    const remainingCards = playerCount === 4 ? [] : originalDeck.slice(playerCount * 13)
    const gameStateResult = await supabaseOps.createGameState({
      game_id: gameId,
      current_player: 0,
      last_play: [],
      last_player: null,
      deck: remainingCards,
      turn_count: 0,
      play_history: []
    })

    if (gameStateResult.error) {
      return NextResponse.json({
        success: false,
        error: '创建游戏状态失败',
        details: gameStateResult.error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // 更新游戏状态为进行中
    const updateGameResult = await supabaseOps.updateGame(gameId, { 
      status: 'in-progress' 
    })

    if (updateGameResult.error) {
      return NextResponse.json({
        success: false,
        error: '更新游戏状态失败',
        details: updateGameResult.error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        game: updateGameResult.data,
        gameState: gameStateResult.data,
        playerCount,
        remainingCards: remainingCards.length
      },
      message: '游戏开始成功',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('开始游戏失败:', error)
    return NextResponse.json({
      success: false,
      error: '开始游戏失败',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}