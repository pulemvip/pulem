'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Send, Loader2, CheckCheck, Users, TrendingUp, Clock, UserCheck } from 'lucide-react'

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
  mensaje: { title: '', body: '', url: '/dashboard/user' },
}

/* ===== SKELETON ===== */
function SkeletonCard() {
  return (
    <div className="bg-[#0f0f14] border border-zinc-800 p-5 rounded-2xl animate-pulse">
      <div className="h-3 bg-zinc-800 rounded w-1/2 mb-4" />
      <div className="h-8 bg-zinc-800 rounded w-1/3 mb-2" />
      <div className="h-2 bg-zinc-800 rounded w-2/3" />
    </div>
  )
}

/* ===== METRIC CARD ===== */
function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string
  value: number | string
  sub?: string
  icon: React.ElementType
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-[#0f0f14] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{title}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}

/* ===== PUSH MODAL ===== */
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
        className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
      >
        <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Bell size={16} /> Enviar notificación
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
              <X size={18} />
            </button>
          </div>

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
                  className={`py-2.5 rounded-xl text-sm font-medium transition border ${
                    type === key
                      ? 'bg-zinc-700 border-zinc-500 text-white'
                      : 'border-zinc-800 text-zinc-500 active:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Título</p>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título de la notificación"
            />
          </div>

          <div className="space-y-1.5 mb-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Mensaje</p>
            <textarea
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition resize-none"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Cuerpo de la notificación"
            />
          </div>

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
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-2xl text-sm font-bold active:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
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

function getISOWeek() {
  const now = new Date()
  const year = now.getFullYear()
  const oneJan = new Date(year, 0, 1)
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)) + 1
  return `${year}-${Math.ceil(numberOfDays / 7)}`
}

/* ===== PAGE ===== */
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

      const [
        { count: totalCount },
        { count: pendientesCount },
        { count: enviadosCount },
        { count: enviadosSemanaCount },
        { data: clientesData },
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('estado', 'enviado'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ultima_semana_enviada', semanaActual),
        supabase.from('clientes').select('user_id'),
      ])

      const vendedoresUnicos = new Set(clientesData?.map(c => c.user_id))

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

      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Resumen general del sistema</p>
          </div>
          <button
            onClick={() => setShowPushModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition"
          >
            <Bell size={15} />
            <span className="hidden sm:inline">Notificar staff</span>
          </button>
        </div>

        {/* Métricas */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Total clientes"
              value={total}
              sub="En la base de datos"
              icon={Users}
              color="bg-blue-500/10 text-blue-400"
              delay={0}
            />
            <MetricCard
              title="Pendientes"
              value={pendientes}
              sub={`${total > 0 ? Math.round((pendientes / total) * 100) : 0}% del total`}
              icon={Clock}
              color="bg-amber-500/10 text-amber-400"
              delay={0.05}
            />
            <MetricCard
              title="Enviados"
              value={enviados}
              sub={`${porcentajeAsignado}% completado`}
              icon={CheckCheck}
              color="bg-emerald-500/10 text-emerald-400"
              delay={0.1}
            />
            <MetricCard
              title="Esta semana"
              value={enviadosSemana}
              sub={`${vendedoresActivos} vendedor${vendedoresActivos !== 1 ? 'es' : ''} activo${vendedoresActivos !== 1 ? 's' : ''}`}
              icon={TrendingUp}
              color="bg-purple-500/10 text-purple-400"
              delay={0.15}
            />
          </div>
        )}

        {/* Barra de progreso */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#0f0f14] border border-zinc-800 p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-zinc-400">Progreso general</p>
                <p className="text-2xl font-bold text-white mt-0.5">{porcentajeAsignado}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-600">{enviados} de {total} clientes</p>
                <p className="text-xs text-zinc-600 mt-0.5">asignados</p>
              </div>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${porcentajeAsignado}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
              />
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{pendientes}</p>
                <p className="text-[11px] text-zinc-600">Pendientes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{enviados}</p>
                <p className="text-[11px] text-zinc-600">Enviados</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-400">{vendedoresActivos}</p>
                <p className="text-[11px] text-zinc-600">Vendedores</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Skeleton progreso */}
        {loading && (
          <div className="bg-[#0f0f14] border border-zinc-800 p-5 rounded-2xl animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-1/4 mb-2" />
            <div className="h-7 bg-zinc-800 rounded w-1/6 mb-4" />
            <div className="h-2.5 bg-zinc-800 rounded-full w-full" />
          </div>
        )}
      </div>
    </>
  )
}