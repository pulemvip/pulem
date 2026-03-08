'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/UserAvatar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, CheckCheck, X, Users,
  TrendingUp, Search, ToggleLeft, ToggleRight, Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type Vendedor = {
  vendedor_id: string
  email: string
  rol: string
  activo: boolean
  total: number
  conversion: number
  avatar_url?: string | null
}

type Toast = { id: number; message: string; type: 'success' | 'error' }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
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

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-zinc-800 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/4" />
      </div>
      <div className="h-6 bg-zinc-800 rounded-full w-14" />
      <div className="h-8 bg-zinc-800 rounded w-8" />
    </div>
  )
}

export default function MiEquipoPage() {
  const router = useRouter()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showForm, setShowForm] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState<Vendedor | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchVendedores = async () => {
    setLoading(true)
    const token = await getToken()
    const res = await fetch('/api/vendedores', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    const ids = (data || []).map((v: Vendedor) => v.vendedor_id)
    let avatarMap: Record<string, string | null> = {}
    if (ids.length > 0) {
      const { data: perfiles } = await supabase
        .from('usuarios').select('id, avatar_url').in('id', ids)
      perfiles?.forEach(p => { avatarMap[p.id] = p.avatar_url })
    }

    setVendedores((data || []).map((v: Vendedor) => ({
      ...v,
      avatar_url: avatarMap[v.vendedor_id] ?? null,
    })))
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: perfil } = await supabase
        .from('usuarios').select('rol').eq('id', user.id).single()

      if (!perfil || !['admin', 'jefe'].includes(perfil.rol)) {
        router.replace('/dashboard/user/clientes')
        return
      }

      await fetchVendedores()
    }
    init()
  }, [router])

  const crearVendedor = async () => {
    if (!email.trim() || !password.trim()) return
    setCreating(true)
    const token = await getToken()
    const res = await fetch('/api/vendedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, password, rol: 'vendedor' }),
    })
    const data = await res.json()
    if (res.ok) {
      addToast(`${email} creado correctamente`, 'success')
      setEmail(''); setPassword('')
      setShowForm(false)
      fetchVendedores()
    } else {
      addToast(data.error || 'Error al crear', 'error')
    }
    setCreating(false)
  }

  const toggleActivo = async (v: Vendedor) => {
    setTogglingId(v.vendedor_id)
    const token = await getToken()
    const res = await fetch('/api/vendedores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: v.vendedor_id, activo: !v.activo }),
    })
    if (res.ok) {
      setVendedores(prev => prev.map(u =>
        u.vendedor_id === v.vendedor_id ? { ...u, activo: !u.activo } : u
      ))
      addToast(v.activo ? 'Vendedor desactivado' : 'Vendedor activado', 'success')
    } else {
      addToast('Error al actualizar', 'error')
    }
    setTogglingId(null)
  }

  const eliminarVendedor = async () => {
    if (!confirmEliminar) return
    setEliminandoId(confirmEliminar.vendedor_id)
    const token = await getToken()
    const res = await fetch('/api/vendedores', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: confirmEliminar.vendedor_id }),
    })
    if (res.ok) {
      addToast(`${confirmEliminar.email} eliminado`, 'success')
      setVendedores(prev => prev.filter(v => v.vendedor_id !== confirmEliminar.vendedor_id))
    } else {
      addToast('Error al eliminar', 'error')
    }
    setEliminandoId(null)
    setConfirmEliminar(null)
  }

  const filtrados = vendedores.filter(v =>
    v.email.toLowerCase().includes(search.toLowerCase())
  )

  const activos = vendedores.filter(v => v.activo).length
  const conversionProm = vendedores.length > 0
    ? Math.round(vendedores.reduce((a, v) => a + v.conversion, 0) / vendedores.length)
    : 0

  return (
    <>
      <ToastContainer toasts={toasts} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-5 pb-24"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Mi equipo</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Vendedores que creaste vos</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold active:bg-zinc-200 transition"
          >
            <Plus size={15} />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: vendedores.length, color: 'text-blue-400 bg-blue-500/10', icon: Users },
            { label: 'Activos', value: activos, color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCheck },
            { label: 'Conv. prom.', value: `${conversionProm}%`, color: 'text-purple-400 bg-purple-500/10', icon: TrendingUp },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-500">{label}</p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={13} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Form crear */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 space-y-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Nuevo vendedor</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email" placeholder="Email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  />
                  <input
                    type="password" placeholder="Contraseña"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && crearVendedor()}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowForm(false); setEmail(''); setPassword('') }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 active:bg-zinc-800 transition">
                    Cancelar
                  </button>
                  <button
                    onClick={crearVendedor}
                    disabled={creating || !email.trim() || !password.trim()}
                    className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 active:bg-zinc-200 transition flex items-center gap-2"
                  >
                    {creating && <Loader2 size={13} className="animate-spin" />}
                    {creating ? 'Creando...' : 'Crear vendedor'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text" placeholder="Buscar vendedor..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          {loading ? (
            <div>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Users size={18} className="text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">
                {search ? 'Sin resultados' : 'Todavía no creaste vendedores'}
              </p>
              {!search && (
                <button onClick={() => setShowForm(true)}
                  className="text-xs text-zinc-400 underline underline-offset-2">
                  Crear el primero
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filtrados.map((v, idx) => (
                <motion.div key={v.vendedor_id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800/20 transition"
                >
                  <UserAvatar email={v.email} avatarUrl={v.avatar_url ?? null} size="sm" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-100 truncate">{v.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                        v.activo
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-700 border-zinc-600 text-zinc-500'
                      }`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {v.total} clientes · {v.conversion}% conv.
                      </span>
                    </div>
                  </div>

                  {/* Toggle activo */}
                  <button
                    onClick={() => toggleActivo(v)}
                    disabled={togglingId === v.vendedor_id}
                    className="shrink-0 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition"
                    title={v.activo ? 'Desactivar' : 'Activar'}
                  >
                    {togglingId === v.vendedor_id
                      ? <Loader2 size={18} className="animate-spin" />
                      : v.activo
                        ? <ToggleRight size={22} className="text-emerald-400" />
                        : <ToggleLeft size={22} />
                    }
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => setConfirmEliminar(v)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal confirmar eliminar */}
      <AnimatePresence>
        {confirmEliminar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => !eliminandoId && setConfirmEliminar(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0"
            >
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <h2 className="text-base font-semibold mb-1">¿Eliminar vendedor?</h2>
                <p className="text-sm text-zinc-500 mb-6 break-all">{confirmEliminar.email}</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmEliminar(null)} disabled={!!eliminandoId}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 disabled:opacity-40 transition">
                    Cancelar
                  </button>
                  <button onClick={eliminarVendedor} disabled={!!eliminandoId}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-red-600 text-white font-semibold disabled:opacity-40 transition flex items-center justify-center gap-2">
                    {eliminandoId ? <Loader2 size={14} className="animate-spin" /> : null}
                    {eliminandoId ? 'Eliminando...' : 'Eliminar'}
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