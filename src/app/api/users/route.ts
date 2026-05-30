import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // ✅ ใช้ Admin Client ที่มี Service Role Key
    // เพื่อให้สามารถเรียก auth.admin.listUsers() ได้
    const supabase = createAdminClient()
    
    // ดึงข้อมูลผู้ใช้ทั้งหมดจาก Supabase Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Supabase Error:', error)
      throw error
    }

    console.log('✅ Successfully fetched users:', users.length)

    // แปลงข้อมูลและส่งกลับ
    return NextResponse.json({ 
      users: users.map(u => ({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at
      }))
    })
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}