'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ACCION_LABELS, ACCION_COLORS } from '@/lib/historial'
import { motion } from 'framer-motion'
import { RefreshCw, Filter, Search } from 'lucide-react'

type HistorialEntry = {
  id: string
  created_at: string
  user_email: string
  accion: string
  detalle: string | null
  metadata: Record<string, unknown> | null
}

const ACCIONES_FILTER = [
  { value: '', label: 'Todas' },
  { value: 'consumo', label: 'Consumos' },
  { value: 'invitado', label: 'Invitados' },
  { value: 'reroll', label: 'Rerolls' },
  { value: 'evento', label: 'Eventos' },
  { value: 'usuario', label: 'Usuarios' },
  { value: 'lista', label: 'Limpiezas' },
]

function formatFecha(fecha: string) {
  const d = new Date(fecha)
  return {
    fecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function getAccionLabel(accion: string): string {
  return ACCION_LABELS[accion as keyof typeof ACCION_LABELS] ?? accion
}

function getAccionColor(accion: string): string {
  return ACCION_COLORS[accion as keyof typeof ACCION_COLORS] ?? 'text-zinc-400'
}

function getAccionDot(accion: string): string {
  if (accion.includes('eliminad') || accion.includes('limpiado') || accion.includes('desactivado')) return 'bg-red-500'
  if (accion.includes('agregado') || accion.includes('creado') || accion.includes('activado')) return 'bg-emerald-500'
  if (accion.includes('editado')) return 'bg-amber-500'
  if (accion.includes('reroll')) return 'bg-purple-500'
  return 'bg-blue-500'
}

export default function HistorialPage() {
  const [entries, setEntries] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchHistorial = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    const { data } = await supabase
      .from('historial')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (data) setEntries(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    fetchHistorial()
  }, [])

  const filtered = entries.filter(e => {
    const matchSearch =
      e.user_email.toLowerCase().includes(search.toLowerCase()) ||
      getAccionLabel(e.accion).toLowerCase().includes(search.toLowerCase()) ||
      (e.detalle?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const matchAccion = filtroAccion === '' || e.accion.includes(filtroAccion)

    return matchSearch && matchAccion
  })

  return (
    <div className="space-y-6 px-0 sm:px-2">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Registro de todas las acciones del sistema</p>
        </div>
        <button
          onClick={() => fetchHistorial(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 transition"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
          />
        </div>

        {/* Filtro por tipo */}
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <select
            value={filtroAccion}
            onChange={e => setFiltroAccion(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-8 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition appearance-none cursor-pointer"
          >
            {ACCIONES_FILTER.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs text-zinc-600">
          {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
          {filtroAccion || search ? ' (filtrado)' : ''}
        </p>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600 text-sm">
          {search || filtroAccion ? 'No hay resultados para esa búsqueda' : 'No hay registros todavía'}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Acción</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Usuario</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Detalle</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => {
                  const { fecha, hora } = formatFecha(entry.created_at)
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx < 20 ? idx * 0.02 : 0 }}
                      className="border-t border-zinc-800 hover:bg-zinc-800/30 transition"
                    >
                      {/* Acción */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getAccionDot(entry.accion)}`} />
                          <span className={`font-medium ${getAccionColor(entry.accion)}`}>
                            {getAccionLabel(entry.accion)}
                          </span>
                        </div>
                        {/* En mobile muestra usuario abajo */}
                        <p className="text-xs text-zinc-600 mt-0.5 sm:hidden">{entry.user_email}</p>
                      </td>

                      {/* Usuario */}
                      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                        {entry.user_email}
                      </td>

                      {/* Detalle */}
                      <td className="px-4 py-3 text-zinc-500 hidden md:table-cell max-w-xs truncate">
                        {entry.detalle ?? '—'}
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        <span className="text-zinc-300">{hora}</span>
                        <span className="text-zinc-600 text-xs ml-1 hidden sm:inline">{fecha}</span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}