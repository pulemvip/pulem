'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
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
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('cliente')

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    crm: true,
    marketing: true,
    admin: true,
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

  /* ================= USER + ROL ================= */

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      setUserEmail(data.user.email ?? null)

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', data.user.id)
        .single()

      if (perfil?.rol) setUserRole(perfil.rol)
    }

    getUser()
  }, [router])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  /* ================= CATEGORÍAS ================= */

  const categories = [
    {
      key: 'crm',
      label: 'CRM',
      items: [
        { href: '/dashboard/user/clientes', label: 'Clientes', icon: Users },
        { href: '/dashboard/user/invitados', label: 'Invitados', icon: UserCheck },
        { href: '/dashboard/user/consumos', label: 'Consumos', icon: Receipt },
      ],
    },
    {
      key: 'marketing',
      label: 'Marketing',
      items: [
        { href: '/dashboard/user/ranking', label: 'Ranking', icon: Trophy },
        { href: '/dashboard/user/home', label: 'Home Pública', icon: Home },
      ],
    },
    {
      key: 'admin',
      label: 'Administración',
      items:
        userRole === 'admin'
          ? [{ href: '/dashboard/admin', label: 'Panel Admin', icon: Shield }]
          : [],
    },
  ]

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-zinc-100 flex flex-col">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-[#0c0c0f]/80 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="md:hidden">
              <Menu size={22} />
            </button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:block"
            >
              {sidebarCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>

            <Image
              src="/logo.png"
              alt="VIP"
              width={70}
              height={70}
              className="hidden sm:block"
            />
          </div>

          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="hidden sm:block max-w-[200px] truncate text-xs text-zinc-400">
                {userEmail}
              </span>
            )}

            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">

        {/* ===== SIDEBAR DESKTOP ===== */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 80 : 260 }}
          transition={{ duration: 0.25 }}
          className="hidden md:flex flex-col bg-[#0f0f14] border-r border-zinc-800 p-4"
        >
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {categories.map(cat => (
              <div key={cat.key}>
                {!sidebarCollapsed && cat.items.length > 0 && (
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className="flex items-center justify-between w-full text-xs uppercase tracking-wide text-zinc-500 mb-2"
                  >
                    {cat.label}
                    {openCategories[cat.key] ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                )}

                {(openCategories[cat.key] || sidebarCollapsed) &&
                  cat.items.map(item => {
                    const active = pathname === item.href
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          active
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <Icon size={18} />
                        {!sidebarCollapsed && item.label}
                      </Link>
                    )
                  })}
              </div>
            ))}
          </div>
        </motion.aside>

        {/* ===== CONTENT ===== */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ================= MODAL LOGOUT ================= */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => setShowLogoutModal(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-[80]"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-xl p-6 w-[90%] max-w-sm shadow-xl">
                <h2 className="text-lg font-semibold mb-4">
                  ¿Cerrar sesión?
                </h2>

                <p className="text-sm text-zinc-400 mb-6">
                  Vas a salir de tu cuenta actual.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-zinc-700 hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={cerrarSesion}
                    className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700"
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