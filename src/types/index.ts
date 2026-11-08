export type UserRole = 'admin' | 'walikelas'

export interface User {
  id: string
  name: string
  username: string
  role: UserRole
  assignedClass?: string // misal: "Kelas IX-A" untuk Walikelas
  nip?: string
  avatar?: string
}

export interface WalikelasAccount {
  id: string
  username: string
  password: string
  name: string
  nip: string
  assignedClass: string
  isActive: boolean
  canInputNilai: boolean
  canPrintRapor: boolean
  createdAt: string
}

export interface WalikelasLoginRule {
  allowWalikelasLogin: boolean
  autoLockAfterSubmit: boolean
  requireNip: boolean
}

export interface SchoolProfile {
  name: string
  ministryHeader1: string
  ministryHeader2: string
  nsm: string
  npsn: string
  accreditation: string
  accreditationLabel: string
  address: string
  city: string
  phone: string
  website: string
  email: string
  headmasterName: string
  headmasterNip: string
  titimangsa: string
}

export interface NavItem {
  id: string
  title: string
  icon: string
  badge?: string | number
  badgeVariant?: 'default' | 'warning' | 'destructive' | 'info'
  description?: string
}

export type ActivePage = 
  // Admin pages
  | 'admin-dashboard'
  | 'admin-master-siswa'
  | 'admin-validasi'
  | 'admin-walikelas-login'
  // Walikelas pages
  | 'walikelas-dashboard'
  | 'walikelas-input-nilai'
  | 'walikelas-rekap'
  // Auth
  | 'login'
