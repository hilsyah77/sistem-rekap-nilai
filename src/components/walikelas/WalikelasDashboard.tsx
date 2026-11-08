import React from "react"
import { 
  Users, 
  School, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Printer,
  FileEdit
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { User, ActivePage } from "@/types"
import { StudentItem } from "@/components/admin/DataMasterPage"
import { ClassValidationItem } from "@/data/mockValidationQueue"

interface WalikelasDashboardProps {
  currentUser: User
  onNavigate: (page: ActivePage) => void
  tahunAjaran?: string
  students?: StudentItem[]
  validationItem?: ClassValidationItem
}

export const WalikelasDashboard: React.FC<WalikelasDashboardProps> = ({ 
  currentUser, 
  onNavigate,
  tahunAjaran = "2024/2025",
  students = [],
  validationItem,
}) => {
  const assignedClass = currentUser.assignedClass || "Kelas IX-A"
  const classStudents = students.filter(s => s.classRoom === assignedClass)
  const maleCount = classStudents.filter(s => s.gender === 'L').length
  const femaleCount = classStudents.filter(s => s.gender === 'P').length

  const currentStatus = validationItem?.status || "draft"
  const revisiNote = validationItem?.revisionNotes || ""

  return (
    <div className="space-y-6">
      {/* Hero Card Identitas Kelas */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
              Jenjang Kelas IX (MTs)
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              Tahun Ajaran {tahunAjaran}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Rekap Nilai Siswa {assignedClass}
          </h2>
          <p className="text-sm text-slate-500">
            Wali Kelas: <strong className="text-slate-700">{currentUser.name}</strong> • NIP: {currentUser.nip || "-"}
          </p>
        </div>

        {/* Status Berkas Nilai */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Status Berkas Nilai
          </span>
          {currentStatus === "draft" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 border-2 border-slate-300 font-bold text-sm shadow-sm">
              <FileEdit className="w-5 h-5 text-slate-600" />
              STATUS: BELUM DIKIRIM (DRAFT)
            </div>
          )}
          {currentStatus === "revisi" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-800 border-2 border-red-300 font-bold text-sm shadow-sm animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              STATUS: PERLU REVISI NILAI
            </div>
          )}
          {currentStatus === "menunggu_validasi" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 border-2 border-amber-300 font-bold text-sm shadow-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              STATUS: MENUNGGU VALIDASI ADMIN
            </div>
          )}
          {currentStatus === "disetujui" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-400 font-bold text-sm shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              STATUS: DISETUJUI & TERVALIDASI
            </div>
          )}
        </div>
      </div>

      {/* Revision Alert Component */}
      {currentStatus === "revisi" && revisiNote && (
        <Alert variant="destructive" className="border-red-300 bg-red-50/90 shadow-sm rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 font-bold text-base flex items-center justify-between">
            <span>Catatan Revisi dari Administrator Madrasah:</span>
            <Badge variant="destructive" className="text-[10px] uppercase">
              Tindakan Diperlukan
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-red-800 mt-2 text-sm leading-relaxed">
            <p className="font-medium bg-white/70 p-3 rounded-lg border border-red-200">
              "{revisiNote}"
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onNavigate("walikelas-input-nilai")}
                className="text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Buka & Perbaiki Input Nilai Sekarang
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Kelas Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Siswa di Kelas
            </CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{classStudents.length} Siswa</div>
            <p className="text-xs text-slate-500 mt-1">
              {maleCount} Laki-laki • {femaleCount} Perempuan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mata Pelajaran Wajib
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <School className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">16 Mapel</div>
            <p className="text-xs text-slate-500 mt-1">PAI, Umum, & Mulok Ke-NU-an</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cakupan Semester
            </CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Sem. 1 s/d 5 + UAM</div>
            <p className="text-xs text-slate-500 mt-1">Standar Rekap Kelulusan MTs</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Shortcut Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-emerald-950">
            Siap Mengisi Nilai Siswa {assignedClass}?
          </h3>
          <p className="text-xs text-emerald-800/80 mt-0.5">
            Gunakan antarmuka spreadsheet interaktif untuk memasukkan nilai per semester atau cetak berkas nilai.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onNavigate("walikelas-input-nilai")}
            className="text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Input Lembar Nilai
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate("walikelas-rekap")}
            className="text-xs font-semibold gap-1.5 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Rekap
          </Button>
        </div>
      </div>
    </div>
  )
}
