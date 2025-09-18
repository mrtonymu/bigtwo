import { NextRequest, NextResponse } from 'next/server'
import { supabaseOps } from '@/lib/supabase/operations'
import { validatePlayerName } from '@/lib/utils/input-validator'

// GET /api/games/[id]/players - 获取游戏玩家列表
export async function GET(
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

    const result = await supabaseOps.getGamePlayers(gameId)

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('获取玩家列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取玩家列表失败',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST /api/games/[id]/players - 加入游戏
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const body = await request.json()
    const { playerName, isSpectator = false } = body

    if (!gameId) {
      return NextResponse.json({
        success: false,
        error: '游戏ID不能为空',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 验证玩家名称
    const nameValidation = validatePlayerName(playerName)
    if (!nameValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: nameValidation.errors.join(', '),
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 获取当前游戏信息
    const gameResult = await supabaseOps.getGame(gameId)
    if (gameResult.error) {
      return NextResponse.json({
        success: false,
        error: '游戏不存在',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    const game = gameResult.data!
    
    // 检查游戏状态
    if (game.status !== 'waiting') {
      return NextResponse.json({
        success: false,
        error: '游戏已开始或已结束，无法加入',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 获取当前玩家列表
    const playersResult = await supabaseOps.getGamePlayers(gameId)
    if (playersResult.error) {
      return NextResponse.json({
        success: false,
        error: '获取玩家列表失败',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const players = playersResult.data!
    
    // 检查玩家名称是否已存在
    const existingPlayer = players.find(p => p.player_name === playerName.trim())
    if (existingPlayer) {
      return NextResponse.json({
        success: false,
        error: '玩家名称已存在',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 检查游戏是否已满
    const activePlayers = players.filter(p => !p.is_spectator)
    if (!isSpectator && activePlayers.length >= game.max_players) {
      return NextResponse.json({
        success: false,
        error: '游戏人数已满',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 添加玩家
    const position = isSpectator ? -1 : activePlayers.length
    const result = await supabaseOps.addPlayer({
      game_id: gameId,
      player_name: playerName.trim(),
      position,
      is_spectator: isSpectator,
      cards: []
    })

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // 更新游戏玩家数量
    const newPlayerCount = isSpectator ? game.current_players : game.current_players + 1
    const newSpectatorCount = isSpectator ? game.spectators + 1 : game.spectators
    
    await supabaseOps.updateGame(gameId, {
      current_players: newPlayerCount,
      spectators: newSpectatorCount
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      message: isSpectator ? '加入观战成功' : '加入游戏成功',
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('加入游戏失败:', error)
    return NextResponse.json({
      success: false,
      error: '加入游戏失败',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}