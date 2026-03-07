'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { registrarAccion } from '@/lib/historial'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, Trash2, Search, CheckCheck, X } from 'lucide-react'

type Consumo = {
  id: string
  nombre: string
  tipo: 'free' | 'descuento'
  user_id: string
}

type Toast = {
  id: number
  message: string
  type: 'success' | 'error'
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] flex flex-col gap-2 items-stretch sm:items-end">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 bg-[#0f0f14] border border-zinc-800 rounded-2xl py-4 px-2 text-center">
      <p className="text-[11px] text-zinc-500 mb-1 leading-tight">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function TipoBadge({ tipo }: { tipo: 'free' | 'descuento' }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
      tipo === 'free'
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    }`}>
      {tipo === 'free' ? 'Free' : 'Dscto'}
    </span>
  )
}

export default function ConsumosPage() {
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [tipo, setTipo] = useState<'free' | 'descuento'>('free')
  const [userIdActual, setUserIdActual] = useState('')
  const [userRole, setUserRole] = useState('cliente')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [agregando, setAgregando] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserIdActual(user.id)
      const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
      if (perfil?.rol) setUserRole(perfil.rol)
      const { data } = await supabase.from('consumos').select('*').order('created_at', { ascending: true })
      setConsumos((data as Consumo[]) || [])
      setLoading(false)
    }
    cargarTodo()
  }, [])

  const cargarConsumos = async () => {
    const { data } = await supabase.from('consumos').select('*').order('created_at', { ascending: true })
    setConsumos((data as Consumo[]) || [])
  }

  const agregarConsumo = async () => {
    if (!nuevoNombre.trim()) return
    setAgregando(true)
    const { error } = await supabase.from('consumos').insert({
      nombre: nuevoNombre.trim(),
      tipo,
      user_id: userIdActual,
    })
    if (error) {
      addToast('Error al agregar consumo', 'error')
    } else {
      await registrarAccion({
        accion: 'consumo_agregado',
        detalle: `${nuevoNombre.trim()} (${tipo})`,
      })
      addToast(`"${nuevoNombre.trim()}" agregado`, 'success')
      setNuevoNombre('')
      setTipo('free')
      await cargarConsumos()
    }
    setAgregando(false)
  }

  const eliminarConsumo = async (id: string, ownerId: string) => {
    if (userRole !== 'admin' && ownerId !== userIdActual) return
    const consumo = consumos.find(c => c.id === id)
    const nombre = consumo?.nombre ?? ''
    const { error } = await supabase.from('consumos').delete().eq('id', id)
    if (error) {
      addToast('Error al eliminar', 'error')
    } else {
      await registrarAccion({
        accion: 'consumo_eliminado',
        detalle: `${nombre} (${consumo?.tipo ?? ''})`,
      })
      setConsumos(prev => prev.filter(c => c.id !== id))
      addToast(`"${nombre}" eliminado`, 'success')
    }
  }

  const [showConfirmLimpiar, setShowConfirmLimpiar] = useState(false)
  const [limpiando, setLimpiando] = useState(false)

  const limpiarLista = async () => {
    if (userRole !== 'admin') return
    setLimpiando(true)
    const total = consumos.length
    const ids = consumos.map(c => c.id)
    const { error } = await supabase.from('consumos').delete().in('id', ids)
    if (error) {
      addToast('Error al limpiar', 'error')
    } else {
      await registrarAccion({
        accion: 'consumos_limpiados',
        detalle: `${total} consumos eliminados`,
        metadata: { total },
      })
      setConsumos([])
      addToast('Lista limpiada', 'success')
    }
    setLimpiando(false)
    setShowConfirmLimpiar(false)
  }

  const copiarTodo = async () => {
    if (consumos.length === 0) return
    const hoy = new Date().toLocaleDateString('es-AR')
    const free = consumos.filter(c => c.tipo === 'free').map(c => c.nombre)
    const descuento = consumos.filter(c => c.tipo === 'descuento').map(c => c.nombre)
    const texto = `CONSUMOS ${hoy}\n\nNombre Combo Free\n${free.join('\n')}\n\nNombre Descuento en Combo\n${descuento.join('\n')}`
    await navigator.clipboard.writeText(texto.trim())
    addToast('Lista copiada al portapapeles', 'success')
  }

  const filtrados = consumos.filter(c => c.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
  const totalFree = consumos.filter(c => c.tipo === 'free').length
  const totalDescuento = consumos.filter(c => c.tipo === 'descuento').length
  const misConsumos = consumos.filter(c => c.user_id === userIdActual).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto space-y-5 pb-24"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">Consumos</h1>
          <p className="text-sm text-zinc-500 mt-1">Registrá los combos del día</p>
        </div>

        <div className="flex gap-2">
          <StatCard label="Combo Free" value={totalFree} color="text-amber-400" />
          <StatCard label="Descuento" value={totalDescuento} color="text-blue-400" />
          <StatCard label="Tus consumos" value={misConsumos} color="text-emerald-400" />
        </div>

        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Agregar consumo</p>
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
            placeholder="Nombre del cliente"
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarConsumo()}
            autoComplete="off"
            autoCorrect="off"
          />
          <div className="flex rounded-xl overflow-hidden border border-zinc-700">
            {(['free', 'descuento'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  tipo === t
                    ? t === 'free' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                    : 'text-zinc-500 active:bg-zinc-800'
                }`}
              >
                {t === 'free' ? 'Combo Free' : 'Combo Descuento'}
              </button>
            ))}
          </div>
          <button
            onClick={agregarConsumo}
            disabled={agregando || !nuevoNombre.trim()}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-xl text-sm font-semibold active:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Plus size={16} />
            {agregando ? 'Agregando...' : 'Agregar'}
          </button>
        </div>

        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3.5 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={copiarTodo}
              disabled={consumos.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 text-sm text-zinc-300 active:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Copy size={15} />
              Copiar lista
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowConfirmLimpiar(true)}
                disabled={consumos.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-sm text-red-400 active:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Trash2 size={15} />
                Limpiar
              </button>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtrados.length === 0 ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-zinc-600 text-center py-10">
                  {searchQuery ? 'Sin resultados para esa búsqueda.' : 'Todavía no hay consumos registrados.'}
                </motion.p>
              ) : (
                filtrados.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18, delay: i * 0.02 }}
                    className="flex items-center justify-between gap-3 px-4 py-4 rounded-xl border border-zinc-800 bg-zinc-900/40 active:bg-zinc-900 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.tipo === 'free' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <span className="text-sm text-zinc-100 truncate">{c.nombre}</span>
                      <TipoBadge tipo={c.tipo} />
                    </div>
                    {(userRole === 'admin' || c.user_id === userIdActual) && (
                      <button
                        onClick={() => eliminarConsumo(c.id, c.user_id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-600 active:text-red-400 active:bg-red-500/10 transition shrink-0"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {filtrados.length > 0 && (
            <p className="text-xs text-zinc-600 text-right pt-1">
              {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
            </p>
          )}
        </div>
      </motion.div>
      {/* Modal confirmar limpiar */}
      <AnimatePresence>
        {showConfirmLimpiar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => !limpiando && setShowConfirmLimpiar(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <h2 className="text-base font-semibold mb-2">¿Limpiar toda la lista?</h2>
                <p className="text-sm text-zinc-400 mb-1">Se van a eliminar <span className="text-white font-semibold">{consumos.length} consumos</span>.</p>
                <p className="text-sm text-zinc-500 mb-6">Esta acción no se puede deshacer.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmLimpiar(false)}
                    disabled={limpiando}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 active:bg-zinc-800 disabled:opacity-40 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={limpiarLista}
                    disabled={limpiando}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-red-600 text-white font-semibold active:bg-red-700 disabled:opacity-40 transition flex items-center justify-center gap-2"
                  >
                    {limpiando ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Limpiando...</> : 'Limpiar todo'}
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