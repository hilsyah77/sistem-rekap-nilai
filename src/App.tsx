import React, { useState } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { LoginPage } from "@/components/auth/LoginPage"
import { AdminDashboard } from "@/components/admin/AdminDashboard"
import { ValidasiNilaiPage } from "@/components/admin/ValidasiNilaiPage"
import { DataMasterPage, ClassItem, StudentItem } from "@/components/admin/DataMasterPage"
import { WalikelasDashboard } from "@/components/walikelas/WalikelasDashboard"
import { InputNilaiPage } from "@/components/walikelas/InputNilaiPage"
import { RekapCetakPage } from "@/components/walikelas/RekapCetakPage"
import { DEFAULT_SCHOOL_PROFILE, DEFAULT_WALIKELAS_LOGIN_RULE } from "@/data/mockData"
import { ClassValidationItem } from "@/data/mockValidationQueue"
import {
  getClassValidations,
  getSemesterLockState,
  getSemesterMeta,
  normalizeSemesterId,
} from "@/lib/semesterLock"
import { User, ActivePage, SchoolProfile, WalikelasAccount, WalikelasLoginRule } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem("sisforekap_session_user")
      if (!saved) return null
      const parsed = JSON.parse(saved) as User
      if (parsed.role === "admin") {
        return { ...parsed, name: "Apris Dwi Priyatomo, S.Pd" }
      }
      return parsed
    } catch {
      return null
    }
  })

  const [activePage, setActivePage] = useState<ActivePage>(() => {
    try {
      const saved = sessionStorage.getItem("sisforekap_session_user")
      if (saved) {
        const u = JSON.parse(saved) as User
        return u.role === "admin" ? "admin-dashboard" : "walikelas-dashboard"
      }
    } catch {}
    return "login"
  })

  const [tahunAjaran, setTahunAjaran] = useState<string>(() => {
    try {
      return localStorage.getItem("sisforekap_ta") || "2025/2026"
    } catch {
      return "2025/2026"
    }
  })

  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sisforekap_ta_list")
      return saved ? JSON.parse(saved) : ["2024/2025", "2025/2026", "2026/2027"]
    } catch {
      return ["2024/2025", "2025/2026", "2026/2027"]
    }
  })

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    try {
      const saved = localStorage.getItem("sisforekap_school_profile")
      return saved ? { ...DEFAULT_SCHOOL_PROFILE, ...JSON.parse(saved) } : DEFAULT_SCHOOL_PROFILE
    } catch {
      return DEFAULT_SCHOOL_PROFILE
    }
  })

  const [classes, setClassesState] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem("sisforekap_v2_classes")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [students, setStudentsState] = useState<StudentItem[]>(() => {
    try {
      const saved = localStorage.getItem("sisforekap_v2_students")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [walikelasAccounts, setWalikelasAccountsState] = useState<WalikelasAccount[]>(() => {
    try {
      const saved = localStorage.getItem("sisforekap_v2_walikelas_accounts")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [walikelasLoginRule, setWalikelasLoginRuleState] = useState<WalikelasLoginRule>(() => {
    try {
      const saved = localStorage.getItem("sisforekap_v2_walikelas_rule")
      return saved ? { ...DEFAULT_WALIKELAS_LOGIN_RULE, ...JSON.parse(saved) } : DEFAULT_WALIKELAS_LOGIN_RULE
    } catch {
      return DEFAULT_WALIKELAS_LOGIN_RULE
    }
  })

  const [validationQueue, setValidationQueueState] = useState<ClassValidationItem[]>(() => {
    try {
      const saved = localStorage.getItem("sisforekap_v2_validations")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [scoresBySemester, setScoresBySemesterState] = useState<
    Record<string, Record<string, Record<string, number | ''>>>
  >(() => {
    try {
      const saved = localStorage.getItem("sisforekap_v2_scores")
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [initialInputSemester, setInitialInputSemester] = useState<string>("sem-5")

  const handleUpdateClasses: React.Dispatch<React.SetStateAction<ClassItem[]>> = (updater) => {
    setClassesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try {
        localStorage.setItem("sisforekap_v2_classes", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleUpdateStudents: React.Dispatch<React.SetStateAction<StudentItem[]>> = (updater) => {
    setStudentsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try {
        localStorage.setItem("sisforekap_v2_students", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleUpdateWalikelasAccounts: React.Dispatch<React.SetStateAction<WalikelasAccount[]>> = (updater) => {
    setWalikelasAccountsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try {
        localStorage.setItem("sisforekap_v2_walikelas_accounts", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleUpdateWalikelasLoginRule = (rule: WalikelasLoginRule) => {
    setWalikelasLoginRuleState(rule)
    try {
      localStorage.setItem("sisforekap_v2_walikelas_rule", JSON.stringify(rule))
    } catch {}
  }

  const handleUpdateValidationQueue: React.Dispatch<React.SetStateAction<ClassValidationItem[]>> = (updater) => {
    setValidationQueueState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try {
        localStorage.setItem("sisforekap_v2_validations", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleScoreChange = (semesterId: string, studentId: string, subjectId: string, value: number | '') => {
    if (currentUser?.role === "walikelas") {
      const assignedClass = currentUser.assignedClass || "Kelas IX-A"
      const lockState = getSemesterLockState({
        className: assignedClass,
        semesterId,
        rule: walikelasLoginRule,
        validationQueue,
      })
      if (lockState.isLocked) return
    }

    setScoresBySemesterState((prev) => {
      const next = {
        ...prev,
        [semesterId]: {
          ...(prev[semesterId] || {}),
          [studentId]: {
            ...(prev[semesterId]?.[studentId] || {}),
            [subjectId]: value,
          },
        },
      }
      try {
        localStorage.setItem("sisforekap_v2_scores", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleUpdateTahunAjaran = (ta: string) => {
    setTahunAjaran(ta)
    try {
      localStorage.setItem("sisforekap_ta", ta)
    } catch {}
  }

  const handleUpdateTahunAjaranList: React.Dispatch<React.SetStateAction<string[]>> = (updater) => {
    setTahunAjaranList((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try {
        localStorage.setItem("sisforekap_ta_list", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleUpdateSchoolProfile = (profile: SchoolProfile) => {
    setSchoolProfile(profile)
    try {
      localStorage.setItem("sisforekap_school_profile", JSON.stringify(profile))
    } catch {}
  }

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user)
    try {
      sessionStorage.setItem("sisforekap_session_user", JSON.stringify(user))
    } catch {}
    if (user.role === "admin") {
      setActivePage("admin-dashboard")
    } else {
      setActivePage("walikelas-dashboard")
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    try {
      sessionStorage.removeItem("sisforekap_session_user")
    } catch {}
    setActivePage("login")
  }

  const handleSubmitValidationForCurrentUser = (semesterId: string = "sem-5") => {
    if (!currentUser || currentUser.role !== "walikelas") return
    const assignedClass = currentUser.assignedClass || "Kelas IX-A"
    const normSem = normalizeSemesterId(semesterId)
    const semMeta = getSemesterMeta(normSem)

    const lockState = getSemesterLockState({
      className: assignedClass,
      semesterId: normSem,
      rule: walikelasLoginRule,
      validationQueue,
    })
    if (lockState.isLocked) return

    const targetRoom = assignedClass.trim().toLowerCase()
    const classStudents = students.filter(
      (s) => (s.classRoom || "").trim().toLowerCase() === targetRoom
    )
    const semScores = scoresBySemester[normSem] || {}

    let sumAvg = 0
    let countWithScores = 0
    classStudents.forEach((std) => {
      const vals = Object.values(semScores[std.id] || {}).filter(
        (v): v is number => typeof v === "number"
      )
      if (vals.length > 0) {
        sumAvg += vals.reduce((a, b) => a + b, 0) / vals.length
        countWithScores++
      }
    })
    const avgScore = countWithScores > 0 ? parseFloat((sumAvg / countWithScores).toFixed(1)) : 0
    const completeness =
      classStudents.length > 0 ? Math.round((countWithScores / classStudents.length) * 100) : 100

    handleUpdateValidationQueue((prev) => {
      const existing = prev.find(
        (v) =>
          (v.className || "").trim().toLowerCase() === targetRoom &&
          normalizeSemesterId(v.semesterId) === normSem
      )
      const newItem: ClassValidationItem = {
        id: existing ? existing.id : `val-${Date.now()}-${normSem}`,
        className: assignedClass,
        semesterId: normSem,
        semesterLabel: semMeta.label,
        grade: "IX",
        walikelasName: currentUser.name,
        walikelasNip: currentUser.nip || "-",
        studentCount: classStudents.length,
        submittedAt: new Date().toLocaleString("id-ID"),
        completeness,
        averageScore: avgScore,
        status: "menunggu_validasi",
      }
      if (existing) {
        return prev.map((v) => (v.id === existing.id ? newItem : v))
      }
      return [...prev, newItem]
    })
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        walikelasAccounts={walikelasAccounts}
        walikelasLoginRule={walikelasLoginRule}
        schoolProfile={schoolProfile}
      />
    )
  }

  const currentAssignedClass = currentUser.assignedClass || "Kelas IX-A"
  const currentWaliValidations = getClassValidations(validationQueue, currentAssignedClass)
  const currentWaliValidation =
    currentWaliValidations.find((v) => normalizeSemesterId(v.semesterId) === "sem-5") ||
    currentWaliValidations[0]

  const renderContent = () => {
    switch (activePage) {
      case "admin-dashboard":
        return (
          <AdminDashboard
            onNavigate={setActivePage}
            tahunAjaran={tahunAjaran}
            classes={classes}
            students={students}
            walikelasAccounts={walikelasAccounts}
            validationQueue={validationQueue}
          />
        )

      case "walikelas-dashboard":
        return (
          <WalikelasDashboard
            currentUser={currentUser}
            onNavigate={setActivePage}
            tahunAjaran={tahunAjaran}
            students={students}
            validationItem={currentWaliValidation}
            classValidations={currentWaliValidations}
            walikelasLoginRule={walikelasLoginRule}
            onOpenSemesterInput={(semId) => {
              setInitialInputSemester(semId)
              setActivePage("walikelas-input-nilai")
            }}
          />
        )

      case "walikelas-input-nilai":
        return (
          <InputNilaiPage
            currentUser={currentUser}
            onNavigate={setActivePage}
            tahunAjaran={tahunAjaran}
            students={students}
            onAddStudent={(newStd) => handleUpdateStudents((prev) => [...prev, newStd])}
            scoresBySemester={scoresBySemester}
            onScoreChange={handleScoreChange}
            validationItem={currentWaliValidation}
            classValidations={currentWaliValidations}
            walikelasLoginRule={walikelasLoginRule}
            initialSemester={initialInputSemester}
            onSubmitForValidation={handleSubmitValidationForCurrentUser}
            autoLockAfterSubmit={walikelasLoginRule.autoLockAfterSubmit}
          />
        )

      case "walikelas-rekap":
      case "admin-rekap":
        return (
          <RekapCetakPage
            currentUser={currentUser}
            tahunAjaran={tahunAjaran}
            schoolProfile={schoolProfile}
            classes={classes}
            walikelasAccounts={walikelasAccounts}
            students={students}
            scoresBySemester={scoresBySemester}
          />
        )

      case "admin-validasi":
        return (
          <ValidasiNilaiPage
            tahunAjaran={tahunAjaran}
            queue={validationQueue}
            onChangeQueue={handleUpdateValidationQueue}
          />
        )

      case "admin-master-siswa":
        return (
          <DataMasterPage
            tahunAjaran={tahunAjaran}
            schoolProfile={schoolProfile}
            onChangeSchoolProfile={handleUpdateSchoolProfile}
            classes={classes}
            onChangeClasses={handleUpdateClasses}
            students={students}
            onChangeStudents={handleUpdateStudents}
            walikelasAccounts={walikelasAccounts}
            onChangeWalikelasAccounts={handleUpdateWalikelasAccounts}
            walikelasLoginRule={walikelasLoginRule}
            onChangeWalikelasLoginRule={handleUpdateWalikelasLoginRule}
            validationQueue={validationQueue}
            onChangeValidationQueue={handleUpdateValidationQueue}
            initialTab="siswa"
          />
        )

      case "admin-walikelas-login":
        return (
          <DataMasterPage
            tahunAjaran={tahunAjaran}
            schoolProfile={schoolProfile}
            onChangeSchoolProfile={handleUpdateSchoolProfile}
            classes={classes}
            onChangeClasses={handleUpdateClasses}
            students={students}
            onChangeStudents={handleUpdateStudents}
            walikelasAccounts={walikelasAccounts}
            onChangeWalikelasAccounts={handleUpdateWalikelasAccounts}
            walikelasLoginRule={walikelasLoginRule}
            onChangeWalikelasLoginRule={handleUpdateWalikelasLoginRule}
            validationQueue={validationQueue}
            onChangeValidationQueue={handleUpdateValidationQueue}
            initialTab="walikelas"
          />
        )

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Halaman</CardTitle>
              <CardDescription>Konten sedang dalam proses pengembangan.</CardDescription>
            </CardHeader>
          </Card>
        )
    }
  }

  return (
    <MainLayout
      currentUser={currentUser}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      tahunAjaran={tahunAjaran}
      onChangeTahunAjaran={handleUpdateTahunAjaran}
      tahunAjaranList={tahunAjaranList}
      onChangeTahunAjaranList={handleUpdateTahunAjaranList}
      schoolProfile={schoolProfile}
      onChangeSchoolProfile={handleUpdateSchoolProfile}
    >
      {renderContent()}
    </MainLayout>
  )
}

export default App
