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

// Pastikan semua response API tidak pernah di-cache oleh browser/proxy
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  next()
})

let pool = null
let initPromise = null

// Antrean tulis berurutan per key agar tidak terjadi race condition / deadlock MySQL
const keyWriteQueues = new Map()
function enqueueKeyWrite(key, taskFn) {
  const prev = keyWriteQueues.get(key) || Promise.resolve()
  const next = prev.then(taskFn, taskFn)
  keyWriteQueues.set(
    key,
    next.catch(() => {})
  )
  return next
}

async function initDatabase() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      // 1. Coba buat database jika user punya hak akses (opsional/non-fatal bila DB sudah dibuat)
      try {
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
      } catch (createErr) {
        console.warn("[Database] Lewati CREATE DATABASE (lanjut koneksi langsung):", createErr.message)
      }

      // 2. Buat connection pool ke database
      const nextPool = mysql.createPool({
        ...DB_CONFIG,
        multipleStatements: true,
      })

      // Uji koneksi terlebih dahulu
      await nextPool.query("SELECT 1")

      // 3. Jalankan schema.sql untuk memastikan semua tabel siap
      const schemaPath = path.join(__dirname, "..", "database", "schema.sql")
      if (fs.existsSync(schemaPath)) {
        const rawSchema = fs.readFileSync(schemaPath, "utf8")
        // Hilangkan baris CREATE DATABASE / USE agar aman dijalankan di DB yang dipilih
        const cleanedSchema = rawSchema
          .replace(/CREATE DATABASE[\s\S]*?;/gi, "")
          .replace(/USE\s+\w+\s*;/gi, "")
        await nextPool.query(cleanedSchema)
      }

      pool = nextPool
      console.log(`[Database] Terhubung ke MySQL (${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database})`)
    } catch (err) {
      pool = null
      console.error("[Database] Gagal menginisialisasi MySQL:", err.message)
    } finally {
      initPromise = null
    }
  })()
  return initPromise
}

async function ensurePool() {
  if (pool) return pool
  await initDatabase()
  return pool
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
            v.revisionNotes || v.revisionNote ? String(v.revisionNotes || v.revisionNote) : null,
          ]
        )
      }
    } else if (key === "sisforekap_v2_scores" && parsed && typeof parsed === "object") {
      const rowsToInsert = []
      for (const [semesterId, studentsMap] of Object.entries(parsed)) {
        if (!studentsMap || typeof studentsMap !== "object") continue
        for (const [studentId, subjectsMap] of Object.entries(studentsMap)) {
          if (!subjectsMap || typeof subjectsMap !== "object") continue
          for (const [subjectId, scoreVal] of Object.entries(subjectsMap)) {
            if (scoreVal === "" || scoreVal === null || scoreVal === undefined) continue
            const numScore = Number(scoreVal)
            if (Number.isNaN(numScore)) continue
            rowsToInsert.push([String(semesterId), String(studentId), String(subjectId), numScore])
          }
        }
      }

      await conn.query("DELETE FROM student_scores")
      const BATCH_SIZE = 200
      for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
        const batch = rowsToInsert.slice(i, i + BATCH_SIZE)
        await conn.query(
          `INSERT INTO student_scores (semester_id, student_id, subject_id, score)
           VALUES ?
           ON DUPLICATE KEY UPDATE score = VALUES(score)`,
          [batch]
        )
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
    const db = await ensurePool()
    if (!db) throw new Error("Database pool belum siap")
    await db.query("SELECT 1")
    res.json({ ok: true, status: "connected", database: DB_CONFIG.database })
  } catch (err) {
    res.status(500).json({ ok: false, status: "disconnected", error: err.message })
  }
})

// Ambil seluruh state aplikasi dari database MySQL
app.get("/api/state", async (_req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await db.query("SELECT store_key, store_value, updated_at FROM app_store")
    const state = {}
    for (const row of rows) {
      if (row.store_key === "sisforekap_session_user") continue
      state[row.store_key] = row.store_value
    }
    res.json({ ok: true, state })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Simpan perubahan nilai secara inkremental (aman untuk banyak perangkat bersamaan)
app.patch("/api/scores", async (req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })

    const changes = Array.isArray(req.body?.changes) ? req.body.changes : []
    if (changes.length === 0) {
      return res.json({ ok: true, updated: 0 })
    }

    const updatedCount = await enqueueKeyWrite("sisforekap_v2_scores", async () => {
      const conn = await db.getConnection()
      try {
        await conn.beginTransaction()

        // 1. Ambil JSON nilai terakhir dari app_store (lock row agar konsisten)
        const [rows] = await conn.query(
          "SELECT store_value FROM app_store WHERE store_key = 'sisforekap_v2_scores' FOR UPDATE"
        )
        let currentScores = {}
        if (rows.length > 0 && rows[0].store_value) {
          try {
            const parsed = JSON.parse(rows[0].store_value)
            if (parsed && typeof parsed === "object") currentScores = parsed
          } catch {}
        }

        const upserts = []
        const deletes = []

        for (const ch of changes) {
          if (!ch || !ch.semesterId || !ch.studentId || !ch.subjectId) continue
          const semId = String(ch.semesterId)
          const stdId = String(ch.studentId)
          const subId = String(ch.subjectId)
          const val = ch.value

          if (!currentScores[semId] || typeof currentScores[semId] !== "object") {
            currentScores[semId] = {}
          }
          if (!currentScores[semId][stdId] || typeof currentScores[semId][stdId] !== "object") {
            currentScores[semId][stdId] = {}
          }

          if (val === "" || val === null || val === undefined) {
            currentScores[semId][stdId][subId] = ""
            deletes.push([semId, stdId, subId])
          } else {
            const numScore = Number(val)
            if (!Number.isNaN(numScore)) {
              currentScores[semId][stdId][subId] = numScore
              upserts.push([semId, stdId, subId, numScore])
            }
          }
        }

        // 2. Simpan JSON hasil merge ke app_store
        await conn.query(
          `INSERT INTO app_store (store_key, store_value)
           VALUES ('sisforekap_v2_scores', ?)
           ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)`,
          [JSON.stringify(currentScores)]
        )

        // 3. Upsert & delete hanya baris yang berubah di tabel relasional student_scores
        if (upserts.length > 0) {
          await conn.query(
            `INSERT INTO student_scores (semester_id, student_id, subject_id, score)
             VALUES ?
             ON DUPLICATE KEY UPDATE score = VALUES(score)`,
            [upserts]
          )
        }
        for (const [semId, stdId, subId] of deletes) {
          await conn.query(
            `DELETE FROM student_scores WHERE semester_id = ? AND student_id = ? AND subject_id = ?`,
            [semId, stdId, subId]
          )
        }

        await conn.commit()
        return upserts.length + deletes.length
      } catch (err) {
        await conn.rollback()
        throw err
      } finally {
        conn.release()
      }
    })

    res.json({ ok: true, updated: updatedCount })
  } catch (err) {
    console.error("[Database] Gagal PATCH /api/scores:", err.message)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Simpan satu key state aplikasi ke MySQL
app.put("/api/state/:key", async (req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const { key } = req.params
    if (key === "sisforekap_session_user") {
      return res.json({ ok: true, key, skipped: true })
    }
    const rawValue =
      typeof req.body.value === "string" ? req.body.value : JSON.stringify(req.body.value ?? "")

    await enqueueKeyWrite(key, async () => {
      let valueToSave = rawValue

      // Untuk sisforekap_v2_scores, gabungkan dengan data server agar tidak menimpa nilai perangkat lain
      if (key === "sisforekap_v2_scores") {
        try {
          const incoming = JSON.parse(rawValue)
          if (incoming && typeof incoming === "object") {
            const [rows] = await db.query(
              "SELECT store_value FROM app_store WHERE store_key = 'sisforekap_v2_scores'"
            )
            let merged = {}
            if (rows.length > 0 && rows[0].store_value) {
              try {
                const existing = JSON.parse(rows[0].store_value)
                if (existing && typeof existing === "object") merged = existing
              } catch {}
            }
            for (const [semId, studentsMap] of Object.entries(incoming)) {
              if (!studentsMap || typeof studentsMap !== "object") continue
              if (!merged[semId] || typeof merged[semId] !== "object") merged[semId] = {}
              for (const [stdId, subjectsMap] of Object.entries(studentsMap)) {
                if (!subjectsMap || typeof subjectsMap !== "object") continue
                merged[semId][stdId] = {
                  ...(merged[semId][stdId] || {}),
                  ...subjectsMap,
                }
              }
            }
            valueToSave = JSON.stringify(merged)
          }
        } catch {}
      } else if (key === "sisforekap_v2_validations") {
        // Gabungkan antrean validasi per className agar pengajuan wali kelas dari perangkat lain tidak saling menimpa
        try {
          const incoming = JSON.parse(rawValue)
          if (Array.isArray(incoming)) {
            const [rows] = await db.query(
              "SELECT store_value FROM app_store WHERE store_key = 'sisforekap_v2_validations'"
            )
            let existing = []
            if (rows.length > 0 && rows[0].store_value) {
              try {
                const parsedExisting = JSON.parse(rows[0].store_value)
                if (Array.isArray(parsedExisting)) existing = parsedExisting
              } catch {}
            }
            const byClass = new Map()
            for (const item of existing) {
              if (item && item.className) byClass.set(item.className, item)
            }
            for (const item of incoming) {
              if (item && item.className) byClass.set(item.className, item)
            }
            valueToSave = JSON.stringify(Array.from(byClass.values()))
          }
        } catch {}
      }

      await db.query(
        `INSERT INTO app_store (store_key, store_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)`,
        [key, valueToSave]
      )

      await syncRelationalTables(key, valueToSave)
    })

    res.json({ ok: true, key })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Simpan banyak key sekaligus (batch sync)
app.post("/api/state", async (req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const entries = req.body?.state || {}
    for (const [key, val] of Object.entries(entries)) {
      if (key === "sisforekap_session_user") continue
      const rawValue = typeof val === "string" ? val : JSON.stringify(val)
      await enqueueKeyWrite(key, async () => {
        await db.query(
          `INSERT INTO app_store (store_key, store_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)`,
          [key, rawValue]
        )
        await syncRelationalTables(key, rawValue)
      })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Endpoint relasional untuk melihat data langsung dari tabel MySQL
app.get("/api/school-profile", async (_req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await db.query("SELECT * FROM school_profile WHERE id = 1")
    res.json({ ok: true, data: rows[0] || null })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/classes", async (_req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await db.query("SELECT * FROM classes ORDER BY name ASC")
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/students", async (_req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await db.query("SELECT * FROM students ORDER BY class_room ASC, name ASC")
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/walikelas", async (_req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await db.query(
      "SELECT id, name, nip, assigned_class, username, is_active, updated_at FROM walikelas_accounts ORDER BY assigned_class ASC"
    )
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/scores", async (_req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await db.query("SELECT * FROM student_scores")
    res.json({ ok: true, data: rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get("/api/validations", async (_req, res) => {
  try {
    const db = await ensurePool()
    if (!db) return res.status(503).json({ ok: false, error: "Database belum terhubung" })
    const [rows] = await db.query("SELECT * FROM validation_queue ORDER BY class_name ASC")
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
  app.use(
    express.static(distDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
        }
      },
    })
  )
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next()
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
    res.sendFile(path.join(distDir, "index.html"))
  })
}

initDatabase().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Sistem Rekap Nilai berjalan di http://0.0.0.0:${PORT}`)
  })
})
