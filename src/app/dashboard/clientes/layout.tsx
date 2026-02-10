'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserEmail(data.user?.email ?? null)
    }

    getUser()
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* LOGO IZQUIERDA */}
          <Link
            href="/dashboard/clientes"
            className="flex items-center gap-2 transform transition-transform duration-300 hover:scale-105"
          >
            <Image
              src="/logo.png"
              alt="VIP"
              width={60}
              height={60}
              priority
              className="sm:w-[80px] sm:h-[80px]"
            />
          </Link>

          {/* DERECHA */}
          <div className="flex items-center gap-3">
            {userEmail && (
              <span
                title={userEmail}
                className="
                  max-w-[120px] truncate
                  text-[11px] text-zinc-400
                  sm:max-w-[200px]
                  sm:text-xs
                  transition-colors duration-300
                  hover:text-white
                "
              >
                {userEmail}
              </span>
            )}

            <button
              onClick={() => setShowLogoutModal(true)}
              className="
                text-sm px-3 py-1.5 rounded-lg
                border border-zinc-700
                bg-zinc-900
                transition-transform transition-colors duration-300
                hover:bg-zinc-800 hover:scale-105
              "
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

      {/* MODAL DE CONFIRMACIÓN CON ANIMACIÓN */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300
          ${showLogoutModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div
          className={`bg-zinc-900 rounded-xl p-6 w-80 flex flex-col items-center space-y-4
            transform transition-transform duration-300
            ${showLogoutModal ? 'scale-100' : 'scale-90'}
          `}
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
        </div>
      </div>
    </div>
  )
}
