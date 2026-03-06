'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Trophy,
  Home,
  UserCheck,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Receipt,
  User,
  MoreHorizontal,
  X,
} from 'lucide-react'

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/* ===== AVATAR CIRCLE ===== */
function AvatarCircle({
  email,
  avatarUrl,
  size = 'sm',
}: {
  email: string
  avatarUrl: string | null
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm'

  if (avatarUrl) {
    return (
      <div className={`${dim} rounded-full overflow-hidden border border-zinc-600 shrink-0`}>
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={size === 'sm' ? 36 : 44}
          height={size === 'sm' ? 36 : 44}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className={`${dim} rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center font-semibold text-white select-none shrink-0`}>
      {getInitials(email)}
    </div>
  )
}

/* ===== TOOLTIP (solo desktop) ===== */
function Tooltip({ label, children, enabled }: {
  label: string
  children: React.ReactNode
  enabled: boolean
}) {
  const [visible, setVisible] = useState(false)
  if (!enabled) return <>{children}</>

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-white whitespace-nowrap shadow-lg pointer-events-none"
          >
            {label}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ===== AVATAR DROPDOWN (header desktop) ===== */
function AvatarDropdown({ email, avatarUrl, onLogout }: {
  email: string
  avatarUrl: string | null
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="rounded-full focus:outline-none hover:ring-2 hover:ring-zinc-500 ring-offset-2 ring-offset-[#0c0c0f] transition"
      >
        <AvatarCircle email={email} avatarUrl={avatarUrl} size="sm" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-[#111118] border border-zinc-800 rounded-xl shadow-xl z-[60] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
              <AvatarCircle email={email} avatarUrl={avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500 mb-0.5">Sesión iniciada como</p>
                <p className="text-sm text-white font-medium truncate">{email}</p>
              </div>
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              <button
                onClick={() => { setOpen(false); router.push('/dashboard/user/perfil') }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition w-full text-left"
              >
                <User size={15} /> Ver perfil
              </button>
              <button
                onClick={() => { setOpen(false); onLogout() }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition w-full text-left"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('cliente')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false) // menú "más" en mobile

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    crm: true, marketing: true, admin: true,
  })

  /* ================= PERSISTENCIA ================= */
  useEffect(() => {
    const collapsed = localStorage.getItem('sidebarCollapsed')
    const categories = localStorage.getItem('openCategories')
    if (collapsed) setSidebarCollapsed(collapsed === 'true')
    if (categories) setOpenCategories(JSON.parse(categories))
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    localStorage.setItem('openCategories', JSON.stringify(openCategories))
  }, [openCategories])

  /* ================= USER ================= */
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.push('/login'); return }
      setUserEmail(data.user.email ?? null)
      const { data: perfil } = await supabase
        .from('usuarios').select('rol, avatar_url').eq('id', data.user.id).single()
      if (perfil?.rol) setUserRole(perfil.rol)
      if (perfil?.avatar_url) setAvatarUrl(perfil.avatar_url)
    }
    getUser()
  }, [router])

  useEffect(() => {
    const refreshAvatar = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      const { data: perfil } = await supabase
        .from('usuarios').select('avatar_url').eq('id', data.user.id).single()
      if (perfil?.avatar_url) setAvatarUrl(perfil.avatar_url)
    }
    refreshAvatar()
  }, [pathname])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }))
  }

  /* ================= NAV ITEMS ================= */
  const mainNavItems = [
    { href: '/dashboard/user/clientes', label: 'Clientes', icon: Users },
    { href: '/dashboard/user/invitados', label: 'Invitados', icon: UserCheck },
    { href: '/dashboard/user/consumos', label: 'Consumos', icon: Receipt },
    { href: '/dashboard/user/ranking', label: 'Ranking', icon: Trophy },
  ]

  // Items secundarios para el menú "Más" en mobile
  const secondaryNavItems = [
    { href: '/dashboard/user/home', label: 'Home Pública', icon: Home },
    { href: '/dashboard/user/perfil', label: 'Mi perfil', icon: User },
    ...(userRole === 'admin'
      ? [{ href: '/dashboard/admin', label: 'Panel Admin', icon: Shield }]
      : []),
  ]

  // Todos los items para el sidebar desktop
  const desktopCategories = [
    {
      key: 'crm', label: 'CRM',
      items: [
        { href: '/dashboard/user/clientes', label: 'Clientes', icon: Users },
        { href: '/dashboard/user/invitados', label: 'Invitados', icon: UserCheck },
        { href: '/dashboard/user/consumos', label: 'Consumos', icon: Receipt },
      ],
    },
    {
      key: 'marketing', label: 'Marketing',
      items: [
        { href: '/dashboard/user/ranking', label: 'Ranking', icon: Trophy },
        { href: '/dashboard/user/home', label: 'Home Pública', icon: Home },
      ],
    },
    {
      key: 'admin', label: 'Administración',
      items: userRole === 'admin'
        ? [{ href: '/dashboard/admin', label: 'Panel Admin', icon: Shield }]
        : [],
    },
  ]

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-zinc-100 flex flex-col">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">

          {/* Izquierda: logo + collapse (solo desktop) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-zinc-800 transition"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <Image src="/logo.png" alt="VIP" width={60} height={60} className="h-9 w-auto" />
          </div>

          {/* Derecha: avatar (desktop) | avatar pequeño (mobile) */}
          {userEmail && (
            <>
              {/* Desktop: dropdown completo */}
              <div className="hidden md:block">
                <AvatarDropdown
                  email={userEmail}
                  avatarUrl={avatarUrl}
                  onLogout={() => setShowLogoutModal(true)}
                />
              </div>

              {/* Mobile: avatar que va a perfil directo */}
              <button
                onClick={() => router.push('/dashboard/user/perfil')}
                className="md:hidden rounded-full focus:outline-none active:ring-2 active:ring-zinc-500 ring-offset-2 ring-offset-[#0c0c0f]"
              >
                <AvatarCircle email={userEmail} avatarUrl={avatarUrl} size="sm" />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1">

        {/* ===== SIDEBAR DESKTOP ===== */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 72 : 240 }}
          transition={{ duration: 0.25 }}
          className="hidden md:flex flex-col bg-[#0f0f14] border-r border-zinc-800 p-3 h-screen sticky top-16 overflow-visible shrink-0"
        >
          <div className="flex-1 overflow-y-auto overflow-x-visible space-y-5 pr-1">
            {desktopCategories.map(cat => (
              <div key={cat.key}>
                {!sidebarCollapsed && cat.items.length > 0 && (
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className="flex items-center justify-between w-full text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 px-2"
                  >
                    {cat.label}
                    {openCategories[cat.key] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
                {(openCategories[cat.key] || sidebarCollapsed) &&
                  cat.items.map(item => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Tooltip key={item.href} label={item.label} enabled={sidebarCollapsed}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition w-full ${
                            active
                              ? 'bg-zinc-800 text-white'
                              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className="shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </Tooltip>
                    )
                  })}
              </div>
            ))}
          </div>
        </motion.aside>

        {/* ===== CONTENT ===== */}
        {/* pb-24 en mobile para que no tape la bottom nav */}
        <main className="flex-1 p-4 pb-28 md:pb-8 md:p-6 lg:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      {/* ================= BOTTOM NAV (solo mobile) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f14]/95 backdrop-blur-md border-t border-zinc-800">
        <div className="flex items-center justify-around px-2 py-2 safe-area-pb">

          {mainNavItems.map(item => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition flex-1 ${
                  active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-zinc-500'}`}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white"
                  />
                )}
              </Link>
            )
          })}

          {/* Botón "Más" */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition flex-1 ${
              secondaryNavItems.some(i => i.href === pathname)
                ? 'text-white'
                : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* ===== SHEET "MÁS" (mobile) ===== */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] md:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#111118] border-t border-zinc-800 rounded-t-3xl p-5 md:hidden"
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-5" />

              {/* Info usuario */}
              {userEmail && (
                <div className="flex items-center gap-3 mb-5 px-1 pb-4 border-b border-zinc-800">
                  <AvatarCircle email={userEmail} avatarUrl={avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">Cuenta</p>
                    <p className="text-sm text-white truncate">{userEmail}</p>
                  </div>
                </div>
              )}

              {/* Items secundarios */}
              <div className="space-y-1 mb-4">
                {secondaryNavItems.map(item => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition ${
                        active
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-300 active:bg-zinc-800'
                      }`}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              {/* Logout */}
              <button
                onClick={() => { setMoreOpen(false); setShowLogoutModal(true) }}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm text-red-400 active:bg-red-500/10 transition"
              >
                <LogOut size={20} />
                Cerrar sesión
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= MODAL LOGOUT ================= */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <h2 className="text-lg font-semibold mb-2">¿Cerrar sesión?</h2>
                <p className="text-sm text-zinc-400 mb-6">Vas a salir de tu cuenta actual.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 active:bg-zinc-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={cerrarSesion}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-red-600 active:bg-red-700 transition"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}