import React, { useState, useEffect } from "react"
import {
  Users,
  School,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  GraduationCap,
  Upload,
  FileSpreadsheet,
  ArrowRightLeft,
  ChevronRight,
  CheckCircle2,
  UserCheck,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SchoolProfile, WalikelasAccount, WalikelasLoginRule } from "@/types"
import { DEFAULT_SCHOOL_PROFILE, DEFAULT_WALIKELAS_LOGIN_RULE } from "@/data/mockData"
import { cn } from "@/lib/utils"

export interface StudentItem {
  id: string
  nisn: string
  nis: string
  name: string
  gender: 'L' | 'P'
  classRoom: string
  grade: 'VII' | 'VIII' | 'IX'
  status: 'Aktif' | 'Mutasi'
  phone?: string
}

export interface ClassItem {
  id: string
  name: string
  grade: 'VII' | 'VIII' | 'IX'
  walikelas: string
  walikelasNip: string
  capacity: number
  totalStudents: number
  maleCount: number
  femaleCount: number
}

export interface SubjectItem {
  id: string
  code: string
  name: string
  category: 'Kemenag (Agama)' | 'Umum'
  kkm: number
  hours: number
}

interface DataMasterPageProps {
  tahunAjaran?: string
  schoolProfile?: SchoolProfile
  onChangeSchoolProfile?: (profile: SchoolProfile) => void
  classes: ClassItem[]
  onChangeClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>
  students: StudentItem[]
  onChangeStudents: React.Dispatch<React.SetStateAction<StudentItem[]>>
  walikelasAccounts: WalikelasAccount[]
  onChangeWalikelasAccounts: React.Dispatch<React.SetStateAction<WalikelasAccount[]>>
  walikelasLoginRule: WalikelasLoginRule
  onChangeWalikelasLoginRule: (rule: WalikelasLoginRule) => void
  initialTab?: string
}

export const DataMasterPage: React.FC<DataMasterPageProps> = ({
  tahunAjaran = "2024/2025",
  schoolProfile = DEFAULT_SCHOOL_PROFILE,
  onChangeSchoolProfile,
  classes,
  onChangeClasses,
  students,
  onChangeStudents,
  walikelasAccounts,
  onChangeWalikelasAccounts,
  walikelasLoginRule = DEFAULT_WALIKELAS_LOGIN_RULE,
  onChangeWalikelasLoginRule,
  initialTab = "siswa",
}) => {
  const [activeMainTab, setActiveMainTab] = useState(initialTab)
  const [search, setSearch] = useState("")
  const [profileForm, setProfileForm] = useState<SchoolProfile>(schoolProfile)

  useEffect(() => {
    setActiveMainTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    setProfileForm(schoolProfile)
  }, [schoolProfile])

  const handleSaveSchoolProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (onChangeSchoolProfile) {
      onChangeSchoolProfile(profileForm)
    }
    setUploadSuccessToast(`Profil Identitas Sekolah "${profileForm.name}" berhasil disimpan dan diperbarui.`)
    setTimeout(() => setUploadSuccessToast(null), 4000)
  }

  // Filter jenjang & kelas aktif untuk Data Siswa
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("IX")
  const [selectedClassId, setSelectedClassId] = useState<string>("all")

  // Master 16 Mapel
  const [subjects] = useState<SubjectItem[]>([
    { id: '1', code: 'QH', name: "Al Qur'an Hadis", category: 'Kemenag (Agama)', kkm: 75, hours: 2 },
    { id: '2', code: 'AA', name: 'Akidah Akhlak', category: 'Kemenag (Agama)', kkm: 75, hours: 2 },
    { id: '3', code: 'FIQ', name: 'Fikih', category: 'Kemenag (Agama)', kkm: 75, hours: 2 },
    { id: '4', code: 'SKI', name: 'Sejarah Kebudayaan Islam', category: 'Kemenag (Agama)', kkm: 75, hours: 2 },
    { id: '5', code: 'PP', name: 'Pendidikan Pancasila', category: 'Umum', kkm: 75, hours: 2 },
    { id: '6', code: 'Bind', name: 'Bahasa Indonesia', category: 'Umum', kkm: 75, hours: 4 },
    { id: '7', code: 'B. Arab', name: 'Bahasa Arab', category: 'Kemenag (Agama)', kkm: 75, hours: 3 },
    { id: '8', code: 'MTK', name: 'Matematika', category: 'Umum', kkm: 75, hours: 4 },
    { id: '9', code: 'IPA', name: 'Ilmu Pengetahuan Alam', category: 'Umum', kkm: 75, hours: 4 },
    { id: '10', code: 'IPS', name: 'Ilmu Pengetahuan Sosial', category: 'Umum', kkm: 75, hours: 4 },
    { id: '11', code: 'Bing', name: 'Bahasa Inggris', category: 'Umum', kkm: 75, hours: 3 },
    { id: '12', code: 'SBK', name: 'Seni dan Prakarya', category: 'Umum', kkm: 75, hours: 2 },
    { id: '13', code: 'PJOK', name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', category: 'Umum', kkm: 75, hours: 3 },
    { id: '14', code: 'TIK', name: 'Informatika', category: 'Umum', kkm: 75, hours: 2 },
    { id: '15', code: 'Bda', name: 'Bahasa Daerah', category: 'Umum', kkm: 75, hours: 2 },
    { id: '16', code: 'KNU', name: 'Ke-NU-An', category: 'Kemenag (Agama)', kkm: 75, hours: 2 },
  ])

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [csvPasteText, setCsvPasteText] = useState("")
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [isMoveClassModalOpen, setIsMoveClassModalOpen] = useState(false)
  const [selectedStudentForMove, setSelectedStudentForMove] = useState<StudentItem | null>(null)
  const [targetClassRoom, setTargetClassRoom] = useState<string>("")
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null)
  const [isDaftarRombelModalOpen, setIsDaftarRombelModalOpen] = useState(false)
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false)
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false)
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<ClassItem | null>(null)

  // Walikelas Login Account Modals
  const [isWaliModalOpen, setIsWaliModalOpen] = useState(false)
  const [editingWaliAccount, setEditingWaliAccount] = useState<WalikelasAccount | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [waliFormData, setWaliFormData] = useState({
    name: "",
    nip: "",
    assignedClass: "",
    username: "",
    password: "",
    isActive: true,
    canInputNilai: true,
    canPrintRapor: true,
  })

  // Form Tambah / Edit Rombel
  const [classFormData, setClassFormData] = useState({
    name: "",
    grade: "IX" as 'VII' | 'VIII' | 'IX',
    walikelas: "",
    walikelasNip: "",
    capacity: 32,
    waliUsername: "",
    waliPassword: "",
  })

  // Handlers Rombel
  const handleOpenAddClass = () => {
    const nextLetter = String.fromCharCode(65 + classes.filter(c => c.grade === 'IX').length)
    setClassFormData({
      name: `Kelas IX-${nextLetter}`,
      grade: "IX",
      walikelas: "",
      walikelasNip: "",
      capacity: 32,
      waliUsername: "",
      waliPassword: "",
    })
    setIsAddClassModalOpen(true)
  }

  const handleSaveAddClass = () => {
    if (!classFormData.name.trim()) return
    const className = classFormData.name.trim()
    const waliName = classFormData.walikelas.trim() || "Belum Ditentukan"
    const waliNip = classFormData.walikelasNip.trim() || "-"

    const newClass: ClassItem = {
      id: `cls-${Date.now()}`,
      name: className,
      grade: classFormData.grade,
      walikelas: waliName,
      walikelasNip: waliNip,
      capacity: Number(classFormData.capacity) || 32,
      totalStudents: 0,
      maleCount: 0,
      femaleCount: 0,
    }
    onChangeClasses(prev => [...prev, newClass])
    setSelectedClassId(newClass.id)

    // Jika diisi username & password login wali kelas sekaligus
    if (classFormData.waliUsername.trim() && classFormData.waliPassword.trim()) {
      const newWaliAcc: WalikelasAccount = {
        id: `wali-${Date.now()}`,
        username: classFormData.waliUsername.trim(),
        password: classFormData.waliPassword.trim(),
        name: waliName,
        nip: waliNip,
        assignedClass: className,
        isActive: true,
        canInputNilai: true,
        canPrintRapor: true,
        createdAt: new Date().toLocaleDateString("id-ID"),
      }
      onChangeWalikelasAccounts(prev => [...prev, newWaliAcc])
    }

    setIsAddClassModalOpen(false)
    setUploadSuccessToast(`Rombongan belajar "${newClass.name}" berhasil ditambahkan.`)
    setTimeout(() => setUploadSuccessToast(null), 4000)
  }

  const handleOpenEditClass = (cls: ClassItem) => {
    setSelectedClassForEdit(cls)
    const linkedWali = walikelasAccounts.find(w => w.assignedClass === cls.name)
    setClassFormData({
      name: cls.name,
      grade: cls.grade,
      walikelas: cls.walikelas,
      walikelasNip: cls.walikelasNip,
      capacity: cls.capacity,
      waliUsername: linkedWali?.username || "",
      waliPassword: linkedWali?.password || "",
    })
    setIsEditClassModalOpen(true)
  }

  const handleSaveEditClass = () => {
    if (!selectedClassForEdit || !classFormData.name.trim()) return
    const oldName = selectedClassForEdit.name
    const newName = classFormData.name.trim()
    const waliName = classFormData.walikelas.trim() || "Belum Ditentukan"
    const waliNip = classFormData.walikelasNip.trim() || "-"

    onChangeClasses(prev =>
      prev.map(c => {
        if (c.id === selectedClassForEdit.id) {
          return {
            ...c,
            name: newName,
            grade: classFormData.grade,
            walikelas: waliName,
            walikelasNip: waliNip,
            capacity: Number(classFormData.capacity) || 32,
          }
        }
        return c
      })
    )

    if (oldName !== newName) {
      onChangeStudents(prev =>
        prev.map(s => (s.classRoom === oldName ? { ...s, classRoom: newName, grade: classFormData.grade } : s))
      )
    }

    // Update atau buat akun login wali kelas jika diisi
    if (classFormData.waliUsername.trim() && classFormData.waliPassword.trim()) {
      const existingAcc = walikelasAccounts.find(w => w.assignedClass === oldName || w.assignedClass === newName)
      if (existingAcc) {
        onChangeWalikelasAccounts(prev =>
          prev.map(w =>
            w.id === existingAcc.id
              ? {
                  ...w,
                  name: waliName,
                  nip: waliNip,
                  assignedClass: newName,
                  username: classFormData.waliUsername.trim(),
                  password: classFormData.waliPassword.trim(),
                }
              : w
          )
        )
      } else {
        onChangeWalikelasAccounts(prev => [
          ...prev,
          {
            id: `wali-${Date.now()}`,
            username: classFormData.waliUsername.trim(),
            password: classFormData.waliPassword.trim(),
            name: waliName,
            nip: waliNip,
            assignedClass: newName,
            isActive: true,
            canInputNilai: true,
            canPrintRapor: true,
            createdAt: new Date().toLocaleDateString("id-ID"),
          },
        ])
      }
    }

    setIsEditClassModalOpen(false)
    setSelectedClassForEdit(null)
    setUploadSuccessToast(`Data rombel "${newName}" berhasil diperbarui.`)
    setTimeout(() => setUploadSuccessToast(null), 4000)
  }

  const handleDeleteClass = (cls: ClassItem) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus rombel "${cls.name}"?`)
    if (!confirmDelete) return

    onChangeClasses(prev => prev.filter(c => c.id !== cls.id))
    onChangeStudents(prev => prev.filter(s => s.classRoom !== cls.name))
    if (selectedClassId === cls.id) {
      setSelectedClassId("all")
    }
    setUploadSuccessToast(`Rombel "${cls.name}" berhasil dihapus.`)
    setTimeout(() => setUploadSuccessToast(null), 4000)
  }

  // Handlers Akun Login Wali Kelas
  const handleOpenAddWaliAccount = () => {
    setEditingWaliAccount(null)
    const defaultClass = classes[0]?.name || "Kelas IX-A"
    const clsObj = classes.find(c => c.name === defaultClass)
    setWaliFormData({
      name: clsObj && clsObj.walikelas !== "Belum Ditentukan" ? clsObj.walikelas : "",
      nip: clsObj && clsObj.walikelasNip !== "-" ? clsObj.walikelasNip : "",
      assignedClass: defaultClass,
      username: "",
      password: "",
      isActive: true,
      canInputNilai: true,
      canPrintRapor: true,
    })
    setIsWaliModalOpen(true)
  }

  const handleOpenEditWaliAccount = (acc: WalikelasAccount) => {
    setEditingWaliAccount(acc)
    setWaliFormData({
      name: acc.name,
      nip: acc.nip,
      assignedClass: acc.assignedClass,
      username: acc.username,
      password: acc.password,
      isActive: acc.isActive,
      canInputNilai: acc.canInputNilai,
      canPrintRapor: acc.canPrintRapor,
    })
    setIsWaliModalOpen(true)
  }

  const handleSaveWaliAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!waliFormData.name.trim() || !waliFormData.username.trim() || !waliFormData.password.trim() || !waliFormData.assignedClass.trim()) {
      return
    }

    const cleanClass = waliFormData.assignedClass.trim()
    const cleanName = waliFormData.name.trim()
    const cleanNip = waliFormData.nip.trim() || "-"
    const cleanUsername = waliFormData.username.trim()

    if (editingWaliAccount) {
      onChangeWalikelasAccounts(prev =>
        prev.map(w =>
          w.id === editingWaliAccount.id
            ? {
                ...w,
                name: cleanName,
                nip: cleanNip,
                assignedClass: cleanClass,
                username: cleanUsername,
                password: waliFormData.password,
                isActive: waliFormData.isActive,
                canInputNilai: waliFormData.canInputNilai,
                canPrintRapor: waliFormData.canPrintRapor,
              }
            : w
        )
      )
      setUploadSuccessToast(`Rule & Akun Login Wali Kelas "${cleanName}" (${cleanClass}) berhasil diperbarui.`)
    } else {
      const newAcc: WalikelasAccount = {
        id: `wali-${Date.now()}`,
        name: cleanName,
        nip: cleanNip,
        assignedClass: cleanClass,
        username: cleanUsername,
        password: waliFormData.password,
        isActive: waliFormData.isActive,
        canInputNilai: waliFormData.canInputNilai,
        canPrintRapor: waliFormData.canPrintRapor,
        createdAt: new Date().toLocaleDateString("id-ID"),
      }
      onChangeWalikelasAccounts(prev => [...prev, newAcc])
      setUploadSuccessToast(`Akun Login Wali Kelas "${cleanName}" (user: ${cleanUsername}) berhasil ditambahkan.`)
    }

    // Sinkronkan ke daftar Rombel jika belum ada atau update nama wali kelasnya
    const existingClass = classes.find(c => c.name.toLowerCase() === cleanClass.toLowerCase())
    if (!existingClass) {
      onChangeClasses(prev => [
        ...prev,
        {
          id: `cls-${Date.now()}`,
          name: cleanClass,
          grade: "IX",
          walikelas: cleanName,
          walikelasNip: cleanNip,
          capacity: 32,
          totalStudents: 0,
          maleCount: 0,
          femaleCount: 0,
        },
      ])
    } else {
      onChangeClasses(prev =>
        prev.map(c =>
          c.id === existingClass.id
            ? { ...c, walikelas: cleanName, walikelasNip: cleanNip }
            : c
        )
      )
    }

    setIsWaliModalOpen(false)
    setTimeout(() => setUploadSuccessToast(null), 4000)
  }

  const handleToggleWaliActive = (acc: WalikelasAccount) => {
    onChangeWalikelasAccounts(prev =>
      prev.map(w => (w.id === acc.id ? { ...w, isActive: !w.isActive } : w))
    )
  }

  const handleDeleteWaliAccount = (acc: WalikelasAccount) => {
    if (!window.confirm(`Hapus akun login Wali Kelas "${acc.name}" (${acc.username})?`)) return
    onChangeWalikelasAccounts(prev => prev.filter(w => w.id !== acc.id))
    setUploadSuccessToast(`Akun login "${acc.username}" telah dihapus.`)
    setTimeout(() => setUploadSuccessToast(null), 4000)
  }

  // Form Tambah Siswa Baru
  const [newStudentData, setNewStudentData] = useState({
    name: "",
    nisn: "",
    nis: "",
    gender: "L" as 'L' | 'P',
    classRoom: "",
    phone: "",
  })

  // Selected active class details
  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0]

  // Filtered students by class and search query
  const filteredStudents = students.filter(std => {
    const matchesSearch =
      std.name.toLowerCase().includes(search.toLowerCase()) ||
      std.nisn.includes(search) ||
      std.nis.includes(search)

    if (selectedClassId === "all" || !currentClass) {
      if (selectedGradeFilter === "all") return matchesSearch
      return matchesSearch && std.grade === selectedGradeFilter
    }

    return matchesSearch && std.classRoom === currentClass.name
  })

  // Handlers Siswa
  const handleOpenAddStudent = () => {
    const defaultRoom = selectedClassId !== "all" && currentClass ? currentClass.name : (classes[0]?.name || "Kelas IX-A")
    setNewStudentData({
      name: "",
      nisn: "",
      nis: "",
      gender: "L",
      classRoom: defaultRoom,
      phone: "",
    })
    setIsAddStudentModalOpen(true)
  }

  const handleSaveNewStudent = () => {
    if (!newStudentData.name.trim() || !newStudentData.classRoom.trim()) return
    const roomName = newStudentData.classRoom.trim()
    const targetGrade = classes.find(c => c.name === roomName)?.grade || 'IX'

    // Jika kelas belum ada di daftar rombel, otomatis buat rombelnya
    if (!classes.some(c => c.name === roomName)) {
      onChangeClasses(prev => [
        ...prev,
        {
          id: `cls-${Date.now()}`,
          name: roomName,
          grade: 'IX',
          walikelas: 'Belum Ditentukan',
          walikelasNip: '-',
          capacity: 32,
          totalStudents: 1,
          maleCount: newStudentData.gender === 'L' ? 1 : 0,
          femaleCount: newStudentData.gender === 'P' ? 1 : 0,
        },
      ])
    }

    const newStudent: StudentItem = {
      id: `std-${Date.now()}`,
      nisn: newStudentData.nisn.trim() || "-",
      nis: newStudentData.nis.trim() || "-",
      name: newStudentData.name.trim(),
      gender: newStudentData.gender,
      classRoom: roomName,
      grade: targetGrade,
      status: 'Aktif',
      phone: newStudentData.phone.trim() || "-",
    }

    onChangeStudents(prev => [...prev, newStudent])
    setIsAddStudentModalOpen(false)
    setUploadSuccessToast(`Siswa "${newStudent.name}" berhasil ditambahkan ke ${roomName}.`)
    setTimeout(() => setUploadSuccessToast(null), 4000)
  }

  const handleOpenMoveClass = (std: StudentItem) => {
    setSelectedStudentForMove(std)
    const otherClass = classes.find(c => c.name !== std.classRoom)?.name || std.classRoom
    setTargetClassRoom(otherClass)
    setIsMoveClassModalOpen(true)
  }

  const handleConfirmMoveClass = () => {
    if (!selectedStudentForMove || !targetClassRoom) return
    const targetGrade = classes.find(c => c.name === targetClassRoom)?.grade || selectedStudentForMove.grade

    onChangeStudents(prev =>
      prev.map(s => {
        if (s.id === selectedStudentForMove.id) {
          return {
            ...s,
            classRoom: targetClassRoom,
            grade: targetGrade,
          }
        }
        return s
      })
    )

    setIsMoveClassModalOpen(false)
    setSelectedStudentForMove(null)
  }

  const handleDeleteStudent = (id: string) => {
    if (!window.confirm("Hapus data siswa ini?")) return
    onChangeStudents(prev => prev.filter(s => s.id !== id))
  }

  const handleProcessImportCsv = () => {
    const lines = csvPasteText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return

    const defaultRoom = selectedClassId !== "all" && currentClass ? currentClass.name : (classes[0]?.name || "Kelas IX-A")
    const imported: StudentItem[] = []
    const newRooms = new Set<string>()

    lines.forEach((line, idx) => {
      const parts = line.includes("\t") ? line.split("\t") : line.split(",")
      if (parts.length === 1) {
        imported.push({
          id: `std-${Date.now()}-${idx}`,
          nisn: "-",
          nis: "-",
          name: parts[0].trim(),
          gender: "L",
          classRoom: defaultRoom,
          grade: "IX",
          status: "Aktif",
          phone: "-",
        })
        newRooms.add(defaultRoom)
      } else {
        const nisn = (parts[0] || "-").trim()
        const nis = (parts[1] || "-").trim()
        const name = (parts[2] || parts[0] || "").trim()
        const genderRaw = (parts[3] || "L").trim().toUpperCase()
        const gender: 'L' | 'P' = genderRaw === "P" ? "P" : "L"
        const room = (parts[4] || defaultRoom).trim()
        if (name && name.toLowerCase() !== "nama" && name.toLowerCase() !== "nama siswa") {
          imported.push({
            id: `std-${Date.now()}-${idx}`,
            nisn,
            nis,
            name,
            gender,
            classRoom: room,
            grade: "IX",
            status: "Aktif",
            phone: "-",
          })
          newRooms.add(room)
        }
      }
    })

    if (imported.length === 0) return

    newRooms.forEach(roomName => {
      if (!classes.some(c => c.name === roomName)) {
        onChangeClasses(prev => [
          ...prev,
          {
            id: `cls-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: roomName,
            grade: "IX",
            walikelas: "Belum Ditentukan",
            walikelasNip: "-",
            capacity: 32,
            totalStudents: 0,
            maleCount: 0,
            femaleCount: 0,
          },
        ])
      }
    })

    onChangeStudents(prev => [...prev, ...imported])
    setCsvPasteText("")
    setIsUploadModalOpen(false)
    setUploadSuccessToast(`Berhasil mengimpor ${imported.length} data siswa baru.`)
    setTimeout(() => setUploadSuccessToast(null), 4500)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi */}
      {uploadSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Perubahan Berhasil Disimpan</p>
              <p className="text-[11px] text-emerald-700">{uploadSuccessToast}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setUploadSuccessToast(null)} className="text-xs">
            Tutup
          </Button>
        </div>
      )}

      {/* Header Utama Manajemen Data Master */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              Administrator Madrasah
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Tahun Ajaran {tahunAjaran}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Data Master & Pengaturan Akses
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data siswa, rombel, mata pelajaran, rule login wali kelas, dan profil identitas sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            onClick={handleOpenAddWaliAccount}
            variant="outline"
            className="text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-xs"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Tambah Login Walikelas</span>
          </Button>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
            variant="outline"
            className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Siswa (CSV/Excel)</span>
          </Button>

          <Button
            onClick={handleOpenAddStudent}
            className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
          <TabsList className="w-full justify-start overflow-x-auto gap-2">
            <TabsTrigger value="siswa" className="gap-2 font-semibold">
              <Users className="w-4 h-4" />
              <span>Data Siswa</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700">
                {students.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="kelas" className="gap-2 font-semibold">
              <School className="w-4 h-4" />
              <span>Daftar Rombel ({classes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="walikelas" className="gap-2 font-semibold">
              <UserCheck className="w-4 h-4" />
              <span>Rule Login Wali Kelas ({walikelasAccounts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="mapel" className="gap-2 font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>Mata Pelajaran (16)</span>
            </TabsTrigger>
            <TabsTrigger value="profil" className="gap-2 font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>Profil Identitas Sekolah</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: DATA SISWA                                              */}
        {/* ============================================================== */}
        <TabsContent value="siswa" className="space-y-4 mt-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Jenjang:
              </span>
              <div className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                <span>Jenjang Kelas IX</span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsDaftarRombelModalOpen(true)}
                className="text-xs h-8 px-3 rounded-lg font-semibold border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Daftar Rombel ({classes.length})</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddClass}
                className="text-xs h-8 px-3 rounded-lg font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rombel</span>
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari siswa / NISN..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* KAPSUL PEMILIH ROMBEL */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-emerald-600" />
              Pilih Rombel:
            </span>

            <button
              onClick={() => setSelectedClassId("all")}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                selectedClassId === "all"
                  ? "bg-emerald-600 text-white shadow-md font-bold"
                  : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
              )}
            >
              Semua Rombel ({students.length})
            </button>

            {classes.map((cls) => {
              const isSelected = selectedClassId === cls.id
              const studentCountInThisClass = students.filter(s => s.classRoom === cls.name).length

              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20 ring-1 ring-emerald-500 font-bold"
                      : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                  )}
                >
                  <span>{cls.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded font-mono font-bold",
                    isSelected ? "bg-emerald-700 text-emerald-100" : "bg-slate-100 text-slate-600"
                  )}>
                    {studentCountInThisClass} Siswa
                  </span>
                </button>
              )
            })}
          </div>

          {/* CLASS SUMMARY BANNER */}
          {selectedClassId !== "all" && currentClass && (
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-700 text-emerald-100 border border-emerald-500/40">
                    Rombel Aktif
                  </span>
                  <span className="text-xs text-emerald-200">
                    Tingkat {currentClass.grade} • {schoolProfile.name}
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">
                  {currentClass.name}
                </h3>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Wali Kelas: <strong className="text-white">{currentClass.walikelas}</strong> (NIP: {currentClass.walikelasNip})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Terdaftar</span>
                  <span className="text-base font-bold text-white font-mono">{filteredStudents.length} / {currentClass.capacity}</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Laki-Laki</span>
                  <span className="text-base font-bold text-blue-300 font-mono">
                    {filteredStudents.filter(s => s.gender === 'L').length}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Perempuan</span>
                  <span className="text-base font-bold text-pink-300 font-mono">
                    {filteredStudents.filter(s => s.gender === 'P').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TABEL DATA SISWA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-800">
                  {selectedClassId !== "all" && currentClass
                    ? `Daftar Siswa ${currentClass.name}` 
                    : "Daftar Seluruh Siswa"}
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                Menampilkan <strong>{filteredStudents.length}</strong> siswa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <th className="px-3 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">NISN / NIS</th>
                    <th className="px-4 py-3">Nama Lengkap Siswa</th>
                    <th className="px-3 py-3 text-center">L/P</th>
                    <th className="px-4 py-3">Rombel / Kelas</th>
                    <th className="px-4 py-3">No. Kontak / WA</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center w-36">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500 text-xs">
                        Belum ada data siswa. Silakan klik tombol <strong>"Tambah Siswa Baru"</strong> atau <strong>"Import Siswa"</strong> di kanan atas.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std, idx) => (
                      <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          <div className="font-semibold">{std.nisn}</div>
                          <div className="text-[10px] text-slate-400">NIS: {std.nis}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {std.name}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={cn(
                            "font-bold text-[10px] px-1.5 py-0.5 rounded",
                            std.gender === 'L' ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                          )}>
                            {std.gender}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium">
                          <Badge variant="outline" className="text-[11px] font-semibold bg-slate-50">
                            {std.classRoom}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {std.phone || "-"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant="success" className="text-[10px] font-semibold">
                            {std.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenMoveClass(std)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Pindah / Mutasi Rombel"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(std.id)}
                              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: DAFTAR KELAS / ROMBEL                                   */}
        {/* ============================================================== */}
        <TabsContent value="kelas" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">Daftar Rombongan Belajar (Rombel) Madrasah</h4>
                <Badge variant="outline" className="text-xs">Tahun Ajaran {tahunAjaran}</Badge>
              </div>
              <Button
                size="sm"
                onClick={handleOpenAddClass}
                className="text-xs font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rombel Baru</span>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <th className="px-4 py-3">Nama Rombel</th>
                    <th className="px-4 py-3">Tingkat Jenjang</th>
                    <th className="px-4 py-3">Wali Kelas Pengampu</th>
                    <th className="px-4 py-3">Akun Login Walikelas</th>
                    <th className="px-4 py-3 text-center">Kapasitas</th>
                    <th className="px-4 py-3 text-center">Terisi</th>
                    <th className="px-4 py-3 text-center w-40">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                        Belum ada data Rombel / Kelas. Klik tombol <strong>"Tambah Rombel Baru"</strong> untuk menambahkan kelas.
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => {
                      const count = students.filter(s => s.classRoom === cls.name).length
                      const linkedAccount = walikelasAccounts.find(w => w.assignedClass === cls.name)
                      return (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-900">{cls.name}</td>
                          <td className="px-4 py-3 text-slate-600">Jenjang Tingkat {cls.grade}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium">
                            <div>{cls.walikelas}</div>
                            <div className="text-[10px] text-slate-400 font-mono">NIP: {cls.walikelasNip}</div>
                          </td>
                          <td className="px-4 py-3">
                            {linkedAccount ? (
                              <Badge variant={linkedAccount.isActive ? "success" : "destructive"} className="text-[10px] font-mono">
                                user: {linkedAccount.username} ({linkedAccount.isActive ? "Aktif" : "Nonaktif"})
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingWaliAccount(null)
                                  setWaliFormData({
                                    name: cls.walikelas !== "Belum Ditentukan" ? cls.walikelas : "",
                                    nip: cls.walikelasNip !== "-" ? cls.walikelasNip : "",
                                    assignedClass: cls.name,
                                    username: "",
                                    password: "",
                                    isActive: true,
                                    canInputNilai: true,
                                    canPrintRapor: true,
                                  })
                                  setIsWaliModalOpen(true)
                                }}
                                className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                              >
                                + Buat Akun Login
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">{cls.capacity} Siswa</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-800">{count} Siswa</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedGradeFilter(cls.grade)
                                  setSelectedClassId(cls.id)
                                  setActiveMainTab("siswa")
                                }}
                                className="px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-0.5"
                                title="Lihat Data Siswa"
                              >
                                <span>Buka</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditClass(cls)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Rombel"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClass(cls)}
                                className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Rombel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: PENGATURAN RULE LOGIN WALI KELAS                        */}
        {/* ============================================================== */}
        <TabsContent value="walikelas" className="mt-4 space-y-4">
          {/* Card Rule Kebijakan Login Wali Kelas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Pengaturan Kebijakan & Rule Login Wali Kelas</h4>
                  <p className="text-xs text-slate-500">
                    Atur hak akses masuk dan penguncian lembar nilai untuk seluruh akun Wali Kelas.
                  </p>
                </div>
              </div>
              <Badge variant={walikelasLoginRule.allowWalikelasLogin ? "success" : "destructive"} className="text-xs px-3 py-1">
                {walikelasLoginRule.allowWalikelasLogin ? "Akses Login Walikelas: DIBUKA" : "Akses Login Walikelas: DITUTUP"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-emerald-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={walikelasLoginRule.allowWalikelasLogin}
                  onChange={(e) =>
                    onChangeWalikelasLoginRule({
                      ...walikelasLoginRule,
                      allowWalikelasLogin: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Izinkan Wali Kelas Login ke Sistem</span>
                  <span className="text-[11px] text-slate-500">
                    Jika dinonaktifkan, seluruh Wali Kelas tidak dapat masuk ke sistem sementara waktu.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-emerald-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={walikelasLoginRule.autoLockAfterSubmit}
                  onChange={(e) =>
                    onChangeWalikelasLoginRule({
                      ...walikelasLoginRule,
                      autoLockAfterSubmit: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Kunci Otomatis Setelah Kirim Nilai ke Admin</span>
                  <span className="text-[11px] text-slate-500">
                    Lembar nilai otomatis terkunci (read-only) setelah Wali Kelas mengirim nilai untuk divalidasi.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Tabel Daftar Akun Login Wali Kelas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>Daftar Akun & Kredensial Login Wali Kelas</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tambahkan username, password, dan kelas ampuan agar Wali Kelas dapat login ke aplikasi.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleOpenAddWaliAccount}
                className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Akun Login Wali Kelas</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <th className="px-3 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">Nama Wali Kelas & NIP</th>
                    <th className="px-4 py-3">Rombel / Kelas Ampuan</th>
                    <th className="px-4 py-3">Username Login</th>
                    <th className="px-4 py-3">Password Login</th>
                    <th className="px-4 py-3 text-center">Status Rule Login</th>
                    <th className="px-4 py-3 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walikelasAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                        Belum ada akun login Wali Kelas. Klik tombol <strong>"Tambah Akun Login Wali Kelas"</strong> untuk membuat username & password Wali Kelas.
                      </td>
                    </tr>
                  ) : (
                    walikelasAccounts.map((acc, idx) => {
                      const isShown = !!showPasswords[acc.id]
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{acc.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">NIP: {acc.nip || "-"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200">
                              {acc.assignedClass}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            {acc.username}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                                {isShown ? acc.password : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords(prev => ({ ...prev, [acc.id]: !prev[acc.id] }))
                                }
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title={isShown ? "Sembunyikan Password" : "Lihat Password"}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleWaliActive(acc)}
                              className="cursor-pointer"
                              title="Klik untuk mengubah status aktif/nonaktif"
                            >
                              {acc.isActive ? (
                                <Badge variant="success" className="text-[10px] font-semibold">
                                  Aktif (Diizinkan)
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] font-semibold">
                                  Nonaktif (Diblokir)
                                </Badge>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditWaliAccount(acc)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Akun Login Walikelas"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWaliAccount(acc)}
                                className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Akun Login Walikelas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 4: MATA PELAJARAN (16 MAPEL)                               */}
        {/* ============================================================== */}
        <TabsContent value="mapel" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-800">Struktur Kurikulum Madrasah (16 Mata Pelajaran)</h4>
              <Badge variant="default" className="text-xs bg-emerald-600">KKM Standar: 75</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <th className="px-3 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Nama Mata Pelajaran</th>
                    <th className="px-4 py-3">Kategori Kelompok</th>
                    <th className="px-4 py-3 text-center">Standar KKM</th>
                    <th className="px-4 py-3 text-center">Beban JP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-800">{sub.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{sub.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">{sub.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">{sub.kkm}</td>
                      <td className="px-4 py-3 text-center text-slate-600 font-mono">{sub.hours} JP/Mg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 5: PROFIL IDENTITAS SEKOLAH / MADRASAH                     */}
        {/* ============================================================== */}
        <TabsContent value="profil" className="mt-4">
          <form onSubmit={handleSaveSchoolProfile} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold tracking-tight text-white">
                    Pengaturan Profil Identitas Sekolah / Madrasah
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    Identitas resmi satuan pendidikan untuk Kop Surat, Buku Leger, Rapor, dan SKL.
                  </p>
                </div>
              </div>
              <Button
                type="submit"
                className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </Button>
            </div>

            <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2">
                  1. Identitas Satuan Pendidikan & Kop Surat
                </h5>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Nama Sekolah / Madrasah *</label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    className="text-xs font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">NSM (Nomor Statistik Madrasah)</label>
                    <Input
                      value={profileForm.nsm}
                      onChange={(e) => setProfileForm({ ...profileForm, nsm: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">NPSN</label>
                    <Input
                      value={profileForm.npsn}
                      onChange={(e) => setProfileForm({ ...profileForm, npsn: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Header Instansi Baris 1</label>
                    <Input
                      value={profileForm.ministryHeader1}
                      onChange={(e) => setProfileForm({ ...profileForm, ministryHeader1: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Header Instansi Baris 2</label>
                    <Input
                      value={profileForm.ministryHeader2}
                      onChange={(e) => setProfileForm({ ...profileForm, ministryHeader2: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Peringkat Akreditasi</label>
                    <Input
                      value={profileForm.accreditation}
                      onChange={(e) => setProfileForm({ ...profileForm, accreditation: e.target.value })}
                      className="text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Predikat Akreditasi</label>
                    <Input
                      value={profileForm.accreditationLabel}
                      onChange={(e) => setProfileForm({ ...profileForm, accreditationLabel: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2">
                  2. Alamat, Kontak & Pengesahan Kepala Sekolah
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Alamat Lengkap Jalan</label>
                    <Input
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Kota / Kabupaten</label>
                    <Input
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Telepon</label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Website</label>
                    <Input
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Email</label>
                    <Input
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">Nama Kepala Sekolah / Madrasah *</label>
                    <Input
                      value={profileForm.headmasterName}
                      onChange={(e) => setProfileForm({ ...profileForm, headmasterName: e.target.value })}
                      required
                      className="text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 block">NIP Kepala Sekolah / Madrasah</label>
                    <Input
                      value={profileForm.headmasterNip}
                      onChange={(e) => setProfileForm({ ...profileForm, headmasterNip: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">Titimangsa Cetak Rapor / Leger / SKL</label>
                  <Input
                    value={profileForm.titimangsa}
                    onChange={(e) => setProfileForm({ ...profileForm, titimangsa: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* ============================================================== */}
      {/* MODAL 1: TAMBAH / EDIT AKUN & RULE LOGIN WALI KELAS             */}
      {/* ============================================================== */}
      <Dialog open={isWaliModalOpen} onOpenChange={setIsWaliModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <UserCheck className="w-6 h-6" />
          </div>
          <DialogTitle>
            {editingWaliAccount ? "Edit Akun & Rule Login Wali Kelas" : "Tambah Akun Login Wali Kelas Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Tetapkan kredensial login (username & password) serta kelas/rombel yang diampu oleh Wali Kelas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveWaliAccount} className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Nama Lengkap Wali Kelas *</label>
            <Input
              value={waliFormData.name}
              onChange={(e) => setWaliFormData({ ...waliFormData, name: e.target.value })}
              placeholder="Contoh: Siti Rohmah, S.Pd."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NIP Wali Kelas</label>
              <Input
                value={waliFormData.nip}
                onChange={(e) => setWaliFormData({ ...waliFormData, nip: e.target.value })}
                placeholder="19850419 201001 2 021"
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Rombel / Kelas Ampuan *</label>
              <Input
                value={waliFormData.assignedClass}
                onChange={(e) => setWaliFormData({ ...waliFormData, assignedClass: e.target.value })}
                placeholder="Contoh: Kelas IX-A"
                list="rombel-list-options"
                required
              />
              <datalist id="rombel-list-options">
                {classes.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Username Login *</label>
              <Input
                value={waliFormData.username}
                onChange={(e) => setWaliFormData({ ...waliFormData, username: e.target.value })}
                placeholder="Contoh: wali9a"
                className="font-mono font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Password Login *</label>
              <Input
                type="text"
                value={waliFormData.password}
                onChange={(e) => setWaliFormData({ ...waliFormData, password: e.target.value })}
                placeholder="Contoh: wali2026"
                className="font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-2">
            <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
              Rule Hak Akses Wali Kelas:
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={waliFormData.isActive}
                onChange={(e) => setWaliFormData({ ...waliFormData, isActive: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Status Akun Aktif (Diizinkan Login)</span>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsWaliModalOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button type="submit" className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Akun Login Walikelas
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 2: IMPORT DATA SISWA (CSV / PASTE EXCEL)                 */}
      {/* ============================================================== */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <DialogTitle>Import Data Siswa (Excel / CSV)</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Tempel (paste) baris data siswa dari Excel atau CSV dengan urutan kolom: <strong>NISN, NIS, Nama Lengkap, L/P, Nama Kelas</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <textarea
            rows={6}
            value={csvPasteText}
            onChange={(e) => setCsvPasteText(e.target.value)}
            placeholder={`Contoh format per baris:\n0089123401, 212209001, Ahmad Fauzan, L, Kelas IX-A\n0089123402, 212209002, Siti Aminah, P, Kelas IX-A`}
            className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} className="text-xs">
            Batal
          </Button>
          <Button
            onClick={handleProcessImportCsv}
            disabled={!csvPasteText.trim()}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Proses & Import Siswa
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 3: TAMBAH SISWA BARU                                     */}
      {/* ============================================================== */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1">
            <Plus className="w-5 h-5" />
          </div>
          <DialogTitle>Tambah Peserta Didik Baru</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Masukkan data identitas siswa baru ke rombel yang dipilih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Nama Lengkap Siswa *</label>
            <Input
              value={newStudentData.name}
              onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
              placeholder="Masukkan nama lengkap siswa"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NISN (10 Digit):</label>
              <Input
                value={newStudentData.nisn}
                onChange={(e) => setNewStudentData({ ...newStudentData, nisn: e.target.value })}
                placeholder="Nomor NISN"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NIS Lokal:</label>
              <Input
                value={newStudentData.nis}
                onChange={(e) => setNewStudentData({ ...newStudentData, nis: e.target.value })}
                placeholder="Nomor NIS"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Jenis Kelamin:</label>
              <select
                value={newStudentData.gender}
                onChange={(e) => setNewStudentData({ ...newStudentData, gender: e.target.value as 'L' | 'P' })}
                className="w-full text-xs h-10 px-3 rounded-lg border border-slate-200 bg-white"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Target Rombel / Kelas *</label>
              <Input
                value={newStudentData.classRoom}
                onChange={(e) => setNewStudentData({ ...newStudentData, classRoom: e.target.value })}
                placeholder="Contoh: Kelas IX-A"
                list="rombel-list-options"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddStudentModalOpen(false)} className="text-xs">
            Batal
          </Button>
          <Button
            onClick={handleSaveNewStudent}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Simpan Siswa
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 4: PINDAH / MUTASI KELAS                                 */}
      {/* ============================================================== */}
      <Dialog open={isMoveClassModalOpen} onOpenChange={setIsMoveClassModalOpen}>
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-1">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <DialogTitle>Pindah / Mutasi Rombel Siswa</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Pindahkan siswa ke rombel paralel lain di madrasah.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 text-[11px]">Nama Siswa:</p>
            <p className="font-bold text-slate-900 text-sm">{selectedStudentForMove?.name}</p>
            <p className="text-slate-500 text-[11px] font-mono mt-0.5">
              NISN: {selectedStudentForMove?.nisn} • Rombel Asal: <strong>{selectedStudentForMove?.classRoom}</strong>
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Pilih Rombel Tujuan:</label>
            <Input
              value={targetClassRoom}
              onChange={(e) => setTargetClassRoom(e.target.value)}
              list="rombel-list-options"
              placeholder="Ketik atau pilih rombel tujuan"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsMoveClassModalOpen(false)} className="text-xs">
            Batal
          </Button>
          <Button
            onClick={handleConfirmMoveClass}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            Konfirmasi Pindah Rombel
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 5: DAFTAR ROMBEL KELAS IX                                */}
      {/* ============================================================== */}
      <Dialog open={isDaftarRombelModalOpen} onOpenChange={setIsDaftarRombelModalOpen}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
              <School className="w-6 h-6" />
            </div>
            <Button
              size="sm"
              onClick={() => {
                setIsDaftarRombelModalOpen(false)
                handleOpenAddClass()
              }}
              className="text-xs h-8 px-3 font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rombel</span>
            </Button>
          </div>
          <DialogTitle>Daftar Rombongan Belajar (Rombel) Kelas IX</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Data rombel tingkat Kelas IX {schoolProfile.name} Tahun Ajaran {tahunAjaran}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2">
          {classes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Belum ada rombel terdaftar. Silakan klik tombol "Tambah Rombel".
            </p>
          ) : (
            classes.map((cls) => {
              const count = students.filter(s => s.classRoom === cls.name).length
              const isSelected = selectedClassId === cls.id
              return (
                <div
                  key={cls.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all flex items-center justify-between gap-3",
                    isSelected
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/30"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      IX
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{cls.name}</h5>
                      <p className="text-[11px] text-slate-500">
                        Wali: <strong className="text-slate-700">{cls.walikelas}</strong> • NIP: {cls.walikelasNip}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-800 mr-1">
                      {count} / {cls.capacity} Siswa
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedClassId(cls.id)
                        setIsDaftarRombelModalOpen(false)
                        setActiveMainTab("siswa")
                      }}
                      className="text-xs h-7 px-2.5 font-semibold bg-emerald-700 text-white"
                    >
                      Buka
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsDaftarRombelModalOpen(false)} className="text-xs">
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 6: TAMBAH ROMBEL BARU (+ OPSI AKUN LOGIN WALIKELAS)      */}
      {/* ============================================================== */}
      <Dialog open={isAddClassModalOpen} onOpenChange={setIsAddClassModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <School className="w-6 h-6" />
          </div>
          <DialogTitle>Tambah Rombongan Belajar (Rombel) Baru</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Buat rombel baru beserta penetapan wali kelas dan akun loginnya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nama Rombel / Kelas *</label>
              <Input
                value={classFormData.name}
                onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                placeholder="Contoh: Kelas IX-A"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Kapasitas Kursi (Siswa)</label>
              <Input
                type="number"
                value={classFormData.capacity}
                onChange={(e) => setClassFormData({ ...classFormData, capacity: Number(e.target.value) })}
                min={1}
                max={60}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nama Wali Kelas Pengampu</label>
              <Input
                value={classFormData.walikelas}
                onChange={(e) => setClassFormData({ ...classFormData, walikelas: e.target.value })}
                placeholder="Nama lengkap & gelar"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">NIP Wali Kelas</label>
              <Input
                value={classFormData.walikelasNip}
                onChange={(e) => setClassFormData({ ...classFormData, walikelasNip: e.target.value })}
                placeholder="NIP atau -"
                className="font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-900 block text-[11px]">
              Buat Akun Login Wali Kelas untuk Rombel Ini (Opsional):
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Username Login</label>
                <Input
                  value={classFormData.waliUsername}
                  onChange={(e) => setClassFormData({ ...classFormData, waliUsername: e.target.value })}
                  placeholder="Contoh: wali9a"
                  className="text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Password Login</label>
                <Input
                  value={classFormData.waliPassword}
                  onChange={(e) => setClassFormData({ ...classFormData, waliPassword: e.target.value })}
                  placeholder="Contoh: wali2026"
                  className="text-xs font-mono bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAddClassModalOpen(false)} className="text-xs">
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAddClass}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Simpan Rombel Baru
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 7: EDIT ROMBEL                                           */}
      {/* ============================================================== */}
      <Dialog open={isEditClassModalOpen} onOpenChange={setIsEditClassModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <Pencil className="w-6 h-6" />
          </div>
          <DialogTitle>Edit Data Rombongan Belajar & Login Walikelas</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Ubah identitas nama rombel, guru wali kelas pengampu, serta akun loginnya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nama Rombel / Kelas *</label>
              <Input
                value={classFormData.name}
                onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                className="font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Kapasitas Kursi (Siswa)</label>
              <Input
                type="number"
                value={classFormData.capacity}
                onChange={(e) => setClassFormData({ ...classFormData, capacity: Number(e.target.value) })}
                min={1}
                max={60}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nama Wali Kelas Pengampu *</label>
              <Input
                value={classFormData.walikelas}
                onChange={(e) => setClassFormData({ ...classFormData, walikelas: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">NIP Wali Kelas</label>
              <Input
                value={classFormData.walikelasNip}
                onChange={(e) => setClassFormData({ ...classFormData, walikelasNip: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-900 block text-[11px]">
              Akun Login Wali Kelas Rombel Ini:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Username Login</label>
                <Input
                  value={classFormData.waliUsername}
                  onChange={(e) => setClassFormData({ ...classFormData, waliUsername: e.target.value })}
                  placeholder="Contoh: wali9a"
                  className="text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Password Login</label>
                <Input
                  value={classFormData.waliPassword}
                  onChange={(e) => setClassFormData({ ...classFormData, waliPassword: e.target.value })}
                  placeholder="Contoh: wali2026"
                  className="text-xs font-mono bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditClassModalOpen(false)} className="text-xs">
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveEditClass}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
