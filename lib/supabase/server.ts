import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dgpxcfqfmqvkdymomzqa.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncHhjZnFmbXF2a2R5bW9tenFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYxMzk4MiwiZXhwIjoyMDczMTg5OTgyfQ.KhQcrTQAaMvJJC-eioZz9kiYAUQuMYr59YKmZ-caDgY'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}
