'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// --- Interfaces ---
interface TripBlock {
  id?: string
  workDate: string
  groupName: string
  licensePlate: string
  gpsName: string
  gpsLink: string
  notes: string
  latLng: string
  deliveryAddress: string
  locationName: string
  distanceKm: string
  eta: string
  arrivalTime: string
  updatedAt: string
  statusColor: 'default' | 'ovn' | 'wait'
  isNew?: boolean
}

interface DateSummary {
  date: string
  count: number
}

// --- Constants for Sidebar ---
const TEXT_SNIPPETS = [
  "Reached, ICD Savannakhet",
  "Reached, Bukit Kayu Hitam, Kedah, Malaysia",
  "Reached, Padang Besar",
  "- Journey out from Sadao customs date xx/xx/xxxx time 00:00 pm."
]

const LOCATION_PRESETS = [
  { name: "Bukit Kayu Hitam, Kedah, Malaysia (Yard)", latLng: "6.483514, 100.422430" },
  { name: "Bukit Kayu Hitam, Kedah, Malaysia (Customs)", latLng: "6.513266, 100.424133" },
  { name: "Sadao, Songkhla", latLng: "6.544442, 100.416695" },
  { name: "ICD Savannakhet", latLng: "16.614202, 104.802505" },
  { name: "Mueang Mukdahan (Customs)", latLng: "16.600288, 104.726940" }
]

export default function TrackingPage() {
  const supabase = createClient()
  const router = useRouter()
  
  // --- States ---
  const [allTrips, setAllTrips] = useState<TripBlock[]>([])
  const [loading, setLoading] = useState(true)
  
  // Navigation States
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showCalendar, setShowCalendar] = useState(false)
  
  // UI States
  const [isMergeMode, setIsMergeMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // --- Effects ---
  useEffect(() => { 
    fetchAllTrips() 
  }, [])

  // --- Helper: Copy to Clipboard ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // --- Data Fetching ---
  const fetchAllTrips = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trip_logs')
        .select('*')
        .order('work_date', { ascending: false })
        .limit(200)
      
      if (error) throw error
      const mapped: TripBlock[] = (data || []).map((t: any) => ({
        id: t.id, workDate: t.work_date?.split('T')[0] || '', groupName: t.group_name || '', 
        licensePlate: t.license_plate || '', gpsName: t.gps_name || '', gpsLink: t.gps_link || '',
        notes: t.notes || '', latLng: t.lat_lng || '', deliveryAddress: t.delivery_address || '',
        locationName: t.location_name || '', distanceKm: String(t.distance_km || ''),
        eta: t.eta_hours ? String(t.eta_hours) : '', arrivalTime: t.arrival_time || '',
        updatedAt: t.updated_at || '', statusColor: t.status_color || 'default', isNew: false
      }))
      setAllTrips(mapped)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  // --- List View Helpers ---
  const uniqueDates = useMemo(() => {
    const dates = new Map<string, number>()
    allTrips.forEach(t => {
      if (t.workDate) dates.set(t.workDate, (dates.get(t.workDate) || 0) + 1)
    })
    return Array.from(dates.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [allTrips])

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setShowCalendar(false)
    setViewMode('detail')
  }

  const deleteDate = async (date: string) => {
    if (!confirm(`ต้องการลบงานทั้งหมดของวันที่ ${date} ใช่หรือไม่?`)) return
    try {
      await supabase.from('trip_logs').delete().eq('work_date', date)
      fetchAllTrips()
    } catch (err) { alert('ลบไม่สำเร็จ') }
  }

  // --- Detail View Logic (Form) ---
  const addBlock = () => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setAllTrips(prev => [...prev, {
      id: tempId, workDate: selectedDate,
      groupName: '', licensePlate: '', gpsName: '', gpsLink: '', notes: '', latLng: '', deliveryAddress: '',
      locationName: '', distanceKm: '', eta: '', arrivalTime: '', updatedAt: '',
      statusColor: 'default', isNew: true
    }])
  }

  const updateField = (index: number, field: keyof TripBlock, value: string) => {
    setAllTrips(prev => {
      const newTrips = [...prev]
      newTrips[index] = { ...newTrips[index], [field]: value }
      return newTrips
    })
  }

  const fetchVehicleData = async (index: number, plate: string) => {
    if (plate.length < 3) return
    try {
      const { data, error } = await supabase.from('vehicles').select('gps_name, gps_link, notes').eq('license_plate', plate).single()
      if (!error && data) {
        setAllTrips(prev => {
          const newTrips = [...prev]
          newTrips[index].gpsName = data.gps_name || ''
          newTrips[index].gpsLink = data.gps_link || ''
          newTrips[index].notes = data.notes || ''
          return newTrips
        })
      }
    } catch (err) { console.error('Vehicle fetch error:', err) }
  }

  const fetchLocationFromCoords = useCallback(async (index: number, latLng: string) => {
    const coords = latLng.split(',').map(c => c.trim())
    if (coords.length !== 2 || isNaN(Number(coords[0])) || isNaN(Number(coords[1]))) return

    try {
      const [lat, lng] = coords
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&zoom=10`,
        { headers: { 'User-Agent': 'LogisticsCommandCenter/1.0' } }
      )
      const data = await res.json()
      const addr = data.address || {}

      let district = addr.county || addr.city_district || ''
      let province = addr.state || ''

      if (!district || !province) {
        const fullName = data.display_name || ""
        const parts = fullName.split(',').map((p: string) => p.trim())
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i].toLowerCase()
          if (p.includes('province') || p.includes('changwat') || p.includes('state')) {
             province = parts[i].replace(/(province|changwat|state)/gi, '').trim()
             if (i > 0) district = parts[i-1]
             break
          }
        }
      }

      const unwantedWords = ['Subdistrict', 'Tambon', 'Administrative', 'Organization', 'Municipality', 'District', 'Amphoe']
      district = district.replace(new RegExp(unwantedWords.join('|'), 'gi'), '').trim()
      province = province.replace(/(Province|Changwat|State)/gi, '').trim()

      let location = ''
      if (district && province) location = `${district}, ${province}`
      else if (district) location = district
      else if (province) location = province

      setAllTrips(prev => {
        const newTrips = [...prev]
        newTrips[index].locationName = location
        return newTrips
      })
    } catch (err) { console.error('Geocoding error:', err) }
  }, [])

  const calculateMetrics = (index: number, distStr: string) => {
    const dist = parseFloat(distStr)
    if (isNaN(dist) || dist <= 0) return
    const etaRounded = Math.round(dist / 58)
    const now = new Date()
    const arrival = new Date(now.getTime() + etaRounded * 60 * 60 * 1000)
    
    const fmtDateTime = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${h}.${m}`
    }

    setAllTrips(prev => {
      const newTrips = [...prev]
      newTrips[index].eta = String(etaRounded)
      newTrips[index].arrivalTime = fmtDateTime(arrival)
      newTrips[index].updatedAt = fmtDateTime(now)
      return newTrips
    })
  }

  const handleDistanceInput = (index: number, e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return
    calculateMetrics(index, allTrips[index].distanceKm)
  }

  const toggleSelect = (id: string | undefined) => {
    if (!id) return
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleMerge = () => {
    if (!isMergeMode) {
      setIsMergeMode(true)
      setSelectedIds([])
    } else {
      if (selectedIds.length < 2) { alert('กรุณาเลือกอย่างน้อย 2 คันเพื่อรวมกลุ่ม'); return }
      const newGroupName = `Job-${new Date().getTime().toString().slice(-5)}`
      setAllTrips(prev => {
        const newTrips = [...prev]
        newTrips.forEach(trip => { if (trip.id && selectedIds.includes(trip.id)) trip.groupName = newGroupName })
        return newTrips
      })
      setIsMergeMode(false)
      setSelectedIds([])
    }
  }

  const currentDayTrips = useMemo(() => {
    const trips = allTrips.filter(t => t.workDate === selectedDate)
    const tempGroups: Record<string, number[]> = {}
    trips.forEach((trip, index) => {
      const key = trip.groupName.trim() || `standalone-${trip.id || index}`
      if (!tempGroups[key]) tempGroups[key] = []
      tempGroups[key].push(index)
    })
    return Object.entries(tempGroups).map(([name, indices]) => ({ 
      name: name.startsWith('standalone-') ? '' : name, 
      indices,
      isStandalone: name.startsWith('standalone-')
    }))
  }, [allTrips, selectedDate])

  const deleteBlock = async (index: number) => {
    const trip = allTrips[index]
    if (!confirm('ต้องการลบข้อมูลนี้ใช่หรือไม่?')) return
    if (trip.id && !trip.id.startsWith('temp-')) await supabase.from('trip_logs').delete().eq('id', trip.id)
    setAllTrips(prev => prev.filter((_, i) => i !== index))
  }

  const saveBlock = async (index: number) => {
    const trip = allTrips[index]
    const payload = {
      work_date: trip.workDate || selectedDate,
      group_name: trip.groupName,
      license_plate: trip.licensePlate, gps_name: trip.gpsName, gps_link: trip.gpsLink, notes: trip.notes,
      lat_lng: trip.latLng, delivery_address: trip.deliveryAddress, location_name: trip.locationName,
      distance_km: parseFloat(trip.distanceKm) || null, eta_hours: parseFloat(trip.eta) || null,
      arrival_time: trip.arrivalTime, updated_at: trip.updatedAt, status_color: trip.statusColor, 
      sort_order: index
    }
    let error, savedId = trip.id
    if (trip.isNew) {
      const res = await supabase.from('trip_logs').insert([payload]).select()
      error = res.error
      if (!error && res.data?.[0]) savedId = res.data[0].id
    } else {
      const res = await supabase.from('trip_logs').update(payload).eq('id', trip.id!).select()
      error = res.error
    }
    if (error) { alert('บันทึกไม่สำเร็จ: ' + error.message); return }
    setAllTrips(prev => {
      const arr = [...prev]; arr[index].isNew = false
      if (savedId && !arr[index].id) arr[index].id = savedId
      return arr
    })
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  // --- Render: Calendar Popup ---
  const renderCalendar = () => {
    if (!showCalendar) return null
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCalendar(false)}>
        <div className="bg-white rounded-xl shadow-xl p-4 w-80" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <button className="text-gray-400">‹</button>
            <span className="font-bold text-gray-700">{monthNames[currentMonth]} {currentYear + 543}</span>
            <button className="text-gray-400">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
            <span>A</span><span>J</span><span>A</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <button 
                key={i} 
                disabled={!d}
                onClick={() => {
                  if (d) {
                    const m = String(currentMonth + 1).padStart(2, '0')
                    const day = String(d).padStart(2, '0')
                    handleSelectDate(`${currentYear}-${m}-${day}`)
                  }
                }}
                className={`h-8 w-8 rounded-full text-sm flex items-center justify-center ${
                  d === today.getDate() ? 'bg-green-500 text-white' : 'hover:bg-gray-100 text-gray-700'
                } ${!d ? 'invisible' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- Render: List View (Overview) ---
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {renderCalendar()}
        <div className="max-w-2xl mx-auto flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manual E-Mail</h1>
          <div className="flex gap-2">
             <button onClick={() => setShowCalendar(true)} className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
               
             </button>
             <button onClick={() => handleSelectDate(new Date().toISOString().split('T')[0])} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 font-medium flex items-center gap-2">
               + เพิ่ม
             </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : uniqueDates.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-500">ยังไม่มีงาน</p>
              <button onClick={() => setShowCalendar(true)} className="mt-4 text-blue-600 hover:underline text-sm">เลือกวันที่เพื่อเริ่มงาน</button>
            </div>
          ) : (
            uniqueDates.map(({ date, count }) => (
              <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectDate(date)}>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-lg">{date.split('-').reverse().join('/')}</div>
                    <div className="text-sm text-gray-500">{count} บล็อก</div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => deleteDate(date)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="text-gray-400">›</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // --- Render: Detail View (The Form with Sidebars) ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {renderCalendar()}
      
      {/* Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              ← กลับ
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              Manual E-Mail <span className="text-sm font-normal text-gray-500 ml-2">({selectedDate.split('-').reverse().join('/')})</span>
            </h1>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-600">ออกจากระบบ</button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ✅ Sidebar Left: Text Snippets */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto sticky top-16 h-[calc(100vh-64px)]">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Text Snippets</h3>
          <div className="space-y-2">
            {TEXT_SNIPPETS.map((snippet, i) => (
              <div key={i} className="group bg-gray-50 border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-all">
                <p className="text-sm text-gray-700 mb-1 wrap-break-word pr-6">{snippet}</p>
                <button 
                  onClick={() => copyToClipboard(snippet)}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                   คัดลอก
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* ✅ Center: Work Blocks */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Blocks List */}
            {currentDayTrips.length === 0 && !allTrips.some(t => t.workDate === selectedDate && t.isNew) ? (
               <div className="text-center py-20 text-gray-400 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                 <div className="text-6xl mb-4">📋</div>
                 <p className="text-lg">ไม่มีข้อมูลสำหรับวันนี้</p>
                 <p className="text-sm mt-2">กด "+ เพิ่ม" เพื่อเริ่มงานใหม่</p>
               </div>
            ) : (
              currentDayTrips.map((group, gIdx) => {
                const groupName = group.name
                const isStandalone = group.isStandalone
                return (
                  <div key={groupName + gIdx} className={`rounded-xl border overflow-hidden transition-all shadow-sm ${isStandalone ? 'border-gray-200 bg-white' : 'border-blue-300 bg-blue-50/10'}`}>
                    {!isStandalone && (
                      <div className="bg-blue-100/50 px-4 py-2 flex justify-between items-center border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-800">📦 กลุ่ม: {groupName}</span>
                          <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">{group.indices.length} คัน</span>
                        </div>
                      </div>
                    )}
                    <div className={`${!isStandalone ? 'divide-y divide-blue-100/50' : ''}`}>
                      {group.indices.map((idx) => {
                        const trip = allTrips[idx]
                        const bgColor = trip.statusColor === 'ovn' ? '#E0FFFF' : trip.statusColor === 'wait' ? '#FFFFE0' : '#ffffff'
                        return (
                          <div key={trip.id || `temp-${idx}`} className="p-4 transition-colors relative" style={{ backgroundColor: bgColor }}>
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                {isMergeMode && (
                                  <input 
                                    type="checkbox" 
                                    checked={!!trip.id && selectedIds.includes(trip.id)} 
                                    onChange={() => toggleSelect(trip.id)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                  />
                                )}
                                <span className="text-xs text-gray-400">
                                  {isStandalone ? 'งานเดี่ยว' : `คันที่ ${group.indices.indexOf(idx) + 1} ในกลุ่ม`}
                                </span>
                              </div>
                              <button onClick={() => deleteBlock(idx)} className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
                            </div>
                            
                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">ทะเบียนรถ</label>
                                <input value={trip.licensePlate} onChange={e => updateField(idx, 'licensePlate', e.target.value)} onBlur={() => fetchVehicleData(idx, trip.licensePlate)} className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น 60-3794" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">ข้อมูล GPS</label>
                                {trip.gpsLink ? (
                                  <a href={trip.gpsLink} target="_blank" rel="noopener noreferrer" className="block w-full py-2 px-3 border border-blue-200 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 underline truncate text-sm text-center font-medium"> {trip.gpsName || 'เปิด GPS'}</a>
                                ) : (
                                  <input value={trip.gpsName} disabled className="w-full py-2 px-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm" readOnly />
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">หมายเหตุ (Auto)</label>
                                <input value={trip.notes} disabled className="w-full py-2 px-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm" readOnly />
                              </div>
                            </div>

                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Latitude, Longitude</label>
                              <input value={trip.latLng} onChange={e => updateField(idx, 'latLng', e.target.value)} onBlur={() => fetchLocationFromCoords(idx, trip.latLng)} className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="13.7563, 100.5018" />
                            </div>

                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Address</label>
                              <input value={trip.deliveryAddress} onChange={e => updateField(idx, 'deliveryAddress', e.target.value)} className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Location (Auto-detected)</label>
                              <input value={trip.locationName} onChange={e => updateField(idx, 'locationName', e.target.value)} className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Phanom Phrai, Roi Et" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Dist. (KM)</label>
                                <input type="number" value={trip.distanceKm} onChange={e => updateField(idx, 'distanceKm', e.target.value)} onKeyDown={e => handleDistanceInput(idx, e)} onBlur={e => handleDistanceInput(idx, e)} className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">ETA (Hrs)</label>
                                <input value={trip.eta} disabled className="w-full py-2 px-3 border border-gray-200 rounded-lg bg-gray-100 text-sm" readOnly />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">เวลาถึง</label>
                                <input value={trip.arrivalTime} disabled className="w-full py-2 px-3 border border-gray-200 rounded-lg bg-gray-100 text-sm" readOnly />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">อัปเดต</label>
                                <input value={trip.updatedAt} disabled className="w-full py-2 px-3 border border-gray-200 rounded-lg bg-gray-100 text-[10px]" readOnly />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                              <button onClick={() => setAllTrips(prev => { const a=[...prev]; a[idx].statusColor = a[idx].statusColor === 'ovn' ? 'default' : 'ovn'; return a })} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${trip.statusColor === 'ovn' ? 'bg-[#00FFFF] border-[#00cccc] text-black shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>OVN</button>
                              <button onClick={() => setAllTrips(prev => { const a=[...prev]; a[idx].statusColor = a[idx].statusColor === 'wait' ? 'default' : 'wait'; return a })} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${trip.statusColor === 'wait' ? 'bg-[#FFFF00] border-[#cccc00] text-black shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Wait</button>
                              <div className="ml-auto">
                                <button onClick={() => saveBlock(idx)} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm flex items-center gap-2">💾 บันทึก</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </main>

        {/* ✅ Sidebar Right: Location Presets */}
        <aside className="hidden lg:block w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto sticky top-16 h-[calc(100vh-64px)]">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Location Presets</h3>
          <div className="space-y-3">
            {LOCATION_PRESETS.map((preset, i) => (
              <div key={i} className="group bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-gray-800 flex-1 pr-2">{preset.name}</p>
                  <button onClick={() => copyToClipboard(preset.name)} className="text-gray-400 hover:text-blue-500 transition-colors">
                    📋
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 font-mono">{preset.latLng}</p>
                  <button onClick={() => copyToClipboard(preset.latLng)} className="text-gray-400 hover:text-blue-500 transition-colors text-xs">
                    คัดลอก
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ✅ Floating Action Buttons (Fixed Bottom Right) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-30">
        <button 
          onClick={handleMerge}
          className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-lg font-medium transition-all hover:scale-105 active:scale-95 ${
            isMergeMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {isMergeMode ? '✅ ยืนยันการรวม' : '🔗 รวม'}
        </button>
        <button 
          onClick={addBlock}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 font-medium transition-all hover:scale-105 active:scale-95"
        >
          + เพิ่ม
        </button>
      </div>
      
      {/* Toast Notification for Copy */}
      {copiedText && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg text-sm z-50 animate-bounce">
          ✅ คัดลอกข้อความสำเร็จ!
        </div>
      )}
    </div>
  )
}