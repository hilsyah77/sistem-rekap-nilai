import React, { useState } from "react"
import { School, ShieldCheck, UserCheck, Lock, User as UserIcon, ArrowRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, UserRole, WalikelasAccount, WalikelasLoginRule, SchoolProfile } from "@/types"
import { ADMIN_USER, DEFAULT_SCHOOL_PROFILE, DEFAULT_WALIKELAS_LOGIN_RULE } from "@/data/mockData"

interface LoginPageProps {
  onLoginSuccess: (user: User) => void
  walikelasAccounts?: WalikelasAccount[]
  walikelasLoginRule?: WalikelasLoginRule
  schoolProfile?: SchoolProfile
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  walikelasAccounts = [],
  walikelasLoginRule = DEFAULT_WALIKELAS_LOGIN_RULE,
  schoolProfile = DEFAULT_SCHOOL_PROFILE,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setErrorMsg(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanUser = username.trim()

    if (selectedRole === "admin") {
      if (cleanUser === "admin" && password === "admin2026") {
        onLoginSuccess({
          ...ADMIN_USER,
          name: "Apris Dwi Priyatomo, S.Pd",
        })
      } else {
        setErrorMsg("Username atau kata sandi Admin tidak valid.")
      }
      return
    }

    // Role: Walikelas
    if (!walikelasLoginRule.allowWalikelasLogin) {
      setErrorMsg("Akses login Wali Kelas sedang dinonaktifkan sementara oleh Administrator.")
      return
    }

    const matchedAccount = walikelasAccounts.find(
      (acc) =>
        (acc.username.toLowerCase() === cleanUser.toLowerCase() ||
          (acc.nip && acc.nip !== "-" && acc.nip === cleanUser)) &&
        acc.password === password
    )

    if (!matchedAccount) {
      if (walikelasAccounts.length === 0) {
        setErrorMsg(
          "Belum ada akun Wali Kelas yang terdaftar. Silakan masuk sebagai Admin untuk menambahkan akun/rule login Wali Kelas di menu Pengaturan."
        )
      } else {
        setErrorMsg("Username atau kata sandi Wali Kelas tidak sesuai.")
      }
      return
    }

    if (!matchedAccount.isActive) {
      setErrorMsg(`Akun Wali Kelas "${matchedAccount.name}" (${matchedAccount.assignedClass}) sedang dinonaktifkan oleh Administrator.`)
      return
    }

    onLoginSuccess({
      id: matchedAccount.id,
      name: matchedAccount.name,
      username: matchedAccount.username,
      role: "walikelas",
      assignedClass: matchedAccount.assignedClass,
      nip: matchedAccount.nip || "-",
    })
  }

  return (
    <div
      className="min-h-screen w-full bg-emerald-950 bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('./login-bg.jpg?v=2')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Subtle dark overlay for contrast while showing the uploaded green numbers background */}
      <div className="absolute inset-0 bg-emerald-950/20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-950/40 mb-3 ring-4 ring-white/20">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
            {schoolProfile.name || "SisfoRekap Madrasah"}
          </h1>
          <p className="text-sm text-emerald-100 font-medium mt-1 drop-shadow">
            Sistem Informasi Rekapitulasi Nilai Siswa Kelas IX
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 text-center">
              Masuk ke Sistem
            </CardTitle>
            <CardDescription className="text-center text-xs text-slate-500">
              Pilih hak akses (role) dan masukkan kredensial akun resmi Anda
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector Tabs */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Pilih Role Akses:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("admin")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedRole === "admin"
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("walikelas")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedRole === "walikelas"
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Walikelas
                  </button>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {selectedRole === "admin" ? "Username Admin:" : "Username / NIP Walikelas:"}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={selectedRole === "admin" ? "Masukkan username admin" : "Masukkan username / NIP walikelas"}
                    className="pl-9 text-sm"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Kata Sandi:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="pl-9 text-sm"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2 mt-2">
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-emerald-100/80 font-medium mt-6 drop-shadow">
          © 2026 {schoolProfile.name || "SisfoRekap Madrasah"} • Sistem Rekapitulasi Nilai Kelas IX
        </p>
      </div>
    </div>
  )
}
