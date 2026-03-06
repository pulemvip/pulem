'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  RefreshCcw,
  History,
  Users,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Bell,
  MoreHorizontal,
} from 'lucide-react'

type Rol = 'admin' | 'vendedor'

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [rol, setRol] = useState<Rol | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.replace('/'); return }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('rol, activo, email, avatar_url')
        .eq('id', data.user.id)
        .single()

      if (!usuario || !usuario.activo) { router.replace('/'); return }

      setEmail(usuario.email)
      setRol(usuario.rol)
      if (usuario.avatar_url) setAvatarUrl(usuario.avatar_url)
      setLoading(false)
    }
    checkUser()
  }, [router])

  useEffect(() => {
    if (!rol) return
    const vendedorAllowedRoutes = ['/dashboard/admin', '/dashboard/admin/historial']
    if (rol === 'vendedor') {
      const allowed = vendedorAllowedRoutes.some(r => pathname.startsWith(r))
      if (!allowed) router.replace('/dashboard/admin')
    }
  }, [rol, pathname, router])

  useEffect(() => { setMoreOpen(false) }, [pathname])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const allLinks = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin', 'vendedor'] },
    { name: 'Historial', href: '/dashboard/admin/historial', icon: History, roles: ['admin', 'vendedor'] },
    { name: 'Reroll', href: '/dashboard/admin/reroll', icon: RefreshCcw, roles: ['admin'] },
    { name: 'Clientes', href: '/dashboard/admin/clientes', icon: Users, roles: ['admin'] },
    { name: 'Vendedores', href: '/dashboard/admin/vendedores', icon: UserCog, roles: ['admin'] },
    { name: 'Configuración', href: '/dashboard/admin/configuracion', icon: Settings, roles: ['admin'] },
  ]

  const visibleLinks = allLinks.filter(l => rol && l.roles.includes(rol))

  // Mobile: primeros 4 en bottom nav, resto en "Más"
  const bottomLinks = visibleLinks.slice(0, 4)
  const moreLinks = visibleLinks.slice(4)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c0f]">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-zinc-100 flex flex-col">

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">

          {/* Izq: collapse (desktop) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-zinc-800 transition"
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">Pulem</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 tracking-wider uppercase">
                Admin
              </span>
            </div>
          </div>

          {/* Der: email + avatar */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-zinc-500 truncate max-w-[160px]">{email}</span>
            {avatarUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-600 shrink-0">
                <Image src={avatarUrl} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-xs font-semibold text-white select-none">
                {email ? getInitials(email) : '?'}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">

        {/* ===== SIDEBAR DESKTOP ===== */}
        <motion.aside
          animate={{ width: sidebarOpen ? 240 : 72 }}
          transition={{ duration: 0.25 }}
          className="hidden md:flex flex-col bg-[#0f0f14] border-r border-zinc-800 p-3 h-screen sticky top-16 overflow-visible shrink-0"
        >
          <div className="flex-1 space-y-1 overflow-y-auto overflow-x-visible">
            {visibleLinks.map(link => {
              const active = pathname === link.href
              const Icon = link.icon
              return (
                <div key={link.href} className="relative group/tip">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition w-full ${
                      active
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{link.name}</span>}
                  </Link>
                  {/* Tooltip cuando colapsado */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity">
                      {link.name}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-700" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer sidebar */}
          <div className="border-t border-zinc-800 pt-3 space-y-1">
            <Link
              href="/dashboard/user"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-800 hover:text-white transition"
            >
              <ChevronLeft size={18} className="shrink-0" />
              {sidebarOpen && <span>Volver a Clientes</span>}
            </Link>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition w-full"
            >
              <LogOut size={18} className="shrink-0" />
              {sidebarOpen && <span>Cerrar sesión</span>}
            </button>
          </div>
        </motion.aside>

        {/* ===== CONTENT ===== */}
        <main className="flex-1 p-4 pb-28 md:pb-8 md:p-6 lg:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      {/* ===== BOTTOM NAV MOBILE ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f14]/95 backdrop-blur-md border-t border-zinc-800">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomLinks.map(link => {
            const active = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition flex-1 ${
                  active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-zinc-500'}`}>
                  {link.name}
                </span>
              </Link>
            )
          })}

          {/* Más */}
          {(moreLinks.length > 0 || true) && (
            <button
              onClick={() => setMoreOpen(true)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition flex-1 ${
                moreLinks.some(l => l.href === pathname) ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <MoreHorizontal size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Más</span>
            </button>
          )}
        </div>
      </nav>

      {/* ===== SHEET MÁS MOBILE ===== */}
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
              <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-5" />

              {email && (
                <div className="flex items-center gap-3 mb-5 px-1 pb-4 border-b border-zinc-800">
                  {avatarUrl ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-600 shrink-0">
                      <Image src={avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                      {getInitials(email)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white truncate">{email}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 uppercase shrink-0">
                        {rol}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1 mb-4">
                {moreLinks.map(link => {
                  const active = pathname === link.href
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition ${
                        active ? 'bg-zinc-800 text-white' : 'text-zinc-300 active:bg-zinc-800'
                      }`}
                    >
                      <Icon size={20} />
                      {link.name}
                    </Link>
                  )
                })}

                <Link
                  href="/dashboard/user"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm text-zinc-400 active:bg-zinc-800 transition"
                >
                  <ChevronLeft size={20} />
                  Volver a Clientes
                </Link>
              </div>

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

      {/* ===== MODAL LOGOUT ===== */}
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