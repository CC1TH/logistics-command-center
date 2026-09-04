"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Job = {
  id: string;
  plate_no: string;
  gps_info: string;
  auto_note: string;
  lat_long: string;
  delivery_address: string;
  auto_location: string;
  distance: string;
  eta: string;
  arrival_time: string;
  update: string;
  job_date: string;
};

export default function ManualEmailPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    loadJobs();
  }, [currentDate]);

  const checkAuth = async () => {
    const cookies = document.cookie.split("; ");
    const roleCookie = cookies.find((row) => row.startsWith("role="));
    const role = roleCookie ? roleCookie.split("=")[1] : null;

    if (!role || (role !== "admin" && role !== "user")) {
      router.push("/login");
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_jobs")
      .select("*")
      .eq("job_date", currentDate)
      .order("created_at", { ascending: true, nullsFirst: true }); // ✅ แก้ไขตรงนี้

    if (data) {
      setJobs(
        data.map((job) => ({
          id: job.id,
          plate_no: job.plate_no || "",
          gps_info: job.gps_name || "",
          auto_note: job.auto_note || "",
          lat_long: job.lat_long || "",
          delivery_address: job.delivery_address || "",
          auto_location: job.auto_location || "",
          distance: job.distance?.toString() || "0",
          eta: job.eta || "",
          arrival_time: job.arrival_time || "",
          update: job.update || "",
          job_date: job.job_date,
        }))
      );
    }
    setLoading(false);
  };

  const handleAddJob = () => {
    const newJob: Job = {
      id: crypto.randomUUID(),
      plate_no: "",
      gps_info: "",
      auto_note: "",
      lat_long: "",
      delivery_address: "",
      auto_location: "",
      distance: "0",
      eta: "",
      arrival_time: "",
      update: "",
      job_date: currentDate,
    };

    // ✅ เพิ่มที่ท้ายรายการ (ล่างสุด)
    setJobs((prev) => {
      const newJobs = [...prev, newJob];
      
      // เลื่อนหน้าจอลงล่างสุด
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "end"
        });
      }, 100);
      
      return newJobs;
    });
  };

  const handleSave = async (job: Job) => {
    const jobData = {
      plate_no: job.plate_no,
      gps_name: job.gps_info,
      auto_note: job.auto_note,
      lat_long: job.lat_long,
      delivery_address: job.delivery_address,
      auto_location: job.auto_location,
      distance: parseFloat(job.distance) || 0,
      eta: job.eta,
      arrival_time: job.arrival_time,
      update: job.update,
      job_date: job.job_date,
      last_update: new Date().toISOString(),
    };

    if (job.id && !job.id.includes("-")) {
      await supabase.from("daily_jobs").update(jobData).eq("id", job.id);
    } else {
      const { data } = await supabase.from("daily_jobs").insert([jobData]).select();
      if (data && data[0]) {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, id: data[0].id } : j))
        );
      }
    }

    alert("บันทึกข้อมูลสำเร็จ");
    loadJobs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบรายการนี้?")) return;
    await supabase.from("daily_jobs").delete().eq("id", id);
    loadJobs();
  };

  const handleInputChange = (id: string, field: keyof Job, value: string) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, [field]: value } : job))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📧 Manual E-Mail</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-red-600 hover:underline"
          >
            ออกจากระบบ
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center gap-4">
          <button
            onClick={() => {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - 1);
              setCurrentDate(date.toISOString().split("T")[0]);
            }}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← กลับ
          </button>
          <div className="flex items-center gap-2 text-lg font-semibold">
             {new Date(currentDate).toLocaleDateString("th-TH")}
          </div>
          <button
            onClick={() => setCurrentDate(new Date().toISOString().split("T")[0])}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            เปลี่ยนวันที่
          </button>
        </div>

        <button
          onClick={handleAddJob}
          className="mb-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          + เพิ่มรายการ
        </button>

        {loading ? (
          <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div 
                key={job.id} 
                className={`bg-white p-6 rounded-lg shadow-md transition-all ${
                  index === jobs.length - 1 && job.id.includes('-') 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : ''
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ทะเบียนรถ
                    </label>
                    <input
                      type="text"
                      value={job.plate_no}
                      onChange={(e) =>
                        handleInputChange(job.id, "plate_no", e.target.value)
                      }
                      placeholder="เช่น 60-3794"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ข้อมูล GPS
                    </label>
                    <input
                      type="text"
                      value={job.gps_info}
                      onChange={(e) =>
                        handleInputChange(job.id, "gps_info", e.target.value)
                      }
                      placeholder=""
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเหตุ (Auto)
                    </label>
                    <input
                      type="text"
                      value={job.auto_note}
                      onChange={(e) =>
                        handleInputChange(job.id, "auto_note", e.target.value)
                      }
                      placeholder=""
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude, Longitude
                  </label>
                  <input
                    type="text"
                    value={job.lat_long}
                    onChange={(e) =>
                      handleInputChange(job.id, "lat_long", e.target.value)
                    }
                    placeholder="13.7563, 100.5018"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={job.delivery_address}
                    onChange={(e) =>
                      handleInputChange(job.id, "delivery_address", e.target.value)
                    }
                    placeholder=""
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Auto-detected)
                  </label>
                  <input
                    type="text"
                    value={job.auto_location}
                    onChange={(e) =>
                      handleInputChange(job.id, "auto_location", e.target.value)
                    }
                    placeholder=""
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dist. (KM)
                    </label>
                    <input
                      type="number"
                      value={job.distance}
                      onChange={(e) =>
                        handleInputChange(job.id, "distance", e.target.value)
                      }
                      placeholder="0"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ETA (Hrs)
                    </label>
                    <input
                      type="text"
                      value={job.eta}
                      onChange={(e) =>
                        handleInputChange(job.id, "eta", e.target.value)
                      }
                      placeholder=""
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เวลาถึง
                    </label>
                    <input
                      type="time"
                      value={job.arrival_time}
                      onChange={(e) =>
                        handleInputChange(job.id, "arrival_time", e.target.value)
                      }
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อัปเดต
                    </label>
                    <input
                      type="text"
                      value={job.update}
                      onChange={(e) =>
                        handleInputChange(job.id, "update", e.target.value)
                      }
                      placeholder=""
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    OVN
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    Wait
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    เคลื่อนงาน
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                  >
                    ✕ ยกเลิก
                  </button>
                  <button
                    onClick={() => handleSave(job)}
                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    💾 บันทึก
                  </button>
                </div>
              </div>
            ))}

            <div ref={bottomRef} />

            {jobs.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-lg">
                ยังไม่มีรายการในวันนี้
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}