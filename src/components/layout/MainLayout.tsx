import React, { useState, useEffect } from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { User, ActivePage, SchoolProfile } from "@/types"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Check, Trash2, School, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  currentUser: User
  activePage: ActivePage
  onNavigate: (page: ActivePage) => void
  onLogout: () => void
  tahunAjaran: string
  onChangeTahunAjaran: (ta: string) => void
  tahunAjaranList: string[]
  onChangeTahunAjaranList: React.Dispatch<React.SetStateAction<string[]>>
  schoolProfile: SchoolProfile
  onChangeSchoolProfile: (profile: SchoolProfile) => void
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
  tahunAjaran,
  onChangeTahunAjaran,
  tahunAjaranList,
  onChangeTahunAjaranList,
  schoolProfile,
  onChangeSchoolProfile,
  children,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false)
  const [isTahunAjaranModalOpen, setIsTahunAjaranModalOpen] = useState(false)
  const [newTahunAjaranInput, setNewTahunAjaranInput] = useState("")
  const [isSchoolProfileModalOpen, setIsSchoolProfileModalOpen] = useState(false)
  const [profileForm, setProfileForm] = useState<SchoolProfile>(schoolProfile)
  const [saveProfileNotice, setSaveProfileNotice] = useState(false)

  useEffect(() => {
    setProfileForm(schoolProfile)
  }, [schoolProfile])

  const handleOpenSchoolModal = () => {
    setProfileForm(schoolProfile)
    setSaveProfileNotice(false)
    setIsSchoolProfileModalOpen(true)
  }

  const handleSaveSchoolProfile = (e: React.FormEvent) => {
    e.preventDefault()
    onChangeSchoolProfile(profileForm)
    setSaveProfileNotice(true)
    setTimeout(() => {
      setSaveProfileNotice(false)
      setIsSchoolProfileModalOpen(false)
    }, 900)
  }

  const handleAddTahunAjaran = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTahunAjaranInput.trim()
    if (!trimmed) return
    if (!tahunAjaranList.includes(trimmed)) {
      onChangeTahunAjaranList(prev => [...prev, trimmed])
    }
    onChangeTahunAjaran(trimmed)
    setNewTahunAjaranInput("")
  }

  const handleDeleteTahunAjaran = (ta: string) => {
    if (tahunAjaranList.length <= 1) return
    const nextList = tahunAjaranList.filter(item => item !== ta)
    onChangeTahunAjaranList(nextList)
    if (tahunAjaran === ta) {
      onChangeTahunAjaran(nextList[0])
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col lg:flex-row antialiased">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        currentUser={currentUser}
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        tahunAjaran={tahunAjaran}
        onOpenTahunAjaranModal={() => setIsTahunAjaranModalOpen(true)}
        schoolProfile={schoolProfile}
        onOpenSchoolProfileModal={handleOpenSchoolModal}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dynamic Topbar */}
        <Topbar
          currentUser={currentUser}
          activePage={activePage}
          onToggleMobileSidebar={() => setIsOpenMobile(!isOpenMobile)}
          onLogout={onLogout}
          tahunAjaran={tahunAjaran}
          onOpenTahunAjaranModal={() => setIsTahunAjaranModalOpen(true)}
          schoolProfile={schoolProfile}
          onOpenSchoolProfileModal={handleOpenSchoolModal}
        />

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Modal Pengaturan Tahun Ajaran */}
      <Dialog open={isTahunAjaranModalOpen} onOpenChange={setIsTahunAjaranModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <Calendar className="w-6 h-6" />
          </div>
          <DialogTitle>Pengaturan Tahun Ajaran</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Pilih Tahun Ajaran aktif atau tambahkan Tahun Ajaran baru untuk rekapitulasi nilai siswa Kelas IX (mencakup Semester 1 s/d 5 & UAM).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Form Tambah Tahun Ajaran Baru */}
          <form onSubmit={handleAddTahunAjaran} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Tambah Tahun Ajaran Baru:
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={newTahunAjaranInput}
                onChange={(e) => setNewTahunAjaranInput(e.target.value)}
                placeholder="Contoh: 2027/2028"
                className="text-xs flex-1"
              />
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </Button>
            </div>
          </form>

          {/* Daftar Tahun Ajaran */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Pilih Tahun Ajaran Aktif:
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {tahunAjaranList.map((ta) => {
                const isSelected = tahunAjaran === ta
                return (
                  <div
                    key={ta}
                    onClick={() => onChangeTahunAjaran(ta)}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        )}
                      >
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Tahun Ajaran {ta}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Periode Kelulusan Kelas IX
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Badge variant="default" className="text-[10px] bg-emerald-600 gap-1">
                          <Check className="w-3 h-3" /> Aktif
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onChangeTahunAjaran(ta)
                          }}
                          className="text-xs h-7 px-2.5"
                        >
                          Pilih
                        </Button>
                      )}

                      {tahunAjaranList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTahunAjaran(ta)
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Tahun Ajaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => setIsTahunAjaranModalOpen(false)}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Selesai & Simpan
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Modal Pengaturan Profil Identitas Sekolah / Madrasah */}
      <Dialog open={isSchoolProfileModalOpen} onOpenChange={setIsSchoolProfileModalOpen}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
            <School className="w-6 h-6" />
          </div>
          <DialogTitle>Pengaturan Profil Identitas Sekolah / Madrasah</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Atur identitas sekolah/madrasah, kop surat, akreditasi, serta data Kepala Sekolah/Madrasah untuk cetak Leger, Rapor, dan SKL.
          </DialogDescription>
        </DialogHeader>

        {saveProfileNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profil identitas sekolah berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSaveSchoolProfile} className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Nama Sekolah / Madrasah *</label>
            <Input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="Contoh: MTs Negeri 1 Kota Semarang"
              className="text-xs font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NSM (No. Statistik Madrasah)</label>
              <Input
                value={profileForm.nsm}
                onChange={(e) => setProfileForm({ ...profileForm, nsm: e.target.value })}
                placeholder="121133740001"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NPSN</label>
              <Input
                value={profileForm.npsn}
                onChange={(e) => setProfileForm({ ...profileForm, npsn: e.target.value })}
                placeholder="20363812"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Kepala Sekolah / Madrasah *</label>
              <Input
                value={profileForm.headmasterName}
                onChange={(e) => setProfileForm({ ...profileForm, headmasterName: e.target.value })}
                placeholder="H. Ahmad Fauzi, S.Pd., M.M."
                className="text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">NIP Kepala Sekolah / Madrasah</label>
              <Input
                value={profileForm.headmasterNip}
                onChange={(e) => setProfileForm({ ...profileForm, headmasterNip: e.target.value })}
                placeholder="19790812 200501 1 003"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Baris Kop Surat 1 (Instansi Induk)</label>
            <Input
              value={profileForm.ministryHeader1}
              onChange={(e) => setProfileForm({ ...profileForm, ministryHeader1: e.target.value })}
              placeholder="KEMENTERIAN AGAMA REPUBLIK INDONESIA"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Baris Kop Surat 2 (Kantor Kemenag / Dinas)</label>
            <Input
              value={profileForm.ministryHeader2}
              onChange={(e) => setProfileForm({ ...profileForm, ministryHeader2: e.target.value })}
              placeholder="KANTOR KEMENTERIAN AGAMA KOTA SEMARANG"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Alamat Lengkap Sekolah / Madrasah</label>
            <Input
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              placeholder="Jl. Al-Ikhlas No. 45, Kota Semarang"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Kabupaten / Kota</label>
              <Input
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                placeholder="Semarang"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Nomor Telepon</label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="(024) 7654321"
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Website</label>
              <Input
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                placeholder="mtsn1-semarang.sch.id"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Email</label>
              <Input
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="info@mtsn1-semarang.sch.id"
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Akreditasi</label>
              <Input
                value={profileForm.accreditation}
                onChange={(e) => setProfileForm({ ...profileForm, accreditation: e.target.value })}
                placeholder="A"
                className="text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Predikat Akreditasi</label>
              <Input
                value={profileForm.accreditationLabel}
                onChange={(e) => setProfileForm({ ...profileForm, accreditationLabel: e.target.value })}
                placeholder="Unggul"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Titimangsa Rapor</label>
              <Input
                value={profileForm.titimangsa}
                onChange={(e) => setProfileForm({ ...profileForm, titimangsa: e.target.value })}
                placeholder="Semarang, 20 Desember 2024"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSchoolProfileModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Profil Sekolah
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
