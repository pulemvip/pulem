'use client'

import Link from 'next/link'
import { ReactNode, useState } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true)

  const links = [
    { name: 'Dashboard', href: '/dashboard/admin' },
    { name: 'Reroll', href: '/dashboard/admin/reroll' },
    { name: 'Historial', href: '/dashboard/admin/historial' },
    { name: 'Clientes', href: '/dashboard/admin/clientes' },
    { name: 'Vendedores', href: '/dashboard/admin/vendedores' },
    { name: 'Configuración', href: '/dashboard/admin/configuracion' },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">

      {/* SIDEBAR */}
      <aside className={`flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all ${open ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <span className="font-bold text-lg">{open ? 'AdminPanel' : 'AP'}</span>
          <button
            onClick={() => setOpen(!open)}
            className="p-1 bg-zinc-800 rounded hover:bg-zinc-700 transition"
          >
            {open ? '<' : '>'}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(link => (
            <Link
              key={link.name}
              href={link.href}
              className="block px-3 py-2 rounded hover:bg-zinc-800 transition"
            >
              {open ? link.name : link.name.charAt(0)}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="flex justify-end items-center bg-zinc-900 border-b border-zinc-800 p-4">
          <span className="text-sm text-zinc-400">admin@email.com</span>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
