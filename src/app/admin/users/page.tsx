'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  created_at: string
  role?: string
}

export default function UsersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    checkCurrentUser()
    fetchUsers()
  }, [])

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserEmail(user?.email || null)
  }

  const fetchUsers = async () => {
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })

      if (authError) throw authError

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) throw rolesError

      const usersWithRoles = authUsers?.map(user => ({
        ...user,
        role: roles?.find(r => r.user_id === user.id)?.role || 'user'
      })) || []

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // เรียก API Route แทน
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'สร้างผู้ใช้งานไม่สำเร็จ')
      }
      
      alert('สร้างผู้ใช้งานสำเร็จ')
      resetForm()
      fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert('สร้างผู้ใช้งานไม่สำเร็จ: ' + error.message)
    }
  }

  const handleDelete = async (userId: string, userEmail: string) => {
    if (userEmail === currentUserEmail) {
      alert('ไม่สามารถลบบัญชีตัวเองได้')
      return
    }

    if (!confirm(`ต้องการลบผู้ใช้งาน ${userEmail} ใช่หรือไม่?`)) return

    try {
      // เรียก API Route แทน
      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ลบผู้ใช้งานไม่สำเร็จ')
      }
      
      alert('ลบผู้ใช้งานสำเร็จ')
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert('ลบผู้ใช้งานไม่สำเร็จ: ' + error.message)
    }
  }

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    try {
      if (currentRole === 'admin') {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin')

        if (error) throw error
        alert('ยกเลิกสิทธิ์ Admin สำเร็จ')
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: 'admin' }])

        if (error) throw error
        alert('กำหนดสิทธิ์ Admin สำเร็จ')
      }
      
      fetchUsers()
    } catch (error: any) {
      console.error('Error toggling admin role:', error)
      alert('ดำเนินการไม่สำเร็จ: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: ''
    })
    setShowForm(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              จัดการผู้ใช้งาน
            </h1>
            <Link 
              href="/admin/vehicles" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← กลับไปจัดการรถ
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            {showForm ? 'ยกเลิก' : '+ สร้างผู้ใช้งานใหม่'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">สร้างผู้ใช้งานใหม่</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="ขั้นต่ำ 6 ตัวอักษร"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  สร้างผู้ใช้งาน
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    สร้างเมื่อ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      ยังไม่มีผู้ใช้งาน
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {user.email}
                        {user.email === currentUserEmail && (
                          <span className="ml-2 text-xs text-blue-600">(คุณ)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.role || 'user')}
                          className={`text-sm px-3 py-1 rounded ${
                            user.role === 'admin'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          }`}
                        >
                          {user.role === 'admin' ? 'ยกเลิก Admin' : 'ตั้งเป็น Admin'}
                        </button>
                        
                        {user.email !== currentUserEmail && (
                          <button
                            onClick={() => handleDelete(user.id, user.email)}
                            className="text-sm text-red-600 hover:text-red-900"
                          >
                            ลบ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 คำแนะนำ:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>ผู้ใช้งานใหม่จะสามารถเข้าสู่ระบบได้ทันทีด้วยอีเมลและรหัสผ่านที่กำหนด</li>
            <li>ผู้ใช้งานทั่วไปจะเห็นเฉพาะหน้า Dashboard (Monitor View)</li>
            <li>Admin สามารถเข้าถึงหน้าจัดการข้อมูลรถและจัดการผู้ใช้งานได้</li>
            <li>คุณไม่สามารถลบบัญชีตัวเองได้</li>
          </ul>
        </div>
      </main>
    </div>
  )
}