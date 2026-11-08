import React, { useState } from "react"
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Eye, 
  Send, 
  FileText, 
  Filter, 
  Check, 
  ChevronRight,
  ShieldCheck,
  School,
  UserCheck,
  TrendingUp,
  Sparkles
} from "lucide-react"
import { MOCK_VALIDATION_QUEUE, ClassValidationItem, ClassValidationStatus } from "@/data/mockValidationQueue"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ValidasiNilaiPageProps {
  tahunAjaran?: string
  queue?: ClassValidationItem[]
  onChangeQueue?: React.Dispatch<React.SetStateAction<ClassValidationItem[]>>
}

export const ValidasiNilaiPage: React.FC<ValidasiNilaiPageProps> = ({
  tahunAjaran = "2024/2025",
  queue: externalQueue,
  onChangeQueue,
}) => {
  const [internalQueue, setInternalQueue] = useState<ClassValidationItem[]>(MOCK_VALIDATION_QUEUE)
  const queue = externalQueue ?? internalQueue
  const setQueue = onChangeQueue ?? setInternalQueue
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal states for Reject (Catatan Revisi)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedClassForReject, setSelectedClassForReject] = useState<ClassValidationItem | null>(null)
  const [revisionNote, setRevisionNote] = useState("")

  // Modal states for Approve
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [selectedClassForApprove, setSelectedClassForApprove] = useState<ClassValidationItem | null>(null)

  // Detail preview modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedClassForDetail, setSelectedClassForDetail] = useState<ClassValidationItem | null>(null)

  // Quick revision templates
  const revisionTemplates = [
    "Terdapat nilai remedial siswa yang belum diisi sesuai KKM 75.",
    "Nilai Al-Qur'an Hadis dan Fikih beberapa siswa masih belum lengkap.",
    "Rata-rata kumulatif semester 5 belum selaras dengan leger nilai madrasah.",
    "Mohon cek kembali nilai siswa pindahan yang belum terdaftar.",
  ]

  // Filter queue items
  const filteredQueue = queue.filter(item => {
    const matchesSearch = 
      item.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.walikelasName.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (statusFilter === "all") return matchesSearch
    return matchesSearch && item.status === statusFilter
  })

  // Counters
  const countPending = queue.filter(q => q.status === 'menunggu_validasi').length
  const countApproved = queue.filter(q => q.status === 'disetujui').length
  const countRevision = queue.filter(q => q.status === 'revisi').length

  // Handlers
  const handleOpenReject = (item: ClassValidationItem) => {
    setSelectedClassForReject(item)
    setRevisionNote("")
    setRejectModalOpen(true)
  }

  const handleConfirmReject = () => {
    if (!selectedClassForReject) return

    setQueue(prev =>
      prev.map(item => {
        if (item.id === selectedClassForReject.id) {
          return {
            ...item,
            status: 'revisi',
            revisionNotes: revisionNote || "Mohon periksa kembali kelengkapan nilai siswa.",
            lastUpdated: `Dikembalikan untuk revisi oleh Super Admin • Baru saja`
          }
        }
        return item
      })
    )

    setRejectModalOpen(false)
    setSelectedClassForReject(null)
  }

  const handleOpenApprove = (item: ClassValidationItem) => {
    setSelectedClassForApprove(item)
    setApproveModalOpen(true)
  }

  const handleConfirmApprove = () => {
    if (!selectedClassForApprove) return

    setQueue(prev =>
      prev.map(item => {
        if (item.id === selectedClassForApprove.id) {
          return {
            ...item,
            status: 'disetujui',
            lastUpdated: `Disahkan & Disetujui oleh Super Admin • Baru saja`
          }
        }
        return item
      })
    )

    setApproveModalOpen(false)
    setSelectedClassForApprove(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              Panel Pengesahan Administrator
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Tahun Ajaran {tahunAjaran}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Validasi Nilai Rapor
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verifikasi berkas nilai yang diajukan oleh wali kelas sebelum diterbitkan menjadi Rapor Resmi & Leger Kelulusan.
          </p>
        </div>

        {/* Quick batch approve or guideline status */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="warning" className="text-xs py-1 px-3 gap-1.5 font-bold">
            <Clock className="w-3.5 h-3.5" />
            {countPending} Kelas Menunggu Tindakan
          </Badge>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card 
          onClick={() => setStatusFilter('menunggu_validasi')}
          className={cn(
            "cursor-pointer transition-all border-amber-200/90 hover:shadow-md",
            statusFilter === 'menunggu_validasi' ? "ring-2 ring-amber-500 bg-amber-50/40" : "bg-white"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Menunggu Validasi
            </CardTitle>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{countPending} Rombel</div>
            <p className="text-xs text-amber-700 mt-1">Memerlukan persetujuan atau catatan revisi</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter('disetujui')}
          className={cn(
            "cursor-pointer transition-all border-emerald-200/90 hover:shadow-md",
            statusFilter === 'disetujui' ? "ring-2 ring-emerald-500 bg-emerald-50/40" : "bg-white"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Disetujui & Tervalidasi
            </CardTitle>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{countApproved} Rombel</div>
            <p className="text-xs text-emerald-700 mt-1">Nilai sah & siap dicetak rapor</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter('revisi')}
          className={cn(
            "cursor-pointer transition-all border-red-200/90 hover:shadow-md",
            statusFilter === 'revisi' ? "ring-2 ring-red-500 bg-red-50/40" : "bg-white"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-red-800 uppercase tracking-wider">
              Perlu Revisi Walikelas
            </CardTitle>
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{countRevision} Rombel</div>
            <p className="text-xs text-red-700 mt-1">Dikembalikan beserta catatan perbaikan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="text-xs h-8"
          >
            Semua ({queue.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "menunggu_validasi" ? "warning" : "outline"}
            onClick={() => setStatusFilter("menunggu_validasi")}
            className="text-xs h-8"
          >
            Menunggu Validasi ({countPending})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "disetujui" ? "default" : "outline"}
            onClick={() => setStatusFilter("disetujui")}
            className="text-xs h-8"
          >
            Disetujui ({countApproved})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "revisi" ? "destructive" : "outline"}
            onClick={() => setStatusFilter("revisi")}
            className="text-xs h-8"
          >
            Perlu Revisi ({countRevision})
          </Button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kelas / nama walikelas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Antrean Pengesahan Rekap Nilai
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Total {filteredQueue.length} rombel ditampilkan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <th className="px-4 py-3">Rombel / Kelas</th>
                <th className="px-4 py-3">Wali Kelas</th>
                <th className="px-3 py-3 text-center">Siswa</th>
                <th className="px-3 py-3 text-center">Rata-Rata</th>
                <th className="px-4 py-3">Kelengkapan</th>
                <th className="px-4 py-3">Waktu Pengajuan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-56">Tindakan / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada data antrean yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const isPending = item.status === "menunggu_validasi"
                  const isApproved = item.status === "disetujui"
                  const isRevision = item.status === "revisi"

                  return (
                    <tr 
                      key={item.id} 
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors",
                        isPending && "bg-amber-50/15"
                      )}
                    >
                      {/* Kelas */}
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.grade}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{item.className}</div>
                            <div className="text-[10px] text-slate-400 font-normal">Tingkat {item.grade}</div>
                          </div>
                        </div>
                      </td>

                      {/* Wali Kelas */}
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium text-slate-900">{item.walikelasName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIP: {item.walikelasNip}</div>
                      </td>

                      {/* Jumlah Siswa */}
                      <td className="px-3 py-3 text-center font-semibold text-slate-800">
                        {item.studentCount} Siswa
                      </td>

                      {/* Nilai Rata-rata */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                          {item.averageScore}
                        </span>
                      </td>

                      {/* Kelengkapan Bar */}
                      <td className="px-4 py-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>{item.completeness}% Lengkap</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              item.completeness === 100 ? "bg-emerald-600" : "bg-amber-500"
                            )}
                            style={{ width: `${item.completeness}%` }}
                          />
                        </div>
                      </td>

                      {/* Tanggal Kirim */}
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        <div>{item.submittedAt}</div>
                        {item.lastUpdated && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            {item.lastUpdated}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-center">
                        {isPending && (
                          <Badge variant="warning" className="text-[10px] font-semibold">
                            Menunggu Validasi
                          </Badge>
                        )}
                        {isApproved && (
                          <Badge variant="success" className="text-[10px] font-semibold gap-1">
                            <Check className="w-3 h-3" /> Disetujui
                          </Badge>
                        )}
                        {isRevision && (
                          <div className="inline-flex flex-col items-center">
                            <Badge variant="destructive" className="text-[10px] font-semibold">
                              Perlu Revisi
                            </Badge>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons as requested in prompt: Approve (Hijau) & Reject (Merah) */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail Preview */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedClassForDetail(item)
                              setDetailModalOpen(true)
                            }}
                            className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            title="Pratinjau Lembar Nilai"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Tombol Approve (Hijau) */}
                          <Button
                            size="sm"
                            onClick={() => handleOpenApprove(item)}
                            disabled={isApproved}
                            className={cn(
                              "h-8 px-2.5 text-xs font-semibold gap-1 shadow-2xs",
                              isApproved 
                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </Button>

                          {/* Tombol Reject (Merah) - Memicu Modal Catatan Revisi */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenReject(item)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1 shadow-2xs bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Reject & Masukkan Catatan Revisi (Sesuai instruksi Langkah 3) */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle>Tolak & Kembalikan Berkas untuk Revisi</DialogTitle>
          <DialogDescription className="text-xs text-slate-600 mt-1">
            Anda akan mengembalikan lembar nilai <strong>{selectedClassForReject?.className}</strong> kepada Wali Kelas (<strong>{selectedClassForReject?.walikelasName}</strong>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Kelas snippet */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-800">{selectedClassForReject?.className}</span>
              <p className="text-[11px] text-slate-500">Jumlah Siswa: {selectedClassForReject?.studentCount} • Rata-Rata: {selectedClassForReject?.averageScore}</p>
            </div>
            <Badge variant="warning" className="text-[10px]">Perlu Perbaikan</Badge>
          </div>

          {/* Quick template buttons */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Pilih Template Catatan Cepat:
            </label>
            <div className="space-y-1">
              {revisionTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRevisionNote(tmpl)}
                  className="w-full text-left text-xs p-2 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 transition-colors"
                >
                  • {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea Input Catatan Revisi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Tuliskan Catatan Revisi Rinci untuk Walikelas:
            </label>
            <textarea
              rows={4}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Contoh: Terdapat 2 siswa yang nilai Matematika Semester 4 dan 5 belum tuntas KKM 75. Harap lakukan verifikasi nilai remedial..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-800"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setRejectModalOpen(false)}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirmReject}
            disabled={!revisionNote.trim()}
            className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Kirim Catatan Revisi ke Walikelas
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Modal: Approve & Sahkan Nilai Rapor */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <DialogTitle>Sahkan & Setujui Nilai {selectedClassForApprove?.className}?</DialogTitle>
          <DialogDescription className="text-xs text-slate-600 mt-2 leading-relaxed">
            Dengan menyetujui nilai ini:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700">
              <li>Status berkas nilai kelas ini berubah menjadi <strong>Disetujui & Tervalidasi</strong>.</li>
              <li>Wali Kelas dapat mencetak <strong>Rapor Resmi</strong> dan <strong>Leger Kelulusan Siswa</strong>.</li>
              <li>Rekapitulasi nilai otomatis terintegrasi ke buku induk madrasah.</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <p className="font-semibold">{selectedClassForApprove?.className} • Wali: {selectedClassForApprove?.walikelasName}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Kelengkapan 100% • Rata-rata Nilai: {selectedClassForApprove?.averageScore}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setApproveModalOpen(false)}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirmApprove}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Ya, Sahkan & Setujui Nilai
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Modal: Pratinjau Cepat Berkas Nilai */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <DialogTitle>Pratinjau Berkas Nilai - {selectedClassForDetail?.className}</DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Diajukan oleh {selectedClassForDetail?.walikelasName} pada {selectedClassForDetail?.submittedAt}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Siswa:</span>
              <span className="font-bold text-slate-800 text-sm">{selectedClassForDetail?.studentCount} Siswa</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Rata-Rata Kelas:</span>
              <span className="font-bold text-emerald-700 text-sm">{selectedClassForDetail?.averageScore}</span>
            </div>
          </div>

          {selectedClassForDetail?.revisionNotes && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs">
              <span className="font-bold text-red-900 block mb-1">Catatan Revisi Terakhir:</span>
              <p className="text-red-800">{selectedClassForDetail.revisionNotes}</p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-semibold text-slate-700 block">Status Mata Pelajaran:</span>
            <p className="text-slate-600">• Kelompok A (Kemenag): 5 Mapel Lengkap</p>
            <p className="text-slate-600">• Kelompok B (Umum): 6 Mapel Lengkap</p>
            <p className="text-slate-600">• Cakupan: Semester 1 s/d 5 & UAM</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDetailModalOpen(false)}
            className="text-xs"
          >
            Tutup
          </Button>
          {selectedClassForDetail?.status === "menunggu_validasi" && (
            <Button
              onClick={() => {
                setDetailModalOpen(false)
                handleOpenApprove(selectedClassForDetail)
              }}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Lanjut Setujui
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  )
}
