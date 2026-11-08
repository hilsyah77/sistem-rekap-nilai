export interface Subject {
  id: string
  code: string // Kode utama misal: QH, AA, FIQ, MTK
  shortName: string // Nama singkatan misal: Qurdis, Akidah, Mtk
  name: string // Nama lengkap resmi
  kkm: number
  category: 'pai' | 'umum' | 'mulok'
}

export interface StudentScoreRow {
  id: string
  nisn: string
  nis: string
  name: string
  gender: 'L' | 'P'
  scores: Record<string, number | ''> // key: subject id, value: score 0-100
}

export const MADRASAH_SUBJECTS: Subject[] = [
  { id: 'qh', code: 'QH', shortName: 'Qurdis', name: "Al Qur'an Hadis", kkm: 75, category: 'pai' },
  { id: 'aa', code: 'AA', shortName: 'Akidah', name: 'Akidah Akhlak', kkm: 75, category: 'pai' },
  { id: 'fiq', code: 'FIQ', shortName: 'Fikih', name: 'Fikih', kkm: 75, category: 'pai' },
  { id: 'ski', code: 'SKI', shortName: 'SKI', name: 'Sejarah Kebudayaan Islam', kkm: 75, category: 'pai' },
  { id: 'pp', code: 'PP', shortName: 'PKn', name: 'Pendidikan Pancasila', kkm: 75, category: 'umum' },
  { id: 'bind', code: 'Bind', shortName: 'B. Indo', name: 'Bahasa Indonesia', kkm: 75, category: 'umum' },
  { id: 'barab', code: 'B. Arab', shortName: 'Barab', name: 'Bahasa Arab', kkm: 75, category: 'umum' },
  { id: 'mtk', code: 'MTK', shortName: 'Mtk', name: 'Matematika', kkm: 75, category: 'umum' },
  { id: 'ipa', code: 'IPA', shortName: 'IPA', name: 'Ilmu Pengetahuan Alam', kkm: 75, category: 'umum' },
  { id: 'ips', code: 'IPS', shortName: 'IPS', name: 'Ilmu Pengetahuan Sosial', kkm: 75, category: 'umum' },
  { id: 'bing', code: 'Bing', shortName: 'B. Ing', name: 'Bahasa Inggris', kkm: 75, category: 'umum' },
  { id: 'sbk', code: 'SBK', shortName: 'Prakarya', name: 'Seni dan Prakarya', kkm: 75, category: 'umum' },
  { id: 'pjok', code: 'PJOK', shortName: 'PJOK', name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', kkm: 75, category: 'umum' },
  { id: 'tik', code: 'TIK', shortName: 'Info', name: 'Informatika', kkm: 75, category: 'umum' },
  { id: 'bda', code: 'Bda', shortName: 'B. Daerah', name: 'Bahasa Daerah', kkm: 75, category: 'mulok' },
  { id: 'knu', code: 'KNU', shortName: 'Ke-NU-an', name: 'Ke-NU-An', kkm: 75, category: 'mulok' },
]

export const MOCK_STUDENTS: StudentScoreRow[] = []

export const SEMESTER_TABS = [
  { id: 'sem-1', label: 'Semester 1', gradeLabel: 'Kelas VII Ganjil', isCompleted: true },
  { id: 'sem-2', label: 'Semester 2', gradeLabel: 'Kelas VII Genap', isCompleted: true },
  { id: 'sem-3', label: 'Semester 3', gradeLabel: 'Kelas VIII Ganjil', isCompleted: true },
  { id: 'sem-4', label: 'Semester 4', gradeLabel: 'Kelas VIII Genap', isCompleted: true },
  { id: 'sem-5', label: 'Semester 5', gradeLabel: 'Kelas IX Ganjil', isCompleted: false, isCurrent: true },
  { id: 'uam', label: 'UAM (Ujian Akhir)', gradeLabel: 'Kelulusan Madrasah', isCompleted: false },
]
