import React from "react"
import { 
  LayoutDashboard, 
  Database, 
  CheckCircle2, 
  TableProperties, 
  Printer, 
  GraduationCap, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  UserCheck,
  School,
  Pencil
} from "lucide-react"
import { User, ActivePage, SchoolProfile } from "@/types"
import { ADMIN_NAV_ITEMS, WALIKELAS_NAV_ITEMS } from "@/data/mockData"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentUser: User
  activePage: ActivePage
  onNavigate: (page: ActivePage) => void
  onLogout: () => void
  isOpenMobile: boolean
  onCloseMobile: () => void
  tahunAjaran: string
  onOpenTahunAjaranModal: () => void
  schoolProfile: SchoolProfile
  onOpenSchoolProfileModal: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  tahunAjaran,
  onOpenTahunAjaranModal,
  schoolProfile,
  onOpenSchoolProfileModal,
}) => {
  const isAdmin = currentUser.role === "admin"
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : WALIKELAS_NAV_ITEMS

  const renderIcon = (name: string, isActive: boolean) => {
    const props = {
      className: cn(
        "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
        isActive ? "text-emerald-700 font-semibold" : "text-slate-500 group-hover:text-slate-800"
      )
    }
    switch (name) {
      case "LayoutDashboard": return <LayoutDashboard {...props} />
      case "Database": return <Database {...props} />
      case "CheckCircle2": return <CheckCircle2 {...props} />
      case "UserCheck": return <UserCheck {...props} />
      case "TableProperties": return <TableProperties {...props} />
      case "Printer": return <Printer {...props} />
      default: return <GraduationCap {...props} />
    }
  }

  return (
    <>
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity" 
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-sm",
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Madrasah Brand Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-emerald-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20 shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-lg tracking-tight">SisfoRekap</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Madrasah
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold truncate" title={schoolProfile.name}>
                {schoolProfile.name}
              </p>
            </div>
          </div>

          {/* School Identity & Academic Info Capsules */}
          <div className="mt-4 space-y-1.5">
            <button
              type="button"
              onClick={onOpenSchoolProfileModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 text-[11px] text-emerald-900 transition-colors cursor-pointer group"
              title="Pengaturan Profil Identitas Sekolah / Madrasah"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <School className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">{schoolProfile.name}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 ml-1">
                <Pencil className="w-2.5 h-2.5" />
                Profil
              </span>
            </button>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
              <span className="font-medium text-slate-500">Tahun Ajaran:</span>
              <button
                type="button"
                onClick={onOpenTahunAjaranModal}
                className="font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Pengaturan Tahun Ajaran"
              >
                <span>{tahunAjaran}</span>
                <Pencil className="w-3 h-3 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Current Active Role Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Akun Login Aktif
            </span>
            <Badge 
              variant={isAdmin ? "default" : "warning"}
              className="text-[10px] uppercase font-bold tracking-wide"
            >
              {isAdmin ? (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Walikelas
                </span>
              )}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-slate-800 truncate" title={currentUser.name}>
            {currentUser.name}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {isAdmin ? `Username: ${currentUser.username}` : `${currentUser.assignedClass || "Walikelas"} • NIP: ${currentUser.nip || "-"}`}
          </p>
        </div>

        {/* Dynamic Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isAdmin ? "Menu Utama Admin" : "Menu Walikelas"}
          </div>

          {navItems.map((item) => {
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as ActivePage)
                  onCloseMobile()
                }}
                className={cn(
                  "w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer",
                  isActive
                    ? "bg-emerald-50 text-emerald-900 font-semibold shadow-xs border border-emerald-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 group-hover:bg-slate-200 text-slate-500"
                  )}>
                    {renderIcon(item.icon, isActive)}
                  </div>
                  <div className="truncate">
                    <div className="leading-snug">{item.title}</div>
                    <div className="text-[11px] text-slate-400 font-normal truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-600" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Logout Action */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sistem (Logout)
          </button>
        </div>
      </aside>
    </>
  )
}
