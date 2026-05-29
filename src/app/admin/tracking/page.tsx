'use client'

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        🚛 Tracking Test
      </h1>
      <p className="text-lg">
        ✅ ถ้าเห็นข้อความนี้ = หน้าเว็บทำงานปกติ!
      </p>
      <button className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
        + ปุ่มทดสอบ
      </button>
    </div>
  )
}