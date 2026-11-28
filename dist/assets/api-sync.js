/**
 * Sinkronisasi Otomatis Frontend <-> Backend MySQL VPS
 * Menghubungkan state aplikasi (sisforekap_*) dengan REST API /api/state & /api/scores di VPS
 */
;(function () {
  var isHttp = window.location.protocol === "http:" || window.location.protocol === "https:"
  if (!isHttp) return

  var API_BASE = window.SISFOREKAP_API_BASE || "/api"
  var origSetItem = Storage.prototype.setItem
  var lastSyncedScores = {}
  var pendingScoreChanges = {}
  var scoreFlushTimer = null
  var isFlushingScores = false
  var pendingKeyWrites = {}
  var keyFlushTimers = {}
  var statusEl = null
  var statusHideTimer = null

  function safeParseJson(str, fallback) {
    try {
      var v = JSON.parse(str)
      return v && typeof v === "object" ? v : fallback
    } catch (_e) {
      return fallback
    }
  }

  function showSyncStatus(state, message) {
    if (typeof document === "undefined" || !document.body) return
    if (!statusEl) {
      statusEl = document.createElement("div")
      statusEl.id = "sisforekap-sync-badge"
      statusEl.style.cssText =
        "position:fixed;bottom:14px;right:14px;z-index:99999;padding:8px 14px;border-radius:9999px;" +
        "font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:600;" +
        "box-shadow:0 4px 14px rgba(0,0,0,0.16);transition:opacity 0.2s ease;display:none;"
      statusEl.addEventListener("click", function () {
        if (statusEl && statusEl.dataset.state === "error") {
          flushAllPending(false)
        }
      })
      document.body.appendChild(statusEl)
    }

    if (statusHideTimer) {
      clearTimeout(statusHideTimer)
      statusHideTimer = null
    }

    statusEl.dataset.state = state
    statusEl.textContent = message
    statusEl.style.display = "block"
    statusEl.style.opacity = "1"

    if (state === "saving") {
      statusEl.style.background = "#fef3c7"
      statusEl.style.color = "#92400e"
      statusEl.style.border = "1px solid #f59e0b"
      statusEl.style.cursor = "default"
    } else if (state === "saved") {
      statusEl.style.background = "#dcfce7"
      statusEl.style.color = "#166534"
      statusEl.style.border = "1px solid #22c55e"
      statusEl.style.cursor = "default"
      statusHideTimer = setTimeout(function () {
        if (statusEl && statusEl.dataset.state === "saved") {
          statusEl.style.opacity = "0"
          setTimeout(function () {
            if (statusEl && statusEl.dataset.state === "saved") {
              statusEl.style.display = "none"
            }
          }, 220)
        }
      }, 2200)
    } else if (state === "error") {
      statusEl.style.background = "#fee2e2"
      statusEl.style.color = "#991b1b"
      statusEl.style.border = "1px solid #ef4444"
      statusEl.style.cursor = "pointer"
    }
  }

  // 1. Hydrate data terbaru dari MySQL VPS sebelum React pertama kali me-render
  try {
    var xhr = new XMLHttpRequest()
    xhr.open("GET", API_BASE + "/state?_t=" + Date.now(), false)
    xhr.setRequestHeader("Cache-Control", "no-cache")
    xhr.send(null)
    if (xhr.status >= 200 && xhr.status < 300) {
      var res = JSON.parse(xhr.responseText)
      if (res && res.ok && res.state) {
        var dbKeys = Object.keys(res.state).filter(function (k) {
          return k !== "sisforekap_session_user"
        })
        if (dbKeys.length > 0) {
          dbKeys.forEach(function (k) {
            origSetItem.call(localStorage, k, res.state[k])
          })
          // Jika ada key sisforekap_* lokal yang belum pernah masuk DB (misal scores), ikut unggah
          var missingPayload = {}
          var hasMissing = false
          for (var m = 0; m < localStorage.length; m++) {
            var localKey = localStorage.key(m)
            if (
              localKey &&
              localKey.indexOf("sisforekap_") === 0 &&
              localKey !== "sisforekap_session_user" &&
              !Object.prototype.hasOwnProperty.call(res.state, localKey)
            ) {
              missingPayload[localKey] = localStorage.getItem(localKey)
              hasMissing = true
            }
          }
          if (hasMissing) {
            fetch(API_BASE + "/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: missingPayload }),
            }).catch(function () {})
          }
        } else {
          // Jika database di VPS masih kosong namun browser punya data lokal, unggah ke VPS
          var initialPayload = {}
          var hasLocal = false
          for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i)
            if (key && key.indexOf("sisforekap_") === 0 && key !== "sisforekap_session_user") {
              initialPayload[key] = localStorage.getItem(key)
              hasLocal = true
            }
          }
          if (hasLocal) {
            fetch(API_BASE + "/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: initialPayload }),
            }).catch(function () {})
          }
        }
      }
    } else {
      console.warn("[ApiSync] Gagal mengambil state dari server (HTTP " + xhr.status + ")")
    }
  } catch (e) {
    console.warn("[ApiSync] Backend belum terjangkau, menggunakan localStorage:", e && e.message)
  }

  lastSyncedScores = safeParseJson(localStorage.getItem("sisforekap_v2_scores") || "{}", {})

  function collectScoreDiff(prevScores, nextScores) {
    var semIds = {}
    Object.keys(prevScores || {}).forEach(function (k) { semIds[k] = true })
    Object.keys(nextScores || {}).forEach(function (k) { semIds[k] = true })

    Object.keys(semIds).forEach(function (semId) {
      var prevSem = (prevScores && prevScores[semId]) || {}
      var nextSem = (nextScores && nextScores[semId]) || {}
      var stdIds = {}
      Object.keys(prevSem).forEach(function (k) { stdIds[k] = true })
      Object.keys(nextSem).forEach(function (k) { stdIds[k] = true })

      Object.keys(stdIds).forEach(function (stdId) {
        var prevStd = prevSem[stdId] || {}
        var nextStd = nextSem[stdId] || {}
        var subIds = {}
        Object.keys(prevStd).forEach(function (k) { subIds[k] = true })
        Object.keys(nextStd).forEach(function (k) { subIds[k] = true })

        Object.keys(subIds).forEach(function (subId) {
          var oldVal = Object.prototype.hasOwnProperty.call(prevStd, subId) ? prevStd[subId] : ""
          var newVal = Object.prototype.hasOwnProperty.call(nextStd, subId) ? nextStd[subId] : ""
          if (oldVal !== newVal) {
            var mapKey = semId + "|||" + stdId + "|||" + subId
            pendingScoreChanges[mapKey] = {
              semesterId: semId,
              studentId: stdId,
              subjectId: subId,
              value: newVal,
            }
          }
        })
      })
    })
  }

  function getScoreSyncHeaders() {
    var headers = { "Content-Type": "application/json" }
    try {
      var rawUser = sessionStorage.getItem("sisforekap_session_user")
      if (rawUser) {
        var parsedUser = JSON.parse(rawUser)
        if (parsedUser && parsedUser.role) {
          headers["X-User-Role"] = encodeURIComponent(String(parsedUser.role))
        }
        if (parsedUser && parsedUser.assignedClass) {
          headers["X-Assigned-Class"] = encodeURIComponent(String(parsedUser.assignedClass))
        }
      }
    } catch (_e) {}
    return headers
  }

  function flushScores(useKeepalive) {
    var keys = Object.keys(pendingScoreChanges)
    if (keys.length === 0) return
    if (isFlushingScores && !useKeepalive) return

    var batchMap = pendingScoreChanges
    pendingScoreChanges = {}
    var changes = keys.map(function (k) { return batchMap[k] })

    isFlushingScores = true
    showSyncStatus("saving", "Menyimpan nilai ke database...")

    var payloadStr = JSON.stringify({ changes: changes })
    fetch(API_BASE + "/scores", {
      method: "PATCH",
      headers: getScoreSyncHeaders(),
      body: payloadStr,
      keepalive: Boolean(useKeepalive && payloadStr.length < 60000),
    })
      .then(function (resp) {
        if (resp.status === 404) {
          // Fallback jika server belum di-restart dengan endpoint PATCH /api/scores
          var fullScores = localStorage.getItem("sisforekap_v2_scores") || "{}"
          return fetch(API_BASE + "/state/sisforekap_v2_scores", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: fullScores }),
            keepalive: Boolean(useKeepalive && fullScores.length < 60000),
          })
        }
        return resp
      })
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status)
        return resp.json().catch(function () { return { ok: true } })
      })
      .then(function (data) {
        if (data && data.ok === false) throw new Error(data.error || "Gagal menyimpan")
        isFlushingScores = false
        if (Object.keys(pendingScoreChanges).length > 0) {
          flushScores(false)
        } else {
          showSyncStatus("saved", "Nilai tersimpan ke database")
        }
      })
      .catch(function (err) {
        console.error("[ApiSync] Gagal menyimpan nilai ke database:", err)
        // Kembalikan perubahan yang gagal agar bisa dicoba ulang
        Object.keys(batchMap).forEach(function (k) {
          if (!Object.prototype.hasOwnProperty.call(pendingScoreChanges, k)) {
            pendingScoreChanges[k] = batchMap[k]
          }
        })
        isFlushingScores = false
        showSyncStatus("error", "Gagal simpan ke DB — Klik untuk coba lagi")
      })
  }

  function flushKey(key, useKeepalive) {
    if (!Object.prototype.hasOwnProperty.call(pendingKeyWrites, key)) return
    var value = pendingKeyWrites[key]
    delete pendingKeyWrites[key]

    showSyncStatus("saving", "Menyimpan ke database...")
    var payloadStr = JSON.stringify({ value: String(value) })
    fetch(API_BASE + "/state/" + encodeURIComponent(key), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payloadStr,
      keepalive: Boolean(useKeepalive && payloadStr.length < 60000),
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status)
        return resp.json().catch(function () { return { ok: true } })
      })
      .then(function (data) {
        if (data && data.ok === false) throw new Error(data.error || "Gagal menyimpan")
        showSyncStatus("saved", "Data tersimpan ke database")
      })
      .catch(function (err) {
        console.error("[ApiSync] Gagal menyimpan " + key + " ke database:", err)
        if (!Object.prototype.hasOwnProperty.call(pendingKeyWrites, key)) {
          pendingKeyWrites[key] = value
        }
        showSyncStatus("error", "Gagal simpan ke DB — Klik untuk coba lagi")
      })
  }

  function flushAllPending(useKeepalive) {
    if (scoreFlushTimer) {
      clearTimeout(scoreFlushTimer)
      scoreFlushTimer = null
    }
    flushScores(useKeepalive)

    Object.keys(keyFlushTimers).forEach(function (k) {
      clearTimeout(keyFlushTimers[k])
      delete keyFlushTimers[k]
    })
    Object.keys(pendingKeyWrites).forEach(function (k) {
      flushKey(k, useKeepalive)
    })
  }

  window.SISFOREKAP_REFRESH_STATE = function () {
    return fetch(API_BASE + "/state?_t=" + Date.now(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status)
        return resp.json()
      })
      .then(function (res) {
        if (res && res.ok && res.state) {
          Object.keys(res.state).forEach(function (k) {
            if (k !== "sisforekap_session_user") {
              origSetItem.call(localStorage, k, res.state[k])
            }
          })
          lastSyncedScores = safeParseJson(localStorage.getItem("sisforekap_v2_scores") || "{}", {})
        }
        return res
      })
  }

  window.addEventListener("pagehide", function () {
    flushAllPending(true)
  })
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      flushAllPending(true)
    }
  })

  // 2. Intercept perubahan data di localStorage & sinkronkan ke MySQL VPS
  Storage.prototype.setItem = function (key, value) {
    origSetItem.call(this, key, value)
    if (
      this !== window.localStorage ||
      typeof key !== "string" ||
      key.indexOf("sisforekap_") !== 0 ||
      key === "sisforekap_session_user"
    ) {
      return
    }

    if (key === "sisforekap_v2_scores") {
      var nextParsed = safeParseJson(String(value), {})
      collectScoreDiff(lastSyncedScores, nextParsed)
      lastSyncedScores = nextParsed
      if (scoreFlushTimer) clearTimeout(scoreFlushTimer)
      scoreFlushTimer = setTimeout(function () {
        scoreFlushTimer = null
        flushScores(false)
      }, 300)
      return
    }

    pendingKeyWrites[key] = String(value)
    if (keyFlushTimers[key]) clearTimeout(keyFlushTimers[key])
    keyFlushTimers[key] = setTimeout(function () {
      delete keyFlushTimers[key]
      flushKey(key, false)
    }, 200)
  }
})()
