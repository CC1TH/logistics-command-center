import { createClient } from '@/lib/supabaseClient'

// กำหนด Email ของ Admin (แก้ไขตาม email จริงของคุณ)
export const ADMIN_EMAILS = ['admin@cc1etlth.co.th']

export interface UserAuthResult {
  user: any
  isAdmin: boolean
  error: string | null
}

export async function getCurrentUser(): Promise<UserAuthResult> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, isAdmin: false, error: error?.message || 'Not authenticated' }
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email || '')
    
    return { user, isAdmin, error: null }
  } catch (err) {
    console.error('Error in getCurrentUser:', err)
    return { user: null, isAdmin: false, error: 'Failed to get user' }
  }
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(email || '')
}