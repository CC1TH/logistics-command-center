import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // ✅ ดึง token จาก header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' }, 
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // ✅ ตรวจสอบ user จาก token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // ✅ ตรวจสอบว่าเป็น admin หรือไม่
    const adminEmails = ['admin@cc1etlth.co.th']
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' }, 
        { status: 403 }
      )
    }

    // ✅ ดึงรายการ users
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error listing users:', error)
      throw error
    }

    return NextResponse.json({ 
      users: users.map(u => ({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at
      }))
    })
  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}