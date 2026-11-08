require("dotenv").config()
const path = require("path")
const fs = require("fs")
const express = require("express")
const cors = require("cors")
const mysql = require("mysql2/promise")

const app = express()
const PORT = Number(process.env.PORT || 3000)

const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sisforekap_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

app.use(cors())
app.use(express.json({ limit: "25mb" }))

let pool = null

async function initDatabase() {
  try {
    // 1. Buat database terlebih dahulu jika belum ada
    const rootConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      multipleStatements: true,
    })

    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    )
    await rootConn.end()

    // 2. Buat connection pool ke database
    pool = mysql.createPool({
      ...DB_CONFIG,
      multipleStatements: true,
    })

    // 3. Jalankan schema.sql untuk memastikan semua tabel siap
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql")
    if (fs.existsSync(schemaPath)) {
      const rawSchema = fs.readFileSync(schemaPath, "utf8")
      // Hilangkan baris CREATE DATABASE / USE agar aman dijalankan di DB yang dipilih
      const cleanedSchema = rawSchema
        .replace(/CREATE DATABASE[\s\S]*?;/gi, "")
        .replace(/USE\s+\w+\s*;/gi, "")
      await pool.query(cleanedSchema)
    }

    console.log(`[Database] Terhubung ke MySQL (${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database})`)
  } catch (err) {
    console.error("[Database] Gagal menginisialisasi MySQL:", err.message)
  }
}

/**
 * Sinkronisasi data JSON dari frontend ke tabel relasional MySQL
 */
async function syncRelationalTables(key, rawValue) {
  if (!pool) return
  let parsed
  try {
    parsed = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue
  } catch {
    parsed = rawValue
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    if (key === "sisforekap_school_profile" && parsed && typeof parsed === "object") {
      await conn.query(
        `INSERT INTO school_profile (
          id, name, ministry_header1, ministry_header2, nsm, npsn,
          accreditation, accreditation_label, address, city, phone,
          website, email, headmaster_name, headmaster_nip, titimangsa, logo_url
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          ministry_header1 = VALUES(ministry_header1),
          ministry_header2 = VALUES(ministry_header2),
          nsm = VALUES(nsm),
          npsn = VALUES(npsn),
          accreditation = VALUES(accreditation),
          accreditation_label = VALUES(accreditation_label),
          address = VALUES(address),
          city = VALUES(city),
          phone = VALUES(phone),
          website = VALUES(website),
          email = VALUES(email),
          headmaster_name = VALUES(headmaster_name),
          headmaster_nip = VALUES(headmaster_nip),
          titimangsa = VALUES(titimangsa),
          logo_url = VALUES(logo_url)`,
        [
          parsed.name || "MTs Negeri 1 Kota Semarang",
          parsed.ministryHeader1 || "KEMENTERIAN AGAMA REPUBLIK INDONESIA",
          parsed.ministryHeader2 || "KANTOR KEMENTERIAN AGAMA KOTA SEMARANG",
          parsed.nsm || "",
          parsed.npsn || "",
          parsed.accreditation || "A",
          parsed.accreditationLabel || "Unggul",
          parsed.address || "",
          parsed.city || "",
          parsed.phone || "",
          parsed.website || "",
          parsed.email || "",
          parsed.headmasterName || "Kepala Madrasah",
          parsed.headmasterNip || "-",
          parsed.titimangsa || "",
          parsed.logoUrl || null,
        ]
      )
    } else if (key === "sisforekap_v2_classes" && Array.isArray(parsed)) {
      await conn.query("DELETE FROM classes")
      for (const cls of parsed) {
        if (!cls || !cls.id) continue
        await conn.query(
          `INSERT INTO classes (id, name, grade, walikelas_name, walikelas_nip, academic_year)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            String(cls.id),
            String(cls.name || ""),
            String(cls.grade || "IX"),
            String(cls.walikelasName || cls.homeroomTeacher || ""),
            String(cls.walikelasNip || "-"),
            String(cls.academicYear || "2025/2026"),
          ]
        )
      }
    } else if (key === "sisforekap_v2_students" && Array.isArray(parsed)) {
      await conn.query("DELETE FROM students")
      for (const std of parsed) {
        if (!std || !std.id) continue
        await conn.query(
          `INSERT INTO students (id, nisn, nis, name, gender, class_room, grade, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            String(std.id),
            String(std.nisn || ""),
            String(std.nis || ""),
            String(std.name || ""),
            std.gender === "P" ? "P" : "L",
            String(std.classRoom || ""),
            String(std.grade || "IX"),
            String(std.status || "aktif"),
          ]
        )
      }
    } else if (key === "sisforekap_v2_walikelas_accounts" && Array.isArray(parsed)) {
      await conn.query("DELETE FROM walikelas_accounts")
      for (const acc of parsed) {
        if (!acc || !acc.id || !acc.username) continue
        await conn.query(
          `INSERT INTO walikelas_accounts (id, name, nip, assigned_class, username, password, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            String(acc.id),
            String(acc.name || ""),
            String(acc.nip || "-"),
            String(acc.assignedClass || ""),
            String(acc.username || ""),
            String(acc.password || ""),
            acc.isActive === false ? 0 : 1,
          ]
        )
      }
    } else if (key === "sisforekap_v2_validations" && Array.isArray(parsed)) {
      await conn.query("DELETE FROM validation_queue")
      for (const v of parsed) {
        if (!v || !v.id) continue
        await conn.query(
          `INSERT INTO validation_queue (
            id, class_name, grade, walikelas_name, walikelas_nip,
            student_count, submitted_at, completeness, average_score, status, revision_note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            String(v.id),
            String(v.className || ""),
            String(v.grade || "IX"),
            String(v.walikelasName || ""),
            String(v.walikelasNip || "-"),
            Number(v.studentCount || 0),
            String(v.submittedAt || ""),
            Number(v.completeness || 0),
            Number(v.averageScore || 0),
            String(v.status || "menunggu_validasi"),
            v.revisionNote ? String(v.revisionNote) : null,
          ]
        )
      }
    } else if (key === "sisforekap_v2_scores" && parsed && typeof parsed === "object") {
      await conn.query("DELETE FROM student_scores")
      for (const [semesterId, studentsMap] of Object.entries(parsed)) {
        if (!studentsMap || typeof studentsMap !== "object") continue
        for (const [studentId, subjectsMap] of Object.entries(studentsMap)) {
          if (!subjectsMap || typeof subjectsMap !== "object") continue
          for (const [subjectId, scoreVal] of Object.entries(subjectsMap)) {
            if (scoreVal === "" || scoreVal === null || scoreVal === undefined) continue
            const numScore = Number(scoreVal)
            if (Number.isNaN(numScore)) continue
            await conn.query(
              `INSERT INTO student_scores (semester_id, student_id, subject_id, score)
               VALUES (?, ?, ?, ?)`,
              [String(semesterId), String(studentId), String(subjectId), numScore]
            )
          }
        }
      }
    }

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    console.error(`[Database] Gagal sinkronisasi tabel relasional untuk ${key}:`, err.message)
  } finally {
    conn.release()
  }
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

app.get("/api/health", async (_req, res) => {
  try {
    if (!pool) throw new Error("Database pool belum siap")
    await pool.query("SELECT 1")
    res.json({ ok: true, status: "connected", database: DB_CONFIG.database })
  } catch (err) {
    res.status(500).json({ ok: false, status: "disconnected", error: err.message })
  }
})

// Ambil seluruh state aplikasi dari database MySQL
app.get("/api/state", async (_req, res) => {
  try {
    if (!pool) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await pool.query("SELECT store_key, store_value, updated_at FROM app_store")
    const state = {}
    for (const row of rows) {
      state[row.store_key] = row.store_value
    }
    res.json({ ok: true, state })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Simpan satu key state aplikasi ke MySQL
app.put("/api/state/:key", async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const { key } = req.params
    const rawValue =
      typeof req.body.value === "string" ? req.body.value : JSON.stringify(req.body.value ?? "")

    await pool.query(
      `INSERT INTO app_store (store_key, store_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)`,
      [key, rawValue]
    )

    await syncRelationalTables(key, rawValue)
    res.json({ ok: true, key })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Simpan banyak key sekaligus (batch sync)
app.post("/api/state", async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const entries = req.body?.state || {}
    for (const [key, val] of Object.entries(entries)) {
      const rawValue = typeof val === "string" ? val : JSON.stringify(val)
      await pool.query(
        `INSERT INTO app_store (store_key, store_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)`,
        [key, rawValue]
      )
      await syncRelationalTables(key, rawValue)
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Endpoint relasional untuk melihat data langsung dari tabel MySQL
app.get("/api/school-profile", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM school_profile WHERE id = 1")
    res.json({ ok: true, data: rows[0] || null })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/classes", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM classes ORDER BY name ASC")
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/students", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students ORDER BY class_room ASC, name ASC")
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/walikelas", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, nip, assigned_class, username, is_active, updated_at FROM walikelas_accounts ORDER BY assigned_class ASC"
    )
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/scores", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM student_scores")
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/validations", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM validation_queue ORDER BY class_name ASC")
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ============================================================================
// SERVE FRONTEND BUILD (../dist)
// ============================================================================
const distDir = path.join(__dirname, "..", "dist")
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next()
    res.sendFile(path.join(distDir, "index.html"))
  })
}

initDatabase().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Sistem Rekap Nilai berjalan di http://0.0.0.0:${PORT}`)
  })
})
