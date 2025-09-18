import { NextRequest, NextResponse } from 'next/server'
import { supabaseOps } from '@/lib/supabase/operations'

// GET /api/games/[id] - 获取游戏详情
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

    const result = await supabaseOps.getGameDetails(gameId)

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error.message,
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('获取游戏详情失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取游戏详情失败',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PUT /api/games/[id] - 更新游戏状态
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const body = await request.json()

    if (!gameId) {
      return NextResponse.json({
        success: false,
        error: '游戏ID不能为空',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const result = await supabaseOps.updateGame(gameId, body)

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
      message: '游戏更新成功',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('更新游戏失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新游戏失败',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}