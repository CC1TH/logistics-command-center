'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'

interface OverNightRow {
  id: number
  booking: string
  truck: string
  trailer: string
  contNo: string
  puDate: string
  shipment: string
  remarks: string
}

export default function OverNightPage() {
  // สร้าง 50 แถวเริ่มต้น
  const [rows, setRows] = useState<OverNightRow[]>(
    Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      booking: '',
      truck: '',
      trailer: '',
      contNo: '',
      puDate: '',
      shipment: '',
      remarks: ''
    }))
  )

  // อัปเดตข้อมูลในแถว
  const updateRow = (id: number, field: keyof OverNightRow, value: string) => {
    setRows(prev =>
      prev.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    )
  }

  // ล้างข้อมูลทั้งหมด
  const clearAll = () => {
    if (confirm('ต้องการล้างข้อมูลทั้งหมดใช่หรือไม่?')) {
      setRows(
        Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          booking: '',
          truck: '',
          trailer: '',
          contNo: '',
          puDate: '',
          shipment: '',
          remarks: ''
        }))
      )
    }
  }

  // ปุ่มสรุป
  const handleSummary = () => {
    const filledRows = rows.filter(row =>
      row.booking || row.truck || row.trailer || row.contNo || row.puDate || row.shipment || row.remarks
    )
    alert(`สรุป: มีข้อมูลที่กรอกแล้ว ${filledRows.length} จาก 50 แถว`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {/* หัวข้อและปุ่ม */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">OverNight</h1>
          <div className="flex gap-2">
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ล้างทั้งหมด
            </button>
            <button
              onClick={handleSummary}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              สรุป
            </button>
          </div>
        </div>

        {/* ตารางข้อมูล */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-blue-600 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase w-12">#</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase min-w-[150px]">Booking</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase min-w-[100px]">Truck</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase min-w-[100px]">Trailer</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase min-w-[150px]">Cont No</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase min-w-[120px]">P/U Date</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase min-w-[200px]">Shipment</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase min-w-[200px]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-600 font-medium">{row.id}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.booking}
                        onChange={(e) => updateRow(row.id, 'booking', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder=""
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.truck}
                        onChange={(e) => updateRow(row.id, 'truck', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.trailer}
                        onChange={(e) => updateRow(row.id, 'trailer', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.contNo}
                        onChange={(e) => updateRow(row.id, 'contNo', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={row.puDate}
                        onChange={(e) => updateRow(row.id, 'puDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.shipment}
                        onChange={(e) => updateRow(row.id, 'shipment', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => updateRow(row.id, 'remarks', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}