'use client'

import { useState, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { useRouter } from 'next/navigation'

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

const DATA_KEYS: (keyof Omit<OverNightRow, 'id'>)[] = ['booking', 'truck', 'trailer', 'contNo', 'puDate', 'shipment', 'remarks']

export default function OverNightPage() {
  const router = useRouter()
  const [rows, setRows] = useState<OverNightRow[]>(
    Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      booking: '', truck: '', trailer: '', contNo: '', puDate: '', shipment: '', remarks: ''
    }))
  )

  const updateRow = useCallback((id: number, field: keyof OverNightRow, value: string) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row))
  }, [])

  // ✅ ระบบ Copy/Paste แบบ Excel
  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const pastedRows = text.split(/\r?\n/).filter(r => r.trim() !== '')
    
    setRows(prev => {
      const newRows = [...prev]
      pastedRows.forEach((rowData, rIdx) => {
        const targetRowIdx = rowIndex + rIdx
        if (targetRowIdx >= 50) return
        
        const cells = rowData.split('\t')
        cells.forEach((cellData, cIdx) => {
          const targetColIdx = colIndex + cIdx
          if (targetColIdx < DATA_KEYS.length) {
            const key = DATA_KEYS[targetColIdx]
            newRows[targetRowIdx][key] = cellData.trim()
          }
        })
      })
      return newRows
    })
  }

  // ✅ Navigation แบบ Excel (Tab/Enter)
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const inputs = document.querySelectorAll('input[data-row]')
    const nextInput = (row: number, col: number) => {
      const target = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`) as HTMLInputElement
      target?.focus()
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const nextCol = e.shiftKey ? colIndex - 1 : colIndex + 1
      if (nextCol >= 0 && nextCol < DATA_KEYS.length) {
        nextInput(rowIndex, nextCol)
      } else if (!e.shiftKey && rowIndex < 49) {
        nextInput(rowIndex + 1, 0)
      } else if (e.shiftKey && rowIndex > 0) {
        nextInput(rowIndex - 1, DATA_KEYS.length - 1)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (rowIndex < 49) nextInput(rowIndex + 1, colIndex)
    }
  }

  const clearAll = () => {
    if (confirm('ยืนยันการล้าง/เคลียร์ข้อมูลในหน้านี้หรือไม่?')) {
      setRows(Array.from({ length: 50 }, (_, i) => ({
        id: i + 1, booking: '', truck: '', trailer: '', contNo: '', puDate: '', shipment: '', remarks: ''
      })))
    }
  }

  const handleSummary = () => {
    sessionStorage.setItem('overnight-data', JSON.stringify(rows))
    router.push('/overnight/summary')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">OverNight</h1>
          <div className="flex gap-2">
            <button onClick={clearAll} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2">
              🗑️ ล้างทั้งหมด
            </button>
            <button onClick={handleSummary} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              📄 สรุป
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-220px)]">
            <table className="min-w-full border-collapse">
              <thead className="bg-blue-600 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white w-10 border-r border-blue-500">#</th>
                  {['Booking', 'Truck', 'Trailer', 'Cont No.', 'P/U Date', 'Shipment', 'Remarks'].map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-xs font-bold text-white min-w-[140px] border-r border-blue-500 last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={row.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-1.5 text-sm text-gray-500 font-medium bg-gray-50 border-r border-gray-200 text-center">{row.id}</td>
                    {DATA_KEYS.map((key, cIdx) => (
                      <td key={key} className="px-1 py-1 border-r border-gray-200 last:border-r-0">
                        <input
                          type="text"
                          value={row[key]}
                          onChange={e => updateRow(row.id, key, e.target.value)}
                          onPaste={e => handlePaste(e, rIdx, cIdx)}
                          onKeyDown={e => handleKeyDown(e, rIdx, cIdx)}
                          data-row={rIdx}
                          data-col={cIdx}
                          className="w-full px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-sm bg-transparent outline-none transition-colors"
                        />
                      </td>
                    ))}
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