import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const { email, password } = await request.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    
    if (error) throw error

    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}