'use client'

import { useState, useEffect } from 'react'

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<any[]>([])

  useEffect(() => {
    // Dummy data
    const dummy = Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      nombre: `Vendedor ${i + 1}`,
      email: `vendedor${i + 1}@mail.com`,
      clientes: Math.floor(Math.random() * 500),
    }))
    setVendedores(dummy)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vendedores</h1>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Clientes Asignados</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map((v) => (
              <tr key={v.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition">
                <td className="px-4 py-3">{v.id}</td>
                <td className="px-4 py-3 font-medium">{v.nombre}</td>
                <td className="px-4 py-3 text-zinc-400">{v.email}</td>
                <td className="px-4 py-3 font-semibold text-blue-500">{v.clientes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
