import { createBrowserClient } from '@supabase/ssr'

// ✅ สำคัญ: ต้องเป็น function ปกติ (ไม่ใช้ async) เพื่อให้ return เป็น Client จริงๆ
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}