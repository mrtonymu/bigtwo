import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const { gameOptions } = await request.json()

    // 验证游戏选项格式
    if (!gameOptions || typeof gameOptions !== 'object') {
      return NextResponse.json(
        { error: 'Invalid game options format' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 更新游戏选项
    const { data, error } = await (supabase as any)
      .from('games')
      .update({ game_options: gameOptions })
      .eq('id', gameId)
      .select()
      .single()

    if (error) {
      console.error('Error updating game options:', error)
      return NextResponse.json(
        { error: 'Failed to update game options' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      gameOptions: (data as any).game_options 
    })

  } catch (error) {
    console.error('Error in game options API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}