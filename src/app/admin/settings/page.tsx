'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { ADMIN_EMAILS } from '@/lib/checkAuth'

export default function SettingsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(ADMIN_EMAILS.includes(user?.email || ''))
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ✅ แสดงเฉพาะ Admin */}
          {isAdmin && (
            <Link href="/admin/users" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">👥</span>
                <h3 className="font-semibold text-gray-800">จัดการผู้ใช้งาน</h3>
              </div>
              <p className="text-sm text-gray-600">เพิ่ม ลบ แก้ไขผู้ใช้งานระบบ</p>
            </Link>
          )}

          <Link href="/admin/vehicles" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🚗</span>
              <h3 className="font-semibold text-gray-800">จัดการข้อมูลรถ</h3>
            </div>
            <p className="text-sm text-gray-600">จัดการทะเบียนรถ GPS และข้อมูลต่างๆ</p>
          </Link>

          <Link href="/admin/tracking" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📧</span>
              <h3 className="font-semibold text-gray-800">Manual E-Mail</h3>
            </div>
            <p className="text-sm text-gray-600">จัดการงานและติดตามรถรายวัน</p>
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔧</span>
              <h3 className="font-semibold text-gray-800">การตั้งค่าอื่นๆ</h3>
            </div>
            <p className="text-sm text-gray-600">กำลังพัฒนา</p>
          </div>
        </div>
      </main>
    </div>
  )
}