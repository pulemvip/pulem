'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Globe, CheckCheck, X, Loader2, AlertTriangle } from 'lucide-react'
import { registrarAccion } from '@/lib/historial'

type Config = {
  mantenimiento: boolean
  mensaje_mantenimiento: string
  mantenimiento_home: boolean
  mensaje_mantenimiento_home: string
}

type Toast = { id: number; message: string; type: 'success' | 'error' }

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

function Toggle({
  active,
  onChange,
  colorActive = 'amber',
}: {
  active: boolean
  onChange: (val: boolean) => void
  colorActive?: 'amber' | 'red'
}) {
  const colors = {
    amber: { bg: 'bg-amber-500/20 border-amber-500/30', dot: 'bg-amber-400' },
    red: { bg: 'bg-red-500/20 border-red-500/30', dot: 'bg-red-400' },
  }
  const c = colors[colorActive]
  return (
    <button
      onClick={() => onChange(!active)}
      className={`w-12 h-6 rounded-full border transition-all flex items-center px-0.5 ${
        active ? c.bg : 'bg-zinc-800 border-zinc-700'
      }`}
    >
      <motion.div
        animate={{ x: active ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`w-5 h-5 rounded-full ${active ? c.dot : 'bg-zinc-600'}`}
      />
    </button>
  )
}

function MantenimientoCard({
  icon: Icon,
  iconColor,
  title,
  description,
  active,
  statusActive,
  statusInactive,
  mensajeLabel,
  mensaje,
  onToggle,
  onMensajeChange,
  onGuardar,
  saving,
  colorActive,
}: {
  icon: React.ElementType
  iconColor: string
  title: string
  description: string
  active: boolean
  statusActive: string
  statusInactive: string
  mensajeLabel: string
  mensaje: string
  onToggle: (val: boolean) => void
  onMensajeChange: (val: string) => void
  onGuardar: () => void
  saving: boolean
  colorActive: 'amber' | 'red'
}) {
  const borderColor = colorActive === 'amber' ? 'border-amber-500/20' : 'border-red-500/20'
  const bgColor = colorActive === 'amber' ? 'bg-amber-500/10' : 'bg-red-500/10'
  const textColor = colorActive === 'amber' ? 'text-amber-400' : 'text-red-400'
  const statusColor = active ? textColor : 'text-emerald-400'

  return (
    <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <div className={`w-9 h-9 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center shrink-0`}>
          <Icon size={16} className={textColor} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-300">Estado</p>
          <p className={`text-xs mt-0.5 ${statusColor}`}>
            {active ? statusActive : statusInactive}
          </p>
        </div>
        <Toggle active={active} onChange={onToggle} colorActive={colorActive} />
      </div>

      {/* Mensaje */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">{mensajeLabel}</p>
        <textarea
          rows={3}
          value={mensaje}
          onChange={e => onMensajeChange(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition resize-none"
          placeholder="Mensaje..."
        />
      </div>

      {/* Guardar */}
      <button
        onClick={onGuardar}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-xl text-sm font-bold active:bg-zinc-200 disabled:opacity-40 transition"
      >
        {saving
          ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
          : <><CheckCheck size={14} /> Guardar</>
        }
      </button>
    </div>
  )
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Config>({
    mantenimiento: false,
    mensaje_mantenimiento: 'El sistema está en mantenimiento. Volvé más tarde.',
    mantenimiento_home: false,
    mensaje_mantenimiento_home: 'Estamos preparando algo increíble. ¡Volvé pronto!',
  })
  const [loading, setLoading] = useState(true)
  const [savingDashboard, setSavingDashboard] = useState(false)
  const [savingHome, setSavingHome] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showConfirmDashboard, setShowConfirmDashboard] = useState(false)
  const [showConfirmHome, setShowConfirmHome] = useState(false)

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('configuracion')
        .select('mantenimiento, mensaje_mantenimiento, mantenimiento_home, mensaje_mantenimiento_home')
        .eq('id', 'global')
        .single()
      if (data) setConfig(data)
      setLoading(false)
    }
    fetchConfig()
  }, [])

  const guardarDashboard = async () => {
    setSavingDashboard(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('configuracion')
      .update({
        mantenimiento: config.mantenimiento,
        mensaje_mantenimiento: config.mensaje_mantenimiento,
        updated_at: new Date().toISOString(),
        updated_by: user?.email ?? null,
      })
      .eq('id', 'global')

    if (error) {
      addToast('Error al guardar', 'error')
    } else {
      await registrarAccion({
        accion: config.mantenimiento ? 'usuario_desactivado' : 'usuario_activado',
        detalle: config.mantenimiento ? 'Mantenimiento dashboard activado' : 'Mantenimiento dashboard desactivado',
      })
      addToast('Dashboard guardado', 'success')
    }
    setSavingDashboard(false)
    setShowConfirmDashboard(false)
  }

  const guardarHome = async () => {
    setSavingHome(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('configuracion')
      .update({
        mantenimiento_home: config.mantenimiento_home,
        mensaje_mantenimiento_home: config.mensaje_mantenimiento_home,
        updated_at: new Date().toISOString(),
        updated_by: user?.email ?? null,
      })
      .eq('id', 'global')

    if (error) {
      addToast('Error al guardar', 'error')
    } else {
      await registrarAccion({
        accion: config.mantenimiento_home ? 'usuario_desactivado' : 'usuario_activado',
        detalle: config.mantenimiento_home ? 'Mantenimiento home activado' : 'Mantenimiento home desactivado',
      })
      addToast('Home guardada', 'success')
    }
    setSavingHome(false)
    setShowConfirmHome(false)
  }

  const handleToggleDashboard = (val: boolean) => {
    setConfig(prev => ({ ...prev, mantenimiento: val }))
    if (val) setShowConfirmDashboard(true)
  }

  const handleToggleHome = (val: boolean) => {
    setConfig(prev => ({ ...prev, mantenimiento_home: val }))
    if (val) setShowConfirmHome(true)
  }

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
        className="space-y-6 max-w-2xl mx-auto"
      >
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Configuración</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Ajustes globales del sistema</p>
        </div>

        {/* Banners activos */}
        <AnimatePresence>
          {config.mantenimiento && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20"
            >
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">
                Dashboard en <span className="font-semibold">mantenimiento</span> — vendedores sin acceso.
              </p>
            </motion.div>
          )}
          {config.mantenimiento_home && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20"
            >
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                Home pública en <span className="font-semibold">mantenimiento</span> — visible para todos.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card dashboard */}
        <MantenimientoCard
          icon={Shield}
          iconColor="text-amber-400"
          colorActive="amber"
          title="Mantenimiento del Dashboard"
          description="Bloquea el acceso al dashboard para todos los vendedores"
          active={config.mantenimiento}
          statusActive="Activo — acceso bloqueado"
          statusInactive="Inactivo — sistema operativo"
          mensajeLabel="Mensaje que verán los vendedores"
          mensaje={config.mensaje_mantenimiento}
          onToggle={handleToggleDashboard}
          onMensajeChange={val => setConfig(prev => ({ ...prev, mensaje_mantenimiento: val }))}
          onGuardar={guardarDashboard}
          saving={savingDashboard}
        />

        {/* Card home */}
        <MantenimientoCard
          icon={Globe}
          iconColor="text-red-400"
          colorActive="red"
          title="Mantenimiento de la Home"
          description="Reemplaza la home pública con una pantalla de pausa"
          active={config.mantenimiento_home}
          statusActive="Activo — home bloqueada"
          statusInactive="Inactivo — home visible"
          mensajeLabel="Mensaje que verán los visitantes"
          mensaje={config.mensaje_mantenimiento_home}
          onToggle={handleToggleHome}
          onMensajeChange={val => setConfig(prev => ({ ...prev, mensaje_mantenimiento_home: val }))}
          onGuardar={guardarHome}
          saving={savingHome}
        />
      </motion.div>

      {/* Modal confirmación dashboard */}
      <AnimatePresence>
        {showConfirmDashboard && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => { setShowConfirmDashboard(false); setConfig(prev => ({ ...prev, mantenimiento: false })) }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <AlertTriangle size={18} className="text-amber-400" />
                </div>
                <h2 className="text-base font-semibold mb-2">¿Activar mantenimiento del dashboard?</h2>
                <p className="text-sm text-zinc-400 mb-6">Los vendedores no podrán acceder hasta que lo desactives.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setShowConfirmDashboard(false); setConfig(prev => ({ ...prev, mantenimiento: false })) }}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 active:bg-zinc-800 transition">
                    Cancelar
                  </button>
                  <button onClick={guardarDashboard} disabled={savingDashboard}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-amber-600 text-white font-semibold active:bg-amber-700 disabled:opacity-40 transition">
                    {savingDashboard ? 'Guardando...' : 'Activar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal confirmación home */}
      <AnimatePresence>
        {showConfirmHome && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => { setShowConfirmHome(false); setConfig(prev => ({ ...prev, mantenimiento_home: false })) }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <Globe size={18} className="text-red-400" />
                </div>
                <h2 className="text-base font-semibold mb-2">¿Activar mantenimiento de la home?</h2>
                <p className="text-sm text-zinc-400 mb-6">Todos los visitantes verán la pantalla de pausa en lugar de los eventos.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setShowConfirmHome(false); setConfig(prev => ({ ...prev, mantenimiento_home: false })) }}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 active:bg-zinc-800 transition">
                    Cancelar
                  </button>
                  <button onClick={guardarHome} disabled={savingHome}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-red-600 text-white font-semibold active:bg-red-700 disabled:opacity-40 transition">
                    {savingHome ? 'Guardando...' : 'Activar'}
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