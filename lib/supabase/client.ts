import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dgpxcfqfmqvkdymomzqa.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncHhjZnFmbXF2a2R5bW9tenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTM5ODIsImV4cCI6MjA3MzE4OTk4Mn0.Bu5qaPt7cQuwoVbmBwXzg-0-u5VYcu_icnJZtr7CqtQ'

// 创建全局单例实例
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}
