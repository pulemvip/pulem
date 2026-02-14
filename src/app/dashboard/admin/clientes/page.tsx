'use client'

import { useState, useEffect } from 'react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])

  useEffect(() => {
    // TODO: Reemplazar con fetch desde Supabase
    const dummy = Array.from({ length: 100 }).map((_, i) => ({
      id: i + 1,
      nombre: `Cliente ${i + 1}`,
      vendedor: `Vendedor ${i % 5 + 1}`,
      estado: ['enviado', 'pendiente'][i % 2],
    }))
    setClientes(dummy)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Clientes</h1>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Vendedor</th>
              <th className="text-left px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition">
                <td className="px-4 py-3">{c.id}</td>
                <td className="px-4 py-3 font-medium">{c.nombre}</td>
                <td className="px-4 py-3 text-zinc-400">{c.vendedor}</td>
                <td className={`px-4 py-3 font-semibold ${c.estado === 'enviado' ? 'text-blue-500' : 'text-zinc-400'}`}>
                  {c.estado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
