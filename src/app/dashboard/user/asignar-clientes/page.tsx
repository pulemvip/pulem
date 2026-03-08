'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, RefreshCcw, CheckCheck, X, Loader2, AlertTriangle, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { registrarAccion } from '@/lib/historial'

type Vendedor = {
  id: string
  email: string
  avatar_url: string | null
  clientes_count?: number
}

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  user_id: string | null
}

type Toast = { id: number; message: string; type: 'success' | 'error' }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-xl text-sm font-medium ${
              t.type === 'success'
                ? 'bg-[#0f0f14] border-emerald-500/30 text-emerald-400'
                : 'bg-[#0f0f14] border-red-500/30 text-red-400'
            }`}
          >
            {t.type === 'success' ? <CheckCheck size={15} /> : <X size={15} />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function getInitials(email: string) {
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function AsignarClientesPage() {
  const router = useRouter()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [repartiendo, setRepartiendo] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [preview, setPreview] = useState<{ vendedor: Vendedor; cantidad: number }[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  // Para asignación individual
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(null)
  const [asignandoId, setAsignandoId] = useState<string | null>(null)

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
      if (!perfil || !['admin'].includes(perfil.rol)) {
        router.replace('/dashboard/user/clientes')
        return
      }

      const [{ data: vData }, { data: cData }] = await Promise.all([
        supabase.from('usuarios').select('id, email, avatar_url').eq('rol', 'vendedor').eq('activo', true),
        supabase.from('clientes').select('id, nombre, telefono, user_id').order('nombre'),
      ])

      const vendedoresList = (vData || []) as Vendedor[]
      const clientesList = (cData || []) as Cliente[]

      // Contar clientes por vendedor
      const vendedoresConCount = vendedoresList.map(v => ({
        ...v,
        clientes_count: clientesList.filter(c => c.user_id === v.id).length,
      }))

      setVendedores(vendedoresConCount)
      setClientes(clientesList)
      setLoading(false)
    }
    cargar()
  }, [router])

  const generarPreview = () => {
    if (vendedores.length === 0) return
    const porVendedor = Math.floor(clientes.length / vendedores.length)
    const resto = clientes.length % vendedores.length
    const prev = vendedores.map((v, i) => ({
      vendedor: v,
      cantidad: porVendedor + (i < resto ? 1 : 0),
    }))
    setPreview(prev)
    setShowConfirm(true)
  }

  const repartirEquitativamente = async () => {
    setRepartiendo(true)
    try {
      const clientesMezclados = [...clientes].sort(() => Math.random() - 0.5)
      const updates: { id: string; user_id: string }[] = []

      clientesMezclados.forEach((cliente, idx) => {
        const vendedor = vendedores[idx % vendedores.length]
        updates.push({ id: cliente.id, user_id: vendedor.id })
      })

      // Batch updates de a 500
      for (let i = 0; i < updates.length; i += 500) {
        const batch = updates.slice(i, i + 500)
        const { error } = await supabase.from('clientes').upsert(batch, { onConflict: 'id' })
        if (error) throw error
      }

      await registrarAccion({
        accion: 'reroll_ejecutado',
        detalle: `${clientes.length} clientes repartidos entre ${vendedores.length} vendedores`,
        metadata: { total: clientes.length, vendedores: vendedores.length },
      })

      // Actualizar estado local
      const updatesMap = new Map(updates.map(u => [u.id, u.user_id]))
      setClientes(prev => prev.map(c => ({ ...c, user_id: updatesMap.get(c.id) ?? c.user_id })))
      setVendedores(prev => prev.map((v, i) => ({
        ...v,
        clientes_count: updates.filter(u => u.user_id === v.id).length,
      })))

      addToast(`${clientes.length} clientes repartidos entre ${vendedores.length} vendedores`, 'success')
    } catch {
      addToast('Error al repartir clientes', 'error')
    }
    setRepartiendo(false)
    setShowConfirm(false)
    setPreview([])
  }

  const asignarCliente = async (clienteId: string, vendedorId: string) => {
    setAsignandoId(clienteId)
    const { error } = await supabase.from('clientes').update({ user_id: vendedorId }).eq('id', clienteId)
    if (error) {
      addToast('Error al asignar', 'error')
    } else {
      setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, user_id: vendedorId } : c))
      setVendedores(prev => prev.map(v => ({
        ...v,
        clientes_count: (clientes.filter(c =>
          c.id === clienteId ? vendedorId === v.id : c.user_id === v.id
        ).length),
      })))
      setClienteSeleccionado(null)
      addToast('Cliente reasignado', 'success')
    }
    setAsignandoId(null)
  }

  const getVendedorEmail = (userId: string | null) => {
    if (!userId) return 'Sin asignar'
    return vendedores.find(v => v.id === userId)?.email ?? 'Desconocido'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
      </div>
    )
  }

  const sinAsignar = clientes.filter(c => !c.user_id || !vendedores.find(v => v.id === c.user_id)).length

  return (
    <>
      <ToastContainer toasts={toasts} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto space-y-5 pb-24"
      >
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">Asignar clientes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {clientes.length} clientes · {vendedores.length} vendedores activos
            {sinAsignar > 0 && <span className="text-amber-400 ml-2">· {sinAsignar} sin asignar</span>}
          </p>
        </div>

        {/* Vendedores — distribución actual */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Users size={15} className="text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-white">Distribución actual</p>
            </div>
            <button
              onClick={generarPreview}
              disabled={repartiendo || vendedores.length < 2}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold active:bg-zinc-200 disabled:opacity-40 transition"
            >
              {repartiendo ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
              Repartir parejo
            </button>
          </div>

          <div className="divide-y divide-zinc-800">
            {vendedores.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-10">No hay vendedores activos</p>
            ) : (
              vendedores.map(v => {
                const pct = clientes.length > 0 ? ((v.clientes_count ?? 0) / clientes.length) * 100 : 0
                return (
                  <div key={v.id} className="px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                          {getInitials(v.email)}
                        </div>
                        <p className="text-sm text-zinc-300 truncate max-w-[180px]">{v.email}</p>
                      </div>
                      <span className="text-sm font-bold text-white shrink-0">{v.clientes_count ?? 0}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Lista de clientes con asignación individual */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="text-sm font-semibold text-white">Clientes</p>
            <p className="text-xs text-zinc-500 mt-0.5">Tocá un cliente para reasignarlo</p>
          </div>

          <div className="divide-y divide-zinc-800 max-h-[480px] overflow-y-auto">
            {clientes.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-10">No hay clientes</p>
            ) : (
              clientes.map(c => {
                const vendedorActual = vendedores.find(v => v.id === c.user_id)
                const isOpen = clienteSeleccionado === c.id
                return (
                  <div key={c.id}>
                    <button
                      onClick={() => setClienteSeleccionado(isOpen ? null : c.id)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/30 transition text-left"
                    >
                      <div>
                        <p className="text-sm text-zinc-100 font-medium">{c.nombre}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {vendedorActual ? vendedorActual.email : <span className="text-amber-500">Sin asignar</span>}
                        </p>
                      </div>
                      <ChevronDown
                        size={15}
                        className={`text-zinc-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-zinc-900/40"
                        >
                          <div className="px-5 py-3 space-y-1">
                            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Asignar a</p>
                            {vendedores.map(v => (
                              <button
                                key={v.id}
                                onClick={() => asignarCliente(c.id, v.id)}
                                disabled={asignandoId === c.id}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition ${
                                  c.user_id === v.id
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'
                                }`}
                              >
                                <span className="truncate">{v.email}</span>
                                {c.user_id === v.id && <CheckCheck size={14} className="shrink-0 ml-2" />}
                                {asignandoId === c.id && c.user_id !== v.id && (
                                  <Loader2 size={13} className="animate-spin shrink-0 ml-2 text-zinc-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal confirmar reparto */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => !repartiendo && setShowConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                  <RefreshCcw size={18} className="text-blue-400" />
                </div>
                <h2 className="text-base font-semibold mb-1">¿Repartir {clientes.length} clientes?</h2>
                <p className="text-sm text-zinc-500 mb-4">Así quedaría la distribución:</p>

                <div className="space-y-2 mb-6">
                  {preview.map(({ vendedor, cantidad }) => (
                    <div key={vendedor.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400 truncate max-w-[200px]">{vendedor.email}</span>
                      <span className="font-bold text-white shrink-0 ml-3">{cantidad} clientes</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 mb-5">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">Esto sobreescribe las asignaciones actuales de todos los clientes.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} disabled={repartiendo}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 active:bg-zinc-800 disabled:opacity-40 transition">
                    Cancelar
                  </button>
                  <button onClick={repartirEquitativamente} disabled={repartiendo}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-white text-black font-semibold active:bg-zinc-200 disabled:opacity-40 transition flex items-center justify-center gap-2">
                    {repartiendo
                      ? <><Loader2 size={14} className="animate-spin" /> Repartiendo...</>
                      : 'Confirmar'}
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