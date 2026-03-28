'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, Save, Trash2, Image as ImageIcon, Video,
  Calendar, Link as LinkIcon, Type, AlignLeft,
  CheckCheck, X, Loader2, AlertTriangle, GripVertical,
} from 'lucide-react'

type HomeContent = {
  id: string
  titulo: string
  descripcion: string
  flyer_url: string
  video_url: string
  boton_texto: string | null
  boton_link: string | null
  fecha_evento: string | null
  orden: number
}

type Toast = { id: number; message: string; type: 'success' | 'error' }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
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

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wide">
        <Icon size={12} />
        {label}
      </div>
      {children}
    </div>
  )
}

function EventCard({
  home, index, onUpdate, onSave, onDelete, saving,
}: {
  home: HomeContent
  index: number
  onUpdate: (id: string, campo: keyof HomeContent, valor: string | null) => void
  onSave: (home: HomeContent, index: number) => void
  onDelete: (id: string) => void
  saving: boolean
}) {
  const flyerRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const [uploadingFlyer, setUploadingFlyer] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: home.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const subirArchivo = async (file: File, tipo: 'flyer' | 'video') => {
    const setUploading = tipo === 'flyer' ? setUploadingFlyer : setUploadingVideo
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${home.id}-${tipo}.${ext}`
    const { error } = await supabase.storage.from('home-assets').upload(path, file, { upsert: true })
    if (error) { setUploading(false); return }
    const { data } = supabase.storage.from('home-assets').getPublicUrl(path)
    onUpdate(home.id, tipo === 'flyer' ? 'flyer_url' : 'video_url', `${data.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              {/* Drag handle */}
              <div
                {...attributes}
                {...listeners}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition cursor-grab active:cursor-grabbing touch-none"
              >
                <GripVertical size={16} />
              </div>
              <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-white truncate max-w-[160px]">
                  {home.titulo || 'Sin título'}
                </p>
                <p className="text-xs text-zinc-600">Evento {index + 1}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {home.flyer_url ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-800">
                <img src={home.flyer_url} alt="Flyer" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button onClick={() => flyerRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white backdrop-blur-sm hover:bg-black/80 transition">
                  {uploadingFlyer ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                  {uploadingFlyer ? 'Subiendo...' : 'Cambiar flyer'}
                </button>
              </div>
            ) : (
              <button onClick={() => flyerRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 transition">
                {uploadingFlyer ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                <span className="text-sm">{uploadingFlyer ? 'Subiendo...' : 'Subir flyer'}</span>
              </button>
            )}
            <input ref={flyerRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files && subirArchivo(e.target.files[0], 'flyer')} />

            <Field label="Título" icon={Type}>
              <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                value={home.titulo} onChange={e => onUpdate(home.id, 'titulo', e.target.value)} placeholder="Nombre del evento" />
            </Field>

            <Field label="Descripción / Lugar" icon={AlignLeft}>
              <textarea rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition resize-none"
                value={home.descripcion} onChange={e => onUpdate(home.id, 'descripcion', e.target.value)} placeholder="Dirección o descripción corta" />
            </Field>

            <Field label="Fecha del evento" icon={Calendar}>
              <input type="date" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition [color-scheme:dark]"
                value={home.fecha_evento ?? ''} onChange={e => onUpdate(home.id, 'fecha_evento', e.target.value || null)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Texto del botón" icon={Type}>
                <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  value={home.boton_texto ?? ''} onChange={e => onUpdate(home.id, 'boton_texto', e.target.value || null)} placeholder="COMPRAR" />
              </Field>
              <Field label="Link del botón" icon={LinkIcon}>
                <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  value={home.boton_link ?? ''} onChange={e => onUpdate(home.id, 'boton_link', e.target.value || null)} placeholder="https://..." />
              </Field>
            </div>

            {index === 0 && (
              <Field label="Video de fondo" icon={Video}>
                <div className="space-y-2">
                  {home.video_url && (
                    <video src={home.video_url} controls className="w-full h-32 rounded-xl object-cover border border-zinc-800" />
                  )}
                  <button onClick={() => videoRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition">
                    {uploadingVideo ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                    {uploadingVideo ? 'Subiendo video...' : home.video_url ? 'Cambiar video' : 'Subir video'}
                  </button>
                  <input ref={videoRef} type="file" accept="video/*" className="hidden"
                    onChange={e => e.target.files && subirArchivo(e.target.files[0], 'video')} />
                </div>
              </Field>
            )}

            <button onClick={() => onSave(home, index)} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-xl text-sm font-bold active:bg-zinc-200 disabled:opacity-40 transition mt-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={14} /> Guardar cambios</>}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center z-[80] px-4 pb-6 sm:pb-0">
              <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <h2 className="text-base font-semibold mb-2">¿Eliminar este evento?</h2>
                <p className="text-sm text-zinc-400 mb-6">Se eliminará <span className="text-white font-medium">"{home.titulo}"</span> de la home pública.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 active:bg-zinc-800 transition">Cancelar</button>
                  <button onClick={() => { onDelete(home.id); setShowDeleteConfirm(false) }}
                    className="flex-1 py-3.5 text-sm rounded-2xl bg-red-600 text-white font-semibold active:bg-red-700 transition">Eliminar</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default function AdminHomePage() {
  const [homes, setHomes] = useState<HomeContent[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase.from('home_content').select('*').order('orden', { ascending: true })
      setHomes(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const actualizarCampo = (id: string, campo: keyof HomeContent, valor: string | null) => {
    setHomes(prev => prev.map(h => h.id === id ? { ...h, [campo]: valor } : h))
  }

  const guardar = async (home: HomeContent, index: number) => {
    setSavingId(home.id)
    const { error } = await supabase.from('home_content').update({
      titulo: home.titulo,
      descripcion: home.descripcion,
      flyer_url: home.flyer_url,
      video_url: index === 0 ? home.video_url : '',
      boton_texto: home.boton_texto || null,
      boton_link: home.boton_link || null,
      fecha_evento: home.fecha_evento || null,
    }).eq('id', home.id)
    setSavingId(null)
    if (error) addToast('Error al guardar', 'error')
    else addToast('Evento guardado', 'success')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = homes.findIndex(h => h.id === active.id)
    const newIndex = homes.findIndex(h => h.id === over.id)
    const reordenado = arrayMove(homes, oldIndex, newIndex).map((h, i) => ({ ...h, orden: i + 1 }))
    setHomes(reordenado)

    // Guardar nuevo orden en Supabase
    await Promise.all(reordenado.map(h =>
      supabase.from('home_content').update({ orden: h.orden }).eq('id', h.id)
    ))
    addToast('Orden guardado', 'success')
  }

  const crearEvento = async () => {
    setCreando(true)
    const { data, error } = await supabase.from('home_content').insert({
      titulo: 'Nuevo Evento',
      descripcion: 'Descripción del evento',
      flyer_url: '',
      video_url: '',
      boton_texto: null,
      boton_link: null,
      activo: true,
      orden: homes.length + 1,
      fecha_evento: null,
    }).select().single()
    if (error) addToast('Error al crear evento', 'error')
    else setHomes(prev => [...prev, data])
    setCreando(false)
  }

  const eliminarEvento = async (id: string) => {
    const { error } = await supabase.from('home_content').delete().eq('id', id)
    if (error) addToast('Error al eliminar', 'error')
    else { setHomes(prev => prev.filter(h => h.id !== id)); addToast('Evento eliminado', 'success') }
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto space-y-5 pb-24">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Home Pública</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {homes.length === 0 ? 'No hay eventos' : `${homes.length} evento${homes.length !== 1 ? 's' : ''}`}
              {homes.length > 1 && <span className="ml-2 text-zinc-600">· arrastrá para reordenar</span>}
            </p>
          </div>
          <button onClick={crearEvento} disabled={creando}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold active:bg-zinc-200 disabled:opacity-40 transition">
            {creando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {creando ? 'Creando...' : 'Agregar evento'}
          </button>
        </div>

        {homes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <ImageIcon size={22} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">No hay eventos en la home</p>
              <p className="text-xs text-zinc-600 mt-1">Agregá eventos para mostrar en la home pública</p>
            </div>
            <button onClick={crearEvento} disabled={creando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold active:bg-zinc-200 disabled:opacity-40 transition mt-2">
              <Plus size={14} /> Agregar primer evento
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={homes.map(h => h.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-5">
                {homes.map((home, idx) => (
                  <EventCard
                    key={home.id}
                    home={home}
                    index={idx}
                    onUpdate={actualizarCampo}
                    onSave={guardar}
                    onDelete={eliminarEvento}
                    saving={savingId === home.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </motion.div>
    </>
  )
}