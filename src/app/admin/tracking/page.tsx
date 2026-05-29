'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ✅ เพิ่ม gpsLink เข้าไปใน Interface
interface TripBlock {
  id?: string
  licensePlate: string
  gpsName: string
  gpsLink: string // เพิ่มมาเพื่อดึงลิงก์
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

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trip_logs')
        .select('*')
        .order('sort_order', { ascending: true })
      
      if (error) throw error

      const mapped: TripBlock[] = (data || []).map((t: any) => ({
        id: t.id,
        licensePlate: t.license_plate || '',
        gpsName: t.gps_name || '',
        gpsLink: t.gps_link || '', // ✅ ดึงลิงก์มาเก็บไว้
        notes: t.notes || '',
        latLng: t.lat_lng || '',
        deliveryAddress: t.delivery_address || '',
        locationName: t.location_name || '',
        distanceKm: String(t.distance_km || ''),
        eta: t.eta_hours ? String(t.eta_hours) : '',
        arrivalTime: t.arrival_time || '',
        updatedAt: t.updated_at || '',
        statusColor: t.status_color || 'default',
        isNew: false
      }))

      setTrips(mapped)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addBlock = () => {
    setTrips(prev => [...prev, {
      licensePlate: '', gpsName: '', gpsLink: '', notes: '', latLng: '', deliveryAddress: '',
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

  // ✅ ฟังก์ชันดึงข้อมูลรถ เพิ่มการดึง gps_link เข้ามาด้วย
  const fetchVehicleData = async (index: number, plate: string) => {
    if (plate.length < 3) return
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('gps_name, gps_link, notes') // ✅ เพิ่ม gps_link
        .eq('license_plate', plate)
        .single()
      
      if (!error && data) {
        setTrips(prev => {
          const newTrips = [...prev]
          newTrips[index].gpsName = data.gps_name || ''
          newTrips[index].gpsLink = data.gps_link || '' // ✅ อัปเดต state ลิงก์
          newTrips[index].notes = data.notes || ''
          return newTrips
        })
      }
    } catch (err) {
      console.error('Vehicle fetch error:', err)
    }
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
      
      const district = addr.city || addr.town || addr.village || addr.county || addr.municipality || ''
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

    const etaRaw = dist / 58
    const etaRounded = Math.round(etaRaw)
    
    const now = new Date()
    const arrival = new Date(now.getTime() + etaRounded * 60 * 60 * 1000)
    
    const fmtTime = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      return `${h}.${m}`
    }

    setTrips(prev => {
      const newTrips = [...prev]
      newTrips[index].eta = String(etaRounded)
      newTrips[index].arrivalTime = fmtTime(arrival)
      newTrips[index].updatedAt = now.toISOString().replace('T', ' ').substring(0, 16)
      return newTrips
    })
  }

  const handleDistanceInput = (index: number, e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return
    calculateMetrics(index, trips[index].distanceKm)
  }

  const moveBlock = (index: number, dir: number) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= trips.length) return
    setTrips(prev => {
      const arr = [...prev]
      ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
      return arr
    })
  }

  const deleteBlock = async (index: number) => {
    const trip = trips[index]
    if (!confirm('ต้องการลบข้อมูลเที่ยวนี้ใช่หรือไม่?')) return
    if (trip.id) {
      await supabase.from('trip_logs').delete().eq('id', trip.id)
    }
    setTrips(prev => prev.filter((_, i) => i !== index))
  }

  // ✅ ลบเงื่อนไขบังคับกรอกข้อมูลออก (บันทึกได้ทันที)
  const saveBlock = async (index: number) => {
    const trip = trips[index]

    const payload = {
      license_plate: trip.licensePlate,
      gps_name: trip.gpsName,
      gps_link: trip.gpsLink, // ✅ บันทึกลิงก์ด้วย
      notes: trip.notes,
      lat_lng: trip.latLng,
      delivery_address: trip.deliveryAddress,
      location_name: trip.locationName,
      distance_km: parseFloat(trip.distanceKm) || null,
      eta_hours: parseFloat(trip.eta) || null,
      arrival_time: trip.arrivalTime,
      updated_at: trip.updatedAt,
      status_color: trip.statusColor,
      sort_order: index
    }

    let error
    let savedId = trip.id
    
    if (trip.isNew) {
      const res = await supabase.from('trip_logs').insert([payload]).select()
      error = res.error
      if (!error && res.data && res.data[0]) {
        savedId = res.data[0].id
      }
    } else {
      const res = await supabase.from('trip_logs').update(payload).eq('id', trip.id!).select()
      error = res.error
    }

    if (error) {
      alert('บันทึกไม่สำเร็จ: ' + error.message)
      return
    }

    setTrips(prev => {
      const arr = [...prev]
      arr[index].isNew = false
      if (savedId && !arr[index].id) {
        arr[index].id = savedId
      }
      return arr
    })
    
    // ✅ ลบ Alert แจ้งเตือนออก เพื่อให้การใช้งานลื่นไหลขึ้น (หรือจะคงไว้ก็ได้)
    // alert('บันทึกข้อมูลสำเร็จ') 
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">🚛 Trip Tracking & Status</h1>
            <Link href="/admin/vehicles" className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium">
              🚗 จัดการข้อมูลรถ
            </Link>
            <Link href="/dashboard" className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">
              📊 Monitor
            </Link>
          </div>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">ออกจากระบบ</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <button onClick={addBlock} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-medium">
          + เพิ่มเที่ยวติดตามใหม่
        </button>

        {trips.map((trip, idx) => {
          const bgColor = trip.statusColor === 'ovn' ? '#00FFFF' : trip.statusColor === 'wait' ? '#FFFF00' : '#ffffff'
          const borderColor = trip.statusColor === 'ovn' ? '#00cccc' : trip.statusColor === 'wait' ? '#cccc00' : '#e5e7eb'

          return (
            <div 
              key={idx} 
              className="rounded-xl shadow-md border p-5 transition-all"
              style={{ backgroundColor: bgColor, borderColor }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30">⬆️</button>
                  <button onClick={() => moveBlock(idx, 1)} disabled={idx === trips.length - 1} className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30">⬇️</button>
                </div>
                <button onClick={() => deleteBlock(idx)} className="text-red-600 hover:text-red-800 p-2">🗑️ ลบเที่ยวนี้</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ทะเบียนรถ</label>
                  <input 
                    value={trip.licensePlate} 
                    onChange={e => updateField(idx, 'licensePlate', e.target.value)}
                    onBlur={() => fetchVehicleData(idx, trip.licensePlate)}
                    className="w-full p-2 border rounded bg-white" 
                    placeholder="เช่น 60-3794"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ข้อมูล GPS</label>
                  {/* ✅ เปลี่ยนเป็นแสดงผลแบบลิงก์ถ้ามีลิงก์ */}
                  {trip.gpsLink ? (
                    <a 
                      href={trip.gpsLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full p-2 border rounded bg-blue-50 text-blue-600 hover:bg-blue-100 underline truncate"
                    >
                      {trip.gpsName || 'เปิด GPS'}
                    </a>
                  ) : (
                    <input value={trip.gpsName} disabled className="w-full p-2 border rounded bg-gray-50 text-gray-500" readOnly />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">หมายเหตุ (Auto)</label>
                  <input value={trip.notes} disabled className="w-full p-2 border rounded bg-gray-50 text-gray-500" readOnly />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Latitude, Longitude (เช่น 13.7563, 100.5018)</label>
                <input 
                  value={trip.latLng} 
                  onChange={e => updateField(idx, 'latLng', e.target.value)}
                  onBlur={() => fetchLocationFromCoords(idx, trip.latLng)}
                  className="w-full p-2 border rounded bg-white font-mono" 
                  placeholder="13.7563, 100.5018"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Address</label>
                <input 
                  value={trip.deliveryAddress} 
                  onChange={e => updateField(idx, 'deliveryAddress', e.target.value)}
                  className="w-full p-2 border rounded bg-white" 
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Location (Auto-detected District, Province)</label>
                <input 
                  value={trip.locationName} 
                  onChange={e => updateField(idx, 'locationName', e.target.value)}
                  className="w-full p-2 border rounded bg-white font-medium" 
                  placeholder="Phanom Phrai, Roi Et"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 bg-white/50 p-3 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dist. To Dest (KM)</label>
                  <input 
                    type="number" 
                    value={trip.distanceKm} 
                    onChange={e => updateField(idx, 'distanceKm', e.target.value)}
                    onKeyDown={e => handleDistanceInput(idx, e)}
                    onBlur={e => handleDistanceInput(idx, e)}
                    className="w-full p-2 border rounded bg-white" 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ETA (Hrs)</label>
                  <input value={trip.eta} disabled className="w-full p-2 border rounded bg-gray-100" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">เวลาถึง (HH.MM)</label>
                  <input value={trip.arrivalTime} disabled className="w-full p-2 border rounded bg-gray-100" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">อัปเดตล่าสุด</label>
                  <input value={trip.updatedAt} disabled className="w-full p-2 border rounded bg-gray-100 text-xs" readOnly />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-black/10">
                <button onClick={() => {
                  setTrips(prev => {
                    const arr = [...prev]
                    arr[idx].statusColor = arr[idx].statusColor === 'ovn' ? 'default' : 'ovn'
                    return arr
                  })
                }} className={`px-4 py-1.5 rounded font-medium text-sm border ${trip.statusColor === 'ovn' ? 'bg-[#00FFFF] border-[#00cccc] text-black' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>OVN</button>
                <button onClick={() => {
                  setTrips(prev => {
                    const arr = [...prev]
                    arr[idx].statusColor = arr[idx].statusColor === 'wait' ? 'default' : 'wait'
                    return arr
                  })
                }} className={`px-4 py-1.5 rounded font-medium text-sm border ${trip.statusColor === 'wait' ? 'bg-[#FFFF00] border-[#cccc00] text-black' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>Wait</button>
                
                <div className="ml-auto flex gap-2">
                  <button onClick={() => saveBlock(idx)} className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 text-sm font-medium">💾 บันทึก</button>
                </div>
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}