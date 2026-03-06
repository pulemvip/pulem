'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Send, Loader2, CheckCheck } from 'lucide-react'

// ===== TIPOS =====
type NotifType = 'lista_limpiada' | 'nuevo_evento' | 'mensaje'

const NOTIF_PRESETS: Record<NotifType, { title: string; body: string; url: string }> = {
  lista_limpiada: {
    title: '🧹 Lista limpiada',
    body: 'El admin limpió la lista. Podés empezar a cargar de nuevo.',
    url: '/dashboard/user/consumos',
  },
  nuevo_evento: {
    title: '🎉 Nuevo evento',
    body: 'Hay un nuevo evento publicado. Revisá la home.',
    url: '/dashboard/user/home',
  },
  mensaje: {
    title: '',
    body: '',
    url: '/dashboard/user',
  },
}

// ===== MODAL PUSH =====
function PushModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<NotifType>('lista_limpiada')
  const [title, setTitle] = useState(NOTIF_PRESETS.lista_limpiada.title)
  const [body, setBody] = useState(NOTIF_PRESETS.lista_limpiada.body)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ enviados: number; fallidos: number } | null>(null)

  const selectType = (t: NotifType) => {
    setType(t)
    setTitle(NOTIF_PRESETS[t].title)
    setBody(NOTIF_PRESETS[t].body)
    setResult(null)
  }

  const send = async () => {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url: NOTIF_PRESETS[type].url }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ enviados: 0, fallidos: 1 })
    }

    setSending(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[70]"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
        className="fixed inset-0 flex items-center justify-center z-[80] px-4"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell size={18} /> Enviar notificación
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
              <X size={20} />
            </button>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5 mb-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Tipo</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'lista_limpiada', label: '🧹 Lista' },
                { key: 'nuevo_evento', label: '🎉 Evento' },
                { key: 'mensaje', label: '✏️ Mensaje' },
              ] as { key: NotifType; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => selectType(key)}
                  className={`py-2 rounded-xl text-sm font-medium transition border ${
                    type === key
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5 mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Título</p>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título de la notificación"
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-1.5 mb-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Mensaje</p>
            <textarea
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition resize-none"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Cuerpo de la notificación"
            />
          </div>

          {/* Resultado */}
          {result && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4 ${
              result.fallidos === 0
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              <CheckCheck size={15} />
              {result.enviados} enviadas · {result.fallidos} fallidas
            </div>
          )}

          <button
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {sending
              ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
              : <><Send size={15} /> Enviar a todo el staff</>
            }
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ===== CARD =====
function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-md flex flex-col justify-between">
      <p className="text-sm sm:text-base text-zinc-400">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

function getISOWeek() {
  const now = new Date()
  const year = now.getFullYear()
  const oneJan = new Date(year, 0, 1)
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)) + 1
  const week = Math.ceil(numberOfDays / 7)
  return `${year}-${week}`
}

// ===== PAGE =====
export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pendientes, setPendientes] = useState(0)
  const [enviados, setEnviados] = useState(0)
  const [enviadosSemana, setEnviadosSemana] = useState(0)
  const [vendedoresActivos, setVendedoresActivos] = useState(0)
  const [showPushModal, setShowPushModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const semanaActual = getISOWeek()

      const { count: totalCount } = await supabase
        .from('clientes').select('*', { count: 'exact', head: true })

      const { count: pendientesCount } = await supabase
        .from('clientes').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')

      const { count: enviadosCount } = await supabase
        .from('clientes').select('*', { count: 'exact', head: true }).eq('estado', 'enviado')

      const { count: enviadosSemanaCount } = await supabase
        .from('clientes').select('*', { count: 'exact', head: true }).eq('ultima_semana_enviada', semanaActual)

      const { data } = await supabase.from('clientes').select('user_id')
      const vendedoresUnicos = new Set(data?.map(c => c.user_id))

      setTotal(totalCount || 0)
      setPendientes(pendientesCount || 0)
      setEnviados(enviadosCount || 0)
      setEnviadosSemana(enviadosSemanaCount || 0)
      setVendedoresActivos(vendedoresUnicos.size || 0)
      setLoading(false)
    }

    fetchData()
  }, [])

  const porcentajeAsignado = total > 0 ? Math.round((enviados / total) * 100) : 0

  return (
    <>
      <AnimatePresence>
        {showPushModal && <PushModal onClose={() => setShowPushModal(false)} />}
      </AnimatePresence>

      <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Panel Admin</h1>

          {/* Botón notificaciones */}
          <button
            onClick={() => setShowPushModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 transition"
          >
            <Bell size={16} />
            <span className="hidden sm:inline">Notificar staff</span>
          </button>
        </div>

        {loading ? (
          <div className="text-zinc-500">Cargando métricas...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <Card title="Clientes Totales" value={total} />
              <Card title="Pendientes" value={pendientes} />
              <Card title="Enviados" value={enviados} />
              <Card title="Enviados Semana" value={enviadosSemana} />
              <Card title="Vendedores Activos" value={vendedoresActivos} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl">
              <p className="text-sm sm:text-base text-zinc-400">Progreso general</p>
              <p className="text-xl sm:text-2xl font-bold mt-2">{porcentajeAsignado}% asignado</p>
              <div className="w-full bg-zinc-800 rounded-full h-2 sm:h-3 mt-3 sm:mt-4">
                <div
                  className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all"
                  style={{ width: `${porcentajeAsignado}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
