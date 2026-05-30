'use client'

import Navigation from '@/components/Navigation'

export default function OverNightPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* หัวข้อหน้า OverNight */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">OverNight</h1>
        
        {/* พื้นที่ว่างสำหรับเนื้อหาในอนาคต */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          <p>พื้นที่สำหรับเนื้อหา OverNight</p>
        </div>
      </main>
    </div>
  )
}