/**
 * Sinkronisasi Otomatis Frontend <-> Backend MySQL VPS
 */
export function initApiSync() {
  if (typeof window === "undefined") return
  const isHttp = window.location.protocol === "http:" || window.location.protocol === "https:"
  if (!isHttp) return

  const API_BASE = (window as unknown as { SISFOREKAP_API_BASE?: string }).SISFOREKAP_API_BASE || "/api"
  const origSetItem = Storage.prototype.setItem

  type ScoreMap = Record<string, Record<string, Record<string, number | "">>>
  type ScoreChange = { semesterId: string; studentId: string; subjectId: string; value: number | "" }

  let lastSyncedScores: ScoreMap = {}
  let pendingScoreChanges: Record<string, ScoreChange> = {}
  let scoreFlushTimer: ReturnType<typeof setTimeout> | null = null
  let isFlushingScores = false
  const pendingKeyWrites: Record<string, string> = {}
  const keyFlushTimers: Record<string, ReturnType<typeof setTimeout>> = {}

  const safeParseJson = <T,>(str: string, fallback: T): T => {
    try {
      const v = JSON.parse(str)
      return v && typeof v === "object" ? (v as T) : fallback
    } catch {
      return fallback
    }
  }

  try {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `${API_BASE}/state?_t=${Date.now()}`, false)
    xhr.setRequestHeader("Cache-Control", "no-cache")
    xhr.send(null)
    if (xhr.status >= 200 && xhr.status < 300) {
      const res = JSON.parse(xhr.responseText)
      if (res?.ok && res.state) {
        const dbKeys = Object.keys(res.state).filter((k) => k !== "sisforekap_session_user")
        if (dbKeys.length > 0) {
          for (const k of dbKeys) {
            origSetItem.call(localStorage, k, res.state[k])
          }
          const missingPayload: Record<string, string | null> = {}
          let hasMissing = false
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (
              key &&
              key.startsWith("sisforekap_") &&
              key !== "sisforekap_session_user" &&
              !Object.prototype.hasOwnProperty.call(res.state, key)
            ) {
              missingPayload[key] = localStorage.getItem(key)
              hasMissing = true
            }
          }
          if (hasMissing) {
            fetch(`${API_BASE}/state`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: missingPayload }),
            }).catch(() => {})
          }
        } else {
          const initialPayload: Record<string, string | null> = {}
          let hasLocal = false
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith("sisforekap_") && key !== "sisforekap_session_user") {
              initialPayload[key] = localStorage.getItem(key)
              hasLocal = true
            }
          }
          if (hasLocal) {
            fetch(`${API_BASE}/state`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: initialPayload }),
            }).catch(() => {})
          }
        }
      }
    }
  } catch {
    // Fallback ke localStorage jika backend belum aktif
  }

  lastSyncedScores = safeParseJson<ScoreMap>(localStorage.getItem("sisforekap_v2_scores") || "{}", {})

  const collectScoreDiff = (prevScores: ScoreMap, nextScores: ScoreMap) => {
    const semIds = new Set([...Object.keys(prevScores || {}), ...Object.keys(nextScores || {})])
    semIds.forEach((semId) => {
      const prevSem = prevScores?.[semId] || {}
      const nextSem = nextScores?.[semId] || {}
      const stdIds = new Set([...Object.keys(prevSem), ...Object.keys(nextSem)])
      stdIds.forEach((stdId) => {
        const prevStd = prevSem[stdId] || {}
        const nextStd = nextSem[stdId] || {}
        const subIds = new Set([...Object.keys(prevStd), ...Object.keys(nextStd)])
        subIds.forEach((subId) => {
          const oldVal = Object.prototype.hasOwnProperty.call(prevStd, subId) ? prevStd[subId] : ""
          const newVal = Object.prototype.hasOwnProperty.call(nextStd, subId) ? nextStd[subId] : ""
          if (oldVal !== newVal) {
            pendingScoreChanges[`${semId}|||${stdId}|||${subId}`] = {
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

  const getScoreSyncHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    try {
      const rawUser = sessionStorage.getItem("sisforekap_session_user")
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser) as { role?: string; assignedClass?: string }
        if (parsedUser?.role) headers["X-User-Role"] = encodeURIComponent(String(parsedUser.role))
        if (parsedUser?.assignedClass) {
          headers["X-Assigned-Class"] = encodeURIComponent(String(parsedUser.assignedClass))
        }
      }
    } catch {}
    return headers
  }

  const flushScores = (useKeepalive: boolean) => {
    const keys = Object.keys(pendingScoreChanges)
    if (keys.length === 0) return
    if (isFlushingScores && !useKeepalive) return

    const batchMap = pendingScoreChanges
    pendingScoreChanges = {}
    const changes = keys.map((k) => batchMap[k])
    const payloadStr = JSON.stringify({ changes })

    isFlushingScores = true
    fetch(`${API_BASE}/scores`, {
      method: "PATCH",
      headers: getScoreSyncHeaders(),
      body: payloadStr,
      keepalive: Boolean(useKeepalive && payloadStr.length < 60000),
    })
      .then((resp) => {
        if (resp.status === 404) {
          const fullScores = localStorage.getItem("sisforekap_v2_scores") || "{}"
          return fetch(`${API_BASE}/state/sisforekap_v2_scores`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: fullScores }),
            keepalive: Boolean(useKeepalive && fullScores.length < 60000),
          })
        }
        return resp
      })
      .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        isFlushingScores = false
        if (Object.keys(pendingScoreChanges).length > 0) flushScores(false)
      })
      .catch(() => {
        for (const k of Object.keys(batchMap)) {
          if (!Object.prototype.hasOwnProperty.call(pendingScoreChanges, k)) {
            pendingScoreChanges[k] = batchMap[k]
          }
        }
        isFlushingScores = false
      })
  }

  const flushKey = (key: string, useKeepalive: boolean) => {
    if (!Object.prototype.hasOwnProperty.call(pendingKeyWrites, key)) return
    const value = pendingKeyWrites[key]
    delete pendingKeyWrites[key]
    const payloadStr = JSON.stringify({ value })

    fetch(`${API_BASE}/state/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payloadStr,
      keepalive: Boolean(useKeepalive && payloadStr.length < 60000),
    }).catch(() => {
      if (!Object.prototype.hasOwnProperty.call(pendingKeyWrites, key)) {
        pendingKeyWrites[key] = value
      }
    })
  }

  const flushAllPending = (useKeepalive: boolean) => {
    if (scoreFlushTimer) {
      clearTimeout(scoreFlushTimer)
      scoreFlushTimer = null
    }
    flushScores(useKeepalive)
    for (const k of Object.keys(keyFlushTimers)) {
      clearTimeout(keyFlushTimers[k])
      delete keyFlushTimers[k]
    }
    for (const k of Object.keys(pendingKeyWrites)) {
      flushKey(k, useKeepalive)
    }
  }

  ;(window as unknown as { SISFOREKAP_REFRESH_STATE?: () => Promise<unknown> }).SISFOREKAP_REFRESH_STATE =
    () =>
      fetch(`${API_BASE}/state?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
        .then((resp) => {
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          return resp.json()
        })
        .then((res) => {
          if (res?.ok && res.state) {
            for (const k of Object.keys(res.state)) {
              if (k !== "sisforekap_session_user") {
                origSetItem.call(localStorage, k, res.state[k])
              }
            }
            lastSyncedScores = safeParseJson<ScoreMap>(
              localStorage.getItem("sisforekap_v2_scores") || "{}",
              {}
            )
          }
          return res
        })

  window.addEventListener("pagehide", () => flushAllPending(true))
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAllPending(true)
  })

  Storage.prototype.setItem = function (key: string, value: string) {
    origSetItem.call(this, key, value)
    if (
      this !== window.localStorage ||
      typeof key !== "string" ||
      !key.startsWith("sisforekap_") ||
      key === "sisforekap_session_user"
    ) {
      return
    }

    if (key === "sisforekap_v2_scores") {
      const nextParsed = safeParseJson<ScoreMap>(String(value), {})
      collectScoreDiff(lastSyncedScores, nextParsed)
      lastSyncedScores = nextParsed
      if (scoreFlushTimer) clearTimeout(scoreFlushTimer)
      scoreFlushTimer = setTimeout(() => {
        scoreFlushTimer = null
        flushScores(false)
      }, 300)
      return
    }

    pendingKeyWrites[key] = String(value)
    if (keyFlushTimers[key]) clearTimeout(keyFlushTimers[key])
    keyFlushTimers[key] = setTimeout(() => {
      delete keyFlushTimers[key]
      flushKey(key, false)
    }, 200)
  }
}
