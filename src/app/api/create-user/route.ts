import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
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
    
    const { email, password } = await request.json()
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    
    if (error) {
      console.error('Error creating user:', error)
      throw error
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Error in POST /api/create-user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}