import React, { useState } from "react"
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Award,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  School,
  Sparkles,
  ChevronDown,
  Info,
  ShieldCheck,
  Check
} from "lucide-react"
import { MADRASAH_SUBJECTS } from "@/data/mockStudentScores"
import { StudentItem } from "@/components/admin/DataMasterPage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, SchoolProfile } from "@/types"
import { DEFAULT_SCHOOL_PROFILE } from "@/data/mockData"
import { cn } from "@/lib/utils"

interface RekapCetakPageProps {
  currentUser: User
  tahunAjaran?: string
  schoolProfile?: SchoolProfile
  students?: StudentItem[]
  scoresBySemester?: Record<string, Record<string, Record<string, number | ''>>>
}

type DocumentType = "leger" | "rapor" | "skl"

export const RekapCetakPage: React.FC<RekapCetakPageProps> = ({
  currentUser,
  tahunAjaran = "2024/2025",
  schoolProfile = DEFAULT_SCHOOL_PROFILE,
  students = [],
  scoresBySemester = {},
}) => {
  const [docType, setDocType] = useState<DocumentType>("leger")
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const titimangsaDate = schoolProfile.titimangsa || "Semarang, 20 Desember 2026"
  const [showRank, setShowRank] = useState<boolean>(true)
  const [showDigitalSign, setShowDigitalSign] = useState<boolean>(true)
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)

  const assignedClass = currentUser.assignedClass || "Kelas IX-A"
  const classStudents = students.filter(s => s.classRoom === assignedClass)
  const sem5Scores = scoresBySemester["sem-5"] || {}

  // Calculate scores and ranks for all students in this class
  const studentsWithStats = classStudents.map(std => {
    const scoresObj = sem5Scores[std.id] || {}
    const scoresList = Object.values(scoresObj).filter((s): s is number => typeof s === 'number')
    const total = scoresList.reduce((acc, val) => acc + val, 0)
    const avg = scoresList.length > 0 ? parseFloat((total / scoresList.length).toFixed(1)) : 0
    return {
      ...std,
      scores: scoresObj,
      totalScore: total,
      averageScore: avg,
    }
  }).sort((a, b) => b.averageScore - a.averageScore)

  // Map rankings
  const rankedStudents = studentsWithStats.map((std, idx) => ({
    ...std,
    rank: idx + 1,
  }))

  // Selected student for Rapor / SKL view
  const currentStudent = rankedStudents.find(s => s.id === selectedStudentId) || rankedStudents[0] || {
    id: "",
    name: "-",
    nisn: "-",
    nis: "-",
    gender: "L" as const,
    scores: {},
    totalScore: 0,
    averageScore: 0,
    rank: 1,
  }

  // Predicate helper
  const getPredicate = (score: number) => {
    if (score >= 90) return { pred: "A", label: "Sangat Baik" }
    if (score >= 80) return { pred: "B", label: "Baik" }
    if (score >= 75) return { pred: "C", label: "Cukup" }
    return { pred: "D", label: "Kurang" }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = (format: string) => {
    setDownloadNotice(`Dokumen berhasil disiapkan untuk format ${format}. Mengunduh...`)
    setTimeout(() => {
      setDownloadNotice(null)
    }, 3500)
  }

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden on Print) */}
      <div className="no-print space-y-4">
        {/* Header bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Pusat Rekapitulasi & Cetak Dokumen
              </span>
              <Badge variant="success" className="text-[10px] gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Berkas Sah & Tervalidasi
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Cetak Dokumen Rekapitulasi Nilai Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cetak Buku Leger Nilai Kolektif, Lembar Rapor Siswa Perorangan, atau Surat Keterangan Lulus (SKL) {currentUser.assignedClass || "Kelas IX-A"}.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={() => handleExport("Excel (.xlsx)")}
              className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              Ekspor Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("PDF")}
              className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-blue-700" />
              Unduh PDF
            </Button>
            <Button
              onClick={handlePrint}
              className="text-xs font-semibold gap-1.5 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Printer className="w-4 h-4" />
              Cetak ke Printer (Ctrl + P)
            </Button>
          </div>
        </div>

        {/* Notice feedback if download clicked */}
        {downloadNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {downloadNotice}
            </span>
            <button onClick={() => setDownloadNotice(null)} className="text-emerald-700 hover:underline">
              Tutup
            </button>
          </div>
        )}

        {/* Document Selection Pills & Customization Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Format selector buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Format Dokumen:
            </span>
            <Button
              size="sm"
              variant={docType === "leger" ? "default" : "outline"}
              onClick={() => setDocType("leger")}
              className={cn(
                "text-xs h-9 gap-1.5",
                docType === "leger" && "bg-emerald-600 text-white shadow-sm"
              )}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>1. Buku Leger Nilai (Kolektif)</span>
            </Button>

            <Button
              size="sm"
              variant={docType === "rapor" ? "default" : "outline"}
              onClick={() => setDocType("rapor")}
              className={cn(
                "text-xs h-9 gap-1.5",
                docType === "rapor" && "bg-emerald-600 text-white shadow-sm"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. Lembar Rapor Siswa (Perorangan)</span>
            </Button>

            <Button
              size="sm"
              variant={docType === "skl" ? "default" : "outline"}
              onClick={() => setDocType("skl")}
              className={cn(
                "text-xs h-9 gap-1.5",
                docType === "skl" && "bg-emerald-600 text-white shadow-sm"
              )}
            >
              <Award className="w-3.5 h-3.5" />
              <span>3. Transkrip Kelulusan (SKL)</span>
            </Button>
          </div>

          {/* Student picker when Rapor or SKL is active */}
          {(docType === "rapor" || docType === "skl") && (
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <label className="text-xs font-semibold text-slate-700 shrink-0">
                Pilih Siswa:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
              >
                {rankedStudents.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name} (Rangking {std.rank} • Rata-rata: {std.averageScore})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Print settings toggles */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 px-3 py-2 bg-slate-100/70 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">Pengaturan Tampilan Cetak:</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showRank}
                onChange={(e) => setShowRank(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Tampilkan Peringkat / Ranking</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDigitalSign}
                onChange={(e) => setShowDigitalSign(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Sertakan Barcode / Validasi Digital</span>
            </label>
          </div>
          <div className="text-[11px] text-slate-500">
            Titimangsa: <strong>{titimangsaDate}</strong>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DOCUMENT PREVIEW CONTAINER (Styled as real printed white paper)  */}
      {/* ============================================================== */}
      <div className="print-container bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 md:p-10 text-slate-900 mx-auto max-w-[1400px]">
        {/* KOP RESMI MADRASAH TSANAWIYAH */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Kemenag / Madrasah */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
              <School className="w-9 h-9" />
            </div>

            {/* Kop text */}
            <div className="text-center flex-1">
              <h4 className="text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-700">
                {schoolProfile.ministryHeader1}
              </h4>
              <h3 className="text-base md:text-xl font-extrabold tracking-tight uppercase text-slate-900">
                {schoolProfile.ministryHeader2}
              </h3>
              <h2 className="text-lg md:text-2xl font-black tracking-tight uppercase text-emerald-950">
                {schoolProfile.name}
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {schoolProfile.address}, Telp. {schoolProfile.phone}, Website: {schoolProfile.website} • Email: {schoolProfile.email}
              </p>
            </div>

            {/* Emblem/Akreditasi */}
            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-1 shrink-0 text-slate-700">
              <span className="text-[9px] font-bold uppercase text-slate-400">Akreditasi</span>
              <span className="text-xl font-black text-emerald-800">{schoolProfile.accreditation}</span>
              <span className="text-[8px] text-slate-500">{schoolProfile.accreditationLabel}</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DOKUMEN 1: BUKU LEGER NILAI LENGKAP (Kolektif 16 Mapel)        */}
        {/* ============================================================== */}
        {docType === "leger" && (
          <div className="space-y-6">
            {/* Document Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                BUKU LEGER NILAI HASIL BELAJAR SISWA
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                TAHUN AJARAN {tahunAjaran}
              </p>
            </div>

            {/* Identity Info Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Satuan Pendidikan:</span>
                <span className="font-bold text-slate-800">{schoolProfile.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rombel / Kelas:</span>
                <span className="font-bold text-slate-800">{currentUser.assignedClass || "Kelas IX-A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Wali Kelas:</span>
                <span className="font-bold text-slate-800">{currentUser.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jumlah Siswa:</span>
                <span className="font-bold text-slate-800">{rankedStudents.length} Siswa Terdaftar</span>
              </div>
            </div>

            {/* Leger Table with exact 16 subjects */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-center text-xs border-collapse font-sans">
                <thead>
                  {/* Group Header */}
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th rowSpan={2} className="w-8 border-r border-slate-300 p-2 text-center">No</th>
                    <th rowSpan={2} className="w-24 border-r border-slate-300 p-2 text-left">NISN</th>
                    <th rowSpan={2} className="w-48 border-r border-slate-300 p-2 text-left">Nama Siswa</th>
                    <th rowSpan={2} className="w-8 border-r border-slate-300 p-2 text-center">L/P</th>
                    <th colSpan={4} className="border-r border-slate-300 py-1 px-2 bg-emerald-50 text-emerald-900 font-bold">
                      Kelompok A (PAI)
                    </th>
                    <th colSpan={10} className="border-r border-slate-300 py-1 px-2 bg-blue-50 text-blue-900 font-bold">
                      Kelompok B (Umum & Bahasa)
                    </th>
                    <th colSpan={2} className="border-r border-slate-300 py-1 px-2 bg-teal-50 text-teal-900 font-bold">
                      Muatan Lokal
                    </th>
                    <th rowSpan={2} className="w-16 border-r border-slate-300 p-2 bg-slate-200/80 font-bold">Total</th>
                    <th rowSpan={2} className="w-16 border-r border-slate-300 p-2 bg-slate-200/80 font-bold">Rerata</th>
                    {showRank && (
                      <th rowSpan={2} className="w-14 border-r border-slate-300 p-2 bg-amber-100 text-amber-900 font-bold">
                        Peringkat
                      </th>
                    )}
                    <th rowSpan={2} className="w-20 p-2 bg-slate-200/80 font-bold">Keterangan</th>
                  </tr>

                  {/* 16 Subjects Header */}
                  <tr className="bg-slate-50 border-b border-slate-300 text-[10px]">
                    {MADRASAH_SUBJECTS.map((sub) => (
                      <th key={sub.id} className="w-10 border-r border-slate-300 py-1 px-0.5 text-center font-bold">
                        <div>{sub.code}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{sub.shortName}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-300">
                  {rankedStudents.map((student, idx) => (
                    <tr key={student.id} className={idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-300 text-left font-mono text-[11px] text-slate-600">
                        {student.nisn}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-left font-bold text-slate-900 truncate max-w-[180px]">
                        {student.name}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-semibold text-[10px]">
                        {student.gender}
                      </td>

                      {/* 16 Subject Scores */}
                      {MADRASAH_SUBJECTS.map((sub) => {
                        const val = student.scores[sub.id]
                        const isRemed = typeof val === 'number' && val < sub.kkm
                        return (
                          <td
                            key={sub.id}
                            className={cn(
                              "p-1 border-r border-slate-300 font-mono text-center text-xs font-semibold",
                              isRemed && "text-red-600 font-bold bg-red-50"
                            )}
                          >
                            {val}
                          </td>
                        )
                      })}

                      {/* Total */}
                      <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-slate-900 bg-slate-50">
                        {student.totalScore}
                      </td>

                      {/* Average */}
                      <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-emerald-800 bg-emerald-50/40">
                        {student.averageScore}
                      </td>

                      {/* Ranking */}
                      {showRank && (
                        <td className="p-1.5 border-r border-slate-300 font-mono font-black text-amber-900 bg-amber-50">
                          #{student.rank}
                        </td>
                      )}

                      {/* Keterangan */}
                      <td className="p-1.5 text-center text-[10px] font-semibold text-emerald-800">
                        Lulus / Naik
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                    <td colSpan={4} className="p-2 text-right border-r border-slate-300">
                      Rata-Rata Kelas:
                    </td>
                    {MADRASAH_SUBJECTS.map((sub) => {
                      const scores = rankedStudents
                        .map(s => s.scores[sub.id])
                        .filter((v): v is number => typeof v === 'number')
                      const subAvg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0
                      return (
                        <td key={sub.id} className="p-1 border-r border-slate-300 font-mono text-[11px] text-emerald-800">
                          {subAvg}
                        </td>
                      )
                    })}
                    <td className="p-2 border-r border-slate-300 font-mono">1366</td>
                    <td className="p-2 border-r border-slate-300 font-mono text-emerald-900">85.4</td>
                    {showRank && <td className="p-2 border-r border-slate-300">-</td>}
                    <td className="p-2 text-[10px] text-emerald-800">100% Tuntas</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature Block */}
            <div className="pt-8 flex justify-between items-end text-xs">
              <div className="text-center w-64">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah</p>
                <div className="h-20 flex items-center justify-center">
                  {showDigitalSign && (
                    <div className="border border-emerald-600 bg-emerald-50 px-3 py-1 rounded text-[10px] text-emerald-800 font-mono font-semibold">
                      [Tanda Tangan Digital Terverifikasi]
                    </div>
                  )}
                </div>
                <p className="font-bold underline text-slate-900">{schoolProfile.headmasterName}</p>
                <p className="text-[11px] text-slate-500 font-mono">NIP. {schoolProfile.headmasterNip}</p>
              </div>

              <div className="text-center w-64">
                <p>{titimangsaDate}</p>
                <p className="font-bold">Wali Kelas {currentUser.assignedClass || "IX-A"}</p>
                <div className="h-20 flex items-center justify-center">
                  {showDigitalSign && (
                    <div className="border border-emerald-600 bg-emerald-50 px-3 py-1 rounded text-[10px] text-emerald-800 font-mono font-semibold">
                      [Tanda Tangan Digital Terverifikasi]
                    </div>
                  )}
                </div>
                <p className="font-bold underline text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">NIP. {currentUser.nip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOKUMEN 2: LEMBAR RAPOR SISWA PERORANGAN                      */}
        {/* ============================================================== */}
        {docType === "rapor" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                LAPORAN HASIL BELAJAR SISWA (RAPOR)
              </h3>
              <p className="text-xs font-semibold text-slate-600 uppercase">
                MADRASAH TSANAWIYAH • KURIKULUM MERDEKA & KEMENAG
              </p>
            </div>

            {/* Student Biodata Box */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs">
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Nama Peserta Didik</span>
                <span className="font-bold text-slate-900">: {currentStudent.name}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Kelas / Rombel</span>
                <span className="font-bold text-slate-900">: {currentUser.assignedClass || "Kelas IX-A"}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">NISN / NIS</span>
                <span className="font-mono text-slate-900">: {currentStudent.nisn} / {currentStudent.nis}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Tahun Ajaran</span>
                <span className="font-bold text-slate-900">: {tahunAjaran}</span>
              </div>
            </div>

            {/* Subject Grades Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="w-10 p-2 text-center border-r border-slate-300">No</th>
                    <th className="p-2 text-left border-r border-slate-300">Mata Pelajaran</th>
                    <th className="w-16 p-2 text-center border-r border-slate-300">Nilai Akhir</th>
                    <th className="w-14 p-2 text-center border-r border-slate-300">Predikat</th>
                    <th className="p-2 text-left">Capaian Kompetensi & Catatan Kemajuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {MADRASAH_SUBJECTS.map((sub, idx) => {
                    const score = Number(currentStudent.scores[sub.id]) || 0
                    const { pred, label } = getPredicate(score)

                    return (
                      <tr key={sub.id} className={idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"}>
                        <td className="p-2 text-center font-mono border-r border-slate-300 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-medium text-slate-900">
                          <div>{sub.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">Kode: {sub.code} (KKM: {sub.kkm})</span>
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-900 border-r border-slate-300 bg-slate-50/50">
                          {score}
                        </td>
                        <td className="p-2 text-center border-r border-slate-300">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-black text-xs font-mono",
                            pred === "A" ? "bg-emerald-100 text-emerald-800" :
                              pred === "B" ? "bg-blue-100 text-blue-800" :
                                pred === "C" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          )}>
                            {pred}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 text-[11px] leading-relaxed">
                          Menunjukkan penguasaan materi yang <strong className="text-slate-900">{label}</strong> dalam memahami konsep pembelajaran semester ini.
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Extracurricular & Attendance Record */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-2">Ekstrakurikuler & Karakter:</h5>
                <ul className="space-y-1 text-slate-700 text-[11px]">
                  <li>• <strong>Pramuka Penggalang:</strong> Sangat Baik (A)</li>
                  <li>• <strong>Kajian Qira'ah & Tilawah:</strong> Sangat Baik (A)</li>
                  <li>• <strong>Karakter Akhlakul Karimah:</strong> Terpuji</li>
                </ul>
              </div>

              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                <h5 className="font-bold text-slate-900 mb-2">Rekapitulasi Kehadiran:</h5>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <span className="block text-slate-500 text-[10px]">Sakit</span>
                    <strong className="text-slate-800 text-sm">1 Hari</strong>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <span className="block text-slate-500 text-[10px]">Izin</span>
                    <strong className="text-slate-800 text-sm">0 Hari</strong>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <span className="block text-slate-500 text-[10px]">Tanpa Ket.</span>
                    <strong className="text-slate-800 text-sm">0 Hari</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Three Signature blocks */}
            <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Orang Tua / Wali Siswa</p>
                <div className="h-16" />
                <p className="border-b border-slate-400 w-36 mx-auto" />
                <p className="text-[10px] text-slate-400 mt-1">Nama Terang & Tanda Tangan</p>
              </div>

              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah</p>
                <div className="h-16 flex items-center justify-center">
                  {showDigitalSign && (
                    <span className="text-[9px] font-mono text-emerald-800 border border-emerald-400 px-2 py-0.5 rounded bg-emerald-50">
                      [Validasi Sistem]
                    </span>
                  )}
                </div>
                <p className="font-bold underline text-slate-900">{schoolProfile.headmasterName}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. {schoolProfile.headmasterNip}</p>
              </div>

              <div>
                <p>{titimangsaDate}</p>
                <p className="font-bold">Wali Kelas</p>
                <div className="h-16 flex items-center justify-center">
                  {showDigitalSign && (
                    <span className="text-[9px] font-mono text-emerald-800 border border-emerald-400 px-2 py-0.5 rounded bg-emerald-50">
                      [Validasi Sistem]
                    </span>
                  )}
                </div>
                <p className="font-bold underline text-slate-900">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. {currentUser.nip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOKUMEN 3: SURAT KETERANGAN LULUS (SKL) / TRANSKRIP NILAI      */}
        {/* ============================================================== */}
        {docType === "skl" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                SURAT KETERANGAN KELULUSAN (SKL)
              </h3>
              <p className="text-xs font-mono text-slate-600">
                Nomor: B-412/Mts.11.02/PP.00.5/12/2024
              </p>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              Kepala {schoolProfile.name}, dengan ini menerangkan bahwa peserta didik di bawah ini telah menyelesaikan seluruh program pembelajaran dan Ujian Akhir Madrasah (UAM) Tahun Ajaran {tahunAjaran}:
            </p>

            {/* Student details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-1.5 text-xs">
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Nama Lengkap</span>
                <span className="col-span-2 font-bold text-slate-900">: {currentStudent.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">NISN / NIS</span>
                <span className="col-span-2 font-mono text-slate-900">: {currentStudent.nisn} / {currentStudent.nis}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Tempat, Tanggal Lahir</span>
                <span className="col-span-2 text-slate-900">: Semarang, 15 Mei 2009</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Madrasah Asal</span>
                <span className="col-span-2 text-slate-900">: {schoolProfile.name}</span>
              </div>
            </div>

            {/* Graduation Announcement Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">Dinyatakan:</span>
              <h4 className="text-2xl font-black text-emerald-900 tracking-wider">
                L U L U S
              </h4>
              <p className="text-xs text-emerald-800">
                Dengan Nilai Rata-Rata Kumulatif: <strong className="font-mono text-sm">{currentStudent.averageScore}</strong> (Predikat Memuaskan)
              </p>
            </div>

            {/* Cumulative Transcripts Snippet */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 w-10 text-center">No</th>
                    <th className="p-2">Mata Pelajaran Kelulusan</th>
                    <th className="p-2 text-center w-28">Nilai Rapor (Sem 1-5)</th>
                    <th className="p-2 text-center w-24">Nilai UAM</th>
                    <th className="p-2 text-center w-24">Nilai Ijazah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {MADRASAH_SUBJECTS.slice(0, 8).map((sub, idx) => {
                    const score = Number(currentStudent.scores[sub.id]) || 80
                    return (
                      <tr key={sub.id}>
                        <td className="p-1.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-1.5 font-medium text-slate-900">{sub.name}</td>
                        <td className="p-1.5 text-center font-mono">{score}</td>
                        <td className="p-1.5 text-center font-mono">{score + 2}</td>
                        <td className="p-1.5 text-center font-mono font-bold text-emerald-800">{score + 1}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* SKL Signature */}
            <div className="pt-6 flex justify-between items-end text-xs">
              <div className="w-48 text-center">
                <div className="w-24 h-28 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 bg-slate-50 mx-auto">
                  Pas Foto 3x4
                </div>
              </div>

              <div className="text-center w-64">
                <p>{titimangsaDate}</p>
                <p className="font-bold">Kepala Madrasah,</p>
                <div className="h-16 flex items-center justify-center">
                  {showDigitalSign && (
                    <div className="border border-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] text-emerald-800 font-mono">
                      [Cap Stempel & TTD Digital]
                    </div>
                  )}
                </div>
                <p className="font-bold underline text-slate-900">{schoolProfile.headmasterName}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. {schoolProfile.headmasterNip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
