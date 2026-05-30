import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // ใช้ Service Role Key สำหรับ Admin API
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
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