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
      <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* IZQUIERDA */}
          <h1 className="font-semibold text-sm sm:text-base tracking-tight">
            Pulem
          </h1>

          {/* CENTRO – LOGO */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
          >
            <Image
              src="/logo.png"
              alt="VIP"
              width={56}
              height={56}
              priority
              className="sm:w-[64px] sm:h-[64px]"
            />
          </Link>

          {/* DERECHA */}
          <div className="flex items-center gap-3">
            {userEmail && (
              <span
                title={userEmail}
                className="hidden sm:block max-w-[200px] truncate text-xs text-zinc-400"
              >
                {userEmail}
              </span>
            )}

            <button
              onClick={cerrarSesion}
              className="text-sm px-3 py-1.5 rounded-lg
                border border-zinc-700
                hover:bg-zinc-800 transition"
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
    </div>
  )
}
