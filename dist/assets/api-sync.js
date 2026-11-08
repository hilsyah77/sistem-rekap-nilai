/**
 * Sinkronisasi Otomatis Frontend <-> Backend MySQL VPS
 * Menghubungkan state aplikasi (sisforekap_*) dengan REST API /api/state di VPS
 */
;(function () {
  var isHttp = window.location.protocol === "http:" || window.location.protocol === "https:"
  if (!isHttp) return

  var API_BASE = window.SISFOREKAP_API_BASE || "/api"
  var origSetItem = Storage.prototype.setItem.bind(localStorage)

  // 1. Hydrate data dari MySQL VPS sebelum React pertama kali me-render
  try {
    var xhr = new XMLHttpRequest()
    xhr.open("GET", API_BASE + "/state", false)
    xhr.send(null)
    if (xhr.status >= 200 && xhr.status < 300) {
      var res = JSON.parse(xhr.responseText)
      if (res && res.ok && res.state) {
        var dbKeys = Object.keys(res.state)
        if (dbKeys.length > 0) {
          dbKeys.forEach(function (k) {
            origSetItem(k, res.state[k])
          })
        } else {
          // Jika database di VPS masih kosong namun browser punya data lokal, unggah ke VPS
          var initialPayload = {}
          var hasLocal = false
          for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i)
            if (key && key.indexOf("sisforekap_") === 0) {
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
    }
  } catch (_e) {
    // Jika backend belum berjalan (misal dev server statis), lanjut gunakan localStorage
  }

  // 2. Intercept perubahan data di aplikasi & langsung simpan ke MySQL VPS
  Storage.prototype.setItem = function (key, value) {
    origSetItem(key, value)
    if (typeof key === "string" && key.indexOf("sisforekap_") === 0) {
      fetch(API_BASE + "/state/" + encodeURIComponent(key), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: String(value) }),
      }).catch(function () {})
    }
  }
})()
