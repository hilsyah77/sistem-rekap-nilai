-- ============================================================================
-- SCHEMA DATABASE MYSQL / MARIADB: SISTEM REKAP NILAI KELAS IX (SISFOREKAP)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS sisforekap_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sisforekap_db;

-- 1. Tabel Profil Sekolah / Madrasah
CREATE TABLE IF NOT EXISTS school_profile (
  id INT PRIMARY KEY DEFAULT 1,
  name VARCHAR(200) NOT NULL DEFAULT 'MTs Negeri 1 Kota Semarang',
  ministry_header1 VARCHAR(200) NOT NULL DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  ministry_header2 VARCHAR(200) NOT NULL DEFAULT 'KANTOR KEMENTERIAN AGAMA KOTA SEMARANG',
  nsm VARCHAR(50) DEFAULT '121133740001',
  npsn VARCHAR(50) DEFAULT '20363812',
  accreditation VARCHAR(10) DEFAULT 'A',
  accreditation_label VARCHAR(50) DEFAULT 'Unggul',
  address TEXT,
  city VARCHAR(100) DEFAULT 'Semarang',
  phone VARCHAR(50) DEFAULT '(024) 7654321',
  website VARCHAR(150) DEFAULT 'mtsn1-semarang.sch.id',
  email VARCHAR(150) DEFAULT 'info@mtsn1-semarang.sch.id',
  headmaster_name VARCHAR(150) DEFAULT 'Kepala Madrasah',
  headmaster_nip VARCHAR(50) DEFAULT '-',
  titimangsa VARCHAR(150) DEFAULT 'Semarang, 20 Desember 2026',
  logo_url LONGTEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default profil jika belum ada
INSERT IGNORE INTO school_profile (
  id, name, ministry_header1, ministry_header2, nsm, npsn,
  accreditation, accreditation_label, address, city, phone,
  website, email, headmaster_name, headmaster_nip, titimangsa
) VALUES (
  1,
  'MTs Negeri 1 Kota Semarang',
  'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  'KANTOR KEMENTERIAN AGAMA KOTA SEMARANG',
  '121133740001',
  '20363812',
  'A',
  'Unggul',
  'Jl. Al-Ikhlas No. 45, Kota Semarang',
  'Semarang',
  '(024) 7654321',
  'mtsn1-semarang.sch.id',
  'info@mtsn1-semarang.sch.id',
  'Kepala Madrasah',
  '-',
  'Semarang, 20 Desember 2026'
);

-- 2. Tabel Rombongan Belajar (Kelas)
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  grade VARCHAR(20) NOT NULL DEFAULT 'IX',
  walikelas_name VARCHAR(150) DEFAULT '',
  walikelas_nip VARCHAR(50) DEFAULT '-',
  academic_year VARCHAR(20) DEFAULT '2025/2026',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Data Master Siswa
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  nisn VARCHAR(30) NOT NULL,
  nis VARCHAR(30) DEFAULT '',
  name VARCHAR(150) NOT NULL,
  gender ENUM('L', 'P') NOT NULL DEFAULT 'L',
  class_room VARCHAR(100) NOT NULL,
  grade VARCHAR(20) NOT NULL DEFAULT 'IX',
  status VARCHAR(30) NOT NULL DEFAULT 'aktif',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_students_class (class_room),
  INDEX idx_students_nisn (nisn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Akun Login Wali Kelas
CREATE TABLE IF NOT EXISTS walikelas_accounts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  nip VARCHAR(50) DEFAULT '-',
  assigned_class VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Nilai Siswa per Semester & Mata Pelajaran
CREATE TABLE IF NOT EXISTS student_scores (
  semester_id VARCHAR(32) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (semester_id, student_id, subject_id),
  INDEX idx_scores_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Antrean Validasi Nilai Kelas
CREATE TABLE IF NOT EXISTS validation_queue (
  id VARCHAR(64) PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  grade VARCHAR(20) NOT NULL DEFAULT 'IX',
  walikelas_name VARCHAR(150) NOT NULL,
  walikelas_nip VARCHAR(50) DEFAULT '-',
  student_count INT NOT NULL DEFAULT 0,
  submitted_at VARCHAR(100) DEFAULT '',
  completeness INT NOT NULL DEFAULT 0,
  average_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'menunggu_validasi',
  revision_note TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_validation_class (class_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Sinkronisasi State Aplikasi (Key-Value JSON Store)
CREATE TABLE IF NOT EXISTS app_store (
  store_key VARCHAR(100) PRIMARY KEY,
  store_value LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
