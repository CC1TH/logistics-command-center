'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Vehicle {
  id: string
  license_plate: string
  company_name: string
  gps_name: string
  gps_link: string
  status: string
  notes: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('license_plate', { ascending: true }) // เรียงตามทะเบียน

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // กรองข้อมูลตามคำค้นหา
  const filteredVehicles = vehicles.filter(vehicle => {
    const search = searchTerm.toLowerCase()
    return (
      vehicle.license_plate.toLowerCase().includes(search) ||
      (vehicle.company_name && vehicle.company_name.toLowerCase().includes(search))
    )
  })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              🚛 Logistics Monitor
            </h1>
            {/* ปุ่มลับสำหรับ Admin กลับไปหน้าจัดการข้อมูล */}
            <Link 
              href="/admin/vehicles" 
              className="text-xs text-gray-500 hover:text-blue-600 border border-gray-300 px-2 py-1 rounded"
            >
              (Admin Mode)
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ช่องค้นหา */}
        <div className="mb-6">
          <input
            type="text"
            placeholder=" ค้นหาทะเบียนรถ หรือชื่อบริษัท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-20 text-gray-500">ไม่พบข้อมูลรถ</div>
            ) : (
              /* Grid Layout สำหรับการ์ด */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                      vehicle.status === 'Out of Service' ? 'border-red-300' : ''
                    }`}
                  >
                    {/* ส่วนหัวการ์ด (สีตามสถานะ) */}
                    <div className={`px-4 py-2 flex justify-between items-center ${
                      vehicle.status === 'Active' ? 'bg-green-50' : 
                      vehicle.status === 'Inactive' ? 'bg-gray-50' : 'bg-red-50'
                    }`}>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        vehicle.status === 'Active' ? 'bg-green-200 text-green-800' : 
                        vehicle.status === 'Inactive' ? 'bg-gray-200 text-gray-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {vehicle.status}
                      </span>
                      <span className="text-xs text-gray-500">{vehicle.company_name}</span>
                    </div>

                    {/* เนื้อหาการ์ด */}
                    <div className="p-4">
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {vehicle.license_plate}
                      </h3>
                      
                      {vehicle.notes && (
                        <p className="text-xs text-gray-500 mb-3 italic">
                          📝 {vehicle.notes}
                        </p>
                      )}

                      {/* ปุ่ม GPS */}
                      {vehicle.gps_link ? (
                        <a
                          href={vehicle.gps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-2"
                        >
                          📍 เปิด GPS ({vehicle.gps_name || 'Link'})
                        </a>
                      ) : (
                        <button
                          disabled
                          className="block w-full text-center bg-gray-100 text-gray-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed mb-2"
                        >
                          ไม่มีลิงก์ GPS
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}