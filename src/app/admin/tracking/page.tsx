'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TripBlock {
  id?: string
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

  useEffect(() => { fetchTrips() }, [])

  const fetchTrips = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('trip_logs').select('*').order('sort_order', { ascending: true })
      if (error) throw error
      const mapped: TripBlock[] = (data || []).map((t: any) => ({
        id: t.id, licensePlate: t.license_plate || '', gpsName: t.gps_name || '', gpsLink: t.gps_link || '',
        notes: t.notes || '', latLng: t.lat_lng || '', deliveryAddress: t.delivery_address || '',
        locationName: t.location_name || '', distanceKm: String(t.distance_km || ''),
        eta: t.eta_hours ? String(t.eta_hours) : '', arrivalTime: t.arrival_time || '',
        updatedAt: t.updated_at || '', statusColor: t.status_color || 'default', isNew: false
      }))
      setTrips(mapped)
    } catch (err) { console.error(err) } finally { setLoading(false) }
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
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&zoom=10`, {
        headers: { 'User-Agent': 'LogisticsCommandCenter/1.0' }
      })
      const data = await res.json()
      const addr = data.address || {}
      const district = addr.city || addr.town || addr.village || addr.county || addr.municipality || ''
      const province = addr.state || ''
      let location = ''
      if (district && province) location = `${district}, ${province}`
      else if (district) location = district
      else if (province) location = province
      else location = data.display_name?.split(',')[0] || ''

      setTrips(prev => { const newTrips = [...prev]; newTrips[index].locationName = location; return newTrips })
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

  const moveBlock = (index: number, dir: number) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= trips.length) return
    setTrips(prev => { const arr = [...prev]; [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]; return arr })
  }

  const deleteBlock = async (index: number) => {
    const trip = trips[index]
    if (!confirm('ต้องการลบข้อมูลนี้ใช่หรือไม่?')) return
    if (trip.id) await supabase.from('trip_logs').delete().eq('id', trip.id)
    setTrips(prev => prev.filter((_, i) => i !== index))
  }

  const saveBlock = async (index: number) => {
    const trip = trips[index]
    const payload = {
      license_plate: trip.licensePlate, gps_name: trip.gpsName, gps_link: trip.gpsLink, notes: trip.notes,
      lat_lng: trip.latLng, delivery_address: trip.deliveryAddress, location_name: trip.locationName,
      distance_km: parseFloat(trip.distanceKm) || null, eta_hours: parseFloat(trip.eta) || null,
      arrival_time: trip.arrivalTime, updated_at: trip.updatedAt, status_color: trip.statusColor, sort_order: index
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

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">กำลังโหลดข้อมูล...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-800">📧 Manual E-Mail</h1>
            <Link href="/admin/vehicles" className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200">🚗 จัดการข้อมูลรถ</Link>
            <Link href="/dashboard" className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200"> Monitor</Link>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600">ออกจากระบบ</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-3 space-y-3">
        <button onClick={addBlock} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded shadow-sm hover:bg-blue-700 font-medium">
          + เพิ่ม
        </button>

        {trips.map((trip, idx) => {
          const bgColor = trip.statusColor === 'ovn' ? '#00FFFF' : trip.statusColor === 'wait' ? '#FFFF00' : '#ffffff'
          const borderColor = trip.statusColor === 'ovn' ? '#00cccc' : trip.statusColor === 'wait' ? '#cccc00' : '#e5e7eb'

          return (
            <div key={idx} className="rounded-lg shadow-sm border p-3 transition-all" style={{ backgroundColor: bgColor, borderColor }}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-1">
                  <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="p-1 bg-gray-200 rounded text-xs hover:bg-gray-300 disabled:opacity-30">⬆️</button>
                  <button onClick={() => moveBlock(idx, 1)} disabled={idx === trips.length - 1} className="p-1 bg-gray-200 rounded text-xs hover:bg-gray-300 disabled:opacity-30">⬇️</button>
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
      </main>
    </div>
  )
}