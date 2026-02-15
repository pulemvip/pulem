'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserEmail(data.user?.email ?? null)
    }
    getUser()
  }, [])

  // cerrar menú si clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">

      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* LOGO + MENU */}
          <div ref={menuRef} className="relative">

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 transition-transform duration-300 hover:scale-105"
            >
              <Image
                src="/logo.png"
                alt="VIP"
                width={60}
                height={60}
                priority
                className="sm:w-[80px] sm:h-[80px]"
              />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute top-full left-0 mt-3 w-56"
                >

                  {/* Flechita */}
                  <div className="absolute -top-2 left-6 w-4 h-4 bg-zinc-900 border-l border-t border-zinc-800 rotate-45" />

                  <div className="
                    bg-zinc-900/95
                    backdrop-blur-xl
                    border border-blue-500/20
                    rounded-2xl
                    shadow-[0_0_25px_rgba(59,130,246,0.15)]
                    overflow-hidden
                  ">

                    <Link
                      href="/dashboard/admin"
                      onClick={() => setShowMenu(false)}
                      className="block px-5 py-3 text-sm hover:bg-blue-500/10 transition"
                    >
                      🛠 Panel Admin
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-3">

            {userEmail && (
              <span
                title={userEmail}
                className="max-w-[120px] truncate text-[11px] text-zinc-400 sm:max-w-[200px] sm:text-xs hover:text-white transition"
              >
                {userEmail}
              </span>
            )}

            <button
              onClick={() => setShowLogoutModal(true)}
              className="text-sm px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:scale-105 transition"
            >
              Cerrar sesión
            </button>

          </div>

        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-zinc-900 rounded-2xl p-6 w-80 flex flex-col items-center space-y-4 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            >
              <p className="text-white text-center">
                ¿Estás seguro que querés cerrar sesión?
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={cerrarSesion}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Cerrar sesión
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
