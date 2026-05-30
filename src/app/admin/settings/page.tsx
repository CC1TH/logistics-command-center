'use client'

import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/users" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">👥</span>
              <h3 className="font-semibold text-gray-800">จัดการผู้ใช้งาน</h3>
            </div>
            <p className="text-sm text-gray-600">เพิ่ม ลบ แก้ไขผู้ใช้งานระบบ</p>
          </Link>

          <Link href="/admin/vehicles" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🚗</span>
              <h3 className="font-semibold text-gray-800">จัดการข้อมูลรถ</h3>
            </div>
            <p className="text-sm text-gray-600">จัดการทะเบียนรถ GPS และข้อมูลต่างๆ</p>
          </Link>
        </div>
      </main>
    </div>
  )
}