import { SEMESTER_TABS } from "@/data/mockStudentScores"
import { ClassValidationItem, ClassValidationStatus } from "@/data/mockValidationQueue"
import { SemesterLockOverride, WalikelasLoginRule } from "@/types"

export function normalizeSemesterId(semesterId?: string | null): string {
  return semesterId && semesterId.trim() ? semesterId.trim() : "sem-5"
}

export function getSemesterMeta(semesterId?: string | null) {
  const norm = normalizeSemesterId(semesterId)
  const found = SEMESTER_TABS.find((t) => t.id === norm)
  return (
    found || {
      id: norm,
      label: norm === "uam" ? "UAM (Ujian Akhir)" : `Semester ${norm.replace("sem-", "")}`,
      gradeLabel: "Kelas IX",
      isCompleted: false,
    }
  )
}

export function getClassValidations(
  validationQueue: ClassValidationItem[],
  className: string
): ClassValidationItem[] {
  const target = (className || "").trim().toLowerCase()
  return validationQueue.filter((v) => (v.className || "").trim().toLowerCase() === target)
}

export function findClassSemesterValidation(
  validationQueue: ClassValidationItem[],
  className: string,
  semesterId: string
): ClassValidationItem | undefined {
  const targetClass = (className || "").trim().toLowerCase()
  const targetSem = normalizeSemesterId(semesterId)
  return validationQueue.find(
    (v) =>
      (v.className || "").trim().toLowerCase() === targetClass &&
      normalizeSemesterId(v.semesterId) === targetSem
  )
}

export function getClassOverrideMap(
  rule: WalikelasLoginRule | undefined,
  className: string
): Record<string, "locked" | "unlocked"> {
  const overrides = rule?.classSemesterOverrides
  if (!overrides) return {}
  if (overrides[className]) return overrides[className]
  const target = (className || "").trim().toLowerCase()
  for (const [k, val] of Object.entries(overrides)) {
    if (k.trim().toLowerCase() === target && val) return val
  }
  return {}
}

export interface SemesterLockState {
  semesterId: string
  semesterLabel: string
  overrideMode: SemesterLockOverride
  isGlobalLocked: boolean
  isAdminLocked: boolean
  isValidationLocked: boolean
  isLocked: boolean
  validationStatus: ClassValidationStatus
  validationItem?: ClassValidationItem
  reasonLabel: string
}

export function getSemesterLockState(params: {
  className: string
  semesterId: string
  rule?: WalikelasLoginRule
  validationQueue?: ClassValidationItem[]
}): SemesterLockState {
  const { className, semesterId, rule, validationQueue = [] } = params
  const meta = getSemesterMeta(semesterId)
  const normSem = meta.id
  const classMap = getClassOverrideMap(rule, className)
  const rawOverride = classMap[normSem]
  const overrideMode: SemesterLockOverride =
    rawOverride === "locked" || rawOverride === "unlocked" ? rawOverride : "inherit"

  const isGlobalLocked = Boolean(rule?.lockedSemesters?.[normSem])
  const isAdminLocked =
    overrideMode === "locked" ? true : overrideMode === "unlocked" ? false : isGlobalLocked

  const validationItem = findClassSemesterValidation(validationQueue, className, normSem)
  const validationStatus: ClassValidationStatus = validationItem?.status || "draft"
  const autoLockAfterSubmit = rule?.autoLockAfterSubmit ?? true
  const isValidationLocked =
    autoLockAfterSubmit &&
    (validationStatus === "menunggu_validasi" || validationStatus === "disetujui")

  const isLocked = isAdminLocked || isValidationLocked

  let reasonLabel = "Mode Input Aktif"
  if (isAdminLocked) {
    reasonLabel = overrideMode === "locked" ? "Dikunci Khusus Admin" : "Dikunci oleh Admin"
  } else if (isValidationLocked) {
    reasonLabel =
      validationStatus === "disetujui" ? "Disetujui & Terkunci" : "Menunggu Validasi Admin"
  } else if (overrideMode === "unlocked" && isGlobalLocked) {
    reasonLabel = "Dibuka Khusus Admin"
  }

  return {
    semesterId: normSem,
    semesterLabel: meta.label,
    overrideMode,
    isGlobalLocked,
    isAdminLocked,
    isValidationLocked,
    isLocked,
    validationStatus,
    validationItem,
    reasonLabel,
  }
}
