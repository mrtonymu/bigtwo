import { createClient as createSupabaseClient, SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dgpxcfqfmqvkdymomzqa.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncHhjZnFmbXF2a2R5bW9tenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTM5ODIsImV4cCI6MjA3MzE4OTk4Mn0.Bu5qaPt7cQuwoVbmBwXzg-0-u5VYcu_icnJZtr7CqtQ'

// 明确指定Supabase客户端类型
export type SupabaseClient = BaseSupabaseClient<Database>

// 创建全局单例实例
let supabaseInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  return supabaseInstance
}

// 获取类型安全的客户端实例
export const supabase = createClient()
