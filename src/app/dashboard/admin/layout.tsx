'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  RefreshCcw,
  History,
  Users,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

type Rol = 'admin' | 'vendedor'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [rol, setRol] = useState<Rol | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.replace('/')
        return
      }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('rol, activo, email')
        .eq('id', data.user.id)
        .single()

      if (!usuario || !usuario.activo) {
        router.replace('/')
        return
      }

      setEmail(usuario.email)
      setRol(usuario.rol)
      setLoading(false)
    }

    checkUser()
  }, [router])

  useEffect(() => {
  if (!rol) return

  const vendedorAllowedRoutes = [
    '/dashboard/admin',
    '/dashboard/admin/historial'
  ]

  if (rol === 'vendedor') {
    const allowed = vendedorAllowedRoutes.some(route =>
      pathname.startsWith(route)
    )

    if (!allowed) {
      router.replace('/dashboard/admin')
    }
  }

}, [rol, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        Cargando...
      </div>
    )
  }

  const links = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin', 'vendedor'] },
  { name: 'Historial', href: '/dashboard/admin/historial', icon: History, roles: ['admin', 'vendedor'] },

  { name: 'Reroll', href: '/dashboard/admin/reroll', icon: RefreshCcw, roles: ['admin'] },
  { name: 'Clientes', href: '/dashboard/admin/clientes', icon: Users, roles: ['admin'] },
  { name: 'Vendedores', href: '/dashboard/admin/vendedores', icon: UserCog, roles: ['admin'] },
  { name: 'Configuración', href: '/dashboard/admin/configuracion', icon: Settings, roles: ['admin'] },
]


  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">

      {/* SIDEBAR */}
      <aside className={`relative flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-950 border-r border-zinc-800 transition-all duration-300 ${open ? 'w-64' : 'w-20'}`}>

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <span className="font-bold text-lg tracking-wide">
            {open ? 'Pulem' : 'P'}
          </span>

          <button
            onClick={() => setOpen(!open)}
            className="p-1 bg-zinc-800 rounded hover:bg-zinc-700 transition"
          >
            {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-2 py-4 space-y-2">

          {links
            .filter(link => rol && link.roles.includes(rol))
            .map(link => {

              const active = pathname === link.href
              const Icon = link.icon

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`
                    group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                    ${active
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'hover:bg-zinc-800 text-zinc-300'}
                  `}
                >
                  <Icon size={18} />

                  {open && <span>{link.name}</span>}

                  {!open && (
                    <span className="absolute left-20 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      {link.name}
                    </span>
                  )}
                </Link>
              )
            })
          }

        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-zinc-800">
          <Link
            href="/dashboard/clientes"
            className="flex items-center justify-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 transition rounded-lg px-3 py-2 font-medium"
          >
            {open ? '← Volver a Clientes' : '←'}
          </Link>
        </div>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        <header className="flex justify-between items-center bg-zinc-900 border-b border-zinc-800 px-6 py-4">

          <h1 className="text-lg font-semibold">
            Panel
          </h1>

          <div className="flex items-center gap-3">

            <span className="text-sm text-zinc-300">
              {email}
            </span>

            {rol === 'admin' && (
              <span className="text-xs font-semibold bg-red-600 text-white px-2 py-1 rounded-full tracking-wide">
                ADMIN
              </span>
            )}

            {rol === 'vendedor' && (
              <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-1 rounded-full tracking-wide">
                VENDEDOR
              </span>
            )}

          </div>

        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

      </div>
    </div>
  )
}
