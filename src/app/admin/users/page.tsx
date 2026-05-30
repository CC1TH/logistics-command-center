'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { createClient } from '@/lib/supabaseClient'

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

  // ✅ ตรวจสอบว่าเป็น Admin หรือไม่
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // 📝 กำหนด Email ของ Admin ที่นี่ (แก้ได้ตามต้องการ)
      const adminEmails = [
        'admin@cc1etlth.co.th',
        'commandth@cc1etlth.co.th',
        'ccth@cc1etlth.co.th'
      ]
      
      const isAdmin = adminEmails.includes(user.email || '')

      if (!isAdmin) {
        alert('⚠️ คุณไม่มีสิทธิ์เข้าถึงหน้านี้\nเฉพาะ Admin เท่านั้นที่สามารถเข้าได้')
        router.push('/dashboard')
        return
      }

      setCheckingAuth(false)
    }

    checkAdmin()
  }, [router, supabase.auth])

  // ✅ โหลดข้อมูลผู้ใช้หลังจากตรวจสอบสิทธิ์แล้ว
  useEffect(() => {
    if (!checkingAuth) {
      fetchUsers()
    }
  }, [checkingAuth])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
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
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword })
      })
      
      if (!res.ok) throw new Error('Failed to create user')
      
      alert('✅ สร้างผู้ใช้สำเร็จ')
      setNewEmail('')
      setNewPassword('')
      setShowAddForm(false)
      fetchUsers()
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`ต้องการลบผู้ใช้ ${email} ใช่หรือไม่?`)) return

    try {
      const res = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (!res.ok) throw new Error('Failed to delete user')
      
      alert('✅ ลบผู้ใช้สำเร็จ')
      fetchUsers()
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ✅ แสดง Loading ขณะตรวจสอบสิทธิ์
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">กำลังตรวจสอบสิทธิ์...</p>
          <p className="text-sm text-gray-400 mt-2">เฉพาะ Admin เท่านั้นที่สามารถเข้าถึงหน้านี้</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
            <p className="text-sm text-gray-500 mt-1">จัดการบัญชีผู้ใช้งานระบบ (Admin Only)</p>
          </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
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
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">รายการผู้ใช้งาน ({users.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              กำลังโหลดข้อมูล...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p className="font-medium">ยังไม่มีผู้ใช้งานในระบบ</p>
              <p className="text-sm mt-1">คลิกปุ่ม "+ เพิ่มผู้ใช้" เพื่อสร้างผู้ใช้ใหม่</p>
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
                        สร้างเมื่อ: {new Date(user.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <a href="/admin/tracking" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            📧 Manual E-Mail
          </a>
          <a href="/admin/vehicles" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            🚗 จัดการข้อมูลรถ
          </a>
          <a href="/dashboard" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            📊 Dashboard
          </a>
        </div>
      </main>
    </div>
  )
}