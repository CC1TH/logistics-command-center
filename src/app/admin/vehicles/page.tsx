'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Vehicle {
  id: string
  license_plate: string
  company_name: string
  gps_name: string
  gps_link: string
  status: string
  notes: string
  created_at: string
  updated_at: string
}

export default function VehiclesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    license_plate: '',
    company_name: '',
    gps_name: '',
    gps_link: '',
    status: 'Active',
    notes: ''
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('vehicles')
          .update(formData)
          .eq('id', editingId)
        
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('vehicles')
          .insert([formData])
        
        if (error) throw error
      }

      // Reset form and refresh
      resetForm()
      fetchVehicles()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert('บันทึกข้อมูลไม่สำเร็จ')
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      license_plate: vehicle.license_plate,
      company_name: vehicle.company_name || '',
      gps_name: vehicle.gps_name || '',
      gps_link: vehicle.gps_link || '',
      status: vehicle.status,
      notes: vehicle.notes || ''
    })
    setEditingId(vehicle.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบข้อมูลรถคันนี้ใช่หรือไม่?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      alert('ลบข้อมูลไม่สำเร็จ')
    }
  }

  const resetForm = () => {
    setFormData({
      license_plate: '',
      company_name: '',
      gps_name: '',
      gps_link: '',
      status: 'Active',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            ระบบจัดการข้อมูลรถขนส่ง
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ปุ่มเพิ่มรถ */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            {showForm ? 'ยกเลิก' : '+ เพิ่มข้อมูลรถ'}
          </button>
        </div>

        {/* ฟอร์มเพิ่ม/แก้ไข */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'แก้ไขข้อมูลรถ' : 'เพิ่มข้อมูลรถ'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ทะเบียนรถ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบริษัท
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ GPS
                  </label>
                  <input
                    type="text"
                    value={formData.gps_name}
                    onChange={(e) => setFormData({...formData, gps_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ลิงก์ GPS
                  </label>
                  <input
                    type="text"
                    value={formData.gps_link}
                    onChange={(e) => setFormData({...formData, gps_link: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  {editingId ? 'อัปเดต' : 'บันทึก'}
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

        {/* ตารางข้อมูล */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ทะเบียนรถ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    บริษัท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    GPS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    หมายเหตุ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      ยังไม่มีข้อมูลรถ
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {vehicle.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {vehicle.company_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.gps_link ? (
                          <a 
                            href={vehicle.gps_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 underline"
                          >
                            {vehicle.gps_name || 'GPS Link'}
                          </a>
                        ) : (
                          <span className="text-gray-500">
                            {vehicle.gps_name || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          vehicle.status === 'Active' 
                            ? 'bg-green-100 text-green-800'
                            : vehicle.status === 'Inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {vehicle.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}