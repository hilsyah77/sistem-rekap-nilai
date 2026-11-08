import { User, SchoolProfile, WalikelasLoginRule } from '@/types'

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: 'MTs Negeri 1 Kota Semarang',
  ministryHeader1: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  ministryHeader2: 'KANTOR KEMENTERIAN AGAMA KOTA SEMARANG',
  nsm: '121133740001',
  npsn: '20363812',
  accreditation: 'A',
  accreditationLabel: 'Unggul',
  address: 'Jl. Al-Ikhlas No. 45, Kota Semarang',
  city: 'Semarang',
  phone: '(024) 7654321',
  website: 'mtsn1-semarang.sch.id',
  email: 'info@mtsn1-semarang.sch.id',
  headmasterName: 'Kepala Madrasah',
  headmasterNip: '-',
  titimangsa: 'Semarang, 20 Desember 2026',
}

export const DEFAULT_WALIKELAS_LOGIN_RULE: WalikelasLoginRule = {
  allowWalikelasLogin: true,
  autoLockAfterSubmit: true,
  requireNip: false,
}

export const ADMIN_USER: User = {
  id: 'usr-admin',
  name: 'Apris Dwi Priyatomo, S.Pd',
  username: 'admin',
  role: 'admin',
  nip: '-',
}

export const ADMIN_NAV_ITEMS = [
  {
    id: 'admin-dashboard',
    title: 'Dashboard Admin',
    icon: 'LayoutDashboard',
    description: 'Ringkasan & statistik pengisian nilai',
  },
  {
    id: 'admin-master-siswa',
    title: 'Manajemen Data Master',
    icon: 'Database',
    description: 'Data Siswa, Rombel, Mapel & Profil Sekolah',
  },
  {
    id: 'admin-walikelas-login',
    title: 'Pengaturan Login Walikelas',
    icon: 'UserCheck',
    description: 'Kelola akun & rule login wali kelas',
  },
  {
    id: 'admin-validasi',
    title: 'Validasi Nilai',
    icon: 'CheckCircle2',
    description: 'Antrean persetujuan & catatan revisi',
  },
  {
    id: 'admin-rekap',
    title: 'Rekap & Cetak Raport',
    icon: 'Printer',
    description: 'Cetak lembar raport, leger & transkrip kelulusan',
  },
]

export const WALIKELAS_NAV_ITEMS = [
  {
    id: 'walikelas-dashboard',
    title: 'Dashboard Walikelas',
    icon: 'LayoutDashboard',
    description: 'Status verifikasi & catatan rekap',
  },
  {
    id: 'walikelas-input-nilai',
    title: 'Input Nilai Siswa',
    icon: 'TableProperties',
    description: 'Spreadsheet nilai per semester & UAM',
  },
  {
    id: 'walikelas-rekap',
    title: 'Rekap & Cetak Raport',
    icon: 'Printer',
    description: 'Cetak lembar raport, leger & SKL',
  },
]
