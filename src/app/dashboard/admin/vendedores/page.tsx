'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/UserAvatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckCheck, X, UserCog, TrendingUp, Users, Search, ChevronDown } from 'lucide-react'

type Vendedor = {
  vendedor_id: string
  email: string
  rol: string
  activo: boolean
  total: number
  enviados: number
  pendientes: number
  conversion: number
  avatar_url?: string | null
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

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-zinc-800 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-zinc-800 rounded w-1/3" />
        <div className="h-3 bg-zinc-800 rounded w-1/5" />
      </div>
      <div className="h-6 bg-zinc-800 rounded-full w-16 hidden sm:block" />
      <div className="h-6 bg-zinc-800 rounded w-10 hidden md:block" />
      <div className="h-8 bg-zinc-800 rounded w-8" />
    </div>
  )
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showForm, setShowForm] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('vendedor')
  const [creating, setCreating] = useState(false)

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
    const res = await fetch('/api/vendedores', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()

    // Enriquecer con avatar_url desde la tabla usuarios
    const ids = (data || []).map((v: Vendedor) => v.vendedor_id)
    let avatarMap: Record<string, string | null> = {}

    if (ids.length > 0) {
      const { data: perfiles } = await supabase
        .from('usuarios')
        .select('id, avatar_url')
        .in('id', ids)

      perfiles?.forEach(p => { avatarMap[p.id] = p.avatar_url })
    }

    setVendedores((data || []).map((v: Vendedor) => ({
      ...v,
      avatar_url: avatarMap[v.vendedor_id] ?? null,
    })))
    setLoading(false)
  }

  useEffect(() => { fetchVendedores() }, [])

  const crearVendedor = async () => {
    if (!email.trim() || !password.trim()) return
    setCreating(true)
    const token = await getToken()
    const res = await fetch('/api/vendedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, password, rol }),
    })
    const data = await res.json()
    if (res.ok) {
      addToast(`${email} creado correctamente`, 'success')
      setEmail(''); setPassword(''); setRol('vendedor')
      setShowForm(false)
      fetchVendedores()
    } else {
      addToast(data.error || 'Error al crear', 'error')
    }
    setCreating(false)
  }

  const actualizarVendedor = async (id: string, campo: string, valor: any) => {
    const token = await getToken()
    const res = await fetch('/api/vendedores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, [campo]: valor }),
    })
    if (res.ok) addToast('Actualizado', 'success')
    else addToast('Error al actualizar', 'error')
    fetchVendedores()
  }

  const eliminarVendedor = async (id: string, emailV: string) => {
    if (!confirm(`¿Eliminar a ${emailV}?`)) return
    const token = await getToken()
    const res = await fetch('/api/vendedores', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    })
    if (res.ok) addToast(`${emailV} eliminado`, 'success')
    else addToast('Error al eliminar', 'error')
    fetchVendedores()
  }

  const filtrados = vendedores.filter(v =>
    v.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalVendedores = vendedores.length
  const activos = vendedores.filter(v => v.activo).length
  const conversionPromedio = vendedores.length > 0
    ? Math.round(vendedores.reduce((acc, v) => acc + v.conversion, 0) / vendedores.length)
    : 0

  return (
    <>
      <ToastContainer toasts={toasts} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Vendedores</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gestión de usuarios del sistema</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold active:bg-zinc-200 transition"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nuevo usuario</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: totalVendedores, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
            { label: 'Activos', value: activos, icon: CheckCheck, color: 'text-emerald-400 bg-emerald-500/10' },
            { label: 'Conv. prom.', value: `${conversionPromedio}%`, icon: TrendingUp, color: 'text-purple-400 bg-purple-500/10' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
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
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 space-y-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Nuevo usuario</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  />
                  <select
                    value={rol}
                    onChange={e => setRol(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition appearance-none cursor-pointer"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="jefe">Jefe</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 active:bg-zinc-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={crearVendedor}
                    disabled={creating || !email.trim() || !password.trim()}
                    className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 active:bg-zinc-200 transition"
                  >
                    {creating ? 'Creando...' : 'Crear usuario'}
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
                type="text"
                placeholder="Buscar por email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          {loading ? (
            <div>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-12">No hay vendedores</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filtrados.map((v, idx) => (
                <motion.div
                  key={v.vendedor_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800/30 transition"
                >
                  {/* Avatar con foto si tiene */}
                  <UserAvatar email={v.email} avatarUrl={v.avatar_url} size="sm" />

                  {/* Info */}
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
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                        v.rol === 'admin' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : v.rol === 'jefe' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}>
                        {v.rol === 'admin' ? 'Admin' : v.rol === 'jefe' ? 'Jefe' : 'Vendedor'}
                      </span>
                      <span className="text-[10px] text-zinc-600">{v.total} clientes · {v.conversion}% conv.</span>
                    </div>
                  </div>

                  {/* Rol select */}
                  <div className="relative shrink-0 hidden sm:block">
                    <select
                      value={v.rol}
                      onChange={e => actualizarVendedor(v.vendedor_id, 'rol', e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-xl pl-3 pr-7 py-2 text-xs text-zinc-300 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="jefe">Jefe</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>

                  {/* Toggle activo */}
                  <button
                    onClick={() => actualizarVendedor(v.vendedor_id, 'activo', !v.activo)}
                    className={`w-10 h-6 rounded-full border transition shrink-0 hidden sm:flex items-center px-0.5 ${
                      v.activo
                        ? 'bg-emerald-500/20 border-emerald-500/30'
                        : 'bg-zinc-800 border-zinc-700'
                    }`}
                    title={v.activo ? 'Desactivar' : 'Activar'}
                  >
                    <div className={`w-4 h-4 rounded-full transition-all ${
                      v.activo ? 'bg-emerald-400 translate-x-4' : 'bg-zinc-600 translate-x-0'
                    }`} />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => eliminarVendedor(v.vendedor_id, v.email)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 active:text-red-400 active:bg-red-500/10 transition shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}