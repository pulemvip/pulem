'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCcw, Unlock, ArrowRight, AlertTriangle, CheckCheck, Loader2 } from 'lucide-react'
import { registrarAccion } from '@/lib/historial'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-zinc-800 animate-pulse">
      <div className="flex-1 h-3.5 bg-zinc-800 rounded w-1/3" />
      <div className="h-3.5 bg-zinc-800 rounded w-1/4 hidden sm:block" />
      <div className="h-3.5 bg-zinc-800 rounded w-1/4 hidden sm:block" />
    </div>
  )
}

export default function RerollPage() {
  const [preview, setPreview] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const generarPreview = async () => {
    setLoadingPreview(true)
    setMessage(null)
    const token = await getToken()
    const res = await fetch('/api/reroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ejecutar: false }),
    })
    const data = await res.json()
    if (res.ok) {
      setPreview(data.preview || [])
      setTotal(data.total ?? 0)
    } else {
      setMessage({ text: data.error || 'Error al generar preview', type: 'error' })
    }
    setLoadingPreview(false)
  }

  const confirmar = async () => {
    setExecuting(true)
    const token = await getToken()
    const res = await fetch('/api/reroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ejecutar: true }),
    })
    if (res.ok) {
      await registrarAccion({
        accion: 'reroll_ejecutado',
        detalle: `${total ?? 0} clientes redistribuidos`,
        metadata: { total },
      })
      setMessage({ text: `Reroll ejecutado correctamente. ${total} clientes redistribuidos.`, type: 'success' })
    } else {
      setMessage({ text: 'Ocurrió un error al ejecutar el reroll.', type: 'error' })
    }
    setExecuting(false)
    setShowConfirm(false)
    setPreview([])
    setTotal(null)
  }

  const desbloquearTodos = async () => {
    setUnlocking(true)
    setMessage(null)
    const token = await getToken()
    const res = await fetch('/api/desbloquear-clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: `${data.totalDesbloqueados ?? 0} clientes desbloqueados correctamente.`, type: 'success' })
      router.refresh()
    } else {
      setMessage({ text: data.error || 'Error al desbloquear.', type: 'error' })
    }
    setUnlocking(false)
  }

  const visibleRows = preview.slice(0, 100)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-5xl mx-auto"
      >
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Reroll</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Redistribución de clientes entre vendedores</p>
        </div>

        {/* Stats post-preview */}
        <AnimatePresence>
          {total !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-3 overflow-hidden"
            >
              {[
                { label: 'Clientes afectados', value: total },
                { label: 'Vista previa', value: Math.min(100, total) },
                { label: 'Estado', value: 'Simulación', colored: true },
              ].map(({ label, value, colored }) => (
                <div key={label} className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-2">{label}</p>
                  <p className={`text-2xl font-bold ${colored ? 'text-blue-400' : 'text-white'}`}>{value}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Acciones */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Acciones masivas</p>
              <p className="text-xs text-zinc-500 mt-0.5">Operaciones administrativas globales</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={generarPreview}
                disabled={loadingPreview}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 font-medium hover:bg-zinc-700 disabled:opacity-40 transition"
              >
                {loadingPreview
                  ? <><Loader2 size={14} className="animate-spin" /> Generando...</>
                  : <><RefreshCcw size={14} /> Generar preview</>
                }
              </button>
              <button
                onClick={desbloquearTodos}
                disabled={unlocking}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 font-medium hover:bg-amber-500/20 disabled:opacity-40 transition"
              >
                {unlocking
                  ? <><Loader2 size={14} className="animate-spin" /> Desbloqueando...</>
                  : <><Unlock size={14} /> Desbloquear todos</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCheck size={15} /> : <AlertTriangle size={15} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabla preview */}
        <AnimatePresence>
          {total !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-semibold text-white">{total} cambios previstos</p>
                  {total > 100 && (
                    <p className="text-xs text-zinc-600 mt-0.5">Mostrando los primeros 100</p>
                  )}
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:bg-red-800 transition"
                >
                  <RefreshCcw size={14} />
                  Confirmar reroll
                </button>
              </div>

              {loadingPreview ? (
                <div>{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : preview.length === 0 ? (
                <p className="text-sm text-zinc-600 text-center py-12">No hay clientes para redistribuir.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="text-left px-4 py-3">Cliente</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Vendedor actual</th>
                        <th className="text-left px-4 py-3">Vendedor nuevo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {visibleRows.map((item, idx) => (
                        <motion.tr
                          key={item.cliente_id || idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx < 20 ? idx * 0.015 : 0 }}
                          className="hover:bg-zinc-800/30 transition"
                        >
                          <td className="px-4 py-3.5 font-medium text-zinc-100">{item.cliente_nombre || '—'}</td>
                          <td className="px-4 py-3.5 text-zinc-500 text-xs hidden sm:table-cell">{item.vendedor_actual_nombre || '—'}</td>
                          <td className="px-4 py-3.5">
                            <span className="flex items-center gap-1.5 text-blue-400 font-medium text-xs">
                              <ArrowRight size={12} />
                              {item.vendedor_nuevo_nombre || '—'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal confirmación */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <h2 className="text-base font-semibold mb-2">¿Confirmar reroll?</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  Esta acción redistribuirá <span className="text-white font-semibold">{total} clientes</span> de forma permanente entre los vendedores activos.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 active:bg-zinc-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={executing}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-red-600 text-white font-semibold active:bg-red-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                  >
                    {executing
                      ? <><Loader2 size={14} className="animate-spin" /> Ejecutando...</>
                      : 'Confirmar'
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}