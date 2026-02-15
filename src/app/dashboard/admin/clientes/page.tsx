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
    const { data: { session } } = await supabase.auth.getSession()
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
    .filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))
    .filter(c => filtroEstado === 'todos' ? true : c.estado === filtroEstado)

  return (
    <div className="space-y-8 px-4 md:px-10 py-6">
      <h1 className="text-3xl font-bold">Gestión de Clientes</h1>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 w-full md:w-64"
        />

        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 w-full md:w-48"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="enviado">Enviados</option>
        </select>
      </div>

      {/* TABLA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        {loading ? (
          <div className="p-6 text-zinc-500">Cargando clientes...</div>
        ) : (
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Vendedor</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center px-4 py-6 text-zinc-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map(cliente => (
                  <tr
                    key={cliente.id}
                    className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                  >
                    <td className="px-4 py-3 font-medium">{cliente.nombre}</td>

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

                    <td className="px-4 py-3 text-zinc-400">{cliente.vendedor_nombre}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
