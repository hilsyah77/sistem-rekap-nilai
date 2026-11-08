import React from "react"
import { Lock, Unlock } from "lucide-react"
import { MADRASAH_SUBJECTS } from "@/data/mockStudentScores"
import { StudentItem } from "@/components/admin/DataMasterPage"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SpreadsheetTableProps {
  isLocked: boolean
  semesterId: string
  semesterName: string
  students: StudentItem[]
  scoresForSemester: Record<string, Record<string, number | ''>>
  onScoreChange: (studentId: string, subjectId: string, value: number | '') => void
}

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({
  isLocked,
  students,
  scoresForSemester,
  onScoreChange,
}) => {
  const handleInputChange = (studentId: string, subjectId: string, valueStr: string) => {
    if (isLocked) return

    let numVal: number | '' = ''
    if (valueStr !== '') {
      const parsed = parseInt(valueStr, 10)
      if (!isNaN(parsed)) {
        numVal = Math.min(100, Math.max(0, parsed))
      }
    }
    onScoreChange(studentId, subjectId, numVal)
  }

  const calculateAverage = (scores: Record<string, number | ''> = {}) => {
    const validScores = Object.values(scores).filter((s): s is number => typeof s === 'number')
    if (validScores.length === 0) return 0
    const sum = validScores.reduce((acc, val) => acc + val, 0)
    return parseFloat((sum / validScores.length).toFixed(1))
  }

  const calculateSubjectAverage = (subjectId: string) => {
    const vals = students
      .map(s => scoresForSemester[s.id]?.[subjectId])
      .filter((s): s is number => typeof s === 'number')
    if (vals.length === 0) return 0
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
  }

  const allStudentAverages = students
    .map(s => calculateAverage(scoresForSemester[s.id]))
    .filter(v => v > 0)
  const classOverallAvg =
    allStudentAverages.length > 0
      ? parseFloat((allStudentAverages.reduce((a, b) => a + b, 0) / allStudentAverages.length).toFixed(1))
      : 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
              <span className="p-1 rounded bg-slate-200 text-slate-700">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span>Mode Lembar Kerja Terkunci (Read-Only)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
              <span className="p-1 rounded bg-emerald-100 text-emerald-800">
                <Unlock className="w-3.5 h-3.5" />
              </span>
              <span>Mode Input Aktif (Editable) • KKM Madrasah: 75</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>Menampilkan <strong>{students.length}</strong> siswa terdaftar</span>
          <span>•</span>
          <span><strong>{MADRASAH_SUBJECTS.length}</strong> Mata Pelajaran</span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="min-w-[1550px] w-full border-collapse text-xs select-none">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th rowSpan={2} className="w-12 min-w-[48px] px-2 py-2.5 text-center font-bold border-r border-slate-200 sticky left-0 bg-slate-100 z-20">
                No.
              </th>
              <th rowSpan={2} className="w-28 min-w-[110px] px-3 py-2.5 text-left font-bold border-r border-slate-200 sticky left-12 bg-slate-100 z-20">
                NISN / NIS
              </th>
              <th rowSpan={2} className="w-56 min-w-[210px] px-3 py-2.5 text-left font-bold border-r border-slate-200 sticky left-[158px] bg-slate-100 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Nama Siswa
              </th>
              <th rowSpan={2} className="w-10 min-w-[42px] px-1 py-2.5 text-center font-bold border-r border-slate-200">
                L/P
              </th>
              <th colSpan={4} className="px-3 py-1.5 text-center font-bold border-r border-slate-200 bg-emerald-50 text-emerald-900">
                Kelompok A (PAI Kemenag)
              </th>
              <th colSpan={10} className="px-3 py-1.5 text-center font-bold border-r border-slate-200 bg-blue-50 text-blue-900">
                Kelompok B (Mata Pelajaran Umum & Bahasa)
              </th>
              <th colSpan={2} className="px-3 py-1.5 text-center font-bold border-r border-slate-200 bg-teal-50 text-teal-900">
                Muatan Lokal & Ciri Khas
              </th>
              <th rowSpan={2} className="w-20 min-w-[76px] px-2 py-2.5 text-center font-bold border-r border-slate-200 bg-slate-200/80 text-slate-800">
                Rata-Rata
              </th>
              <th rowSpan={2} className="w-24 min-w-[85px] px-2 py-2.5 text-center font-bold bg-slate-200/80 text-slate-800">
                Status KKM
              </th>
            </tr>

            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px]">
              {MADRASAH_SUBJECTS.map((sub) => (
                <th
                  key={sub.id}
                  className="w-14 min-w-[56px] max-w-[56px] px-1 py-1.5 text-center font-semibold border-r border-slate-200 whitespace-nowrap"
                  title={`${sub.name} (KKM: ${sub.kkm})`}
                >
                  <div className="font-bold text-slate-900 text-xs tracking-tight">{sub.code}</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate max-w-[50px] mx-auto">
                    {sub.shortName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-medium">
            {students.length === 0 ? (
              <tr>
                <td colSpan={22} className="py-10 text-center text-slate-500 text-xs">
                  Belum ada data siswa di kelas ini. Silakan tambahkan siswa melalui tombol <strong>"Tambah Siswa"</strong> di atas atau melalui menu Data Master Admin.
                </td>
              </tr>
            ) : (
              students.map((student, idx) => {
                const studentScores = scoresForSemester[student.id] || {}
                const avg = calculateAverage(studentScores)
                const hasRemedial = Object.values(studentScores).some(
                  score => typeof score === 'number' && score < 75
                )

                return (
                  <tr 
                    key={student.id} 
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors focus-within:bg-emerald-50/50",
                      idx % 2 === 1 && "bg-slate-50/30"
                    )}
                  >
                    <td className="px-2 py-1.5 text-center text-slate-500 border-r border-slate-200 sticky left-0 bg-white z-10 font-normal">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-1.5 text-left text-slate-500 border-r border-slate-200 sticky left-12 bg-white z-10 font-mono text-[11px]">
                      <div>{student.nisn}</div>
                      <div className="text-[10px] text-slate-400">{student.nis}</div>
                    </td>
                    <td className="px-3 py-1.5 text-left border-r border-slate-200 sticky left-[158px] bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <span className="font-semibold text-slate-800 truncate block max-w-[190px]" title={student.name}>
                        {student.name}
                      </span>
                    </td>
                    <td className="px-1 py-1.5 text-center text-slate-600 border-r border-slate-200">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        student.gender === 'L' ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                      )}>
                        {student.gender}
                      </span>
                    </td>

                    {MADRASAH_SUBJECTS.map((sub) => {
                      const score = studentScores[sub.id] ?? ''
                      const isUnderKKM = typeof score === 'number' && score < sub.kkm

                      return (
                        <td 
                          key={sub.id} 
                          className={cn(
                            "w-14 min-w-[56px] max-w-[56px] p-1 text-center border-r border-slate-200 transition-colors",
                            isLocked && "bg-slate-100/90"
                          )}
                        >
                          <input
                            type="number"
                            disabled={isLocked}
                            value={score}
                            onChange={(e) => handleInputChange(student.id, sub.id, e.target.value)}
                            className={cn(
                              "w-full h-8 px-0 text-center text-xs font-mono font-bold rounded transition-all focus:outline-none select-all",
                              !isLocked && [
                                "border border-slate-200 bg-white hover:border-emerald-400 focus:border-emerald-600 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500/40 focus:text-emerald-950 shadow-2xs",
                                isUnderKKM ? "text-red-600 bg-red-50/70 border-red-200 focus:bg-red-50 focus:border-red-500 focus:ring-red-400/40" : "text-slate-800"
                              ],
                              isLocked && [
                                "bg-slate-100 text-slate-500 border-transparent cursor-not-allowed select-none",
                                isUnderKKM && "text-red-500"
                              ]
                            )}
                            min={0}
                            max={100}
                          />
                        </td>
                      )
                    })}

                    <td className="px-2 py-1.5 text-center font-bold text-slate-800 border-r border-slate-200 bg-slate-50/50">
                      <span className={cn(
                        "font-mono text-xs",
                        avg >= 85 ? "text-emerald-700" : avg >= 75 ? "text-slate-800" : avg > 0 ? "text-red-600" : "text-slate-400"
                      )}>
                        {avg || "-"}
                      </span>
                    </td>

                    <td className="px-2 py-1.5 text-center bg-slate-50/50">
                      {avg === 0 ? (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Kosong
                        </Badge>
                      ) : hasRemedial ? (
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                          Remedial
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5">
                          Tuntas
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>

          {students.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 text-slate-800 font-bold border-t-2 border-slate-300">
                <td colSpan={4} className="px-4 py-2.5 text-right border-r border-slate-200 sticky left-0 bg-slate-100 z-10 text-xs">
                  Rata-Rata Kelas:
                </td>
                {MADRASAH_SUBJECTS.map((sub) => {
                  const subAvg = calculateSubjectAverage(sub.id)
                  return (
                    <td key={sub.id} className="w-14 min-w-[56px] max-w-[56px] px-0 py-2 text-center border-r border-slate-200 font-mono text-xs">
                      <span className={subAvg > 0 && subAvg < 75 ? "text-red-600 font-bold" : "text-emerald-800 font-bold"}>
                        {subAvg || "-"}
                      </span>
                    </td>
                  )
                })}
                <td className="px-2 py-2 text-center border-r border-slate-200 font-mono text-xs text-emerald-800 font-bold">
                  {classOverallAvg || "-"}
                </td>
                <td className="px-2 py-2 text-center text-[10px] text-slate-600">
                  Rekap
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
