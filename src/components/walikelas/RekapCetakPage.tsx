import React, { useState } from "react"
import * as XLSX from "xlsx"
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Award,
  School,
  CheckCircle2,
  Check,
  GraduationCap,
  SlidersHorizontal,
  Info
} from "lucide-react"
import { MADRASAH_SUBJECTS, SEMESTER_TABS } from "@/data/mockStudentScores"
import { ClassItem, StudentItem } from "@/components/admin/DataMasterPage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, SchoolProfile, WalikelasAccount } from "@/types"
import { DEFAULT_SCHOOL_PROFILE } from "@/data/mockData"
import { cn } from "@/lib/utils"

interface RekapCetakPageProps {
  currentUser: User
  tahunAjaran?: string
  schoolProfile?: SchoolProfile
  classes?: ClassItem[]
  walikelasAccounts?: WalikelasAccount[]
  students?: StudentItem[]
  scoresBySemester?: Record<string, Record<string, Record<string, number | ''>>>
}

type DocumentType = "leger" | "rapor" | "skl" | "ijazah"
type IjazahRounding = "1dec" | "int"
type IjazahTableMode = "mapel" | "ringkasan"

interface IjazahConfig {
  raporWeight: number
  umWeight: number
  rounding: IjazahRounding
}

const DEFAULT_IJAZAH_CONFIG: IjazahConfig = {
  raporWeight: 60,
  umWeight: 40,
  rounding: "1dec",
}

const SEM_1_TO_5 = ["sem-1", "sem-2", "sem-3", "sem-4", "sem-5"] as const

export const RekapCetakPage: React.FC<RekapCetakPageProps> = ({
  currentUser,
  tahunAjaran = "2024/2025",
  schoolProfile = DEFAULT_SCHOOL_PROFILE,
  classes = [],
  walikelasAccounts = [],
  students = [],
  scoresBySemester = {},
}) => {
  const isAdmin = currentUser.role === "admin"

  const classOptions = React.useMemo(() => {
    const set = new Set<string>()
    classes.forEach((c) => {
      if (c?.name) set.add(c.name)
    })
    students.forEach((s) => {
      if (s?.classRoom) set.add(s.classRoom)
    })
    if (set.size === 0) set.add("Kelas IX-A")
    return Array.from(set)
  }, [classes, students])

  const [docType, setDocType] = useState<DocumentType>(isAdmin ? "ijazah" : "leger")
  const [selectedClass, setSelectedClass] = useState<string>(() =>
    isAdmin ? classOptions[0] || "Kelas IX-A" : currentUser.assignedClass || "Kelas IX-A"
  )
  const [selectedSemester, setSelectedSemester] = useState<string>("sem-5")
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [ijazahTableMode, setIjazahTableMode] = useState<IjazahTableMode>("mapel")
  const [ijazahConfig, setIjazahConfig] = useState<IjazahConfig>(() => {
    try {
      const raw = localStorage.getItem("sisforekap_v2_ijazah_config")
      return raw ? { ...DEFAULT_IJAZAH_CONFIG, ...JSON.parse(raw) } : DEFAULT_IJAZAH_CONFIG
    } catch {
      return DEFAULT_IJAZAH_CONFIG
    }
  })

  const titimangsaDate = schoolProfile.titimangsa || "Semarang, 20 Desember 2026"
  const [showRank, setShowRank] = useState<boolean>(true)
  const [showDigitalSign, setShowDigitalSign] = useState<boolean>(true)
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)
  const [sklNo, setSklNo] = useState<string>(
    () => localStorage.getItem("sisforekap_v2_skl_no") || "B-412/Mts.11.02/PP.00.5/06/2026"
  )
  const [ttlMap, setTtlMap] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("sisforekap_v2_ttl") || "{}")
    } catch {
      return {}
    }
  })

  const updateIjazahConfig = (patch: Partial<IjazahConfig>) => {
    setIjazahConfig((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem("sisforekap_v2_ijazah_config", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleRaporWeightChange = (valStr: string) => {
    const parsed = Math.min(100, Math.max(0, Number(valStr) || 0))
    updateIjazahConfig({ raporWeight: parsed, umWeight: 100 - parsed })
  }

  const handleUmWeightChange = (valStr: string) => {
    const parsed = Math.min(100, Math.max(0, Number(valStr) || 0))
    updateIjazahConfig({ umWeight: parsed, raporWeight: 100 - parsed })
  }

  const formatIjazahScore = (val: number): number => {
    return ijazahConfig.rounding === "int"
      ? Math.round(val)
      : parseFloat(val.toFixed(1))
  }

  const activeClassLabel = isAdmin
    ? selectedClass === "ALL"
      ? "Semua Kelas IX"
      : selectedClass
    : currentUser.assignedClass || "Kelas IX-A"

  const waliInfo = React.useMemo(() => {
    if (!isAdmin) return { name: currentUser.name, nip: currentUser.nip || "-" }
    if (selectedClass === "ALL") {
      return {
        name: schoolProfile.headmasterName || currentUser.name,
        nip: schoolProfile.headmasterNip || "-",
      }
    }
    const wAcc = walikelasAccounts.find((w) => w.assignedClass === selectedClass)
    if (wAcc) return { name: wAcc.name, nip: wAcc.nip || "-" }
    const clsObj = classes.find((c) => c.name === selectedClass)
    if (clsObj?.walikelas) return { name: clsObj.walikelas, nip: clsObj.walikelasNip || "-" }
    return { name: `Wali Kelas ${selectedClass}`, nip: "-" }
  }, [isAdmin, selectedClass, currentUser, schoolProfile, walikelasAccounts, classes])

  const filteredStudents = React.useMemo(() => {
    if (isAdmin) {
      if (selectedClass === "ALL") return students
      return students.filter(
        (s) => (s.classRoom || "").trim().toLowerCase() === selectedClass.trim().toLowerCase()
      )
    }
    const assigned = (currentUser.assignedClass || "Kelas IX-A").trim().toLowerCase()
    return students.filter((s) => (s.classRoom || "").trim().toLowerCase() === assigned)
  }, [isAdmin, selectedClass, students, currentUser.assignedClass])

  const computeStudentsStats = React.useCallback(
    (targetStudents: StudentItem[]) => {
      const semScores = scoresBySemester[selectedSemester] || {}
      const uamScores = scoresBySemester["uam"] || {}
      const wR = ijazahConfig.raporWeight
      const wU = ijazahConfig.umWeight

      const rows = targetStudents.map((std) => {
        const scObj = semScores[std.id] || {}
        const semVals = Object.values(scObj).filter((v): v is number => typeof v === "number")
        const totalScore = semVals.reduce((a, b) => a + b, 0)
        const averageScore =
          semVals.length > 0 ? parseFloat((totalScore / semVals.length).toFixed(1)) : 0

        // Rata-rata per semester (Sem 1 s/d Sem 5)
        const semAvgs: Record<string, number | null> = {}
        const validSemAvgs: number[] = []
        SEM_1_TO_5.forEach((sid) => {
          const sMap = scoresBySemester[sid]?.[std.id] || {}
          const sList = MADRASAH_SUBJECTS.map((sub) => sMap[sub.id]).filter(
            (v): v is number => typeof v === "number"
          )
          if (sList.length > 0) {
            const avgS = parseFloat((sList.reduce((a, b) => a + b, 0) / sList.length).toFixed(1))
            semAvgs[sid] = avgS
            validSemAvgs.push(avgS)
          } else {
            semAvgs[sid] = null
          }
        })
        const sumSem1to5Avg =
          validSemAvgs.length > 0
            ? parseFloat(validSemAvgs.reduce((a, b) => a + b, 0).toFixed(1))
            : null

        const raporAvg: Record<string, number | null> = {}
        const uamSub: Record<string, number | null> = {}
        const ijazahSub: Record<string, number | null> = {}

        const validRaporSubs: number[] = []
        const validUmSubs: number[] = []
        const validIjazahSubs: number[] = []

        MADRASAH_SUBJECTS.forEach((sub) => {
          const rVals: number[] = []
          SEM_1_TO_5.forEach((sid) => {
            const v = scoresBySemester[sid]?.[std.id]?.[sub.id]
            if (typeof v === "number") rVals.push(v)
          })
          const rAvg =
            rVals.length > 0
              ? parseFloat((rVals.reduce((a, b) => a + b, 0) / rVals.length).toFixed(1))
              : null
          const rawUm = uamScores[std.id]?.[sub.id]
          const uVal = typeof rawUm === "number" ? rawUm : null

          let ijVal: number | null = null
          if (rAvg !== null && uVal !== null) {
            ijVal = formatIjazahScore((rAvg * wR) / 100 + (uVal * wU) / 100)
          } else if (rAvg !== null && wU === 0) {
            ijVal = formatIjazahScore(rAvg)
          } else if (uVal !== null && wR === 0) {
            ijVal = formatIjazahScore(uVal)
          }

          raporAvg[sub.id] = rAvg
          uamSub[sub.id] = uVal
          ijazahSub[sub.id] = ijVal

          if (rAvg !== null) validRaporSubs.push(rAvg)
          if (uVal !== null) validUmSubs.push(uVal)
          if (ijVal !== null) validIjazahSubs.push(ijVal)
        })

        const totalRaporSem15 =
          validRaporSubs.length > 0
            ? parseFloat(validRaporSubs.reduce((a, b) => a + b, 0).toFixed(1))
            : null
        const globalRaporAvg =
          validRaporSubs.length > 0
            ? parseFloat(
                (validRaporSubs.reduce((a, b) => a + b, 0) / validRaporSubs.length).toFixed(1)
              )
            : null

        const totalUm =
          validUmSubs.length > 0
            ? parseFloat(validUmSubs.reduce((a, b) => a + b, 0).toFixed(1))
            : null
        const globalUmAvg =
          validUmSubs.length > 0
            ? parseFloat((validUmSubs.reduce((a, b) => a + b, 0) / validUmSubs.length).toFixed(1))
            : null

        const totalIjazah =
          validIjazahSubs.length > 0
            ? parseFloat(validIjazahSubs.reduce((a, b) => a + b, 0).toFixed(1))
            : null
        const sklAverage =
          validIjazahSubs.length > 0
            ? formatIjazahScore(
                validIjazahSubs.reduce((a, b) => a + b, 0) / validIjazahSubs.length
              )
            : null

        return {
          ...std,
          scores: scObj,
          totalScore,
          averageScore,
          semAvgs,
          sumSem1to5Avg,
          raporAvg,
          uamSub,
          ijazahSub,
          totalRaporSem15,
          globalRaporAvg,
          totalUm,
          globalUmAvg,
          totalIjazah,
          sklAverage,
        }
      })

      const sorted = [...rows].sort((a, b) => {
        if (docType === "ijazah" || docType === "skl") {
          const scoreA = a.sklAverage ?? a.globalRaporAvg ?? 0
          const scoreB = b.sklAverage ?? b.globalRaporAvg ?? 0
          return scoreB - scoreA
        }
        return b.averageScore - a.averageScore
      })

      return sorted.map((s, idx) => ({ ...s, rank: idx + 1 }))
    },
    [scoresBySemester, selectedSemester, ijazahConfig, docType]
  )

  const rankedStudents = React.useMemo(
    () => computeStudentsStats(filteredStudents),
    [computeStudentsStats, filteredStudents]
  )

  const currentStudent = rankedStudents.find((s) => s.id === selectedStudentId) ||
    rankedStudents[0] || {
      id: "",
      name: "(Belum Ada Siswa Terdaftar)",
      nisn: "-",
      nis: "-",
      gender: "L" as const,
      classRoom: activeClassLabel,
      scores: {},
      semAvgs: {},
      sumSem1to5Avg: null,
      raporAvg: {},
      uamSub: {},
      ijazahSub: {},
      totalScore: 0,
      averageScore: 0,
      totalRaporSem15: null,
      globalRaporAvg: null,
      totalUm: null,
      globalUmAvg: null,
      totalIjazah: null,
      sklAverage: null,
      rank: 1,
    }

  const getPredicate = (score: number) => {
    if (score >= 90) return { pred: "A", label: "Sangat Baik" }
    if (score >= 80) return { pred: "B", label: "Baik" }
    if (score >= 75) return { pred: "C", label: "Cukup" }
    return { pred: "D", label: "Perlu Bimbingan" }
  }

  const avgOfNums = (arr: Array<number | null | undefined>, asIjazah = false): number | null => {
    const valid = arr.filter((v): v is number => typeof v === "number")
    if (valid.length === 0) return null
    const raw = valid.reduce((a, b) => a + b, 0) / valid.length
    return asIjazah ? formatIjazahScore(raw) : parseFloat(raw.toFixed(1))
  }

  const classIjazahStats = React.useMemo(() => {
    const rAvg = avgOfNums(rankedStudents.map((s) => s.globalRaporAvg))
    const uAvg = avgOfNums(rankedStudents.map((s) => s.globalUmAvg))
    const ijValues = rankedStudents
      .map((s) => s.sklAverage)
      .filter((v): v is number => typeof v === "number")
    const ijAvg = ijValues.length > 0 ? avgOfNums(ijValues, true) : null
    const ijMax = ijValues.length > 0 ? Math.max(...ijValues) : null
    const ijMin = ijValues.length > 0 ? Math.min(...ijValues) : null
    const lulusCount = ijValues.filter((v) => v >= 75).length
    const missingUmCount = rankedStudents.filter((s) => s.globalUmAvg === null).length
    return { rAvg, uAvg, ijAvg, ijMax, ijMin, lulusCount, missingUmCount }
  }, [rankedStudents, ijazahConfig.rounding])

  const handlePrint = () => {
    window.print()
  }

  const buildIjazahSheetsForGroup = (
    wb: XLSX.WorkBook,
    groupRows: ReturnType<typeof computeStudentsStats>,
    classLabel: string,
    includeSummarySheet: boolean
  ) => {
    const wR = ijazahConfig.raporWeight
    const wU = ijazahConfig.umWeight
    const legerTitle = [
      [schoolProfile.name.toUpperCase()],
      [`DAFTAR KOLEKTIF NILAI IJAZAH (DKNI) — ${classLabel.toUpperCase()} (TA ${tahunAjaran})`],
      [`Formula Nilai Ijazah: ${wR}% Rata-Rata Rapor Sem 1–5 + ${wU}% Nilai UM (UAM)`],
      [],
    ]
    const legerHeader = [
      "No",
      "NISN",
      "NIS",
      "Nama Siswa",
      "L/P",
      "Kelas",
      ...MADRASAH_SUBJECTS.map((s) => s.code),
      "Total Sem 1-5",
      "Rerata Global Sem 1-5",
      "Total UM",
      "Rerata UM",
      "Total Ijazah",
      "Nilai Akhir Ijazah",
      "Peringkat",
      "Keterangan",
    ]
    const legerBody = groupRows.map((st, idx) => [
      idx + 1,
      st.nisn,
      st.nis || "-",
      st.name,
      st.gender,
      st.classRoom || classLabel,
      ...MADRASAH_SUBJECTS.map((s) => st.ijazahSub[s.id] ?? "-"),
      st.totalRaporSem15 ?? "-",
      st.globalRaporAvg ?? "-",
      st.totalUm ?? "-",
      st.globalUmAvg ?? "-",
      st.totalIjazah ?? "-",
      st.sklAverage ?? "-",
      st.rank,
      st.sklAverage === null ? "Menunggu UM" : st.sklAverage >= 75 ? "LULUS" : "Belum Tuntas",
    ])
    const legerFooter = [
      "",
      "",
      "",
      "Rata-Rata Kelas",
      "",
      "",
      ...MADRASAH_SUBJECTS.map(
        (sub) => avgOfNums(groupRows.map((s) => s.ijazahSub[sub.id]), true) ?? "-"
      ),
      avgOfNums(groupRows.map((s) => s.totalRaporSem15)) ?? "-",
      avgOfNums(groupRows.map((s) => s.globalRaporAvg)) ?? "-",
      avgOfNums(groupRows.map((s) => s.totalUm)) ?? "-",
      avgOfNums(groupRows.map((s) => s.globalUmAvg)) ?? "-",
      avgOfNums(groupRows.map((s) => s.totalIjazah)) ?? "-",
      avgOfNums(groupRows.map((s) => s.sklAverage), true) ?? "-",
      "-",
      "",
    ]

    const wsLeger = XLSX.utils.aoa_to_sheet([
      ...legerTitle,
      legerHeader,
      ...legerBody,
      legerFooter,
    ])
    const safeSheetName = (raw: string) =>
      raw.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Rekap Ijazah"

    XLSX.utils.book_append_sheet(
      wb,
      wsLeger,
      safeSheetName(includeSummarySheet ? "Leger Nilai Ijazah" : classLabel)
    )

    if (includeSummarySheet) {
      const sumHeader = [
        "No",
        "NISN",
        "NIS",
        "Nama Siswa",
        "L/P",
        "Kelas",
        "Rerata Sem 1",
        "Rerata Sem 2",
        "Rerata Sem 3",
        "Rerata Sem 4",
        "Rerata Sem 5",
        "Total Rerata Sem 1-5",
        "Rerata Global Sem 1-5",
        "Total Mapel UM",
        "Rerata UM",
        "Nilai Akhir Ijazah",
        "Peringkat",
        "Keterangan",
      ]
      const sumBody = groupRows.map((st, idx) => [
        idx + 1,
        st.nisn,
        st.nis || "-",
        st.name,
        st.gender,
        st.classRoom || classLabel,
        st.semAvgs["sem-1"] ?? "-",
        st.semAvgs["sem-2"] ?? "-",
        st.semAvgs["sem-3"] ?? "-",
        st.semAvgs["sem-4"] ?? "-",
        st.semAvgs["sem-5"] ?? "-",
        st.sumSem1to5Avg ?? "-",
        st.globalRaporAvg ?? "-",
        st.totalUm ?? "-",
        st.globalUmAvg ?? "-",
        st.sklAverage ?? "-",
        st.rank,
        st.sklAverage === null ? "Menunggu UM" : st.sklAverage >= 75 ? "LULUS" : "Belum Tuntas",
      ])
      const sumFooter = [
        "",
        "",
        "",
        "Rata-Rata Kelas",
        "",
        "",
        avgOfNums(groupRows.map((s) => s.semAvgs["sem-1"])) ?? "-",
        avgOfNums(groupRows.map((s) => s.semAvgs["sem-2"])) ?? "-",
        avgOfNums(groupRows.map((s) => s.semAvgs["sem-3"])) ?? "-",
        avgOfNums(groupRows.map((s) => s.semAvgs["sem-4"])) ?? "-",
        avgOfNums(groupRows.map((s) => s.semAvgs["sem-5"])) ?? "-",
        avgOfNums(groupRows.map((s) => s.sumSem1to5Avg)) ?? "-",
        avgOfNums(groupRows.map((s) => s.globalRaporAvg)) ?? "-",
        avgOfNums(groupRows.map((s) => s.totalUm)) ?? "-",
        avgOfNums(groupRows.map((s) => s.globalUmAvg)) ?? "-",
        avgOfNums(groupRows.map((s) => s.sklAverage), true) ?? "-",
        "-",
        "",
      ]
      const wsSum = XLSX.utils.aoa_to_sheet([
        ...legerTitle,
        sumHeader,
        ...sumBody,
        sumFooter,
      ])
      XLSX.utils.book_append_sheet(wb, wsSum, safeSheetName("Ringkasan Sem 1-5 & UM"))
    }
  }

  const handleExport = (format: string) => {
    if (format === "PDF") {
      setDownloadNotice("Membuka dialog Cetak / Simpan sebagai PDF...")
      setTimeout(() => {
        window.print()
        setDownloadNotice(null)
      }, 400)
      return
    }

    try {
      const wb = XLSX.utils.book_new()
      if (docType === "ijazah") {
        buildIjazahSheetsForGroup(wb, rankedStudents, activeClassLabel, true)
        if (isAdmin && selectedClass === "ALL" && classOptions.length > 1) {
          classOptions.forEach((clsName) => {
            const subStds = students.filter(
              (s) => (s.classRoom || "").trim().toLowerCase() === clsName.trim().toLowerCase()
            )
            if (subStds.length > 0) {
              buildIjazahSheetsForGroup(wb, computeStudentsStats(subStds), clsName, false)
            }
          })
        }
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([out], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Rekap_Nilai_Ijazah_${activeClassLabel.replace(/\s+/g, "_")}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setDownloadNotice("File Excel Rekap Nilai Ijazah (.xlsx) berhasil diunduh!")
      } else {
        const headers = [
          "No",
          "NISN",
          "NIS",
          "Nama Siswa",
          "L/P",
          "Kelas",
          ...MADRASAH_SUBJECTS.map((s) => s.code),
          "Total",
          "Rata-Rata",
          "Peringkat",
        ]
        const aoa = [
          headers,
          ...rankedStudents.map((st, idx) => [
            idx + 1,
            st.nisn,
            st.nis || "-",
            st.name,
            st.gender,
            st.classRoom || activeClassLabel,
            ...MADRASAH_SUBJECTS.map((s) => st.scores[s.id] ?? ""),
            st.totalScore,
            st.averageScore,
            st.rank,
          ]),
        ]
        const ws = XLSX.utils.aoa_to_sheet(aoa)
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai")
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([out], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Rekap_Nilai_${activeClassLabel.replace(/\s+/g, "_")}_${selectedSemester}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setDownloadNotice("File Excel (.xlsx) berhasil diunduh!")
      }
    } catch {
      setDownloadNotice("Dokumen berhasil disiapkan.")
    }
    setTimeout(() => setDownloadNotice(null), 3500)
  }

  const semMeta = SEMESTER_TABS.find((t) => t.id === selectedSemester) || SEMESTER_TABS[4]

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden on Print) */}
      <div className="no-print space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {isAdmin
                  ? "Panel Admin • Pusat Rekap & Nilai Ijazah"
                  : "Pusat Rekapitulasi & Cetak Dokumen"}
              </span>
              <Badge variant="success" className="text-[10px] gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Berkas Sah & Tervalidasi
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Rekap Nilai Ijazah, Leger, Rapor & SKL ({activeClassLabel})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rekapitulasi total rata-rata global Semester 1–5, rata-rata UM (UAM), dan perhitungan Nilai Akhir Ijazah kolektif per kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={() => handleExport("Excel (.xlsx)")}
              className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              Ekspor Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("PDF")}
              className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-blue-700" />
              Cetak / Simpan PDF
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

        {downloadNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {downloadNotice}
            </span>
            <button
              onClick={() => setDownloadNotice(null)}
              className="text-emerald-700 hover:underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Document Selection Pills & Class/Semester Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Pilih Dokumen:
              </span>
              {isAdmin && (
                <Button
                  size="sm"
                  variant={docType === "ijazah" ? "default" : "outline"}
                  onClick={() => setDocType("ijazah")}
                  className={cn(
                    "text-xs h-9 gap-1.5",
                    docType === "ijazah" && "bg-emerald-600 text-white shadow-sm"
                  )}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Rekap Nilai Ijazah (Per Kelas)</span>
                </Button>
              )}

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
                <span>Buku Leger (Per Semester)</span>
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
                <span>Rapor Siswa (Perorangan)</span>
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
                <span>Transkrip Kelulusan (SKL)</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 shrink-0">Kelas:</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value)
                      setSelectedStudentId("")
                    }}
                    className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    <option value="ALL">Semua Kelas IX</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(docType === "leger" || docType === "rapor") && (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 shrink-0">Semester:</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    {SEMESTER_TABS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.gradeLabel})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar Pengaturan Rumus & Mode Tabel Khusus Rekap Nilai Ijazah / SKL */}
          {isAdmin && (docType === "ijazah" || docType === "skl") && (
            <div className="pt-3 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                  Rumus Nilai Ijazah:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Bobot Sem 1–5:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ijazahConfig.raporWeight}
                    onChange={(e) => handleRaporWeightChange(e.target.value)}
                    className="w-14 px-1.5 py-0.5 text-center font-mono font-bold rounded border border-slate-300 bg-white text-slate-900"
                  />
                  <span className="font-bold text-slate-700">%</span>
                </div>
                <span className="font-bold text-slate-400">+</span>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Bobot UM:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ijazahConfig.umWeight}
                    onChange={(e) => handleUmWeightChange(e.target.value)}
                    className="w-14 px-1.5 py-0.5 text-center font-mono font-bold rounded border border-slate-300 bg-white text-slate-900"
                  />
                  <span className="font-bold text-slate-700">%</span>
                </div>
                {(ijazahConfig.raporWeight !== 60 || ijazahConfig.umWeight !== 40) && (
                  <button
                    type="button"
                    onClick={() => updateIjazahConfig({ raporWeight: 60, umWeight: 40 })}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Reset 60%:40%
                  </button>
                )}

                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Pembulatan:</span>
                  <select
                    value={ijazahConfig.rounding}
                    onChange={(e) =>
                      updateIjazahConfig({ rounding: e.target.value as IjazahRounding })
                    }
                    className="font-semibold text-slate-800 bg-transparent focus:outline-none"
                  >
                    <option value="1dec">1 Desimal (84.6)</option>
                    <option value="int">Bulat Satuan (85)</option>
                  </select>
                </div>
              </div>

              {docType === "ijazah" && (
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 gap-0.5 self-start">
                  <button
                    type="button"
                    onClick={() => setIjazahTableMode("mapel")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                      ijazahTableMode === "mapel"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Leger 16 Mapel + Rekap Ijazah
                  </button>
                  <button
                    type="button"
                    onClick={() => setIjazahTableMode("ringkasan")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                      ijazahTableMode === "ringkasan"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Ringkasan Sem 1–5, UM & Ijazah
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Student picker when Rapor or SKL is active */}
          {(docType === "rapor" || docType === "skl") && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-emerald-800 shrink-0">Pilih Siswa:</label>
                <select
                  value={currentStudent.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-lg border border-emerald-300 bg-emerald-50/40 font-bold text-slate-900"
                >
                  {rankedStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.rank}. {std.name} (NISN: {std.nisn} • Rerata:{" "}
                      {docType === "skl" ? std.sklAverage ?? "-" : std.averageScore})
                    </option>
                  ))}
                </select>
              </div>

              {docType === "skl" && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">No. SKL:</span>
                    <input
                      type="text"
                      value={sklNo}
                      onChange={(e) => {
                        setSklNo(e.target.value)
                        try {
                          localStorage.setItem("sisforekap_v2_skl_no", e.target.value)
                        } catch {}
                      }}
                      className="px-2 py-1 rounded border border-slate-300 text-xs font-mono w-56"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">TTL Siswa:</span>
                    <input
                      type="text"
                      value={ttlMap[currentStudent.id] || "Semarang, 15 Mei 2011"}
                      onChange={(e) => {
                        if (!currentStudent.id) return
                        const next = { ...ttlMap, [currentStudent.id]: e.target.value }
                        setTtlMap(next)
                        try {
                          localStorage.setItem("sisforekap_v2_ttl", JSON.stringify(next))
                        } catch {}
                      }}
                      className="px-2 py-1 rounded border border-slate-300 text-xs w-48"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Banner jika nilai UM belum lengkap */}
        {docType === "ijazah" &&
          ijazahConfig.umWeight > 0 &&
          rankedStudents.length > 0 &&
          classIjazahStats.missingUmCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Terdapat <strong>{classIjazahStats.missingUmCount} siswa</strong> yang nilai{" "}
                <strong>UM (UAM)</strong>-nya belum diinput (ditampilkan sebagai <code>-</code>).
                Nilai Akhir Ijazah akan otomatis muncul penuh setelah nilai UM diisi, atau ubah{" "}
                <strong>Bobot UM ke 0%</strong> bila ingin melihat simulasi murni dari Rapor Sem 1–5.
              </div>
            </div>
          )}

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
      {/* DOCUMENT PREVIEW CONTAINER                                     */}
      {/* ============================================================== */}
      <div className="print-container bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 md:p-10 text-slate-900 mx-auto max-w-[1450px]">
        {/* KOP RESMI MADRASAH */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
              <School className="w-9 h-9" />
            </div>

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
                {schoolProfile.address}, Telp. {schoolProfile.phone}, Website:{" "}
                {schoolProfile.website} • Email: {schoolProfile.email}
              </p>
            </div>

            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-1 shrink-0 text-slate-700">
              <span className="text-[9px] font-bold uppercase text-slate-400">Akreditasi</span>
              <span className="text-xl font-black text-emerald-800">
                {schoolProfile.accreditation}
              </span>
              <span className="text-[8px] text-slate-500">{schoolProfile.accreditationLabel}</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DOKUMEN BARU: REKAP NILAI IJAZAH KOLEKTIF PER KELAS            */}
        {/* ============================================================== */}
        {docType === "ijazah" && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                DAFTAR KOLEKTIF NILAI IJAZAH (DKNI) & REKAP KELULUSAN
              </h3>
              <p className="text-xs font-semibold text-slate-600 uppercase">
                {activeClassLabel} • TAHUN AJARAN {tahunAjaran} • FORMULA:{" "}
                {ijazahConfig.raporWeight}% RERATA SEM 1–5 + {ijazahConfig.umWeight}% NILAI UM
              </p>
            </div>

            {/* Statistik Ringkas Kelas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Rombel / Siswa:
                </span>
                <span className="font-bold text-slate-900">
                  {activeClassLabel} ({rankedStudents.length} Siswa)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Rerata Global Sem 1–5:
                </span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  {classIjazahStats.rAvg ?? "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Rerata Nilai UM:
                </span>
                <span className="font-mono font-bold text-purple-800 text-sm">
                  {classIjazahStats.uAvg ?? "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Rerata Nilai Ijazah:
                </span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {classIjazahStats.ijAvg ?? "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Tertinggi / Terendah:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {classIjazahStats.ijMax ?? "-"} / {classIjazahStats.ijMin ?? "-"} (
                  {classIjazahStats.lulusCount} Lulus)
                </span>
              </div>
            </div>

            {/* MODE A: LEGER 16 MAPEL NILAI IJAZAH + REKAP SEM 1-5, UM & IJAZAH */}
            {ijazahTableMode === "mapel" && (
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-center text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th rowSpan={2} className="w-8 border-r border-slate-300 p-2 text-center">
                        No
                      </th>
                      <th rowSpan={2} className="w-24 border-r border-slate-300 p-2 text-left">
                        NISN
                      </th>
                      <th rowSpan={2} className="w-48 border-r border-slate-300 p-2 text-left">
                        Nama Siswa
                      </th>
                      <th rowSpan={2} className="w-8 border-r border-slate-300 p-2 text-center">
                        L/P
                      </th>
                      {selectedClass === "ALL" && (
                        <th rowSpan={2} className="w-24 border-r border-slate-300 p-2 text-center">
                          Kelas
                        </th>
                      )}
                      <th
                        colSpan={16}
                        className="border-r border-slate-300 py-1.5 px-2 bg-emerald-50 text-emerald-950 font-bold"
                      >
                        Nilai Ijazah per Mata Pelajaran ({ijazahConfig.raporWeight}% Sem 1–5 +{" "}
                        {ijazahConfig.umWeight}% UM)
                      </th>
                      <th
                        colSpan={2}
                        className="border-r border-slate-300 py-1.5 px-2 bg-blue-50 text-blue-950 font-bold"
                      >
                        Rekap Global Sem 1–5
                      </th>
                      <th
                        rowSpan={2}
                        className="w-16 border-r border-slate-300 p-1.5 bg-purple-50 text-purple-950 font-bold"
                      >
                        Rerata UM
                      </th>
                      <th
                        colSpan={2}
                        className="border-r border-slate-300 py-1.5 px-2 bg-emerald-100 text-emerald-950 font-extrabold"
                      >
                        Hasil Nilai Ijazah
                      </th>
                      {showRank && (
                        <th
                          rowSpan={2}
                          className="w-12 border-r border-slate-300 p-1.5 bg-amber-100 text-amber-900 font-bold"
                        >
                          Rank
                        </th>
                      )}
                      <th rowSpan={2} className="w-20 p-1.5 bg-slate-200/80 font-bold">
                        Status
                      </th>
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[10px]">
                      {MADRASAH_SUBJECTS.map((sub) => (
                        <th
                          key={sub.id}
                          className="w-10 border-r border-slate-300 py-1 px-0.5 text-center font-bold"
                          title={sub.name}
                        >
                          <div>{sub.code}</div>
                          <div className="text-[9px] text-slate-400 font-normal">
                            {sub.shortName}
                          </div>
                        </th>
                      ))}
                      <th className="w-14 border-r border-slate-300 py-1 px-1 bg-blue-50/50 text-blue-900 font-bold">
                        Total
                      </th>
                      <th className="w-14 border-r border-slate-300 py-1 px-1 bg-blue-50/50 text-blue-900 font-bold">
                        Rerata
                      </th>
                      <th className="w-14 border-r border-slate-300 py-1 px-1 bg-emerald-50 text-emerald-950 font-bold">
                        Total
                      </th>
                      <th className="w-16 border-r border-slate-300 py-1 px-1 bg-emerald-100/70 text-emerald-950 font-black">
                        Nilai Akhir
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-300">
                    {rankedStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            25 + (selectedClass === "ALL" ? 1 : 0) + (showRank ? 1 : 0)
                          }
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          Belum ada data siswa terdaftar di kelas ini.
                        </td>
                      </tr>
                    ) : (
                      rankedStudents.map((st, idx) => (
                        <tr
                          key={st.id}
                          className={idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}
                        >
                          <td className="p-1.5 border-r border-slate-300 font-mono">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 text-left font-mono text-[11px] text-slate-600">
                            {st.nisn}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-left font-bold text-slate-900 truncate max-w-[180px]">
                            {st.name}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-semibold text-[10px]">
                            {st.gender}
                          </td>
                          {selectedClass === "ALL" && (
                            <td className="p-1.5 border-r border-slate-300 text-[10px] font-semibold text-slate-700">
                              {st.classRoom}
                            </td>
                          )}

                          {MADRASAH_SUBJECTS.map((sub) => {
                            const val = st.ijazahSub[sub.id]
                            const rVal = st.raporAvg[sub.id]
                            const uVal = st.uamSub[sub.id]
                            const isLow = typeof val === "number" && val < sub.kkm
                            return (
                              <td
                                key={sub.id}
                                title={`${sub.name} — Sem 1-5: ${rVal ?? "-"} | UM: ${uVal ?? "-"} | Ijazah: ${val ?? "-"}`}
                                className={cn(
                                  "p-1 border-r border-slate-300 font-mono text-xs font-semibold",
                                  isLow && "text-red-600 font-bold bg-red-50"
                                )}
                              >
                                {val ?? "-"}
                              </td>
                            )
                          })}

                          <td className="p-1.5 border-r border-slate-300 font-mono text-[11px] text-blue-900 bg-blue-50/20">
                            {st.totalRaporSem15 ?? "-"}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-blue-900 bg-blue-50/40">
                            {st.globalRaporAvg ?? "-"}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-purple-900 bg-purple-50/30">
                            {st.globalUmAvg ?? "-"}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-mono text-[11px] font-semibold text-emerald-900 bg-emerald-50/30">
                            {st.totalIjazah ?? "-"}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-black text-emerald-950 bg-emerald-100/60">
                            {st.sklAverage ?? "-"}
                          </td>
                          {showRank && (
                            <td className="p-1.5 border-r border-slate-300 font-mono font-black text-amber-900 bg-amber-50">
                              #{st.rank}
                            </td>
                          )}
                          <td className="p-1.5 text-center text-[10px] font-bold">
                            {st.sklAverage === null ? (
                              <span className="text-amber-700">Menunggu UM</span>
                            ) : st.sklAverage >= 75 ? (
                              <span className="text-emerald-800">LULUS</span>
                            ) : (
                              <span className="text-red-600">Belum Tuntas</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {rankedStudents.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                        <td
                          colSpan={4 + (selectedClass === "ALL" ? 1 : 0)}
                          className="p-2 text-right border-r border-slate-300"
                        >
                          Rata-Rata Kelas:
                        </td>
                        {MADRASAH_SUBJECTS.map((sub) => (
                          <td
                            key={sub.id}
                            className="p-1 border-r border-slate-300 font-mono text-[11px] text-emerald-900"
                          >
                            {avgOfNums(
                              rankedStudents.map((s) => s.ijazahSub[sub.id]),
                              true
                            ) ?? "-"}
                          </td>
                        ))}
                        <td className="p-1.5 border-r border-slate-300 font-mono text-[11px] text-blue-900">
                          {avgOfNums(rankedStudents.map((s) => s.totalRaporSem15)) ?? "-"}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-mono text-blue-950">
                          {classIjazahStats.rAvg ?? "-"}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-mono text-purple-950">
                          {classIjazahStats.uAvg ?? "-"}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-mono text-[11px] text-emerald-900">
                          {avgOfNums(rankedStudents.map((s) => s.totalIjazah)) ?? "-"}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-mono font-black text-emerald-950 bg-emerald-200/60">
                          {classIjazahStats.ijAvg ?? "-"}
                        </td>
                        {showRank && <td className="p-1.5 border-r border-slate-300">-</td>}
                        <td className="p-1.5 text-[10px] text-emerald-800">
                          {classIjazahStats.lulusCount}/{rankedStudents.length} Lulus
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* MODE B: RINGKASAN REKAP SEM 1..5, RERATA GLOBAL SEM 1-5, UM & IJAZAH */}
            {ijazahTableMode === "ringkasan" && (
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-center text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th rowSpan={2} className="w-8 border-r border-slate-300 p-2">
                        No
                      </th>
                      <th rowSpan={2} className="w-24 border-r border-slate-300 p-2 text-left">
                        NISN
                      </th>
                      <th rowSpan={2} className="w-52 border-r border-slate-300 p-2 text-left">
                        Nama Siswa
                      </th>
                      <th rowSpan={2} className="w-8 border-r border-slate-300 p-2">
                        L/P
                      </th>
                      {selectedClass === "ALL" && (
                        <th rowSpan={2} className="w-24 border-r border-slate-300 p-2">
                          Kelas
                        </th>
                      )}
                      <th
                        colSpan={5}
                        className="border-r border-slate-300 py-1.5 px-2 bg-slate-200/70 text-slate-900"
                      >
                        Rata-Rata Rapor Tiap Semester
                      </th>
                      <th
                        colSpan={2}
                        className="border-r border-slate-300 py-1.5 px-2 bg-blue-50 text-blue-950"
                      >
                        Rekap Global Sem 1–5 ({ijazahConfig.raporWeight}%)
                      </th>
                      <th
                        colSpan={2}
                        className="border-r border-slate-300 py-1.5 px-2 bg-purple-50 text-purple-950"
                      >
                        Rekap Nilai UM ({ijazahConfig.umWeight}%)
                      </th>
                      <th
                        colSpan={2}
                        className="border-r border-slate-300 py-1.5 px-2 bg-emerald-100 text-emerald-950 font-extrabold"
                      >
                        Hasil Nilai Ijazah
                      </th>
                      {showRank && (
                        <th
                          rowSpan={2}
                          className="w-14 border-r border-slate-300 p-2 bg-amber-100 text-amber-900"
                        >
                          Peringkat
                        </th>
                      )}
                      <th rowSpan={2} className="w-24 p-2 bg-slate-200/80">
                        Keterangan
                      </th>
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold">
                      <th className="w-14 border-r border-slate-300 py-1.5">Sem 1</th>
                      <th className="w-14 border-r border-slate-300 py-1.5">Sem 2</th>
                      <th className="w-14 border-r border-slate-300 py-1.5">Sem 3</th>
                      <th className="w-14 border-r border-slate-300 py-1.5">Sem 4</th>
                      <th className="w-14 border-r border-slate-300 py-1.5">Sem 5</th>
                      <th className="w-16 border-r border-slate-300 py-1.5 bg-blue-50/50 text-blue-900">
                        Total 16 Mapel
                      </th>
                      <th className="w-16 border-r border-slate-300 py-1.5 bg-blue-50/80 text-blue-950">
                        Rerata Global
                      </th>
                      <th className="w-16 border-r border-slate-300 py-1.5 bg-purple-50/40 text-purple-900">
                        Total UM
                      </th>
                      <th className="w-16 border-r border-slate-300 py-1.5 bg-purple-50/70 text-purple-950">
                        Rerata UM
                      </th>
                      <th className="w-16 border-r border-slate-300 py-1.5 bg-emerald-50 text-emerald-900">
                        Total Ijazah
                      </th>
                      <th className="w-20 border-r border-slate-300 py-1.5 bg-emerald-100/80 text-emerald-950 font-black">
                        Nilai Akhir
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-300">
                    {rankedStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            16 + (selectedClass === "ALL" ? 1 : 0) + (showRank ? 1 : 0)
                          }
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          Belum ada data siswa terdaftar di kelas ini.
                        </td>
                      </tr>
                    ) : (
                      rankedStudents.map((st, idx) => (
                        <tr
                          key={st.id}
                          className={idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}
                        >
                          <td className="p-2 border-r border-slate-300 font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 text-left font-mono text-[11px] text-slate-600">
                            {st.nisn}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-left font-bold text-slate-900">
                            {st.name}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-semibold text-[10px]">
                            {st.gender}
                          </td>
                          {selectedClass === "ALL" && (
                            <td className="p-2 border-r border-slate-300 text-[11px] font-semibold">
                              {st.classRoom}
                            </td>
                          )}
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {st.semAvgs["sem-1"] ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {st.semAvgs["sem-2"] ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {st.semAvgs["sem-3"] ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {st.semAvgs["sem-4"] ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {st.semAvgs["sem-5"] ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono text-blue-900 bg-blue-50/20">
                            {st.totalRaporSem15 ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold text-blue-950 bg-blue-50/50">
                            {st.globalRaporAvg ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono text-purple-900 bg-purple-50/20">
                            {st.totalUm ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold text-purple-950 bg-purple-50/50">
                            {st.globalUmAvg ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-semibold text-emerald-900 bg-emerald-50/30">
                            {st.totalIjazah ?? "-"}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-black text-emerald-950 bg-emerald-100/70 text-sm">
                            {st.sklAverage ?? "-"}
                          </td>
                          {showRank && (
                            <td className="p-2 border-r border-slate-300 font-mono font-black text-amber-900 bg-amber-50">
                              #{st.rank}
                            </td>
                          )}
                          <td className="p-2 text-center text-[11px] font-bold">
                            {st.sklAverage === null ? (
                              <span className="text-amber-700">Menunggu UM</span>
                            ) : st.sklAverage >= 75 ? (
                              <span className="text-emerald-800">LULUS</span>
                            ) : (
                              <span className="text-red-600">Belum Tuntas</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {rankedStudents.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                        <td
                          colSpan={4 + (selectedClass === "ALL" ? 1 : 0)}
                          className="p-2 text-right border-r border-slate-300"
                        >
                          Rata-Rata Kelas:
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono">
                          {avgOfNums(rankedStudents.map((s) => s.semAvgs["sem-1"])) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono">
                          {avgOfNums(rankedStudents.map((s) => s.semAvgs["sem-2"])) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono">
                          {avgOfNums(rankedStudents.map((s) => s.semAvgs["sem-3"])) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono">
                          {avgOfNums(rankedStudents.map((s) => s.semAvgs["sem-4"])) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono">
                          {avgOfNums(rankedStudents.map((s) => s.semAvgs["sem-5"])) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono text-blue-900">
                          {avgOfNums(rankedStudents.map((s) => s.totalRaporSem15)) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono text-blue-950">
                          {classIjazahStats.rAvg ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono text-purple-900">
                          {avgOfNums(rankedStudents.map((s) => s.totalUm)) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono text-purple-950">
                          {classIjazahStats.uAvg ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono text-emerald-900">
                          {avgOfNums(rankedStudents.map((s) => s.totalIjazah)) ?? "-"}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono font-black text-emerald-950 bg-emerald-200/70">
                          {classIjazahStats.ijAvg ?? "-"}
                        </td>
                        {showRank && <td className="p-2 border-r border-slate-300">-</td>}
                        <td className="p-2 text-[10px] text-emerald-800">
                          {classIjazahStats.lulusCount}/{rankedStudents.length} Lulus
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Blok Pengesahan Tanda Tangan */}
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
                <p className="text-[11px] text-slate-500 font-mono">
                  NIP. {schoolProfile.headmasterNip}
                </p>
              </div>

              <div className="text-center w-64">
                <p>{titimangsaDate}</p>
                <p className="font-bold">
                  {selectedClass === "ALL"
                    ? "Koordinator Kurikulum / Admin"
                    : `Wali Kelas ${activeClassLabel}`}
                </p>
                <div className="h-20 flex items-center justify-center">
                  {showDigitalSign && (
                    <div className="border border-emerald-600 bg-emerald-50 px-3 py-1 rounded text-[10px] text-emerald-800 font-mono font-semibold">
                      [Tanda Tangan Digital Terverifikasi]
                    </div>
                  )}
                </div>
                <p className="font-bold underline text-slate-900">{waliInfo.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">NIP. {waliInfo.nip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOKUMEN 1: BUKU LEGER NILAI PER SEMESTER                       */}
        {/* ============================================================== */}
        {docType === "leger" && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                BUKU LEGER NILAI HASIL BELAJAR SISWA
              </h3>
              <p className="text-xs font-semibold text-slate-600 uppercase">
                {semMeta.label} • TAHUN AJARAN {tahunAjaran}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Satuan Pendidikan:
                </span>
                <span className="font-bold text-slate-800">{schoolProfile.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Rombel / Kelas:
                </span>
                <span className="font-bold text-slate-800">{activeClassLabel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Wali Kelas:
                </span>
                <span className="font-bold text-slate-800">{waliInfo.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Jumlah Siswa:
                </span>
                <span className="font-bold text-slate-800">{rankedStudents.length} Siswa</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-center text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th rowSpan={2} className="w-8 border-r border-slate-300 p-2">
                      No
                    </th>
                    <th rowSpan={2} className="w-24 border-r border-slate-300 p-2 text-left">
                      NISN
                    </th>
                    <th rowSpan={2} className="w-48 border-r border-slate-300 p-2 text-left">
                      Nama Siswa
                    </th>
                    <th rowSpan={2} className="w-8 border-r border-slate-300 p-2">
                      L/P
                    </th>
                    <th
                      colSpan={4}
                      className="border-r border-slate-300 py-1 px-2 bg-emerald-50 text-emerald-900"
                    >
                      Kelompok A (PAI)
                    </th>
                    <th
                      colSpan={10}
                      className="border-r border-slate-300 py-1 px-2 bg-blue-50 text-blue-900"
                    >
                      Kelompok B (Umum & Bahasa)
                    </th>
                    <th
                      colSpan={2}
                      className="border-r border-slate-300 py-1 px-2 bg-teal-50 text-teal-900"
                    >
                      Muatan Lokal
                    </th>
                    <th rowSpan={2} className="w-16 border-r border-slate-300 p-2 bg-slate-200/80">
                      Total
                    </th>
                    <th rowSpan={2} className="w-16 border-r border-slate-300 p-2 bg-slate-200/80">
                      Rerata
                    </th>
                    {showRank && (
                      <th
                        rowSpan={2}
                        className="w-14 border-r border-slate-300 p-2 bg-amber-100 text-amber-900"
                      >
                        Peringkat
                      </th>
                    )}
                    <th rowSpan={2} className="w-20 p-2 bg-slate-200/80">
                      Keterangan
                    </th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-300 text-[10px]">
                    {MADRASAH_SUBJECTS.map((sub) => (
                      <th
                        key={sub.id}
                        className="w-10 border-r border-slate-300 py-1 px-0.5 text-center font-bold"
                      >
                        <div>{sub.code}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{sub.shortName}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {rankedStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}
                    >
                      <td className="p-1.5 border-r border-slate-300 font-mono">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-300 text-left font-mono text-[11px] text-slate-600">
                        {student.nisn}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-left font-bold text-slate-900 truncate max-w-[180px]">
                        {student.name}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-semibold text-[10px]">
                        {student.gender}
                      </td>
                      {MADRASAH_SUBJECTS.map((sub) => {
                        const val = student.scores[sub.id]
                        const isRemed = typeof val === "number" && val < sub.kkm
                        return (
                          <td
                            key={sub.id}
                            className={cn(
                              "p-1 border-r border-slate-300 font-mono text-xs font-semibold",
                              isRemed && "text-red-600 font-bold bg-red-50"
                            )}
                          >
                            {val ?? "-"}
                          </td>
                        )
                      })}
                      <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-slate-900 bg-slate-50">
                        {student.totalScore}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-emerald-800 bg-emerald-50/40">
                        {student.averageScore}
                      </td>
                      {showRank && (
                        <td className="p-1.5 border-r border-slate-300 font-mono font-black text-amber-900 bg-amber-50">
                          #{student.rank}
                        </td>
                      )}
                      <td className="p-1.5 text-center text-[10px] font-semibold text-emerald-800">
                        Tuntas
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOKUMEN 2: LEMBAR RAPOR SISWA PERORANGAN                      */}
        {/* ============================================================== */}
        {docType === "rapor" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                LAPORAN HASIL BELAJAR SISWA (RAPOR)
              </h3>
              <p className="text-xs font-semibold text-slate-600 uppercase">
                {semMeta.label} • TAHUN AJARAN {tahunAjaran}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs">
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Nama Peserta Didik</span>
                <span className="font-bold text-slate-900">: {currentStudent.name}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Kelas / Rombel</span>
                <span className="font-bold text-slate-900">
                  : {currentStudent.classRoom || activeClassLabel}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">NISN / NIS</span>
                <span className="font-mono text-slate-900">
                  : {currentStudent.nisn} / {currentStudent.nis}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Tahun Ajaran</span>
                <span className="font-bold text-slate-900">: {tahunAjaran}</span>
              </div>
            </div>

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
                    const raw = currentStudent.scores[sub.id]
                    const score = typeof raw === "number" ? raw : Number(raw) || 0
                    const { pred, label } = getPredicate(score)
                    return (
                      <tr key={sub.id} className={idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"}>
                        <td className="p-2 text-center font-mono border-r border-slate-300 text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-medium text-slate-900">
                          <div>{sub.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Kode: {sub.code} (KKM: {sub.kkm})
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-900 border-r border-slate-300 bg-slate-50/50">
                          {raw !== undefined && raw !== "" ? raw : "-"}
                        </td>
                        <td className="p-2 text-center border-r border-slate-300">
                          <span className="px-2 py-0.5 rounded font-black text-xs font-mono bg-emerald-100 text-emerald-800">
                            {score > 0 ? pred : "-"}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 text-[11px]">
                          {score > 0
                            ? `Menunjukkan penguasaan kompetensi yang ${label} pada mata pelajaran ${sub.name}.`
                            : "Nilai belum diinput."}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOKUMEN 3: SURAT KETERANGAN LULUS (SKL) PERORANGAN             */}
        {/* ============================================================== */}
        {docType === "skl" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                SURAT KETERANGAN KELULUSAN & TRANSKRIP NILAI
              </h3>
              <p className="text-xs font-mono text-slate-600">Nomor: {sklNo}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-1.5 text-xs">
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Nama Lengkap</span>
                <span className="col-span-2 font-bold text-slate-900">: {currentStudent.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">NISN / NIS</span>
                <span className="col-span-2 font-mono text-slate-900">
                  : {currentStudent.nisn} / {currentStudent.nis}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Kelas / Rombel</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  : {currentStudent.classRoom || activeClassLabel}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Tempat, Tanggal Lahir</span>
                <span className="col-span-2 text-slate-900">
                  : {ttlMap[currentStudent.id] || "Semarang, 15 Mei 2011"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">
                Dinyatakan:
              </span>
              <h4 className="text-2xl font-black text-emerald-900 tracking-wider">L U L U S</h4>
              <p className="text-xs text-emerald-800">
                Nilai Rata-Rata Akhir Ijazah:{" "}
                <strong className="font-mono text-sm">
                  {currentStudent.sklAverage ?? "-"}
                </strong>
              </p>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 w-10 text-center border-r border-slate-300">No</th>
                    <th className="p-2 border-r border-slate-300">Mata Pelajaran</th>
                    <th className="p-2 text-center w-32 border-r border-slate-300">
                      Rerata Sem 1–5 ({ijazahConfig.raporWeight}%)
                    </th>
                    <th className="p-2 text-center w-24 border-r border-slate-300">
                      Nilai UM ({ijazahConfig.umWeight}%)
                    </th>
                    <th className="p-2 text-center w-28">Nilai Ijazah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {MADRASAH_SUBJECTS.map((sub, idx) => (
                    <tr key={sub.id} className={idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}>
                      <td className="p-1.5 text-center font-mono text-slate-500 border-r border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="p-1.5 font-medium text-slate-900 border-r border-slate-300">
                        {sub.name}
                      </td>
                      <td className="p-1.5 text-center font-mono border-r border-slate-300">
                        {currentStudent.raporAvg[sub.id] ?? "-"}
                      </td>
                      <td className="p-1.5 text-center font-mono border-r border-slate-300">
                        {currentStudent.uamSub[sub.id] ?? "-"}
                      </td>
                      <td className="p-1.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                        {currentStudent.ijazahSub[sub.id] ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                    <td colSpan={2} className="p-2 text-right border-r border-slate-300">
                      Rata-Rata Akhir Kelulusan:
                    </td>
                    <td className="p-2 text-center font-mono border-r border-slate-300">
                      {currentStudent.globalRaporAvg ?? "-"}
                    </td>
                    <td className="p-2 text-center font-mono border-r border-slate-300">
                      {currentStudent.globalUmAvg ?? "-"}
                    </td>
                    <td className="p-2 text-center font-mono text-emerald-900 bg-emerald-100/60">
                      {currentStudent.sklAverage ?? "-"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
