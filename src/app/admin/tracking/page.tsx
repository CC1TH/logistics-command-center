'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function TrackingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [trips, setTrips] = useState<TripBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isMergeMode, setIsMergeMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => { 
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    fetchTrips(today)
  }, [])

  const fetchTrips = async (date: string) => {
    if (!date) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trip_logs')
        .select('*')
        .eq('work_date', date)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      const mapped: TripBlock[] = (data || []).map((t: any) => ({
        id: t.id, workDate: t.work_date || '', groupName: t.group_name || '', 
        licensePlate: t.license_plate || '', gpsName: t.gps_name || '', gpsLink: t.gps_link || '',
        notes: t.notes || '', latLng: t.lat_lng || '', deliveryAddress: t.delivery_address || '',
        locationName: t.location_name || '', distanceKm: String(t.distance_km || ''),
        eta: t.eta_hours ? String(t.eta_hours) : '', arrivalTime: t.arrival_time || '',
        updatedAt: t.updated_at || '', statusColor: t.status_color || 'default', isNew: false
      }))
      setTrips(mapped)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    fetchTrips(newDate)
    setIsMergeMode(false)
    setSelectedIds([])
  }

  const addBlock = () => {
    if (!selectedDate) {
      alert('กรุณาเลือกวันที่ก่อน')
      return
    }
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setTrips(prev => [...prev, {
      id: tempId, workDate: selectedDate,
      groupName: '', licensePlate: '', gpsName: '', gpsLink: '', notes: '', latLng: '', deliveryAddress: '',
      locationName: '', distanceKm: '', eta: '', arrivalTime: '', updatedAt: '',
      statusColor: 'default', isNew: true
    }])
  }

  const updateField = (index: number, field: keyof TripBlock, value: string) => {
    setTrips(prev => {
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
        setTrips(prev => {
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

      // ✅ แก้ไขใหม่: ดึงเฉพาะ อำเภอ (District) และ จังหวัด (Province)
      const district = addr.county || addr.city_district || ''
      const province = addr.state || ''

      let location = ''
      if (district && province) location = `${district}, ${province}`
      else if (district) location = district
      else if (province) location = province
      else location = data.display_name?.split(',')[0] || ''

      setTrips(prev => {
        const newTrips = [...prev]
        newTrips[index].locationName = location
        return newTrips
      })
    } catch (err) {
      console.error('Geocoding error:', err)
    }
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

    setTrips(prev => {
      const newTrips = [...prev]
      newTrips[index].eta = String(etaRounded)
      newTrips[index].arrivalTime = fmtDateTime(arrival)
      newTrips[index].updatedAt = fmtDateTime(now)
      return newTrips
    })
  }

  const handleDistanceInput = (index: number, e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return
    calculateMetrics(index, trips[index].distanceKm)
  }

  const toggleSelect = (id: string | undefined) => {
    if (!id) return
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleMerge = () => {
    if (!isMergeMode) {
      setIsMergeMode(true)
      setSelectedIds([])
    } else {
      if (selectedIds.length < 2) {
        alert('กรุณาเลือกอย่างน้อย 2 คันเพื่อรวมกลุ่ม')
        return
      }
      const newGroupName = `Job-${new Date().getTime().toString().slice(-5)}`
      setTrips(prev => {
        const newTrips = [...prev]
        newTrips.forEach(trip => {
          if (trip.id && selectedIds.includes(trip.id)) {
            trip.groupName = newGroupName
          }
        })
        return newTrips
      })
      setIsMergeMode(false)
      setSelectedIds([])
    }
  }

  const groups = useMemo(() => {
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
  }, [trips])

  const moveGroup = (groupIdx: number, dir: number) => {
    const newIdx = groupIdx + dir
    if (newIdx < 0 || newIdx >= groups.length) return
    setTrips(prev => {
      const arr = [...prev]
      const currentIndices = groups[groupIdx].indices
      const targetIndices = groups[newIdx].indices
      const currentItems = currentIndices.map(i => ({ index: i, item: arr[i] }))
      const targetItems = targetIndices.map(i => ({ index: i, item: arr[i] }))
      const allIndices = [...currentIndices, ...targetIndices].sort((a, b) => b - a)
      allIndices.forEach(i => arr.splice(i, 1))
      const insertAt = Math.min(...currentIndices, ...targetIndices)
      if (dir === -1) {
        const itemsToInsert = [...currentItems, ...targetItems].sort((a, b) => a.index - b.index).map(x => x.item)
        arr.splice(insertAt, 0, ...itemsToInsert)
      } else {
        const itemsToInsert = [...targetItems, ...currentItems].sort((a, b) => a.index - b.index).map(x => x.item)
        arr.splice(insertAt, 0, ...itemsToInsert)
      }
      return arr
    })
  }

  const deleteBlock = async (index: number) => {
    const trip = trips[index]
    if (!confirm('ต้องการลบข้อมูลนี้ใช่หรือไม่?')) return
    if (trip.id && !trip.id.startsWith('temp-')) await supabase.from('trip_logs').delete().eq('id', trip.id)
    setTrips(prev => prev.filter((_, i) => i !== index))
  }

  const saveBlock = async (index: number) => {
    const trip = trips[index]
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
    setTrips(prev => {
      const arr = [...prev]; arr[index].isNew = false
      if (savedId && !arr[index].id) arr[index].id = savedId
      return arr
    })
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const formatDateThai = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    return `วันที่ ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`
  }

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">กำลังโหลดข้อมูล...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-800">📧 Manual E-Mail</h1>
            <Link href="/admin/vehicles" className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"> จัดการข้อมูลรถ</Link>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600">ออกจากระบบ</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-3 space-y-3">
        <div className="bg-linear-to-r from-blue-500 to-blue-600 p-3 rounded-lg shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-white text-sm font-bold whitespace-nowrap">
                📅 เลือกวันที่ทำงาน:
              </label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={handleDateChange}
                className="flex-1 px-3 py-1.5 rounded border border-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <div className="text-white text-xs font-medium whitespace-nowrap">
              {formatDateThai(selectedDate)}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-200">
          <button 
            onClick={addBlock} 
            disabled={!selectedDate}
            className={`text-sm px-4 py-1.5 rounded shadow-sm font-medium flex items-center gap-1 transition-all ${
              selectedDate 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>+</span> เพิ่ม
          </button>
          <div className="flex items-center gap-2">
             {isMergeMode && <span className="text-xs text-blue-600 animate-pulse font-medium">เลือกรถ ({selectedIds.length})</span>}
            <button 
              onClick={handleMerge} 
              disabled={!selectedDate}
              className={`text-sm px-4 py-1.5 rounded shadow-sm font-medium flex items-center gap-1 transition-colors ${
                !selectedDate 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isMergeMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isMergeMode ? '✅ ยืนยันการรวม' : '📦 รวมกลุ่ม'}
            </button>
          </div>
        </div>

        {selectedDate && (
          <div className="text-center text-xs text-gray-600 bg-white py-1 px-3 rounded border border-gray-200">
            📊 มีงานทั้งหมด <span className="font-bold text-blue-600">{trips.length}</span> คัน
          </div>
        )}

        {!selectedDate ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-600 font-medium">กรุณาเลือกวันที่ต้องการดู/เพิ่มงาน</p>
            <p className="text-gray-400 text-sm mt-2">ระบบจะแสดงงานเฉพาะวันที่คุณเลือกเท่านั้น</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 font-medium">ยังไม่มีงานสำหรับวันที่ {formatDateThai(selectedDate)}</p>
            <button onClick={addBlock} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm font-medium">
              + เพิ่มงานแรก
            </button>
          </div>
        ) : (
          groups.map((group, gIdx) => {
            const groupName = group.name
            const isStandalone = group.isStandalone
            return (
              <div key={groupName + gIdx} className={`rounded-lg border overflow-hidden transition-all ${isStandalone ? 'border-gray-300 bg-white' : 'border-blue-400 bg-blue-50/20'}`}>
                {!isStandalone && (
                  <div className="bg-blue-100 px-3 py-1.5 flex justify-between items-center border-b border-blue-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-800">📦 กลุ่ม: {groupName}</span>
                      <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">{group.indices.length} คัน</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveGroup(gIdx, -1)} disabled={gIdx === 0} className="p-1 bg-white border border-blue-300 rounded text-xs hover:bg-blue-50 disabled:opacity-30">⬆️</button>
                      <button onClick={() => moveGroup(gIdx, 1)} disabled={gIdx === groups.length - 1} className="p-1 bg-white border border-blue-300 rounded text-xs hover:bg-blue-50 disabled:opacity-30">⬇️</button>
                    </div>
                  </div>
                )}
                <div className={`${!isStandalone ? 'divide-y divide-blue-100' : ''}`}>
                  {group.indices.map((idx) => {
                    const trip = trips[idx]
                    const bgColor = trip.statusColor === 'ovn' ? '#00FFFF' : trip.statusColor === 'wait' ? '#FFFF00' : '#ffffff'
                    return (
                      <div key={trip.id || `temp-${idx}`} className="p-3 transition-colors relative" style={{ backgroundColor: bgColor }}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            {isMergeMode && (
                              <input 
                                type="checkbox" 
                                checked={!!trip.id && selectedIds.includes(trip.id)} 
                                onChange={() => toggleSelect(trip.id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              />
                            )}
                            <span className="text-[10px] text-gray-400">
                              {isStandalone ? 'งานเดี่ยว' : `คันที่ ${group.indices.indexOf(idx) + 1} ในกลุ่ม`}
                            </span>
                          </div>
                          <button onClick={() => deleteBlock(idx)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">ทะเบียนรถ</label>
                            <input value={trip.licensePlate} onChange={e => updateField(idx, 'licensePlate', e.target.value)} onBlur={() => fetchVehicleData(idx, trip.licensePlate)} className="w-full py-1 px-2 border rounded bg-white text-sm" placeholder="เช่น 60-3794" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">ข้อมูล GPS</label>
                            {trip.gpsLink ? (
                              <a href={trip.gpsLink} target="_blank" rel="noopener noreferrer" className="block w-full py-1 px-2 border border-blue-300 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 underline truncate text-sm text-center">📍 {trip.gpsName || 'เปิด GPS'}</a>
                            ) : (
                              <input value={trip.gpsName} disabled className="w-full py-1 px-2 border rounded bg-gray-50 text-gray-400 text-sm" readOnly />
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">หมายเหตุ (Auto)</label>
                            <input value={trip.notes} disabled className="w-full py-1 px-2 border rounded bg-gray-50 text-gray-400 text-sm" readOnly />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Latitude, Longitude</label>
                          <input value={trip.latLng} onChange={e => updateField(idx, 'latLng', e.target.value)} onBlur={() => fetchLocationFromCoords(idx, trip.latLng)} className="w-full py-1 px-2 border rounded bg-white font-mono text-sm" placeholder="13.7563, 100.5018" />
                        </div>
                        <div className="mb-2">
                          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Delivery Address</label>
                          <input value={trip.deliveryAddress} onChange={e => updateField(idx, 'deliveryAddress', e.target.value)} className="w-full py-1 px-2 border rounded bg-white text-sm" />
                        </div>
                        <div className="mb-2">
                          <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Location (Auto-detected)</label>
                          <input value={trip.locationName} onChange={e => updateField(idx, 'locationName', e.target.value)} className="w-full py-1 px-2 border rounded bg-white text-sm font-medium" placeholder="Phanom Phrai, Roi Et" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 bg-white/60 p-2 rounded">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Dist. To Dest (KM)</label>
                            <input type="number" value={trip.distanceKm} onChange={e => updateField(idx, 'distanceKm', e.target.value)} onKeyDown={e => handleDistanceInput(idx, e)} onBlur={e => handleDistanceInput(idx, e)} className="w-full py-1 px-2 border rounded bg-white text-sm" placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">ETA (Hrs)</label>
                            <input value={trip.eta} disabled className="w-full py-1 px-2 border rounded bg-gray-100 text-sm" readOnly />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">เวลาถึง (วัน/เดือน/ปี HH.MM)</label>
                            <input value={trip.arrivalTime} disabled className="w-full py-1 px-2 border rounded bg-gray-100 text-sm" readOnly />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">อัปเดตล่าสุด</label>
                            <input value={trip.updatedAt} disabled className="w-full py-1 px-2 border rounded bg-gray-100 text-[10px]" readOnly />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-black/10">
                          <button onClick={() => setTrips(prev => { const a=[...prev]; a[idx].statusColor = a[idx].statusColor === 'ovn' ? 'default' : 'ovn'; return a })} className={`px-3 py-1 rounded text-xs border ${trip.statusColor === 'ovn' ? 'bg-[#00FFFF] border-[#00cccc] text-black' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>OVN</button>
                          <button onClick={() => setTrips(prev => { const a=[...prev]; a[idx].statusColor = a[idx].statusColor === 'wait' ? 'default' : 'wait'; return a })} className={`px-3 py-1 rounded text-xs border ${trip.statusColor === 'wait' ? 'bg-[#FFFF00] border-[#cccc00] text-black' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>Wait</button>
                          <div className="ml-auto">
                            <button onClick={() => saveBlock(idx)} className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 text-xs font-medium"> บันทึก</button>
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
      </main>
    </div>
  )
}