import React from "react"
import { 
  Menu, 
  Calendar,
  Layers,
  ChevronDown,
  School,
  Pencil,
  LogOut
} from "lucide-react"
import { User, ActivePage, SchoolProfile } from "@/types"
import { Badge } from "@/components/ui/badge"

interface TopbarProps {
  currentUser: User
  activePage: ActivePage
  onToggleMobileSidebar: () => void
  onLogout: () => void
  tahunAjaran: string
  onOpenTahunAjaranModal: () => void
  schoolProfile: SchoolProfile
  onOpenSchoolProfileModal: () => void
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  activePage,
  onToggleMobileSidebar,
  onLogout,
  tahunAjaran,
  onOpenTahunAjaranModal,
  schoolProfile,
  onOpenSchoolProfileModal,
}) => {
  const isAdmin = currentUser.role === "admin"

  const getPageTitle = (page: ActivePage) => {
    switch (page) {
      case "admin-dashboard":
        return { title: "Dashboard Overview", subtitle: "Monitoring & Statistik Pengisian Nilai Madrasah" }
      case "admin-master-siswa":
        return { title: "Manajemen Data Master", subtitle: "Kelola Data Siswa, Rombel, Mata Pelajaran & Profil Sekolah" }
      case "admin-walikelas-login":
        return { title: "Pengaturan Login Wali Kelas", subtitle: "Kelola Akun, Kredensial & Rule Akses Login Wali Kelas" }
      case "admin-validasi":
        return { title: "Validasi Nilai Rapor", subtitle: "Verifikasi Kelayakan Nilai & Catatan Revisi Walikelas" }
      case "walikelas-dashboard":
        return { title: "Dashboard Walikelas", subtitle: `Ringkasan Progress Nilai ${currentUser.assignedClass || ""}` }
      case "walikelas-input-nilai":
        return { title: "Input Nilai Siswa", subtitle: "Format Spreadsheet Nilai Semester 1 - 5 & Ujian Akhir Madrasah (UAM)" }
      case "walikelas-rekap":
        return { title: "Rekapitulasi & Cetak", subtitle: "Pratinjau Lembar Rapor, Buku Leger dan SKL Siswa" }
      default:
        return { title: "SisfoRekap", subtitle: "Aplikasi Rekap Nilai Siswa Madrasah" }
    }
  }

  const { title, subtitle } = getPageTitle(activePage)

  return (
    <header className="h-16 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-medium text-slate-500 bg-slate-50">
              <Layers className="w-3 h-3 mr-1 text-slate-400" />
              {isAdmin ? "Admin" : `Walikelas (${currentUser.assignedClass || "-"})`}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 hidden md:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: School Identity, Academic Info & User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Setting Profil Identitas Sekolah Button */}
        <button
          type="button"
          onClick={onOpenSchoolProfileModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
          title="Klik untuk mengatur Profil Identitas Sekolah / Madrasah"
        >
          <School className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden md:inline max-w-[160px] truncate font-bold">{schoolProfile.name}</span>
          <span className="md:hidden font-bold">Profil Sekolah</span>
          <Pencil className="w-3 h-3 text-emerald-600 shrink-0" />
        </button>

        {/* Setting Tahun Ajaran Button */}
        <button
          type="button"
          onClick={onOpenTahunAjaranModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
          title="Klik untuk mengatur Tahun Ajaran"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Tahun Ajaran:</span>
          <span className="font-bold">{tahunAjaran}</span>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
        </button>

        {/* User Profile Pill & Quick Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-200 shadow-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser.name.split(",")[0]}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">
              {isAdmin ? "Administrator" : (currentUser.assignedClass || "Wali Kelas")}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Keluar Sistem (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
