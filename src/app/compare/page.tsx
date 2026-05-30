'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'

interface ComparisonRow {
  id: number
  booking: string
  truck: string
  contNo: string
}

// สร้างข้อมูลเริ่มต้น 50 แถว
const INITIAL_ROWS: ComparisonRow[] = Array.from({ length: 50 }, (_, i) => ({
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

  const [showResults, setShowResults] = useState(false)
  const [onlyInSet1, setOnlyInSet1] = useState<ComparisonRow[]>([])
  const [onlyInSet2, setOnlyInSet2] = useState<ComparisonRow[]>([])

  // บันทึกข้อมูลอัตโนมัติเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('compare-set1', JSON.stringify(set1))
  }, [set1])

  useEffect(() => {
    localStorage.setItem('compare-set2', JSON.stringify(set2))
  }, [set2])

  const updateField = (set: 1 | 2, id: number, field: keyof ComparisonRow, value: string) => {
    if (set === 1) {
      setSet1((prev) => prev.map((row) => row.id === id ? { ...row, [field]: value } : row))
    } else {
      setSet2((prev) => prev.map((row) => row.id === id ? { ...row, [field]: value } : row))
    }
  }

  // ✅ ระบบ Copy/Paste แบบ Excel (แก้ไข Type Error แล้ว)
  const handlePaste = useCallback((e: React.ClipboardEvent, rowIndex: number, colIndex: number, setNumber: 1 | 2) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const pastedRows = text.split(/\r?\n/).filter((r) => r.trim() !== '')
    
    const fields: (keyof ComparisonRow)[] = ['booking', 'truck', 'contNo']

    const updateSet = (prev: ComparisonRow[]): ComparisonRow[] => {
      const newRows = [...prev]
      pastedRows.forEach((rowData, rIdx) => {
        const targetRowIdx = rowIndex + rIdx
        if (targetRowIdx >= 50) return
        
        const cells = rowData.split('\t')
        cells.forEach((cellData, cIdx) => {
          const targetColIdx = colIndex + cIdx
          if (targetColIdx < fields.length) {
            const key = fields[targetColIdx]
            // ✅ ใช้ as any เพื่อแก้ Error Type 'string' is not assignable to type 'never'
            ;(newRows[targetRowIdx] as any)[key] = cellData.trim()
          }
        })
      })
      return newRows
    }

    if (setNumber === 1) {
      setSet1(updateSet)
    } else {
      setSet2(updateSet)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const nextInput = (row: number, col: number) => {
      const target = document.querySelector(`input[data-set][data-row="${row}"][data-col="${col}"]`) as HTMLInputElement
      target?.focus()
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const nextCol = e.shiftKey ? colIndex - 1 : colIndex + 1
      if (nextCol >= 0 && nextCol < 3) {
        nextInput(rowIndex, nextCol)
      } else if (!e.shiftKey && rowIndex < 49) {
        nextInput(rowIndex + 1, 0)
      } else if (e.shiftKey && rowIndex > 0) {
        nextInput(rowIndex - 1, 2)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (rowIndex < 49) nextInput(rowIndex + 1, colIndex)
    }
  }

  // ✅ ล้างข้อมูลพร้อมยืนยัน
  const clearAll = () => {
    if (confirm('ยืนยันการลบ/เคลียร์ข้อมูลทั้งหมดในหน้านี้หรือไม่?')) {
      setSet1(INITIAL_ROWS)
      setSet2(INITIAL_ROWS)
      localStorage.removeItem('compare-set1')
      localStorage.removeItem('compare-set2')
      setShowResults(false)
      setOnlyInSet1([])
      setOnlyInSet2([])
    }
  }

  // ✅ ตรวจสอบและเปรียบเทียบข้อมูล
  const handleVerify = () => {
    const filledSet1 = set1.filter((r) => r.booking || r.truck || r.contNo)
    const filledSet2 = set2.filter((r) => r.booking || r.truck || r.contNo)

    // สร้าง key สำหรับเปรียบเทียบ (Booking + Truck + ContNo)
    const createKey = (row: ComparisonRow) => 
      `${row.booking.toLowerCase()}_${row.truck.toLowerCase()}_${row.contNo.toLowerCase()}`

    const set1Keys = new Set(filledSet1.map(createKey))
    const set2Keys = new Set(filledSet2.map(createKey))

    // หาข้อมูลที่อยู่ใน Set1 เท่านั้น
    const only1 = filledSet1.filter((row) => !set2Keys.has(createKey(row)))
    // หาข้อมูลที่อยู่ใน Set2 เท่านั้น
    const only2 = filledSet2.filter((row) => !set1Keys.has(createKey(row)))

    setOnlyInSet1(only1)
    setOnlyInSet2(only2)
    setShowResults(true)

    // Scroll ไปดูผลลัพธ์
    setTimeout(() => {
      document.getElementById('comparison-results')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ฟังก์ชันสร้างตาราง (Render Helper)
  const renderTable = (data: ComparisonRow[], color: 'blue' | 'green', setNumber: 1 | 2) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-screen max-h-150">
      <div className={`${color === 'blue' ? 'bg-blue-600' : 'bg-green-600'} px-4 py-3`}>
        <h2 className="text-white font-bold text-lg">ชุดที่ {setNumber}</h2>
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
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-500">{row.id}</td>
                {(['booking', 'truck', 'contNo'] as const).map((field, colIdx) => (
                  <td key={field} className="px-2 py-2">
                    <input 
                      type="text" 
                      value={row[field]}
                      onChange={(e) => updateField(setNumber, row.id, field, e.target.value)}
                      onPaste={(e) => handlePaste(e, row.id - 1, colIdx, setNumber)}
                      onKeyDown={(e) => handleKeyDown(e, row.id - 1, colIdx)}
                      data-set={setNumber}
                      data-row={row.id - 1}
                      data-col={colIdx}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Data Comparison</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {renderTable(set1, 'blue', 1)}
          {renderTable(set2, 'green', 2)}
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

        {/* ✅ ผลการเปรียบเทียบ */}
        {showResults && (
          <div id="comparison-results" className="mt-8 mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">ผลการเปรียบเทียบ</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* มีเฉพาะในชุดที่ 1 */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h3 className="text-red-700 font-bold text-lg mb-3">
                  มีเฉพาะในชุดที่ 1 ({onlyInSet1.length} รายการ)
                </h3>
                {onlyInSet1.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Booking</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Truck Number</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Container Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {onlyInSet1.map((row, idx) => (
                          <tr key={idx} className="hover:bg-red-100">
                            <td className="px-3 py-2 font-medium">{row.booking}</td>
                            <td className="px-3 py-2">{row.truck}</td>
                            <td className="px-3 py-2">{row.contNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">ไม่มีข้อมูลที่แตกต่างกัน</p>
                )}
              </div>

              {/* มีเฉพาะในชุดที่ 2 */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <h3 className="text-amber-700 font-bold text-lg mb-3">
                  มีเฉพาะในชุดที่ 2 ({onlyInSet2.length} รายการ)
                </h3>
                {onlyInSet2.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Booking</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Truck Number</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Container Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {onlyInSet2.map((row, idx) => (
                          <tr key={idx} className="hover:bg-amber-100">
                            <td className="px-3 py-2 font-medium">{row.booking}</td>
                            <td className="px-3 py-2">{row.truck}</td>
                            <td className="px-3 py-2">{row.contNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">ไม่มีข้อมูลที่แตกต่างกัน</p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}