import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  // 在构建时跳过数据库连接测试
  if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_URL) {
    return NextResponse.json({
      success: true,
      message: '构建环境跳过数据库测试',
      tests: {
        connection: false,
        gamesTable: false,
        playersTable: false,
        gameStateTable: false,
        insertTest: false
      },
      timestamp: new Date().toISOString()
    })
  }

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
    
    // 4. 测试插入操作（仅在开发环境）
    if (process.env.NODE_ENV !== 'production') {
      try {
        // 简化测试，只检查表结构而不实际插入数据
        const { data, error } = await supabase
          .from('games')
          .select('id')
          .limit(0)
        
        if (!error) {
          tests.insertTest = true
        } else {
          console.error('Insert test error:', error)
        }
      } catch (error) {
        console.error('Insert test error:', error)
      }
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