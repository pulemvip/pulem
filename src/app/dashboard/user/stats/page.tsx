'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users, UserCheck, Receipt, TrendingUp, Bell, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Stats = {
  totalClientes: number
  totalInvitados: number
  totalConsumos: number
  totalVendedores: number
  consumosFree: number
  consumosDescuento: number
  invitadosPorVendedor: { email: string; total: number }[]
}

type Toast = { show: boolean; message: string; type: 'success' | 'error' }

function StatCard({
  icon: Icon, label, value, color, sub,
}: {
  icon: React.ElementType; label: string; value: number | string; color: string; sub?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-zinc-800 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
        <div className="h-6 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  )
}

export default function JefeStatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [
        { count: totalClientes },
        { count: totalInvitados },
        { data: consumosData },
        { count: totalVendedores },
        { data: invitadosData },
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('invitados').select('*', { count: 'exact', head: true }),
        supabase.from('consumos').select('tipo'),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'vendedor').eq('activo', true),
        supabase.from('invitados').select('user_id, user_email'),
      ])

      // Invitados por vendedor
      const conteo: Record<string, { email: string; total: number }> = {}
      invitadosData?.forEach(i => {
        if (!conteo[i.user_id]) conteo[i.user_id] = { email: i.user_email, total: 0 }
        conteo[i.user_id].total++
      })
      const invitadosPorVendedor = Object.values(conteo)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      setStats({
        totalClientes: totalClientes ?? 0,
        totalInvitados: totalInvitados ?? 0,
        totalConsumos: consumosData?.length ?? 0,
        totalVendedores: totalVendedores ?? 0,
        consumosFree: consumosData?.filter(c => c.tipo === 'free').length ?? 0,
        consumosDescuento: consumosData?.filter(c => c.tipo === 'descuento').length ?? 0,
        invitadosPorVendedor,
      })
      setLoading(false)
    }
    cargar()
  }, [router])

  const enviarNotificacion = async () => {
    setEnviando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: '📢 Mensaje del jefe',
          body: 'Revisá la app, hay novedades.',
        }),
      })
      if (res.ok) showToast('Notificación enviada a todos', 'success')
      else showToast('Error al enviar notificación', 'error')
    } catch {
      showToast('Error al enviar notificación', 'error')
    }
    setEnviando(false)
  }

  return (
    <>
      {/* Toast */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-[#0f0f14] border-emerald-500/30 text-emerald-400'
              : 'bg-[#0f0f14] border-red-500/30 text-red-400'
          }`}
        >
          {toast.message}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto space-y-6 pb-24"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Resumen general</h1>
            <p className="text-sm text-zinc-500 mt-1">Estado actual del equipo</p>
          </div>
          <button
            onClick={enviarNotificacion}
            disabled={enviando}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 transition"
          >
            {enviando
              ? <Loader2 size={14} className="animate-spin" />
              : <Bell size={14} />
            }
            {enviando ? 'Enviando...' : 'Notificar'}
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={Users} label="Total clientes" value={stats!.totalClientes} color="bg-blue-500/10 text-blue-400" />
              <StatCard icon={UserCheck} label="Vendedores activos" value={stats!.totalVendedores} color="bg-emerald-500/10 text-emerald-400" />
              <StatCard icon={UserCheck} label="Total invitados" value={stats!.totalInvitados} color="bg-purple-500/10 text-purple-400" />
              <StatCard icon={Receipt} label="Consumos hoy" value={stats!.totalConsumos} color="bg-amber-500/10 text-amber-400"
                sub={`${stats!.consumosFree} free · ${stats!.consumosDescuento} dscto`} />
            </>
          )}
        </div>

        {/* Top vendedores por invitados */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <TrendingUp size={15} className="text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-white">Top invitados por vendedor</p>
          </div>

          {loading ? (
            <div className="divide-y divide-zinc-800">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 animate-pulse">
                  <div className="h-3.5 bg-zinc-800 rounded w-1/3" />
                  <div className="h-5 bg-zinc-800 rounded w-10" />
                </div>
              ))}
            </div>
          ) : stats!.invitadosPorVendedor.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-10">Sin invitados todavía</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {stats!.invitadosPorVendedor.map((v, idx) => (
                <motion.div
                  key={v.email}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 w-5">#{idx + 1}</span>
                    <p className="text-sm text-zinc-300 truncate max-w-[200px]">{v.email}</p>
                  </div>
                  <span className="text-base font-bold text-purple-400">{v.total}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Consumos breakdown */}
        {!loading && stats!.totalConsumos > 0 && (
          <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Consumos actuales</p>
            <div className="flex gap-3">
              <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-400/70 mb-1">Combo Free</p>
                <p className="text-2xl font-bold text-amber-400">{stats!.consumosFree}</p>
              </div>
              <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-400/70 mb-1">Descuento</p>
                <p className="text-2xl font-bold text-blue-400">{stats!.consumosDescuento}</p>
              </div>
            </div>
            {/* Barra proporcional */}
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-blue-400 rounded-full transition-all duration-700"
                style={{ width: `${(stats!.consumosFree / stats!.totalConsumos) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 text-center">
              {Math.round((stats!.consumosFree / stats!.totalConsumos) * 100)}% free · {Math.round((stats!.consumosDescuento / stats!.totalConsumos) * 100)}% descuento
            </p>
          </div>
        )}
      </motion.div>
    </>
  )
}