import { createClient } from '@/lib/supabaseClient'

// ✅ ฟังก์ชันตรวจสอบว่าเป็น Admin หรือไม่
export async function checkIsAdmin() {
  const supabase = createClient()
  
  // ดึงข้อมูล user ปัจจุบัน
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { isAdmin: false, error: 'Not authenticated', user: null }
  }

  // 📝 กำหนด Email ของ Admin ที่นี่
  const adminEmails = [
    'admin@cc1etlth.co.th',
    'commandth@cc1etlth.co.th',
    'ccth@cc1etlth.co.th'
  ]
  
  const isAdmin = adminEmails.includes(user.email || '')

  return { isAdmin, user, error: null }
}