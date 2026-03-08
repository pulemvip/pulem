'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Lock, Unlock, CheckCheck, X, Save } from 'lucide-react'

type Cliente = {
  id: number
  nombre: string
  telefono: string
  estado: string | null
  ultima_semana_enviada: number | null
  user_id: string
}

type Toast = { id: number; message: string; type: 'success' | 'error' }

const getSemanaActual = (): number => {
  const hoy = new Date()
  const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1)
  const dias = Math.floor((hoy.getTime() - primerDiaAnio.getTime()) / (24 * 60 * 60 * 1000))
  return Number(`${hoy.getFullYear()}${Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7)}`)
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
      <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function ClientesUserPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editandoMensaje, setEditandoMensaje] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [rolNoPermitido, setRolNoPermitido] = useState(false)

  const semanaActual = getSemanaActual()

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: perfil } = await supabase
        .from('usuarios').select('rol').eq('id', user.id).single()

      const rol = perfil?.rol ?? 'vendedor'

      // Jefe no tiene acceso a esta sección
      if (rol === 'jefe') {
        setRolNoPermitido(true)
        setLoading(false)
        return
      }

      // Admin ve todos los clientes, vendedor solo los suyos
      const clientesQuery = rol === 'admin'
        ? supabase.from('clientes').select('*').order('nombre')
        : supabase.from('clientes').select('*').eq('user_id', user.id).order('nombre')

      const [{ data: clientesData }, { data: settings }] = await Promise.all([
        clientesQuery,
        supabase.from('user_settings').select('mensaje').eq('user_id', user.id).single(),
      ])

      setClientes((clientesData as Cliente[]) || [])
      setMensaje(settings?.mensaje ?? `Hola {{nombre}} 👋\nTe escribo de Aura.\n¿Te paso info de la próxima fecha? 🔥`)
      setLoading(false)
    }
    cargarTodo()
  }, [router])

  const guardarMensaje = async () => {
    setGuardando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, mensaje })
    if (error) addToast('Error al guardar', 'error')
    else { addToast('Mensaje guardado', 'success'); setEditandoMensaje(false) }
    setGuardando(false)
  }

  const enviarWhatsapp = async (cliente: Cliente) => {
    const texto = mensaje.replace('{{nombre}}', cliente.nombre)
    window.open(`https://wa.me/${cliente.telefono}?text=${encodeURIComponent(texto)}`, '_blank')

    await supabase.from('clientes').update({
      estado: 'enviado',
      ultima_semana_enviada: semanaActual,
    }).eq('id', cliente.id)

    setClientes(prev => prev.map(c =>
      c.id === cliente.id ? { ...c, ultima_semana_enviada: semanaActual } : c
    ))
    addToast(`Mensaje enviado a ${cliente.nombre}`, 'success')
  }

  const resumen = useMemo(() => {
    const disponibles = clientes.filter(c => c.ultima_semana_enviada !== semanaActual).length
    return { total: clientes.length, disponibles, bloqueados: clientes.length - disponibles }
  }, [clientes, semanaActual])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
      </div>
    )
  }

  if (rolNoPermitido) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <Lock size={20} className="text-zinc-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-300">Sección no disponible</p>
          <p className="text-xs text-zinc-600 mt-1">Esta sección es solo para vendedores.</p>
        </div>
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
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">Mis Clientes</h1>
          <p className="text-sm text-zinc-500 mt-1">Semana {semanaActual}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <StatCard label="Disponibles" value={resumen.disponibles} color="text-amber-400" />
          <StatCard label="Bloqueados" value={resumen.bloqueados} color="text-zinc-500" />
          <StatCard label="Total" value={resumen.total} color="text-white" />
        </div>

        {/* Mensaje WhatsApp */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Mensaje de WhatsApp</p>
            <button
              onClick={() => setEditandoMensaje(p => !p)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              {editandoMensaje ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {editandoMensaje ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <textarea
                  rows={4}
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">Usá <code className="text-zinc-400">{'{{nombre}}'}</code> para el nombre</span>
                  <button
                    onClick={guardarMensaje}
                    disabled={guardando}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold disabled:opacity-40 transition"
                  >
                    <Save size={12} />
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.pre
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-zinc-400 font-sans whitespace-pre-wrap leading-relaxed bg-zinc-900/50 rounded-xl px-4 py-3"
              >
                {mensaje}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>

        {/* Lista clientes */}
        <div className="space-y-2">
          {clientes.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-12">No tenés clientes asignados</p>
          ) : (
            clientes.map((c, idx) => {
              const bloqueado = c.ultima_semana_enviada === semanaActual
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl border transition ${
                    bloqueado
                      ? 'border-zinc-800 bg-zinc-900/20 opacity-60'
                      : 'border-zinc-800 bg-[#0f0f14]'
                  }`}
                >
                  {/* Ícono estado */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    bloqueado ? 'bg-zinc-800' : 'bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {bloqueado
                      ? <Lock size={14} className="text-zinc-600" />
                      : <Unlock size={14} className="text-emerald-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{c.nombre}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{c.telefono}</p>
                  </div>

                  {/* Botón */}
                  <button
                    disabled={bloqueado}
                    onClick={() => enviarWhatsapp(c)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                      bloqueado
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-emerald-600 text-white active:bg-emerald-700'
                    }`}
                  >
                    <MessageCircle size={13} />
                    {bloqueado ? 'Enviado' : 'WhatsApp'}
                  </button>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>
    </>
  )
}