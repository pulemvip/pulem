'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Users, CheckCheck, Clock } from 'lucide-react'

type Cliente = {
  id: string
  nombre: string
  estado: string
  vendedor_nombre: string
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-zinc-800 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-zinc-800 rounded w-1/3" />
      </div>
      <div className="h-6 bg-zinc-800 rounded-full w-20" />
      <div className="h-3.5 bg-zinc-800 rounded w-1/4 hidden sm:block" />
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => { fetchClientes() }, [])

  const fetchClientes = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/clientes', {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    const data = await res.json()
    setClientes(data || [])
    setLoading(false)
  }

  const filtrados = clientes
    .filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))
    .filter(c => filtroEstado === 'todos' ? true : c.estado === filtroEstado)

  const total = clientes.length
  const enviados = clientes.filter(c => c.estado === 'enviado').length
  const pendientes = clientes.filter(c => c.estado === 'pendiente').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Clientes</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Listado completo de clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: total, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Enviados', value: enviados, icon: CheckCheck, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Pendientes', value: pendientes, icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">{label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={13} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + tabla */}
      <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">

        {/* Filtros */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-8 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition appearance-none cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="enviado">Enviados</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div>{[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-16">
            {search || filtroEstado !== 'todos' ? 'No hay resultados para esa búsqueda.' : 'No hay clientes.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Nombre</th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filtrados.map((cliente, idx) => (
                    <motion.tr
                      key={cliente.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx < 30 ? idx * 0.01 : 0 }}
                      className="hover:bg-zinc-800/30 transition"
                    >
                      <td className="px-4 py-3.5 font-medium text-zinc-100">{cliente.nombre}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                          cliente.estado === 'enviado'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {cliente.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500 text-xs hidden sm:table-cell">
                        {cliente.vendedor_nombre}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-600">
                {filtrados.length} {filtrados.length === 1 ? 'cliente' : 'clientes'}
                {(search || filtroEstado !== 'todos') ? ' (filtrado)' : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}