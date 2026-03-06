'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { registrarAccion } from '@/lib/historial'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, Trash2, Search, CheckCheck, X } from 'lucide-react'

type Invitado = {
  id: number
  nombre: string
  user_id: string
  user_email: string
}

type Toast = {
  id: number
  message: string
  type: 'success' | 'error'
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
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

function Avatar({ email }: { email: string }) {
  const initials = email.split('@')[0].slice(0, 2).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[11px] font-semibold text-zinc-300 shrink-0">
      {initials}
    </div>
  )
}

export default function InvitadosPage() {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [userIdActual, setUserIdActual] = useState('')
  const [userRole, setUserRole] = useState('vendedor')
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
      const { data } = await supabase.from('invitados').select('*').order('nombre')
      setInvitados((data as Invitado[]) || [])
      setLoading(false)
    }
    cargarTodo()
  }, [])

  const cargarInvitados = async () => {
    const { data } = await supabase.from('invitados').select('*').order('nombre')
    setInvitados((data as Invitado[]) || [])
  }

  const agregarInvitado = async () => {
    if (!nuevoInvitado.trim()) return
    setAgregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('invitados').insert({
      nombre: nuevoInvitado.trim(),
      user_id: user.id,
      user_email: user.email,
    })

    if (error) {
      addToast('Error al agregar invitado', 'error')
    } else {
      await registrarAccion({
        accion: 'invitado_agregado',
        detalle: nuevoInvitado.trim(),
      })
      addToast(`"${nuevoInvitado.trim()}" agregado`, 'success')
      setNuevoInvitado('')
      await cargarInvitados()
    }
    setAgregando(false)
  }

  const eliminarInvitado = async (id: number, nombre: string) => {
    const { error } = await supabase
      .from('invitados').delete().eq('id', id).eq('user_id', userIdActual)
    if (error) {
      addToast('Error al eliminar', 'error')
    } else {
      await registrarAccion({
        accion: 'invitado_eliminado',
        detalle: nombre,
      })
      setInvitados(prev => prev.filter(i => i.id !== id))
      addToast(`"${nombre}" eliminado`, 'success')
    }
  }

  const limpiarLista = async () => {
    if (userRole !== 'admin') return
    const total = invitados.length
    const { error } = await supabase.from('invitados').delete().neq('id', 0)
    if (error) {
      addToast('Error al limpiar la lista', 'error')
    } else {
      await registrarAccion({
        accion: 'invitados_limpiados',
        detalle: `${total} invitados eliminados`,
        metadata: { total },
      })
      setInvitados([])
      addToast('Lista limpiada', 'success')
    }
  }

  const copiarLista = async () => {
    if (invitados.length === 0) return
    const hoy = new Date().toLocaleDateString('es-AR')
    const texto = `INVITADOS ${hoy}\n\n${invitados.map(i => i.nombre).join('\n')}`
    await navigator.clipboard.writeText(texto.trim())
    addToast('Lista copiada al portapapeles', 'success')
  }

  const filtrados = invitados.filter(i => i.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
  const misInvitados = invitados.filter(i => i.user_id === userIdActual).length

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
          <h1 className="text-xl font-semibold text-white">Invitados</h1>
          <p className="text-sm text-zinc-500 mt-1">Listado del día</p>
        </div>

        <div className="flex gap-2">
          <StatCard label="Total invitados" value={invitados.length} color="text-amber-400" />
          <StatCard label="Tus invitados" value={misInvitados} color="text-emerald-400" />
        </div>

        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Agregar invitado</p>
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
            placeholder="Nombre del invitado"
            value={nuevoInvitado}
            onChange={e => setNuevoInvitado(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarInvitado()}
            autoComplete="off"
            autoCorrect="off"
          />
          <button
            onClick={agregarInvitado}
            disabled={agregando || !nuevoInvitado.trim()}
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
              placeholder="Buscar invitado..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3.5 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={copiarLista}
              disabled={invitados.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 text-sm text-zinc-300 active:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Copy size={15} />
              Copiar lista
            </button>
            {userRole === 'admin' && (
              <button
                onClick={limpiarLista}
                disabled={invitados.length === 0}
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
                  {searchQuery ? 'Sin resultados para esa búsqueda.' : 'Todavía no hay invitados registrados.'}
                </motion.p>
              ) : (
                filtrados.map((i, idx) => (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18, delay: idx * 0.02 }}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 active:bg-zinc-900 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar email={i.user_email} />
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-100 truncate">{i.nombre}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{i.user_email}</p>
                      </div>
                    </div>
                    {i.user_id === userIdActual && (
                      <button
                        onClick={() => eliminarInvitado(i.id, i.nombre)}
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
              {filtrados.length} {filtrados.length === 1 ? 'invitado' : 'invitados'}
            </p>
          )}
        </div>
      </motion.div>
    </>
  )
}