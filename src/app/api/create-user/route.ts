import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/checkAuth'

export async function POST(request: Request) {
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

    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    
    if (error) {
      console.error('Error creating user:', error)
      throw error
    }

    return NextResponse.json({ user: data.user, message: 'User created successfully' })
  } catch (error) {
    console.error('Error in POST /api/create-user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}