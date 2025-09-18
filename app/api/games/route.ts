import { NextRequest, NextResponse } from 'next/server'
import { supabaseOps } from '@/lib/supabase/operations'
import { validateRoomName } from '@/lib/utils/input-validator'

// GET /api/games - 获取游戏列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || 'created_at'
    const ascending = searchParams.get('ascending') !== 'false'

    const result = await supabaseOps.getGames({
      limit,
      offset,
      orderBy,
      ascending
    })

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
      count: result.count,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('获取游戏列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取游戏列表失败',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST /api/games - 创建新游戏
export async function POST(request: NextRequest) {
  let body: any = null
  try {
    body = await request.json()
    const { name, maxPlayers = 4, allowSpectators = true, gameOptions } = body

    // 验证游戏名称
    const nameValidation = validateRoomName(name)
    if (!nameValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: nameValidation.errors.join(', '),
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 默认游戏选项
    const defaultGameOptions = {
      allowSpectators: true,
      gameSpeed: "normal",
      autoPass: false,
      showCardCount: true,
      cardSorting: "auto",
      autoArrange: true,
    }

    // 创建游戏（不包含game_options字段）
    const result = await supabaseOps.createGame({
      name: name.trim(),
      status: 'waiting',
      max_players: maxPlayers,
      current_players: 0,
      spectators: 0
    })

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
      message: '游戏创建成功',
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('创建游戏失败:', error)
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: body
    })
    return NextResponse.json({
      success: false,
      error: '创建游戏失败',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}