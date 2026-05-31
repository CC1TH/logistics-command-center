'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { ADMIN_EMAILS } from '@/lib/checkAuth'

interface User {
  id: string
  email: string
  created_at: string
}

export default function UsersPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ตรวจสอบสิทธิ์ Admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.error('Auth error:', error)
          alert('กรุณา Login ใหม่')
          router.push('/login')
          return
        }

        // ตรวจสอบว่าเป็น Admin หรือไม่
        if (!ADMIN_EMAILS.includes(user.email || '')) {
          alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
          router.push('/dashboard')
          return
        }

        setCheckingAuth(false)
      } catch (err) {
        console.error('Error in checkAuth:', err)
        alert('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์')
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  // โหลดข้อมูลผู้ใช้
  useEffect(() => {
    if (!checkingAuth) {
      fetchUsers()
    }
  }, [checkingAuth])

  // ✅ ฟังก์ชันโหลดข้อมูลผู้ใช้ (แก้ไขแล้ว - ส่ง Token ไปด้วย)
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // ✅ ดึง session ปัจจุบัน
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Session หมดอายุ กรุณา Login ใหม่')
      }

      if (!session || !session.access_token) {
        console.error('No session or access token')
        throw new Error('Session หมดอายุ กรุณา Login ใหม่')
      }

      console.log('Fetching users with token...')
      
      // ✅ ส่ง token ไปด้วยใน header
      const res = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // ✅ ส่ง access token
        }
      })
      
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้')
        } else if (res.status === 401) {
          throw new Error('Session หมดอายุ กรุณา Login ใหม่')
        } else {
          const errorData = await res.json()
          throw new Error(errorData.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
        }
      }
      
      const data = await res.json()
      console.log('Users data:', data)
      setUsers(data.users || [])
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
      alert(err.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
      
      // ✅ ถ้า session หมดอายุ ให้ redirect ไป login
      if (err.message.includes('Session หมดอายุ')) {
        await supabase.auth.signOut()
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      alert('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    try {
      // ✅ ดึง session สำหรับการสร้าง user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Session หมดอายุ กรุณา Login ใหม่')
      }

      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // ✅ ส่ง token
        },
        body: JSON.stringify({ email: newEmail, password: newPassword })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create user')
      }
      
      alert('สร้างผู้ใช้สำเร็จ')
      setNewEmail('')
      setNewPassword('')
      setShowAddForm(false)
      fetchUsers()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`ต้องการลบผู้ใช้ ${email} ใช่หรือไม่?`)) return

    try {
      // ✅ ดึง session สำหรับการลบ user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Session หมดอายุ กรุณา Login ใหม่')
      }

      const res = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // ✅ ส่ง token
        },
        body: JSON.stringify({ userId })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }
      
      alert('ลบผู้ใช้สำเร็จ')
      fetchUsers()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // แสดง Loading ขณะตรวจสอบสิทธิ์
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {showAddForm ? '✕ ยกเลิก' : '+ เพิ่มผู้ใช้'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">เพิ่มผู้ใช้งานใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input 
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  สร้างผู้ใช้
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">รายการผู้ใช้งาน ({users.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              กำลังโหลดข้อมูล...
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-2">⚠️ {error}</div>
              <button 
                onClick={fetchUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p>ยังไม่มีผู้ใช้งานในระบบ</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        สร้างเมื่อ: {new Date(user.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/admin/tracking" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            📧 Manual E-Mail
          </Link>
          <Link href="/admin/vehicles" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            🚗 จัดการข้อมูลรถ
          </Link>
          <Link href="/dashboard" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            📊 Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}