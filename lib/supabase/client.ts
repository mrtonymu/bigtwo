import { createClient as createSupabaseClient, SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// 明确指定Supabase客户端类型
export type SupabaseClient = BaseSupabaseClient<Database>

// 创建全局单例实例
let supabaseInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!, {
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
  return supabaseInstance!
}

// 获取类型安全的客户端实例
export const supabase = createClient()
