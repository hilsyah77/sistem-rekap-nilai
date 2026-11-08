export type ClassValidationStatus = 'menunggu_validasi' | 'disetujui' | 'revisi' | 'draft'

export interface ClassValidationItem {
  id: string
  className: string
  grade: 'VII' | 'VIII' | 'IX'
  walikelasName: string
  walikelasNip: string
  studentCount: number
  submittedAt: string
  completeness: number // 0-100%
  averageScore: number
  status: ClassValidationStatus
  revisionNotes?: string
  lastUpdated?: string
}

export const MOCK_VALIDATION_QUEUE: ClassValidationItem[] = []
