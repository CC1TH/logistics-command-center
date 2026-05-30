import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function GET() {
  const supabase = createClient()
  
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