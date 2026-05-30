import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function GET() {
  const supabase = createClient()
  
  // ✅ 1. ตรวจสอบว่ามี user login หรือไม่
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
  }

  // ✅ 2. ตรวจสอบว่าเป็น Admin หรือไม่
  const adminEmails = [
    'admin@cc1etlth.co.th',
    'commandth@cc1etlth.co.th',
    'ccth@cc1etlth.co.th'
  ]
  
  if (!adminEmails.includes(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  // ✅ 3. ดึงรายการ users ทั้งหมด
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) throw error

    return NextResponse.json({ 
      users: users.map(u => ({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at
      }))
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}