import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // ดึงข้อมูล users จาก auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) throw authError

    // ดึงข้อมูล role จาก user_roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')

    if (rolesError) throw rolesError

    // รวมข้อมูล
    const usersWithRoles = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      role: roles?.find(r => r.user_id === user.id)?.role || 'user'
    }))

    return NextResponse.json({ users: usersWithRoles })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}