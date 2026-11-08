/**
 * Sinkronisasi Otomatis Frontend <-> Backend MySQL VPS
 */
export function initApiSync() {
  if (typeof window === "undefined") return
  const isHttp = window.location.protocol === "http:" || window.location.protocol === "https:"
  if (!isHttp) return

  const API_BASE = (window as unknown as { SISFOREKAP_API_BASE?: string }).SISFOREKAP_API_BASE || "/api"
  const origSetItem = Storage.prototype.setItem.bind(localStorage)

  try {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `${API_BASE}/state`, false)
    xhr.send(null)
    if (xhr.status >= 200 && xhr.status < 300) {
      const res = JSON.parse(xhr.responseText)
      if (res?.ok && res.state) {
        const dbKeys = Object.keys(res.state)
        if (dbKeys.length > 0) {
          for (const k of dbKeys) {
            origSetItem(k, res.state[k])
          }
        } else {
          const initialPayload: Record<string, string | null> = {}
          let hasLocal = false
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith("sisforekap_")) {
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

  Storage.prototype.setItem = function (key: string, value: string) {
    origSetItem(key, value)
    if (typeof key === "string" && key.startsWith("sisforekap_")) {
      fetch(`${API_BASE}/state/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: String(value) }),
      }).catch(() => {})
    }
  }
}
