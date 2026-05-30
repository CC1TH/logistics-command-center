import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function DELETE(request: Request) {
  const supabase = createClient()
  
  try {
    const { userId } = await request.json()
    
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}