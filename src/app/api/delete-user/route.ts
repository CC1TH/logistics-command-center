import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: Request) {
  try {
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
    
    const { userId } = await request.json()
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (error) {
      console.error('Error deleting user:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/delete-user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}