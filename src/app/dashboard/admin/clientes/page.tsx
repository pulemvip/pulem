'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
  estado: string
  vendedor_nombre: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch('/api/clientes', {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    })

    const data = await res.json()

    setClientes(data || [])
    setLoading(false)
  }

  const clientesFiltrados = clientes
    .filter(c =>
      c.nombre.toLowerCase().includes(search.toLowerCase())
    )
    .filter(c =>
      filtroEstado === 'todos' ? true : c.estado === filtroEstado
    )

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Gestión de Clientes</h1>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 w-64"
        />

        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="enviado">Enviados</option>
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-zinc-500">Cargando clientes...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Vendedor</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map(cliente => (
                <tr
                  key={cliente.id}
                  className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                >
                  <td className="px-4 py-3 font-medium">
                    {cliente.nombre}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        cliente.estado === 'enviado'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                      }`}
                    >
                      {cliente.estado}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-zinc-400">
                    {cliente.vendedor_nombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
