import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/checkAuth'

export async function GET() {
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
    
    // ตรวจสอบสิทธิ์ Admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Not logged in' }, 
        { status: 401 }
      )
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' }, 
        { status: 403 }
      )
    }

    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error listing users:', error)
      throw error
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}