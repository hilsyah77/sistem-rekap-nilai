import React, { useState } from "react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs"
import { SpreadsheetTable } from "./SpreadsheetTable"
import { SEMESTER_TABS } from "@/data/mockStudentScores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  Send,
  Printer,
  Lock,
  Unlock,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { User, ActivePage } from "@/types"
import { StudentItem } from "@/components/admin/DataMasterPage"
import { ClassValidationItem } from "@/data/mockValidationQueue"

interface InputNilaiPageProps {
  currentUser: User
  onNavigate?: (page: ActivePage) => void
  tahunAjaran?: string
  students?: StudentItem[]
  onAddStudent?: (student: StudentItem) => void
  scoresBySemester: Record<string, Record<string, Record<string, number | ''>>>
  onScoreChange: (semesterId: string, studentId: string, subjectId: string, value: number | '') => void
  validationItem?: ClassValidationItem
  onSubmitForValidation?: () => void
  autoLockAfterSubmit?: boolean
}

export const InputNilaiPage: React.FC<InputNilaiPageProps> = ({
  currentUser,
  onNavigate,
  tahunAjaran = "2024/2025",
  students = [],
  onAddStudent,
  scoresBySemester,
  onScoreChange,
  validationItem,
  onSubmitForValidation,
  autoLockAfterSubmit = true,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<string>("sem-5")
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [isSuccessSubmit, setIsSuccessSubmit] = useState(false)
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    nisn: "",
    nis: "",
    gender: "L" as 'L' | 'P',
  })

  const assignedClass = currentUser.assignedClass || "Kelas IX-A"
  const classStudents = students.filter(s => s.classRoom === assignedClass)

  const isLocked =
    autoLockAfterSubmit &&
    (validationItem?.status === "menunggu_validasi" || validationItem?.status === "disetujui")

  const handleConfirmSubmit = () => {
    if (onSubmitForValidation) {
      onSubmitForValidation()
    }
    setIsSubmitModalOpen(false)
    setIsSuccessSubmit(true)
  }

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentForm.name.trim() || !onAddStudent) return
    onAddStudent({
      id: `std-${Date.now()}`,
      name: newStudentForm.name.trim(),
      nisn: newStudentForm.nisn.trim() || "-",
      nis: newStudentForm.nis.trim() || "-",
      gender: newStudentForm.gender,
      classRoom: assignedClass,
      grade: "IX",
      status: "Aktif",
      phone: "-",
    })
    setNewStudentForm({ name: "", nisn: "", nis: "", gender: "L" })
    setIsAddStudentModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              {assignedClass}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Tahun Ajaran {tahunAjaran}
            </span>
            {isLocked ? (
              <Badge variant="warning" className="text-xs gap-1 py-0.5">
                <Lock className="w-3 h-3" /> Lembar Nilai Terkunci ({validationItem?.status === "disetujui" ? "Disetujui" : "Menunggu Validasi"})
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs gap-1 py-0.5">
                <Unlock className="w-3 h-3" /> Mode Input Aktif (Dapat Diedit)
              </Badge>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Lembar Rekapitulasi Nilai Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Wali Kelas: <strong className="text-slate-700">{currentUser.name}</strong> • Nilai otomatis tersimpan saat diketik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isLocked && onAddStudent && (
            <Button
              variant="outline"
              onClick={() => setIsAddStudentModalOpen(true)}
              className="text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Tambah Siswa
            </Button>
          )}

          {onNavigate && (
            <Button
              variant="outline"
              onClick={() => onNavigate("walikelas-rekap")}
              className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Cetak Rekap
            </Button>
          )}

          <Button
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={isLocked || classStudents.length === 0}
            className="text-xs font-semibold gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-4 h-4" />
            {isLocked ? "Nilai Sudah Terkirim" : "Kirim Nilai ke Admin"}
          </Button>
        </div>
      </div>

      {/* Success Notification Alert after Submit */}
      {isSuccessSubmit && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">
                Nilai {assignedClass} Berhasil Dikirim ke Administrator Madrasah!
              </p>
              <p className="text-[11px] text-emerald-700">
                Pengajuan validasi nilai telah masuk ke antrean Administrator.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSuccessSubmit(false)}
            className="text-xs text-emerald-800 hover:bg-emerald-100/60"
          >
            Tutup
          </Button>
        </div>
      )}

      {/* Main Tabs Container: Semester 1 s/d 5 & UAM */}
      <Tabs value={selectedSemester} onValueChange={setSelectedSemester} className="w-full">
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
          <TabsList className="w-full justify-start overflow-x-auto gap-1.5 p-1.5 bg-slate-100/90 rounded-xl">
            {SEMESTER_TABS.map((tab) => {
              const isSelected = selectedSemester === tab.id
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "gap-2 shrink-0 py-2 px-3.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "!bg-emerald-600 !text-white shadow-md shadow-emerald-700/25 ring-1 ring-emerald-500 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                  )}
                >
                  <span className="font-bold tracking-tight">{tab.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors",
                    isSelected
                      ? "bg-emerald-700/80 text-emerald-100 border border-emerald-500/50"
                      : "bg-slate-200/80 text-slate-600"
                  )}>
                    {tab.gradeLabel}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {SEMESTER_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Buku Nilai {assignedClass}: {tab.label} ({tab.gradeLabel})
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Kriteria Ketuntasan Minimal (KKM): <strong className="text-slate-800">75</strong></span>
                </div>
              </div>

              <SpreadsheetTable
                isLocked={isLocked}
                semesterId={tab.id}
                semesterName={tab.label}
                students={classStudents}
                scoresForSemester={scoresBySemester[tab.id] || {}}
                onScoreChange={(studentId, subjectId, val) =>
                  onScoreChange(tab.id, studentId, subjectId, val)
                }
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal Tambah Siswa */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1">
            <Plus className="w-5 h-5" />
          </div>
          <DialogTitle>Tambah Siswa ke {assignedClass}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Tambahkan data siswa baru ke kelas {assignedClass}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveNewStudent} className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Nama Lengkap Siswa *</label>
            <Input
              value={newStudentForm.name}
              onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
              placeholder="Nama lengkap siswa"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NISN</label>
              <Input
                value={newStudentForm.nisn}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, nisn: e.target.value })}
                placeholder="Nomor NISN"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NIS</label>
              <Input
                value={newStudentForm.nis}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, nis: e.target.value })}
                placeholder="Nomor NIS"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Jenis Kelamin</label>
            <select
              value={newStudentForm.gender}
              onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value as 'L' | 'P' })}
              className="w-full text-xs h-10 px-3 rounded-lg border border-slate-200 bg-white"
            >
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddStudentModalOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button type="submit" className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Siswa
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal: Konfirmasi Kirim Nilai ke Admin */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <Send className="w-6 h-6" />
          </div>
          <DialogTitle>Kirim Nilai {assignedClass} ke Admin?</DialogTitle>
          <DialogDescription className="text-xs text-slate-600 mt-2 leading-relaxed">
            Setelah dikirim ke Administrator Madrasah:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700">
              <li>Pengajuan validasi nilai {assignedClass} akan diteruskan ke antrean Admin.</li>
              {autoLockAfterSubmit && (
                <li>Lembar kerja akan dikunci otomatis hingga disetujui atau dikembalikan oleh Admin untuk revisi.</li>
              )}
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsSubmitModalOpen(false)}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Ya, Kirim Nilai Sekarang
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
