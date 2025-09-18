import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 测试基本连接 - 使用简单的健康检查
    const { data, error } = await supabase.auth.getSession()
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('Supabase连接错误:', error)
      return NextResponse.json({
        success: false,
        error: 'Supabase连接失败',
        details: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // 测试环境变量配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: '环境变量配置不完整',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        },
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase连接测试成功',
      tests: {
        connection: '✅ 客户端初始化成功',
        auth: '✅ 认证服务可用',
        config: '✅ 环境变量配置完整'
      },
      config: {
        url: supabaseUrl,
        keyLength: supabaseKey.length,
        hasSession: !!data.session
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('测试过程中发生未知错误:', error)
    return NextResponse.json({
      success: false,
      error: '测试过程中发生未知错误',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}