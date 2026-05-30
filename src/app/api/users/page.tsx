'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  created_at: string
}

export default function UsersPage() {
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

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
      
      alert('สร้างผู้ใช้สำเร็จ')
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
      
      alert('ลบผู้ใช้สำเร็จ')
      fetchUsers()
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message)
    }
  }

  const handleLogout = async () => {
    // Simple logout - redirect to login
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              ← กลับ
            </button>
            <h1 className="text-xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* ปุ่มเพิ่มผู้ใช้ */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">จัดการบัญชีผู้ใช้งานระบบ</p>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {showAddForm ? '✕ ยกเลิก' : '+ เพิ่มผู้ใช้'}
          </button>
        </div>

        {/* ฟอร์มเพิ่มผู้ใช้ */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">เพิ่มผู้ใช้งานใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล
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
                  รหัสผ่าน
                </label>
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

        {/* รายการผู้ใช้ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
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

        {/* Navigation Links */}
        <div className="mt-6 flex gap-3">
          <Link 
            href="/admin/tracking"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            📧 Manual E-Mail
          </Link>
          <Link 
            href="/admin/vehicles"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            🚗 จัดการข้อมูลรถ
          </Link>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            📊 Dashboard
          </Link>
        </div>

      </main>
    </div>
  )
}