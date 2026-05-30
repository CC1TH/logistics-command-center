'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

interface Vehicle {
  id?: string
  licensePlate: string
  companyName: string
  gpsName: string
  gpsLink: string
  status: string
  notes?: string
  created_at?: string
}

export default function VehiclesPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '',
    companyName: '',
    gpsName: '',
    gpsLink: '',
    notes: ''
  })

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
      
      const mapped = (data || []).map((v: any) => ({
        id: v.id,
        licensePlate: v.license_plate || '',
        companyName: v.company_name || '',
        gpsName: v.gps_name || '',
        gpsLink: v.gps_link || '',
        status: v.status || 'Active',
        notes: v.notes || '',
        created_at: v.created_at
      }))
      setVehicles(mapped)
    } catch (err) {
      console.error('Error fetching vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async () => {
    if (!newVehicle.licensePlate) {
      alert('กรุณากรอกทะเบียนรถ')
      return
    }
    try {
      const { error } = await supabase.from('vehicles').insert([{
        license_plate: newVehicle.licensePlate,
        company_name: newVehicle.companyName,
        gps_name: newVehicle.gpsName,
        gps_link: newVehicle.gpsLink,
        notes: newVehicle.notes,
        status: 'Active'
      }])
      if (error) throw error
      alert('เพิ่มข้อมูลสำเร็จ')
      setNewVehicle({ licensePlate: '', companyName: '', gpsName: '', gpsLink: '', notes: '' })
      setShowAddForm(false)
      fetchVehicles()
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err as Error).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบข้อมูลรถคันนี้ใช่หรือไม่?')) return
    try {
      await supabase.from('vehicles').delete().eq('id', id)
      fetchVehicles()
    } catch (err) {
      alert('ลบไม่สำเร็จ')
    }
  }

  const filteredVehicles = vehicles.filter(v => 
    v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.gpsName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ 1. เพิ่ม Navigation Component (จะมี 3 แท็บ + Logout ให้อัตโนมัติ) */}
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* ✅ 2. ย้ายหัวข้อลงมาไว้เหนือช่องค้นหา และเปลี่ยนชื่อเป็น Trucks Details */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Trucks Details</h1>

        {/* ช่องค้นหา */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาด้วยทะเบียนรถ, บริษัท, หรือชื่อ GPS..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* ปุ่มเพิ่มข้อมูล */}
        <div className="mb-4">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            + เพิ่มข้อมูลรถ
          </button>
        </div>

        {/* ฟอร์มเพิ่มข้อมูล (แสดงเมื่อกดปุ่ม) */}
        {showAddForm && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input type="text" placeholder="ทะเบียนรถ" value={newVehicle.licensePlate} onChange={e => setNewVehicle({...newVehicle, licensePlate: e.target.value})} className="px-3 py-2 border rounded text-sm" />
            <input type="text" placeholder="บริษัท" value={newVehicle.companyName} onChange={e => setNewVehicle({...newVehicle, companyName: e.target.value})} className="px-3 py-2 border rounded text-sm" />
            <input type="text" placeholder="ชื่อ GPS" value={newVehicle.gpsName} onChange={e => setNewVehicle({...newVehicle, gpsName: e.target.value})} className="px-3 py-2 border rounded text-sm" />
            <input type="text" placeholder="ลิงก์ GPS" value={newVehicle.gpsLink} onChange={e => setNewVehicle({...newVehicle, gpsLink: e.target.value})} className="px-3 py-2 border rounded text-sm" />
            <input type="text" placeholder="หมายเหตุ" value={newVehicle.notes} onChange={e => setNewVehicle({...newVehicle, notes: e.target.value})} className="px-3 py-2 border rounded text-sm" />
            <div className="md:col-span-5 flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleAddVehicle} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">บันทึก</button>
            </div>
          </div>
        )}

        {/* ตารางแสดงข้อมูล */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ทะเบียนรถ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บริษัท</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมายเหตุ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">กำลังโหลดข้อมูล...</td></tr>
              ) : filteredVehicles.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">ไม่พบข้อมูล</td></tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.licensePlate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                      {v.gpsLink ? <a href={v.gpsLink} target="_blank" rel="noopener noreferrer">{v.gpsName || 'เปิด GPS'}</a> : v.gpsName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${v.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.notes || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">แก้ไข</button>
                      <button onClick={() => handleDelete(v.id || '')} className="text-red-600 hover:text-red-900">ลบ</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}