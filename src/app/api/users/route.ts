import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function GET() {
  const supabase = createClient()
  
  try {
    // ใช้ admin API ผ่าน service role
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}