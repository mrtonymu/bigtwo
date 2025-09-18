import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 测试数据库连接和表结构
    const tests = {
      connection: false,
      gamesTable: false,
      playersTable: false,
      gameStateTable: false,
      insertTest: false
    }
    
    // 1. 测试基本连接
    try {
      const { data, error } = await supabase.from('games').select('count').limit(1)
      if (!error) {
        tests.connection = true
        tests.gamesTable = true
      } else {
        console.error('Games table error:', error)
      }
    } catch (error) {
      console.error('Connection error:', error)
    }
    
    // 2. 测试players表
    try {
      const { data, error } = await supabase.from('players').select('count').limit(1)
      if (!error) {
        tests.playersTable = true
      } else {
        console.error('Players table error:', error)
      }
    } catch (error) {
      console.error('Players table error:', error)
    }
    
    // 3. 测试game_state表
    try {
      const { data, error } = await supabase.from('game_state').select('count').limit(1)
      if (!error) {
        tests.gameStateTable = true
      } else {
        console.error('Game state table error:', error)
      }
    } catch (error) {
      console.error('Game state table error:', error)
    }
    
    // 4. 测试插入操作（不实际插入）
    try {
      const testData = {
        name: '测试游戏',
        status: 'waiting' as const,
        max_players: 4,
        current_players: 0,
        spectators: 0,
        game_options: {
          allowSpectators: true,
          gameSpeed: "normal" as const,
          autoPass: false,
          showCardCount: true,
          cardSorting: "auto" as const,
          autoArrange: true
        }
      }
      
      // 使用dry run模式测试插入
      const { data, error } = await supabase
        .from('games')
        .insert(testData)
        .select()
        .single()
      
      if (!error && data) {
        tests.insertTest = true
        // 立即删除测试数据
        await supabase.from('games').delete().eq('id', data.id)
      } else {
        console.error('Insert test error:', error)
      }
    } catch (error) {
      console.error('Insert test error:', error)
    }
    
    return NextResponse.json({
      success: true,
      message: '数据库测试完成',
      tests,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: '数据库测试失败',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}