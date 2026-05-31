import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/checkAuth'

export async function DELETE(request: Request) {
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

    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      )
    }
    
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) {
      console.error('Error deleting user:', error)
      throw error
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/delete-user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}