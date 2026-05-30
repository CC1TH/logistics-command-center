'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'

interface ComparisonRow {
  id: number
  booking: string
  truck: string
  contNo: string
}

// สร้างข้อมูลเริ่มต้น 50 แถว
const INITIAL_ROWS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  booking: '',
  truck: '',
  contNo: ''
}))

export default function ComparisonPage() {
  // โหลดข้อมูลจาก localStorage ถ้ามี
  const [set1, setSet1] = useState<ComparisonRow[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('compare-set1')
      return saved ? JSON.parse(saved) : INITIAL_ROWS
    }
    return INITIAL_ROWS
  })

  const [set2, setSet2] = useState<ComparisonRow[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('compare-set2')
      return saved ? JSON.parse(saved) : INITIAL_ROWS
    }
    return INITIAL_ROWS
  })

  // บันทึกข้อมูลอัตโนมัติเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('compare-set1', JSON.stringify(set1))
  }, [set1])

  useEffect(() => {
    localStorage.setItem('compare-set2', JSON.stringify(set2))
  }, [set2])

  const updateField = (set: 1 | 2, id: number, field: keyof ComparisonRow, value: string) => {
    if (set === 1) {
      setSet1(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row))
    } else {
      setSet2(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row))
    }
  }

  const clearAll = () => {
    if (confirm('ต้องการล้างข้อมูลทั้งหมดในหน้านี้ใช่หรือไม่?')) {
      setSet1(INITIAL_ROWS)
      setSet2(INITIAL_ROWS)
      localStorage.removeItem('compare-set1')
      localStorage.removeItem('compare-set2')
    }
  }

  const handleVerify = () => {
    // ตัวอย่าง Logic: ตรวจสอบว่ามีข้อมูลว่างหรือไม่
    const emptySet1 = set1.filter(r => !r.booking && !r.truck && !r.contNo).length
    const emptySet2 = set2.filter(r => !r.booking && !r.truck && !r.contNo).length
    
    alert(`การตรวจสอบเบื้องต้น:\n- ชุดที่ 1 มีข้อมูล ${50 - emptySet1} แถว\n- ชุดที่ 2 มีข้อมูล ${50 - emptySet2} แถว`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* ✅ แก้ไข max-w เป็น standard class */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Data Comparison</h1>
          <p className="text-gray-500 mt-2">เปรียบเทียบข้อมูล 2 ชุด เพื่อหาความแตกต่าง</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* === ชุดที่ 1 (สีฟ้า) === */}
          {/* ✅ แก้ไข max-h-[600px] เป็น max-h-150 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-screen max-h-150">
            <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">ชุดที่ 1</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 sticky top-0 text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 w-12">#</th>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Truck Number</th>
                    <th className="px-4 py-3">Container Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {set1.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-500">{row.id}</td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={row.booking}
                          onChange={(e) => updateField(1, row.id, 'booking', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={row.truck}
                          onChange={(e) => updateField(1, row.id, 'truck', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={row.contNo}
                          onChange={(e) => updateField(1, row.id, 'contNo', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* === ชุดที่ 2 (สีเขียว) === */}
          {/* ✅ แก้ไข max-h-[600px] เป็น max-h-150 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-screen max-h-150">
            <div className="bg-green-600 px-4 py-3 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">ชุดที่ 2</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 sticky top-0 text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 w-12">#</th>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Truck Number</th>
                    <th className="px-4 py-3">Container Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {set2.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-500">{row.id}</td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={row.booking}
                          onChange={(e) => updateField(2, row.id, 'booking', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={row.truck}
                          onChange={(e) => updateField(2, row.id, 'truck', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={row.contNo}
                          onChange={(e) => updateField(2, row.id, 'contNo', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ปุ่มควบคุม */}
        <div className="flex justify-center gap-4 pb-10">
          <button 
            onClick={clearAll}
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            เคลียร์ข้อมูล
          </button>
          <button 
            onClick={handleVerify}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            ตรวจสอบ
          </button>
        </div>

      </main>
    </div>
  )
}