'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { registrarAccion } from '@/lib/historial'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  Upload, Cake, Search, Trash2, Loader2,
  CheckCheck, X, ChevronDown, PartyPopper, MessageCircle, Shuffle, AlertTriangle,
} from 'lucide-react'

type Cumple = {
  id: string
  nombre: string
  telefono: string | null
  fecha: string
  asignado_a: string | null
  mensaje_enviado: boolean
  mensaje_enviado_at: string | null
}

type Toast = { id: number; message: string; type: 'success' | 'error' }

const MESES = [
  'Todos', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function parseDate(raw: string | number | null | undefined): string | null {
  if (!raw) return null
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw)
    if (!date) return null
    return `${date.y < 100 ? 2000 + date.y : date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  const parts = String(raw).trim().split('/')
  if (parts.length === 3) {
    let year = parseInt(parts[2])
    if (year < 100) year = 2000 + year
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return null
}

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function esCumpleHoy(iso: string) {
  const hoy = new Date()
  const [, m, d] = iso.split('-')
  return parseInt(m) === hoy.getMonth() + 1 && parseInt(d) === hoy.getDate()
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-xl text-sm font-medium ${
              t.type === 'success' ? 'bg-[#0f0f14] border-emerald-500/30 text-emerald-400' : 'bg-[#0f0f14] border-red-500/30 text-red-400'
            }`}>
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
    <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800 animate-pulse">
      <div className="w-8 h-8 rounded-xl bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-zinc-800 rounded w-1/3" />
        <div className="h-3 bg-zinc-800 rounded w-1/5" />
      </div>
      <div className="h-3 bg-zinc-800 rounded w-20" />
    </div>
  )
}

export default function CumpleanosPage() {
  const router = useRouter()
  const [cumples, setCumples] = useState<Cumple[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [mesFiltro, setMesFiltro] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showConfirmLimpiar, setShowConfirmLimpiar] = useState(false)
  const [limpiando, setLimpiando] = useState(false)
  const [showMesDropdown, setShowMesDropdown] = useState(false)
  const [mensaje, setMensaje] = useState('Hola {{nombre}} 🎂 ¡Feliz cumpleaños! Te deseamos un excelente día 🥳')
  const [mensajeOriginal, setMensajeOriginal] = useState('')
  const [editandoMensaje, setEditandoMensaje] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRol, setUserRol] = useState<string>('jefe')
  const [verTodos, setVerTodos] = useState(false)
  const [distribuyendo, setDistribuyendo] = useState(false)
  const [showConfirmDistribuir, setShowConfirmDistribuir] = useState(false)
  const [preview, setPreview] = useState<{ id: string; email: string; cantidad: number }[]>([])
  const [totalSinAsignar, setTotalSinAsignar] = useState(0)
  const [staffDisponible, setStaffDisponible] = useState<{ id: string; email: string }[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
      if (!perfil || !['admin', 'jefe'].includes(perfil.rol)) { router.replace('/dashboard/user/clientes'); return }
      setUserId(user.id)
      setUserRol(perfil.rol)
      setUserEmail(user.email ?? null)
      await Promise.all([
        cargarCumples(user.id, perfil.rol, false),
        checkSinAsignar(),
        cargarMensaje(user.id),
      ])
    }
    init()
  }, [router])

  const checkSinAsignar = async () => {
    const { count } = await supabase.from('cumpleanos').select('*', { count: 'exact', head: true }).is('asignado_a', null)
    setTotalSinAsignar(count ?? 0)
  }

  const cargarMensaje = async (uid: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('mensaje_cumpleanos')
      .eq('user_id', uid)
      .maybeSingle()
    if (!error && data?.mensaje_cumpleanos) setMensaje(data.mensaje_cumpleanos)
  }

  const cargarCumples = async (uid: string, rol: string, todos: boolean) => {
    setLoading(true)
    let query = supabase.from('cumpleanos').select('id, nombre, telefono, fecha, asignado_a, mensaje_enviado, mensaje_enviado_at').order('fecha')
    if (!(rol === 'admin' && todos)) query = query.eq('asignado_a', uid)
    const { data } = await query
    setCumples(data ?? [])
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      const headers = rows[0]?.map((h: any) => String(h).trim().toLowerCase()) ?? []
      const colNombre = headers.findIndex((h: string) => h.includes('nombre'))
      const colCumple = headers.findIndex((h: string) => h.includes('cumple') || h.includes('fecha'))
      const colTelefono = headers.findIndex((h: string) => h.includes('tel') || h.includes('fono'))
      if (colNombre === -1 || colCumple === -1) { addToast('No se encontraron columnas NOMBRE y CUMPLE', 'error'); setUploading(false); return }
      const registros: { nombre: string; telefono: string | null; fecha: string; asignado_a: null }[] = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || !row[colNombre]) continue
        const nombre = String(row[colNombre]).trim()
        const fecha = parseDate(row[colCumple])
        const telefono = colTelefono !== -1 && row[colTelefono] ? String(row[colTelefono]).trim() : null
        if (!nombre || !fecha) continue
        registros.push({ nombre, telefono, fecha, asignado_a: null })
      }
      if (registros.length === 0) { addToast('No se encontraron datos válidos', 'error'); setUploading(false); return }
      for (let i = 0; i < registros.length; i += 500) {
        const { error } = await supabase.from('cumpleanos').insert(registros.slice(i, i + 500))
        if (error) throw error
      }
      addToast(`${registros.length} cumpleaños importados`, 'success')
      await checkSinAsignar()
      if (userId) await cargarCumples(userId, userRol, verTodos)
    } catch { addToast('Error al procesar el archivo', 'error') }
    setUploading(false)
  }

  const generarPreview = async () => {
    const { data: staff } = await supabase.from('usuarios').select('id, email').in('rol', ['admin', 'jefe']).eq('activo', true)
    if (!staff || staff.length < 1) { addToast('No hay admins/jefes activos', 'error'); return }
    const { count: total } = await supabase.from('cumpleanos').select('*', { count: 'exact', head: true })
    if (!total || total === 0) { addToast('No hay cumpleaños para distribuir', 'error'); return }
    setStaffDisponible(staff)
    setSeleccionados(new Set(staff.map(s => s.id)))
    recalcularPreview(staff, staff.map(s => s.id), total)
    setShowConfirmDistribuir(true)
  }

  const recalcularPreview = (staff: { id: string; email: string }[], ids: string[], total: number) => {
    const activos = staff.filter(s => ids.includes(s.id))
    if (activos.length === 0) { setPreview([]); return }
    const porPersona = Math.floor(total / activos.length)
    const resto = total % activos.length
    setPreview(activos.map((s, i) => ({ id: s.id, email: s.email, cantidad: porPersona + (i < resto ? 1 : 0) })))
  }

  const toggleSeleccionado = async (id: string) => {
    const next = new Set(seleccionados)
    if (next.has(id)) { if (next.size <= 1) return; next.delete(id) } else { next.add(id) }
    setSeleccionados(next)
    const { count: total } = await supabase.from('cumpleanos').select('*', { count: 'exact', head: true })
    recalcularPreview(staffDisponible, Array.from(next), total ?? 0)
  }

  const distribuir = async () => {
    setDistribuyendo(true)
    try {
      const { data: todos } = await supabase.from('cumpleanos').select('id')
      if (!todos || todos.length === 0) throw new Error('Sin datos')
      const mezclados = [...todos].sort(() => Math.random() - 0.5)
      // Actualizar de a uno por persona para evitar el 400 del upsert parcial
      for (let i = 0; i < preview.length; i++) {
        const ids = mezclados
          .filter((_, idx) => idx % preview.length === i)
          .map(c => c.id)
        if (ids.length === 0) continue
        const { error } = await supabase
          .from('cumpleanos')
          .update({ asignado_a: preview[i].id })
          .in('id', ids)
        if (error) throw error
      }
      addToast(`${todos.length} cumpleaños distribuidos`, 'success')
      setTotalSinAsignar(0)
      if (userId) await cargarCumples(userId, userRol, verTodos)
    } catch { addToast('Error al distribuir', 'error') }
    setDistribuyendo(false)
    setShowConfirmDistribuir(false)
  }

  const limpiarLista = async () => {
    setLimpiando(true)
    const { error } = await supabase.from('cumpleanos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) addToast('Error al limpiar', 'error')
    else { setCumples([]); setTotalSinAsignar(0); addToast('Lista limpiada', 'success') }
    setLimpiando(false)
    setShowConfirmLimpiar(false)
  }

  const marcarEnviado = async (c: Cumple) => {
    const { error } = await supabase
      .from('cumpleanos')
      .update({ mensaje_enviado: true, mensaje_enviado_at: new Date().toISOString() })
      .eq('id', c.id)
    if (!error) {
      setCumples(prev => prev.map(x => x.id === c.id ? { ...x, mensaje_enviado: true, mensaje_enviado_at: new Date().toISOString() } : x))
      // Registrar en historial
      await registrarAccion({ accion: 'mensaje_cumpleanos', detalle: `Mensaje enviado a ${c.nombre}` })
    }
  }

  const filtrados = useMemo(() => cumples.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || (c.telefono ?? '').includes(search)
    const matchMes = mesFiltro === 0 || parseInt(c.fecha.split('-')[1]) === mesFiltro
    return matchSearch && matchMes
  }), [cumples, search, mesFiltro])

  const cumpleHoy = cumples.filter(c => esCumpleHoy(c.fecha))
  const cumpleMes = cumples.filter(c => parseInt(c.fecha.split('-')[1]) === new Date().getMonth() + 1)

  return (
    <>
      <ToastContainer toasts={toasts} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Cumpleaños</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {cumples.length} asignados a vos
              {userRol === 'admin' && (<> · <button onClick={() => { const next = !verTodos; setVerTodos(next); if (userId) cargarCumples(userId, userRol, next) }} className="text-blue-400 underline underline-offset-2">{verTodos ? 'Ver solo los míos' : 'Ver todos'}</button></>)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generarPreview} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 transition">
              <Shuffle size={14} /><span className="hidden sm:inline">Distribuir</span>
            </button>
            {cumples.length > 0 && (
              <button onClick={() => setShowConfirmLimpiar(true)} className="px-3 py-2.5 rounded-xl border border-zinc-700 text-xs text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition">
                <Trash2 size={14} />
              </button>
            )}
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold cursor-pointer active:bg-zinc-200 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</> : <><Upload size={14} /> Excel</>}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Sin asignar warning */}
        {totalSinAsignar > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
            <AlertTriangle size={15} className="shrink-0 text-amber-400" />
            {totalSinAsignar} cumpleaños sin distribuir — tocá "Distribuir" para repartirlos.
          </div>
        )}

        {/* Hoy */}
        {cumpleHoy.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper size={16} className="text-amber-400" />
              <p className="text-sm font-semibold text-amber-300">{cumpleHoy.length === 1 ? '1 cumpleaños hoy' : `${cumpleHoy.length} cumpleaños hoy`}</p>
            </div>
            <div className="space-y-2">
              {cumpleHoy.map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <p className="text-sm text-white font-medium">{c.nombre}</p>
                  {c.telefono && (
                    c.mensaje_enviado ? (
                      <span className="text-xs text-zinc-600 flex items-center gap-1"><CheckCheck size={13} /> Enviado</span>
                    ) : (
                      <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje.replace('{{nombre}}', c.nombre))}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={() => marcarEnviado(c)}
                        className="text-xs text-emerald-400 flex items-center gap-1">
                        <MessageCircle size={13} /> Saludar
                      </a>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {!loading && cumples.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1"><Cake size={14} className="text-pink-400" /><p className="text-xs text-zinc-500">Este mes</p></div>
              <p className="text-2xl font-bold text-white">{cumpleMes.length}</p>
            </div>
            <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1"><PartyPopper size={14} className="text-amber-400" /><p className="text-xs text-zinc-500">Hoy</p></div>
              <p className="text-2xl font-bold text-white">{cumpleHoy.length}</p>
            </div>
          </div>
        )}

        {/* Mensaje */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Mensaje de WhatsApp</p>
            {editandoMensaje ? (
              <div className="flex items-center gap-2">
                <button onClick={() => { setMensaje(mensajeOriginal); setEditandoMensaje(false) }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition px-2 py-1">
                  Cancelar
                </button>
                <button onClick={async () => {
                  if (userId) {
                    await supabase.from('user_settings').upsert(
                      { user_id: userId, mensaje_cumpleanos: mensaje },
                      { onConflict: 'user_id' }
                    )
                  }
                  setMensajeOriginal(mensaje)
                  setEditandoMensaje(false)
                  addToast('Mensaje guardado', 'success')
                }}
                  className="text-xs font-semibold text-white bg-zinc-700 hover:bg-zinc-600 transition px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCheck size={12} /> Guardar
                </button>
              </div>
            ) : (
              <button onClick={() => { setMensajeOriginal(mensaje); setEditandoMensaje(true) }}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition px-2 py-1 rounded-lg hover:bg-zinc-800">
                Editar
              </button>
            )}
          </div>
          {editandoMensaje ? (
            <textarea rows={3} value={mensaje} onChange={e => setMensaje(e.target.value)} autoFocus
              className="w-full bg-zinc-900 border border-zinc-600 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition resize-none" />
          ) : (
            <p className="text-sm text-zinc-300 leading-relaxed">{mensaje}</p>
          )}
          {editandoMensaje && (
            <p className="text-xs text-zinc-600 mt-2">Usá <span className="text-zinc-400 font-mono">{"{{nombre}}"}</span> para insertar el nombre.</p>
          )}
        </div>

        {/* Lista */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input type="text" placeholder="Buscar nombre o teléfono..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition" />
            </div>
            <div className="relative">
              <button onClick={() => setShowMesDropdown(p => !p)}
                className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-300 whitespace-nowrap">
                {MESES[mesFiltro]}<ChevronDown size={13} className={`transition-transform ${showMesDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showMesDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-40 bg-[#111118] border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
                    {MESES.map((mes, idx) => (
                      <button key={mes} onClick={() => { setMesFiltro(idx); setShowMesDropdown(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition ${mesFiltro === idx ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                        {mes}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {loading ? (
            <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Cake size={18} className="text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">{cumples.length === 0 ? 'Subí un Excel para empezar' : 'Sin resultados'}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filtrados.map((c, idx) => {
                const esHoy = esCumpleHoy(c.fecha)
                return (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className={`flex items-center gap-4 px-5 py-4 ${esHoy ? 'bg-amber-500/5' : 'hover:bg-zinc-800/20'} ${c.mensaje_enviado ? 'opacity-50' : ''} transition`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${esHoy ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-zinc-800 border border-zinc-700'}`}>
                      {esHoy ? <PartyPopper size={16} className="text-amber-400" /> : <Cake size={16} className="text-zinc-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${esHoy ? 'text-amber-200' : 'text-zinc-100'}`}>
                        {c.nombre}
                        {esHoy && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Hoy 🎂</span>}
                      </p>
                      {c.telefono && <p className="text-xs text-zinc-600 mt-0.5">{c.telefono}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-xs text-zinc-500 tabular-nums">{formatFecha(c.fecha)}</p>
                      {c.telefono && (
                        c.mensaje_enviado ? (
                          <div title={c.mensaje_enviado_at ? `Enviado ${new Date(c.mensaje_enviado_at).toLocaleDateString('es-AR')}` : 'Enviado'}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-600 cursor-default">
                            <CheckCheck size={14} />
                          </div>
                        ) : (
                          <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje.replace('{{nombre}}', c.nombre))}`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={() => marcarEnviado(c)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition">
                            <MessageCircle size={14} />
                          </a>
                        )
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal distribuir */}
      <AnimatePresence>
        {showConfirmDistribuir && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]" onClick={() => !distribuyendo && setShowConfirmDistribuir(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0">
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                  <Shuffle size={18} className="text-blue-400" />
                </div>
                <h2 className="text-base font-semibold mb-1">Distribuir cumpleaños</h2>
                <p className="text-sm text-zinc-500 mb-4">Elegí a quiénes incluir en el reparto:</p>
                <div className="space-y-2 mb-4">
                  {staffDisponible.map(s => {
                    const sel = seleccionados.has(s.id)
                    const cant = preview.find(p => p.id === s.id)?.cantidad ?? 0
                    return (
                      <button key={s.id} onClick={() => toggleSeleccionado(s.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition text-sm ${sel ? 'bg-zinc-800 border-zinc-600' : 'border-zinc-800 opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${sel ? 'bg-white border-white' : 'border-zinc-600'}`}>
                            {sel && <CheckCheck size={10} className="text-black" />}
                          </div>
                          <span className="text-zinc-300 truncate max-w-[160px]">{s.email}</span>
                        </div>
                        {sel && <span className="text-white font-bold ml-2 shrink-0">{cant}</span>}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 mb-5">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">Sobreescribe las asignaciones actuales.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmDistribuir(false)} disabled={distribuyendo}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 disabled:opacity-40 transition">Cancelar</button>
                  <button onClick={distribuir} disabled={distribuyendo}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-white text-black font-semibold disabled:opacity-40 transition flex items-center justify-center gap-2">
                    {distribuyendo ? <><Loader2 size={14} className="animate-spin" /> Distribuyendo...</> : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal limpiar */}
      <AnimatePresence>
        {showConfirmLimpiar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]" onClick={() => !limpiando && setShowConfirmLimpiar(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0">
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <h2 className="text-base font-semibold mb-1">¿Limpiar toda la lista?</h2>
                <p className="text-sm text-zinc-500 mb-6">Se van a eliminar todos los registros.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmLimpiar(false)} disabled={limpiando}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 disabled:opacity-40 transition">Cancelar</button>
                  <button onClick={limpiarLista} disabled={limpiando}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-red-600 text-white font-semibold disabled:opacity-40 transition flex items-center justify-center gap-2">
                    {limpiando ? <Loader2 size={14} className="animate-spin" /> : null}
                    {limpiando ? 'Limpiando...' : 'Limpiar'}
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