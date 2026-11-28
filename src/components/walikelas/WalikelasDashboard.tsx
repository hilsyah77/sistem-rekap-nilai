import React from "react"
import { 
  Users, 
  School, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  FileEdit,
  Lock,
  Unlock,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { User, ActivePage, WalikelasLoginRule } from "@/types"
import { StudentItem } from "@/components/admin/DataMasterPage"
import { ClassValidationItem } from "@/data/mockValidationQueue"
import { SEMESTER_TABS } from "@/data/mockStudentScores"
import { getSemesterLockState, getSemesterMeta, normalizeSemesterId } from "@/lib/semesterLock"
import { cn } from "@/lib/utils"

interface WalikelasDashboardProps {
  currentUser: User
  onNavigate: (page: ActivePage) => void
  tahunAjaran?: string
  students?: StudentItem[]
  validationItem?: ClassValidationItem
  classValidations?: ClassValidationItem[]
  walikelasLoginRule?: WalikelasLoginRule
  onOpenSemesterInput?: (semesterId: string) => void
}

export const WalikelasDashboard: React.FC<WalikelasDashboardProps> = ({ 
  currentUser, 
  onNavigate,
  tahunAjaran = "2024/2025",
  students = [],
  validationItem,
  classValidations,
  walikelasLoginRule,
  onOpenSemesterInput,
}) => {
  const assignedClass = currentUser.assignedClass || "Kelas IX-A"
  const classStudents = students.filter(
    s => (s.classRoom || "").trim().toLowerCase() === assignedClass.trim().toLowerCase()
  )
  const maleCount = classStudents.filter(s => (s.gender || "").toUpperCase() === 'L').length
  const femaleCount = classStudents.filter(s => (s.gender || "").toUpperCase() === 'P').length

  const effectiveQueue = classValidations ?? (validationItem ? [validationItem] : [])
  const revisionItems = effectiveQueue.filter(v => v.status === "revisi")
  const pendingItems = effectiveQueue.filter(v => v.status === "menunggu_validasi")
  const approvedItems = effectiveQueue.filter(v => v.status === "disetujui")

  const currentStatus =
    revisionItems.length > 0
      ? "revisi"
      : pendingItems.length > 0
      ? "menunggu_validasi"
      : approvedItems.length > 0
      ? "disetujui"
      : "draft"

  const handleGoToSemester = (semesterId: string) => {
    if (onOpenSemesterInput) {
      onOpenSemesterInput(semesterId)
    } else {
      onNavigate("walikelas-input-nilai")
    }
  }

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
            Ringkasan Status Berkas
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
              STATUS: {revisionItems.length} SEMESTER PERLU REVISI
            </div>
          )}
          {currentStatus === "menunggu_validasi" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 border-2 border-amber-300 font-bold text-sm shadow-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              STATUS: {pendingItems.length} SEMESTER MENUNGGU VALIDASI
            </div>
          )}
          {currentStatus === "disetujui" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-400 font-bold text-sm shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              STATUS: {approvedItems.length} SEMESTER DISETUJUI
            </div>
          )}
        </div>
      </div>

      {/* Revision Alert Components per Semester */}
      {revisionItems.map((rev) => {
        const semId = normalizeSemesterId(rev.semesterId)
        const semLabel = rev.semesterLabel || getSemesterMeta(semId).label
        return (
          <Alert
            key={rev.id}
            variant="destructive"
            className="border-red-300 bg-red-50/90 shadow-sm rounded-xl"
          >
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-900 font-bold text-base flex items-center justify-between gap-2">
              <span>Catatan Revisi Admin — {semLabel}:</span>
              <Badge variant="destructive" className="text-[10px] uppercase">
                Tindakan Diperlukan
              </Badge>
            </AlertTitle>
            <AlertDescription className="text-red-800 mt-2 text-sm leading-relaxed">
              {rev.revisionNotes && (
                <p className="font-medium bg-white/70 p-3 rounded-lg border border-red-200">
                  "{rev.revisionNotes}"
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleGoToSemester(semId)}
                  className="text-xs font-semibold gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Buka & Perbaiki {semLabel}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )
      })}

      {/* Status Penguncian & Validasi per Semester */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900">
            Status Akses Input & Penguncian Nilai per Semester
          </CardTitle>
          <CardDescription className="text-xs">
            Klik salah satu kartu semester untuk langsung membuka lembar nilai semester tersebut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SEMESTER_TABS.map((tab) => {
              const state = getSemesterLockState({
                className: assignedClass,
                semesterId: tab.id,
                rule: walikelasLoginRule,
                validationQueue: effectiveQueue,
              })
              const isApproved = state.validationStatus === "disetujui"
              const isPending = state.validationStatus === "menunggu_validasi"
              const isRevisi = state.validationStatus === "revisi"

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleGoToSemester(tab.id)}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group",
                    isRevisi
                      ? "bg-red-50/60 border-red-200 hover:border-red-400"
                      : state.isLocked
                      ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                      : "bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50/70 hover:border-emerald-400"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {state.isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-900">{tab.label}</span>
                      <span className="text-[10px] text-slate-400 truncate">({tab.gradeLabel})</span>
                    </div>
                    <div className="mt-1.5">
                      <Badge
                        variant={
                          isRevisi
                            ? "destructive"
                            : isApproved
                            ? "success"
                            : isPending || state.isLocked
                            ? "warning"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {isRevisi ? "Perlu Revisi" : state.reasonLabel}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
            <p className="text-xs text-slate-500 mt-1">Penguncian & Validasi Mandiri per Semester</p>
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
            Gunakan antarmuka spreadsheet interaktif untuk memasukkan nilai per semester sesuai akses semester yang terbuka.
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
        </div>
      </div>
    </div>
  )
}
