'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function OverNightSummaryPage() {
  const router = useRouter()
  const [groupedData, setGroupedData] = useState<Record<string, OverNightRow[]>>({})
  const [sortedDates, setSortedDates] = useState<string[]>([])

  useEffect(() => {
    const raw = sessionStorage.getItem('overnight-data')
    if (!raw) {
      router.push('/overnight')
      return
    }

    const allRows: OverNightRow[] = JSON.parse(raw)
    // กรองแถวที่กรอกข้อมูลอย่างน้อย 1 ช่อง
    const filledRows = allRows.filter(r => 
      r.booking || r.truck || r.trailer || r.contNo || r.puDate || r.shipment || r.remarks
    )

    // จัดกลุ่มตาม P/U Date
    const grouped: Record<string, OverNightRow[]> = {}
    filledRows.forEach(row => {
      const date = row.puDate || 'ไม่ระบุวันที่'
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(row)
    })

    // เรียงวันที่
    const dates = Object.keys(grouped).sort((a, b) => {
      if (a === 'ไม่ระบุวันที่') return 1
      if (b === 'ไม่ระบุวันที่') return -1
      return new Date(a).getTime() - new Date(b).getTime()
    })

    setGroupedData(grouped)
    setSortedDates(dates)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard OverNight</h1>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500 self-center">ทั้งหมด {sortedDates.reduce((acc, d) => acc + groupedData[d].length, 0)} รายการ</span>
            <button 
              onClick={() => router.back()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              🔙 กลับ
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 px-4 py-2 flex justify-between items-center">
                <span className="text-white font-bold text-sm flex items-center gap-2">📅 {date}</span>
                <span className="text-blue-100 text-xs font-medium">{groupedData[date].length} รายการ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Booking', 'Truck', 'Cont No.', 'Shipment', 'Remarks', 'จัดการ'].map(h => (
                        <th key={h} className="px-4 py-2 text-left font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedData[date].map(row => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{row.booking}</td>
                        <td className="px-4 py-2 text-gray-600">{row.truck}</td>
                        <td className="px-4 py-2 text-gray-600">{row.contNo}</td>
                        <td className="px-4 py-2 text-gray-600 max-w-[250px] truncate">{row.shipment}</td>
                        <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate">{row.remarks}</td>
                        <td className="px-4 py-2">
                          <button className="text-red-500 hover:text-red-700 text-xs">️ ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {sortedDates.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              ยังไม่มีข้อมูลสำหรับสรุป
            </div>
          )}
        </div>
      </main>
    </div>
  )
}