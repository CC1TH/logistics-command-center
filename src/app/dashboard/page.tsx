'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Vehicle {
  id?: string
  licensePlate: string
  companyName: string
  gpsName: string
  gpsLink: string
  status: string
  notes?: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  
  // --- States ---
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  
  // ETA Calculator States
  const [distance, setDistance] = useState('')
  const [etaResult, setEtaResult] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  
  // Search States
  const [searchTerm, setSearchTerm] = useState('')
  
  // Add Vehicle States
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '',
    companyName: '',
    gpsName: '',
    gpsLink: ''
  })
  
  // Toggle States
  const [showAllVehicles, setShowAllVehicles] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)

  // --- Effects ---
  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setVehicles(data || [])
    } catch (err) {
      console.error('Error fetching vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- ETA Calculator ---
  const calculateETA = () => {
    const dist = parseFloat(distance)
    if (isNaN(dist) || dist <= 0) {
      alert('กรุณากรอกระยะทางที่ถูกต้อง')
      return
    }

    // สูตร: ระยะทาง / 58
    const hoursRaw = dist / 58
    
    // ปัดเศษ: < 0.5 ปัดลง, >= 0.5 ปัดขึ้น
    const hours = Math.round(hoursRaw)
    
    // คำนวณเวลาถึง
    const now = new Date()
    const arrival = new Date(now.getTime() + hours * 60 * 60 * 1000)
    
    // Format เวลาไทย
    const formatDate = (date: Date) => {
      const day = date.getDate()
      const month = date.getMonth() + 1
      const year = date.getFullYear() + 543
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes} ${day}/${month}/${year}`
    }
    
    setEtaResult(`${hours} ชั่วโมง`)
    setArrivalTime(formatDate(arrival))
  }

  // --- Search Vehicles ---
  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return []
    return vehicles.filter(v => 
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5) // แสดงแค่ 5 ผลลัพธ์แรก
  }, [searchTerm, vehicles])

  // --- Add Vehicle ---
  const handleAddVehicle = async () => {
    if (!newVehicle.licensePlate || !newVehicle.companyName) {
      alert('กรุณากรอกทะเบียนรถและชื่อบริษัท')
      return
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([{
          license_plate: newVehicle.licensePlate,
          company_name: newVehicle.companyName,
          gps_name: newVehicle.gpsName,
          gps_link: newVehicle.gpsLink,
          status: 'Active'
        }])
      
      if (error) throw error
      
      alert('เพิ่มข้อมูลรถสำเร็จ')
      setNewVehicle({ licensePlate: '', companyName: '', gpsName: '', gpsLink: '' })
      setShowAddVehicle(false)
      fetchVehicles()
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚛</span>
            <h1 className="text-xl font-bold text-gray-800">Logistics Monitor</h1>
            <button 
              onClick={() => router.push('/admin/tracking')}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100"
            >
              Admin Mode
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        
        {/* ✅ ส่วนที่ 1: คำนวณ ETA */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-800">คำนวณ ETA</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">เวลาปัจจุบัน (เวลาไทย)</label>
              <input 
                type="text" 
                value={new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">ระยะทาง (กม.)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="เช่น 60"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={calculateETA}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ผลลัพธ์</label>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                {etaResult || 'กรอกเวลาและระยะทาง'}
              </div>
            </div>
          </div>
          
          {arrivalTime && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">เวลาถึงจุดหมาย:</span> {arrivalTime}
              </p>
            </div>
          )}
        </section>

        {/* ✅ ส่วนที่ 2: ค้นหาทะเบียนรถ */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            ค้นหาทะเบียนรถ (พิมพ์เฉพาะตัวเลข)
          </h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="เช่น 1234"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          {/* ผลการค้นหา */}
          {filteredVehicles.length > 0 && (
            <div className="mt-3 space-y-2">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-800">{vehicle.licensePlate}</p>
                    <p className="text-sm text-gray-600">{vehicle.companyName}</p>
                  </div>
                  {vehicle.gpsLink && (
                    <a 
                      href={vehicle.gpsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      📍 เปิด GPS {vehicle.gpsName && `(${vehicle.gpsName})`}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ✅ ส่วนที่ 3: เพิ่มข้อมูลรถ */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">เพิ่มข้อมูลรถ</h2>
            <button 
              onClick={() => setShowAddVehicle(!showAddVehicle)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {showAddVehicle ? '✕ ยกเลิก' : '+ เพิ่มแถว'}
            </button>
          </div>
          
          {showAddVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  type="text"
                  value={newVehicle.licensePlate}
                  onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                  placeholder="ทะเบียนรถ"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input 
                  type="text"
                  value={newVehicle.companyName}
                  onChange={(e) => setNewVehicle({...newVehicle, companyName: e.target.value})}
                  placeholder="ชื่อบริษัท"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input 
                  type="text"
                  value={newVehicle.gpsName}
                  onChange={(e) => setNewVehicle({...newVehicle, gpsName: e.target.value})}
                  placeholder="ชื่อ GPS"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input 
                  type="text"
                  value={newVehicle.gpsLink}
                  onChange={(e) => setNewVehicle({...newVehicle, gpsLink: e.target.value})}
                  placeholder="ลิงก์ GPS"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleAddVehicle}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  บันทึก
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ✅ ส่วนที่ 4: รายการรถทั้งหมด (Toggle) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setShowAllVehicles(!showAllVehicles)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showAllVehicles ? '▼' : '▶'} รายการรถทั้งหมด
            </button>
            <span className="text-xs text-gray-500">{vehicles.length} คัน</span>
          </div>
          
          {showAllVehicles && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      vehicle.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {vehicle.status}
                    </span>
                    <span className="text-xs text-gray-500">{vehicle.companyName || 'PMT'}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{vehicle.licensePlate}</h3>
                  
                  {vehicle.gpsLink ? (
                    <a 
                      href={vehicle.gpsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 text-center transition-colors"
                    >
                      📍 เปิด GPS {vehicle.gpsName && `(${vehicle.gpsName})`}
                    </a>
                  ) : (
                    <div className="mt-2 px-3 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg text-center">
                      ไม่มีลิงก์ GPS
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}