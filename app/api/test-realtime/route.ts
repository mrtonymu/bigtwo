import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 测试实时连接
    const channel = supabase.channel('test-channel')
    
    // 测试订阅游戏表变化
    const subscription = channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games'
      }, (payload) => {
        console.log('游戏表变化:', payload)
      })
      .subscribe((status) => {
        console.log('订阅状态:', status)
      })

    // 等待一小段时间检查连接状态
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const channelState = channel.state
    
    // 清理订阅
    await supabase.removeChannel(channel)

    return NextResponse.json({
      success: true,
      message: '实时订阅测试完成',
      tests: {
        channel: '✅ 频道创建成功',
        subscription: '✅ 订阅设置成功',
        connection: channelState === 'joined' ? '✅ 连接成功' : '⚠️ 连接状态: ' + channelState
      },
      channelState,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('实时订阅测试失败:', error)
    return NextResponse.json({
      success: false,
      error: '实时订阅测试失败',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}