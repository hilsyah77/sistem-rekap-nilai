import React from "react"
import { 
  Users, 
  School, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  ArrowUpRight,
  UserCheck
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ActivePage, WalikelasAccount } from "@/types"
import { ClassItem, StudentItem } from "./DataMasterPage"
import { ClassValidationItem } from "@/data/mockValidationQueue"

interface AdminDashboardProps {
  onNavigate: (page: ActivePage) => void
  tahunAjaran?: string
  classes?: ClassItem[]
  students?: StudentItem[]
  walikelasAccounts?: WalikelasAccount[]
  validationQueue?: ClassValidationItem[]
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  tahunAjaran = "2024/2025",
  classes = [],
  students = [],
  walikelasAccounts = [],
  validationQueue = [],
}) => {
  const pendingValidations = validationQueue.filter(q => q.status === "menunggu_validasi")
  const approvedValidations = validationQueue.filter(q => q.status === "disetujui")
  const completionPct = classes.length > 0
    ? parseFloat(((approvedValidations.length / classes.length) * 100).toFixed(1))
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-emerald-600/60 text-emerald-100 border-emerald-400/30 mb-3">
            Tahun Ajaran {tahunAjaran}
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Panel Administrator
          </h2>
          <p className="text-emerald-100/80 text-sm mt-2 leading-relaxed">
            Kelola rombel, data siswa, pengesahan nilai rapor, serta pengaturan akun & rule login Wali Kelas. Saat ini terdapat{" "}
            <strong className="text-white underline">{pendingValidations.length} kelas</strong> yang menunggu validasi nilai.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button 
              onClick={() => onNavigate("admin-walikelas-login")}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold text-xs shadow-md gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Kelola Rule Login Walikelas ({walikelasAccounts.length})
            </Button>
            <Button 
              onClick={() => onNavigate("admin-master-siswa")}
              variant="outline" 
              className="bg-emerald-700/50 border-emerald-500/40 text-white hover:bg-emerald-700 text-xs font-semibold"
            >
              Kelola Data Siswa & Rombel
            </Button>
            <Button 
              onClick={() => onNavigate("admin-validasi")}
              variant="outline" 
              className="bg-emerald-700/50 border-emerald-500/40 text-white hover:bg-emerald-700 text-xs font-semibold"
            >
              Antrean Validasi ({pendingValidations.length})
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 bg-emerald-400/10 rounded-full pointer-events-none" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Siswa Terdaftar
            </CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{students.length} Siswa</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Aktif
              </span>
              <span>Terdata di sistem</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Rombel & Walikelas
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <School className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{classes.length} Rombel</div>
            <p className="text-xs text-slate-500 mt-1">
              {walikelasAccounts.length} Akun Login Walikelas terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              % Pengesahan Nilai
            </CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{completionPct}%</div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${completionPct}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {approvedValidations.length} dari {classes.length} rombel telah disahkan
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-amber-200/80 bg-amber-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Menunggu Validasi
            </CardTitle>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{pendingValidations.length} Kelas</div>
            <p className="text-xs text-amber-700/80 mt-1 flex items-center justify-between">
              <span>{pendingValidations.length > 0 ? pendingValidations.map(p => p.className).join(", ") : "Tidak ada antrean"}</span>
              <button 
                onClick={() => onNavigate("admin-validasi")}
                className="font-semibold text-amber-900 hover:underline inline-flex items-center cursor-pointer"
              >
                Cek <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Rekap & Panduan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daftar Rombel & Status Akun Wali Kelas</CardTitle>
            <CardDescription>Ringkasan rombel, jumlah siswa, dan akun login Wali Kelas aktif</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {classes.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                <p>Belum ada data Rombel / Kelas maupun Akun Wali Kelas.</p>
                <div className="flex justify-center gap-2 pt-1">
                  <Button size="sm" onClick={() => onNavigate("admin-master-siswa")} className="text-xs">
                    + Tambah Rombel & Siswa
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onNavigate("admin-walikelas-login")} className="text-xs">
                    + Atur Login Walikelas
                  </Button>
                </div>
              </div>
            ) : (
              classes.map((cls) => {
                const count = students.filter(s => s.classRoom === cls.name).length
                const acc = walikelasAccounts.find(w => w.assignedClass === cls.name)
                const valItem = validationQueue.find(v => v.className === cls.name)
                return (
                  <div key={cls.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{cls.name}</h4>
                      <p className="text-xs text-slate-500">
                        Wali Kelas: <strong>{cls.walikelas}</strong> • {count} Siswa
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {acc ? (
                        <Badge variant={acc.isActive ? "success" : "destructive"} className="text-[10px] font-mono">
                          Login: {acc.username}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Belum ada akun login
                        </Badge>
                      )}
                      {valItem && (
                        <Badge
                          variant={
                            valItem.status === "disetujui"
                              ? "success"
                              : valItem.status === "menunggu_validasi"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {valItem.status === "disetujui"
                            ? "Disetujui"
                            : valItem.status === "menunggu_validasi"
                            ? "Menunggu Validasi"
                            : "Perlu Revisi"}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alur Kerja Sistem</CardTitle>
            <CardDescription>Panduan pengelolaan sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="flex gap-2.5 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">1</div>
              <p>Admin menambahkan <strong>Rombel, Data Siswa</strong>, serta membuat <strong>Akun & Rule Login Wali Kelas</strong>.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">2</div>
              <p>Wali Kelas login menggunakan username & password yang dibuat Admin untuk mengisi nilai Semester 1-5 & UAM.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">3</div>
              <p>Admin memeriksa dan memberikan <strong>Approve</strong> atau <strong>Catatan Revisi</strong> pada menu Validasi Nilai.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
