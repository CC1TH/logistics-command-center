import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_EMAILS } from '@/lib/checkAuth'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ ตรวจสอบสิทธิ์ Admin แบบ Dynamic จากไฟล์กลาง
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    return NextResponse.json({
      users: users.map(u => ({ id: u.id, email: u.email || '', created_at: u.created_at }))
    })
  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}