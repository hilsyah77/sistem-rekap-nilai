$orig = [System.IO.File]::ReadAllText("$PSScriptRoot\dist\assets\index-D2xirN7d.js.bak")

# =========================================================================
# STEP 1 & 2: TOPBAR & SIDEBAR BUTTONS
# Hide Profil Sekolah & Tahun Ajaran buttons for Walikelas
# =========================================================================
$p1_target = '(0,L.jsxs)(`div`,{className:`flex items-center gap-2 md:gap-3`,children:[(0,L.jsxs)(`button`,{type:`button`,onClick:osp,className:`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-all cursor-pointer shadow-2xs`,title:`Klik untuk mengatur Profil Identitas Sekolah / Madrasah`'
$p1_replace = '(0,L.jsxs)(`div`,{className:`flex items-center gap-2 md:gap-3`,children:[i&&(0,L.jsxs)(`button`,{type:`button`,onClick:osp,className:`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-all cursor-pointer shadow-2xs`,title:`Klik untuk mengatur Profil Identitas Sekolah / Madrasah`'
$p1b_target = ',(0,L.jsxs)(`button`,{type:`button`,onClick:ota,className:`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-all cursor-pointer shadow-2xs`,title:`Klik untuk mengatur Tahun Ajaran`'
$p1b_replace = ',i&&(0,L.jsxs)(`button`,{type:`button`,onClick:ota,className:`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-all cursor-pointer shadow-2xs`,title:`Klik untuk mengatur Tahun Ajaran`'
$p2_target = '(0,L.jsxs)(`div`,{className:`mt-4 space-y-1.5`,children:[(0,L.jsxs)(`button`,{type:`button`,onClick:osp,className:`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 text-[11px] text-emerald-900 transition-colors cursor-pointer group`,title:`Pengaturan Profil Identitas Sekolah / Madrasah`'
$p2_replace = 's&&(0,L.jsxs)(`div`,{className:`mt-4 space-y-1.5`,children:[(0,L.jsxs)(`button`,{type:`button`,onClick:osp,className:`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 text-[11px] text-emerald-900 transition-colors cursor-pointer group`,title:`Pengaturan Profil Identitas Sekolah / Madrasah`'

$cur = $orig.Replace($p1_target, $p1_replace).Replace($p1b_target, $p1b_replace).Replace($p2_target, $p2_replace)

# =========================================================================
# STEP 3: DATAMASTER (Lr) - CLEAN LOCALSTORAGE (START EMPTY)
# =========================================================================
$idxDMStart = $cur.IndexOf(',[o,s]=(0,_.useState)(`cls-9a`),[c,l]=(0,_.useState)([{id:`cls-9a`')
$idxFp = $cur.IndexOf('[f,p]=', $idxDMStart)
if ($idxDMStart -ge 0 -and $idxFp -gt $idxDMStart) {
    $dmSub = $cur.Substring($idxDMStart, $idxFp - $idxDMStart)
    $dmReplace = ',[o,s]=(0,_.useState)(`all`),[c,_l]=(0,_.useState)(()=>{try{let s=localStorage.getItem(`sisforekap_v2_classes`);return s?JSON.parse(s):[]}catch{return[]}}),l=val=>{_l(val);try{let next=typeof val===`function`?val(c):val;localStorage.setItem(`sisforekap_v2_classes`,JSON.stringify(next))}catch{}},[u,_d]=(0,_.useState)(()=>{try{let s=localStorage.getItem(`sisforekap_v2_students`);return s?JSON.parse(s):[]}catch{return[]}}),d=val=>{_d(val);try{let next=typeof val===`function`?val(u):val;localStorage.setItem(`sisforekap_v2_students`,JSON.stringify(next))}catch{}},'
    $cur = $cur.Replace($dmSub, $dmReplace)
}

# =========================================================================
# STEP 4: UR ARRAY (InputNilai & RekapCetak) - DYNAMIC FROM LOCALSTORAGE
# =========================================================================
$idxUrStart = $cur.IndexOf('category:`mulok`}],Ur=[{id:`std-1`')
if ($idxUrStart -ge 0) {
    $idxUrAfter = $cur.IndexOf('}],Wr=[', $idxUrStart)
    if ($idxUrAfter -ge 0) {
        $urSub = $cur.Substring($idxUrStart, ($idxUrAfter - $idxUrStart) + 7)
        $urReplace = 'category:`mulok`}],Ur=((()=>{try{let stds=JSON.parse(localStorage.getItem(`sisforekap_v2_students`)||`[]`);let sc=JSON.parse(localStorage.getItem(`sisforekap_v2_scores`)||`{}`);let sem5=sc[`sem-5`]||{};return stds.map(s=>({id:s.id,nisn:s.nisn,nis:s.nis,name:s.name,gender:s.gender,classRoom:s.classRoom,grade:s.grade,status:s.status,scores:sem5[s.id]||{}}))}catch{return[]}})()),Wr=['
        $cur = $cur.Replace($urSub, $urReplace)
    }
}

# =========================================================================
# STEP 5: REMOVE isLocked DUMMY BANNER in Kr
# =========================================================================
$idxBanner = $cur.IndexOf('Uji Coba Dua Variasi UI: isLocked Dummy Prop')
if ($idxBanner -ge 0) {
    $idxBannerStart = $cur.LastIndexOf('(0,L.jsxs)(`div`,{className:`p-4 rounded-xl bg-gradient-to-r', $idxBanner)
    $idxBannerEnd = $cur.IndexOf('Kunci Nilai (Set isLocked = true)`]})})]}),', $idxBanner)
    if ($idxBannerStart -ge 0 -and $idxBannerEnd -ge 0) {
        $bannerLen = ($idxBannerEnd + 43) - $idxBannerStart
        $bannerSub = $cur.Substring($idxBannerStart, $bannerLen)
        $cur = $cur.Replace($bannerSub, 'null,')
    }
}

# =========================================================================
# STEP 6: REMOVE SIMULATION BAR in Vr & REMOVE DUMMY REVISION NOTE
# =========================================================================
$idxSim = $cur.IndexOf('Simulasi Status Verifikasi Nilai Kelas:')
if ($idxSim -ge 0) {
    $idxSimStart = $cur.LastIndexOf('(0,L.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs`', $idxSim)
    $idxSimEnd = $cur.IndexOf('Status: Disetujui (Hijau)`})]})]}),', $idxSim)
    if ($idxSimStart -ge 0 -and $idxSimEnd -ge 0) {
        $simLen = ($idxSimEnd + 35) - $idxSimStart
        $simSub = $cur.Substring($idxSimStart, $simLen)
        $cur = $cur.Replace($simSub, 'null,')
    }
}

# Remove dummy Ahmad Dani revision note
$idxRev = $cur.IndexOf('Terdapat 2 siswa (Ahmad Dani & Farhan Pratama)')
if ($idxRev -ge 0) {
    $idxRevStart = $cur.LastIndexOf('n===`revisi`&&(0,L.jsxs)(Rr,', $idxRev)
    if ($idxRevStart -ge 0) {
        $idxRevEnd = $cur.IndexOf('Buka & Perbaiki Input Nilai Sekarang`]})})]})]}),', $idxRev)
        if ($idxRevEnd -ge 0) {
            $revLen = ($idxRevEnd + 48) - $idxRevStart
            $revSub = $cur.Substring($idxRevStart, $revLen)
            $cur = $cur.Replace($revSub, '')
        }
    }
}

# =========================================================================
# STEP 7: ADMIN DASHBOARD STATS (wr)
# =========================================================================
$pWr_target = 'wr=({onNavigate:e,tahunAjaran:t=`2024/2025`,classes:cls=[],students:stds=[],walikelasAccounts:wa=[],validationQueue:vq=[]})=>'
$pWr_replace = 'wr=({onNavigate:e,tahunAjaran:t=`2024/2025`,classes:cls=(()=>{try{return JSON.parse(localStorage.getItem(`sisforekap_v2_classes`)||`[]`)}catch{return[]}})(),students:stds=(()=>{try{return JSON.parse(localStorage.getItem(`sisforekap_v2_students`)||`[]`)}catch{return[]}})(),walikelasAccounts:wa=(()=>{try{return JSON.parse(localStorage.getItem(`sisforekap_v2_walikelas_accounts`)||`[]`)}catch{return[]}})(),validationQueue:vq=(()=>{try{return JSON.parse(localStorage.getItem(`sisforekap_v2_validations`)||`[]`)}catch{return[]}})()})=>'
$cur = $cur.Replace($pWr_target, $pWr_replace)

# =========================================================================
# STEP 8: WALIKELAS LOGIN PAGE COMPONENT, ROUTER, & LOGIN AUTH
# =========================================================================
$walikelasPageComponent = @'
function WalikelasLoginPage({ tahunAjaran: ta = "2024/2025", schoolProfile: sp = DSP }) {
  let [accounts, setAccounts] = (0, _.useState)(() => {
    try {
      let s = localStorage.getItem('sisforekap_v2_walikelas_accounts');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  let [rule, setRule] = (0, _.useState)(() => {
    try {
      let s = localStorage.getItem('sisforekap_v2_walikelas_rule');
      return s ? JSON.parse(s) : { allowWalikelasLogin: true, autoLockAfterSubmit: true };
    } catch { return { allowWalikelasLogin: true, autoLockAfterSubmit: true }; }
  });

  let [classes] = (0, _.useState)(() => {
    try {
      let s = localStorage.getItem('sisforekap_v2_classes');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  let [showPw, setShowPw] = (0, _.useState)({});
  let [isModalOpen, setIsModalOpen] = (0, _.useState)(false);
  let [editingAcc, setEditingAcc] = (0, _.useState)(null);

  let [formName, setFormName] = (0, _.useState)("");
  let [formNip, setFormNip] = (0, _.useState)("");
  let [formClass, setFormClass] = (0, _.useState)("");
  let [formUsername, setFormUsername] = (0, _.useState)("");
  let [formPassword, setFormPassword] = (0, _.useState)("");
  let [formIsActive, setFormIsActive] = (0, _.useState)(true);
  let [toast, setToast] = (0, _.useState)(null);
  let [errorMsg, setErrorMsg] = (0, _.useState)("");

  let showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  let updateRule = (patch) => {
    let next = { ...rule, ...patch };
    setRule(next);
    try { localStorage.setItem('sisforekap_v2_walikelas_rule', JSON.stringify(next)); } catch {}
    showToast("Pengaturan kebijakan login berhasil diperbarui.");
  };

  let toggleActive = (acc) => {
    let next = accounts.map(a => a.id === acc.id ? { ...a, isActive: a.isActive === false } : a);
    setAccounts(next);
    try { localStorage.setItem('sisforekap_v2_walikelas_accounts', JSON.stringify(next)); } catch {}
    showToast(`Status akun ${acc.name} diubah menjadi ${acc.isActive === false ? 'Aktif' : 'Nonaktif'}.`);
  };

  let handleDelete = (acc) => {
    if (confirm(`Yakin ingin menghapus akun login Wali Kelas ${acc.name} (${acc.assignedClass})?`)) {
      let next = accounts.filter(a => a.id !== acc.id);
      setAccounts(next);
      try { localStorage.setItem('sisforekap_v2_walikelas_accounts', JSON.stringify(next)); } catch {}
      showToast(`Akun login ${acc.name} berhasil dihapus.`);
    }
  };

  let openAddModal = () => {
    setEditingAcc(null);
    setFormName("");
    setFormNip("");
    setFormClass(classes.length > 0 ? classes[0].name : "Kelas IX-A");
    setFormUsername("");
    setFormPassword("");
    setFormIsActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  let openEditModal = (acc) => {
    setEditingAcc(acc);
    setFormName(acc.name);
    setFormNip(acc.nip || "");
    setFormClass(acc.assignedClass);
    setFormUsername(acc.username);
    setFormPassword(acc.password);
    setFormIsActive(acc.isActive !== false);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  let handleSaveAccount = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formClass.trim() || !formUsername.trim() || !formPassword.trim()) {
      setErrorMsg("Harap lengkapi Nama, Kelas, Username, dan Password!");
      return;
    }
    let duplicate = accounts.find(a => (!editingAcc || a.id !== editingAcc.id) && a.username.toLowerCase() === formUsername.trim().toLowerCase());
    if (duplicate) {
      setErrorMsg(`Username "${formUsername.trim()}" sudah digunakan akun lain!`);
      return;
    }

    let next;
    if (editingAcc) {
      next = accounts.map(a => a.id === editingAcc.id ? {
        ...a,
        name: formName.trim(),
        nip: formNip.trim(),
        assignedClass: formClass.trim(),
        username: formUsername.trim(),
        password: formPassword.trim(),
        isActive: formIsActive
      } : a);
      showToast(`Akun Wali Kelas ${formName.trim()} berhasil diperbarui.`);
    } else {
      let newAcc = {
        id: `wali-${Date.now()}`,
        name: formName.trim(),
        nip: formNip.trim(),
        assignedClass: formClass.trim(),
        username: formUsername.trim(),
        password: formPassword.trim(),
        isActive: formIsActive
      };
      next = [...accounts, newAcc];
      showToast(`Akun Wali Kelas baru "${formName.trim()}" berhasil dibuat.`);
    }

    setAccounts(next);
    try { localStorage.setItem('sisforekap_v2_walikelas_accounts', JSON.stringify(next)); } catch {}
    setIsModalOpen(false);
  };

  return (0, L.jsxs)("div", {
    className: "space-y-6",
    children: [
      toast && (0, L.jsx)("div", {
        className: "p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs",
        children: (0, L.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [
            (0, L.jsx)(Ce, { className: "w-4 h-4 text-emerald-600 shrink-0" }),
            (0, L.jsx)("span", { children: toast })
          ]
        })
      }),
      (0, L.jsxs)("div", {
        className: "bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",
        children: [
          (0, L.jsxs)("div", {
            className: "space-y-1",
            children: [
              (0, L.jsxs)("div", {
                className: "flex items-center gap-2 mb-1",
                children: [
                  (0, L.jsx)("span", {
                    className: "text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800",
                    children: "Administrator"
                  }),
                  (0, L.jsxs)("span", {
                    className: "text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700",
                    children: ["Tahun Ajaran ", ta]
                  })
                ]
              }),
              (0, L.jsx)("h2", {
                className: "text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight",
                children: "Pengaturan Login Wali Kelas"
              }),
              (0, L.jsx)("p", {
                className: "text-xs text-slate-500",
                children: "Kelola akun, kredensial login, dan aturan hak akses pengisian nilai untuk seluruh Wali Kelas."
              })
            ]
          }),
          (0, L.jsxs)("button", {
            type: "button",
            onClick: openAddModal,
            className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0",
            children: [
              (0, L.jsx)(it, { className: "w-4 h-4" }),
              (0, L.jsx)("span", { children: "Tambah Akun Wali Kelas" })
            ]
          })
        ]
      }),
      (0, L.jsxs)("div", {
        className: "bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4",
        children: [
          (0, L.jsxs)("div", {
            className: "flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4",
            children: [
              (0, L.jsxs)("div", {
                className: "flex items-center gap-3",
                children: [
                  (0, L.jsx)("div", {
                    className: "w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0",
                    children: (0, L.jsx)(Be, { className: "w-5 h-5 text-emerald-700" })
                  }),
                  (0, L.jsxs)("div", {
                    children: [
                      (0, L.jsx)("h4", {
                        className: "text-sm font-bold text-slate-900",
                        children: "Kebijakan & Rule Akses Login Wali Kelas"
                      }),
                      (0, L.jsx)("p", {
                        className: "text-xs text-slate-500",
                        children: "Atur akses masuk sistem dan penguncian lembar nilai secara terpusat."
                      })
                    ]
                  })
                ]
              }),
              (0, L.jsx)(R, {
                variant: rule.allowWalikelasLogin ? "default" : "destructive",
                className: `text-xs px-3 py-1 font-bold ${rule.allowWalikelasLogin ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}`,
                children: rule.allowWalikelasLogin ? "Akses Login: DIBUKA" : "Akses Login: DITUTUP"
              })
            ]
          }),
          (0, L.jsxs)("div", {
            className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-xs",
            children: [
              (0, L.jsxs)("label", {
                className: "flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 cursor-pointer transition-colors",
                children: [
                  (0, L.jsx)("input", {
                    type: "checkbox",
                    checked: !!rule.allowWalikelasLogin,
                    onChange: (e) => updateRule({ allowWalikelasLogin: e.target.checked }),
                    className: "mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  }),
                  (0, L.jsxs)("div", {
                    children: [
                      (0, L.jsx)("span", {
                        className: "font-bold text-slate-800 block text-xs",
                        children: "Izinkan Wali Kelas Login ke Sistem"
                      }),
                      (0, L.jsx)("span", {
                        className: "text-[11px] text-slate-500 mt-0.5 block",
                        children: "Jika dinonaktifkan, seluruh Wali Kelas tidak dapat masuk ke sistem sementara waktu."
                      })
                    ]
                  })
                ]
              }),
              (0, L.jsxs)("label", {
                className: "flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 cursor-pointer transition-colors",
                children: [
                  (0, L.jsx)("input", {
                    type: "checkbox",
                    checked: !!rule.autoLockAfterSubmit,
                    onChange: (e) => updateRule({ autoLockAfterSubmit: e.target.checked }),
                    className: "mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  }),
                  (0, L.jsxs)("div", {
                    children: [
                      (0, L.jsx)("span", {
                        className: "font-bold text-slate-800 block text-xs",
                        children: "Kunci Otomatis Setelah Kirim Nilai ke Admin"
                      }),
                      (0, L.jsx)("span", {
                        className: "text-[11px] text-slate-500 mt-0.5 block",
                        children: "Lembar nilai otomatis dikunci (read-only) saat status menunggu validasi."
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),
      (0, L.jsxs)("div", {
        className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",
        children: [
          (0, L.jsxs)("div", {
            className: "p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50",
            children: [
              (0, L.jsxs)("div", {
                children: [
                  (0, L.jsxs)("h4", {
                    className: "text-sm font-bold text-slate-800 flex items-center gap-2",
                    children: [
                      (0, L.jsx)(Ot, { className: "w-4 h-4 text-emerald-700" }),
                      (0, L.jsxs)("span", { children: ["Daftar Akun Login Wali Kelas (", accounts.length, ")"] })
                    ]
                  }),
                  (0, L.jsx)("p", {
                    className: "text-[11px] text-slate-500 mt-0.5",
                    children: "Gunakan username dan password di bawah ini untuk masuk ke akun Wali Kelas masing-masing."
                  })
                ]
              }),
              (0, L.jsxs)("button", {
                type: "button",
                onClick: openAddModal,
                className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer",
                children: [
                  (0, L.jsx)(it, { className: "w-3.5 h-3.5" }),
                  (0, L.jsx)("span", { children: "Tambah Akun" })
                ]
              })
            ]
          }),
          (0, L.jsx)("div", {
            className: "overflow-x-auto",
            children: (0, L.jsxs)("table", {
              className: "w-full text-left text-xs border-collapse",
              children: [
                (0, L.jsx)("thead", {
                  children: (0, L.jsxs)("tr", {
                    className: "bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200",
                    children: [
                      (0, L.jsx)("th", { className: "px-3 py-3 w-10 text-center", children: "No" }),
                      (0, L.jsx)("th", { className: "px-4 py-3", children: "Nama Wali Kelas & NIP" }),
                      (0, L.jsx)("th", { className: "px-4 py-3", children: "Rombel Ampuan" }),
                      (0, L.jsx)("th", { className: "px-4 py-3", children: "Username" }),
                      (0, L.jsx)("th", { className: "px-4 py-3", children: "Password" }),
                      (0, L.jsx)("th", { className: "px-4 py-3 text-center", children: "Status Akun" }),
                      (0, L.jsx)("th", { className: "px-4 py-3 text-center w-36", children: "Aksi" })
                    ]
                  })
                }),
                (0, L.jsx)("tbody", {
                  className: "divide-y divide-slate-100",
                  children: accounts.length === 0 ? (
                    (0, L.jsx)("tr", {
                      children: (0, L.jsxs)("td", {
                        colSpan: 7,
                        className: "py-12 text-center text-slate-400 text-xs",
                        children: [
                          (0, L.jsx)("p", { className: "font-semibold text-slate-600 mb-1", children: "Belum Ada Akun Login Wali Kelas" }),
                          (0, L.jsx)("p", { children: "Klik tombol \"Tambah Akun Wali Kelas\" di atas untuk membuat kredensial baru." })
                        ]
                      })
                    })
                  ) : accounts.map((acc, idx) => {
                    let isPwShown = !!showPw[acc.id];
                    let isAct = acc.isActive !== false;
                    return (0, L.jsxs)("tr", {
                      key: acc.id,
                      className: "hover:bg-slate-50/80 transition-colors",
                      children: [
                        (0, L.jsx)("td", { className: "px-3 py-3 text-center font-mono text-slate-500", children: idx + 1 }),
                        (0, L.jsxs)("td", {
                          className: "px-4 py-3",
                          children: [
                            (0, L.jsx)("div", { className: "font-bold text-slate-900", children: acc.name }),
                            (0, L.jsxs)("div", { className: "text-[10px] text-slate-400 font-mono", children: ["NIP: ", acc.nip || "-"] })
                          ]
                        }),
                        (0, L.jsx)("td", {
                          className: "px-4 py-3",
                          children: (0, L.jsx)("span", {
                            className: "inline-flex px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200",
                            children: acc.assignedClass
                          })
                        }),
                        (0, L.jsx)("td", {
                          className: "px-4 py-3 font-mono font-semibold text-slate-800",
                          children: acc.username
                        }),
                        (0, L.jsx)("td", {
                          className: "px-4 py-3 font-mono",
                          children: (0, L.jsxs)("div", {
                            className: "inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200",
                            children: [
                              (0, L.jsx)("span", { children: isPwShown ? acc.password : "••••••••" }),
                              (0, L.jsx)("button", {
                                type: "button",
                                onClick: () => setShowPw({ ...showPw, [acc.id]: !isPwShown }),
                                className: "text-slate-400 hover:text-slate-700 cursor-pointer p-0.5",
                                title: isPwShown ? "Sembunyikan password" : "Lihat password",
                                children: (0, L.jsx)("span", { className: "text-[10px] underline font-sans ml-1 text-emerald-700", children: isPwShown ? "Tutup" : "Lihat" })
                              })
                            ]
                          })
                        }),
                        (0, L.jsx)("td", {
                          className: "px-4 py-3 text-center",
                          children: (0, L.jsx)("button", {
                            type: "button",
                            onClick: () => toggleActive(acc),
                            className: `px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${isAct ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100" : "bg-red-50 text-red-800 border-red-300 hover:bg-red-100"}`,
                            children: isAct ? "Aktif" : "Nonaktif"
                          })
                        }),
                        (0, L.jsx)("td", {
                          className: "px-4 py-3 text-center",
                          children: (0, L.jsxs)("div", {
                            className: "flex items-center justify-center gap-1.5",
                            children: [
                              (0, L.jsx)("button", {
                                type: "button",
                                onClick: () => openEditModal(acc),
                                className: "p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer",
                                title: "Edit Akun",
                                children: (0, L.jsx)(nt, { className: "w-3.5 h-3.5" })
                              }),
                              (0, L.jsx)("button", {
                                type: "button",
                                onClick: () => handleDelete(acc),
                                className: "p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer",
                                title: "Hapus Akun",
                                children: (0, L.jsx)(bt, { className: "w-3.5 h-3.5" })
                              })
                            ]
                          })
                        })
                      ]
                    });
                  })
                })
              ]
            })
          })
        ]
      }),
      isModalOpen && (0, L.jsxs)("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200",
        children: [
          (0, L.jsx)("div", {
            className: "fixed inset-0",
            onClick: () => setIsModalOpen(false)
          }),
          (0, L.jsxs)("div", {
            className: "relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10",
            children: [
              (0, L.jsxs)("div", {
                className: "px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between",
                children: [
                  (0, L.jsxs)("div", {
                    children: [
                      (0, L.jsx)("h3", {
                        className: "text-sm font-bold text-slate-900",
                        children: editingAcc ? "Edit Akun Wali Kelas" : "Tambah Akun Login Wali Kelas"
                      }),
                      (0, L.jsx)("p", {
                        className: "text-[11px] text-slate-500",
                        children: "Masukkan data identitas & kredensial login akun."
                      })
                    ]
                  }),
                  (0, L.jsx)("button", {
                    type: "button",
                    onClick: () => setIsModalOpen(false),
                    className: "text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer",
                    children: "✕"
                  })
                ]
              }),
              (0, L.jsxs)("form", {
                onSubmit: handleSaveAccount,
                className: "p-6 space-y-3.5 text-xs",
                children: [
                  errorMsg && (0, L.jsx)("div", {
                    className: "p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold",
                    children: errorMsg
                  }),
                  (0, L.jsxs)("div", {
                    children: [
                      (0, L.jsx)("label", { className: "block font-bold text-slate-700 mb-1", children: "Nama Lengkap Wali Kelas *" }),
                      (0, L.jsx)("input", {
                        type: "text",
                        required: true,
                        placeholder: "Contoh: Siti Rohmah, S.Pd.",
                        value: formName,
                        onChange: (e) => setFormName(e.target.value),
                        className: "w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                      })
                    ]
                  }),
                  (0, L.jsxs)("div", {
                    children: [
                      (0, L.jsx)("label", { className: "block font-bold text-slate-700 mb-1", children: "NIP (Nomor Induk Pegawai)" }),
                      (0, L.jsx)("input", {
                        type: "text",
                        placeholder: "Contoh: 19850419 201001 2 021 (Opsional)",
                        value: formNip,
                        onChange: (e) => setFormNip(e.target.value),
                        className: "w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                      })
                    ]
                  }),
                  (0, L.jsxs)("div", {
                    children: [
                      (0, L.jsx)("label", { className: "block font-bold text-slate-700 mb-1", children: "Rombel / Kelas Ampuan *" }),
                      classes.length > 0 ? (
                        (0, L.jsx)("select", {
                          value: formClass,
                          onChange: (e) => setFormClass(e.target.value),
                          className: "w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white",
                          children: classes.map(c => (0, L.jsx)("option", { value: c.name, children: c.name }, c.id))
                        })
                      ) : (
                        (0, L.jsx)("input", {
                          type: "text",
                          required: true,
                          placeholder: "Contoh: Kelas IX-A",
                          value: formClass,
                          onChange: (e) => setFormClass(e.target.value),
                          className: "w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                        })
                      )
                    ]
                  }),
                  (0, L.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3 pt-1 border-t border-slate-100",
                    children: [
                      (0, L.jsxs)("div", {
                        children: [
                          (0, L.jsx)("label", { className: "block font-bold text-slate-700 mb-1", children: "Username Login *" }),
                          (0, L.jsx)("input", {
                            type: "text",
                            required: true,
                            placeholder: "wali9a",
                            value: formUsername,
                            onChange: (e) => setFormUsername(e.target.value),
                            className: "w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                          })
                        ]
                      }),
                      (0, L.jsxs)("div", {
                        children: [
                          (0, L.jsx)("label", { className: "block font-bold text-slate-700 mb-1", children: "Password Login *" }),
                          (0, L.jsx)("input", {
                            type: "text",
                            required: true,
                            placeholder: "wali123",
                            value: formPassword,
                            onChange: (e) => setFormPassword(e.target.value),
                            className: "w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                          })
                        ]
                      })
                    ]
                  }),
                  (0, L.jsxs)("label", {
                    className: "flex items-center gap-2 pt-1 cursor-pointer",
                    children: [
                      (0, L.jsx)("input", {
                        type: "checkbox",
                        checked: formIsActive,
                        onChange: (e) => setFormIsActive(e.target.checked),
                        className: "w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      }),
                      (0, L.jsx)("span", { className: "font-semibold text-slate-700", children: "Akun Aktif (Dapat Login ke Aplikasi)" })
                    ]
                  }),
                  (0, L.jsxs)("div", {
                    className: "pt-3 border-t border-slate-100 flex items-center justify-end gap-2",
                    children: [
                      (0, L.jsx)("button", {
                        type: "button",
                        onClick: () => setIsModalOpen(false),
                        className: "px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer",
                        children: "Batal"
                      }),
                      (0, L.jsx)("button", {
                        type: "submit",
                        className: "px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer",
                        children: editingAcc ? "Simpan Perubahan" : "Buat Akun Wali Kelas"
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}
'@

$idxJr = $cur.IndexOf('function Jr(){')
if ($idxJr -ge 0) {
    $cur = $cur.Substring(0, $idxJr) + $walikelasPageComponent + "`n" + $cur.Substring($idxJr)
}

# Router switch
$routerTarget = 'case`admin-master-siswa`:return(0,L.jsx)(Lr,{tahunAjaran:ta,schoolProfile:sp,onChangeSchoolProfile:hsp});default:'
$routerReplace = 'case`admin-master-siswa`:return(0,L.jsx)(Lr,{tahunAjaran:ta,schoolProfile:sp,onChangeSchoolProfile:hsp});case`admin-walikelas-login`:return(0,L.jsx)(WalikelasLoginPage,{tahunAjaran:ta,schoolProfile:sp});default:'
$cur = $cur.Replace($routerTarget, $routerReplace)

# Pass credentials to LoginPage
$loginTarget = '(0,L.jsx)(Cr,{onLogin:u=>{'
$loginReplace = '(0,L.jsx)(Cr,{walikelasAccounts:(()=>{try{return JSON.parse(localStorage.getItem(`sisforekap_v2_walikelas_accounts`)||`[]`)}catch{return[]}})(),walikelasLoginRule:(()=>{try{return JSON.parse(localStorage.getItem(`sisforekap_v2_walikelas_rule`)||`{}`)}catch{return DWLR}})(),schoolProfile:sp,onLogin:u=>{'
$cur = $cur.Replace($loginTarget, $loginReplace)

# Write output to test_full.js and check syntax
$testPath = "$PSScriptRoot\test_full.js"
[System.IO.File]::WriteAllText($testPath, $cur, [System.Text.Encoding]::UTF8)

$html = '<!DOCTYPE html><html><body><div id="out"></div><script>var xhr=new XMLHttpRequest();xhr.open("GET","./test_full.js",false);xhr.send();try{new Function(xhr.responseText);document.getElementById("out").innerText="OK";}catch(e){document.getElementById("out").innerText="ERR:"+e.message;}</script></body></html>'
[System.IO.File]::WriteAllText("$PSScriptRoot\test_full.html", $html, [System.Text.Encoding]::UTF8)

$url = "file:///c:/Users/AL-Rasyd/Documents/rekap nilai kelas IX/test_full.html"
$out = cmd /c "`"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`" --headless --no-sandbox --allow-file-access-from-files --dump-dom `"$url`""
$found = ($out | Select-String '<div id="out">([^<]+)</div>')
Write-Output "Full Build Syntax Check : $found"

if ($found -match '<div id="out">OK</div>') {
    Write-Output "SUCCESS! Applying to dist/assets/index-D2xirN7d.js..."
    $prodPath = "$PSScriptRoot\dist\assets\index-D2xirN7d.js"
    [System.IO.File]::WriteAllText($prodPath, $cur, [System.Text.Encoding]::UTF8)
    Write-Output "Production bundle updated! Length: $($cur.Length)"
} else {
    Write-Output "ABORT: Syntax check failed."
}
