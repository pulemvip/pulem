'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Shield, Calendar, CheckCircle, XCircle, Clock,
  Camera, Loader2, KeyRound, Eye, EyeOff, X, CheckCheck,
} from 'lucide-react'

type Perfil = {
  id: string
  email: string
  rol: string
  activo: boolean
  created_at: string
  avatar_url: string | null
}

type Toast = { id: number; message: string; type: 'success' | 'error' }

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

function Badge({ activo }: { activo: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      activo
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    }`}>
      {activo ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function RolBadge({ rol }: { rol: string }) {
  const isAdmin = rol === 'admin'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isAdmin
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
    }`}>
      <Shield size={11} />
      {rol.charAt(0).toUpperCase() + rol.slice(1)}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value, children }: {
  icon: React.ElementType; label: string; value?: string; children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-zinc-800 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        {children ?? <p className="text-sm text-zinc-100 break-all">{value}</p>}
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/* ===== AVATAR UPLOAD ===== */
function AvatarUpload({ perfil, onUpdate }: { perfil: Perfil; onUpdate: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(perfil.avatar_url)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Solo se permiten imágenes', false); return }
    if (file.size > 3 * 1024 * 1024) { showToast('La imagen no puede superar 3MB', false); return }

    setUploading(true)
    setPreview(URL.createObjectURL(file))

    const ext = file.name.split('.').pop()
    const path = `${perfil.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { showToast('Error al subir la imagen', false); setPreview(perfil.avatar_url); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase.from('usuarios').update({ avatar_url: publicUrl }).eq('id', perfil.id)
    if (dbError) showToast('Error al guardar', false)
    else { setPreview(publicUrl); onUpdate(publicUrl); showToast('Foto actualizada', true) }

    setUploading(false)
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-zinc-700 border-2 border-zinc-600 overflow-hidden flex items-center justify-center">
          {preview
            ? <Image src={preview} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" unoptimized />
            : <span className="text-2xl font-bold text-white select-none">{getInitials(perfil.email)}</span>
          }
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:bg-zinc-200 disabled:opacity-60 transition"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
        </button>
      </div>

      <button onClick={() => inputRef.current?.click()} disabled={uploading} className="text-xs text-zinc-500 active:text-zinc-300 transition mt-2">
        {uploading ? 'Subiendo...' : 'Cambiar foto de perfil'}
      </button>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {toast && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`text-xs font-medium ${toast.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {toast.msg}
        </motion.p>
      )}
    </div>
  )
}

/* ===== MODAL CAMBIO CONTRASEÑA ===== */
function CambiarPasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validar = () => {
    if (nueva.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (nueva !== confirmar) return 'Las contraseñas no coinciden'
    return null
  }

  const handleGuardar = async () => {
    const err = validar()
    if (err) { setError(err); return }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password: nueva })
    if (error) {
      setError(error.message ?? 'Error al cambiar la contraseña')
    } else {
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  const coinciden = nueva && confirmar && nueva === confirmar
  const noCoinciden = nueva && confirmar && nueva !== confirmar

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
        <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                <KeyRound size={15} className="text-zinc-400" />
              </div>
              <h2 className="text-base font-semibold">Cambiar contraseña</h2>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            {/* Nueva */}
            <div className="space-y-1.5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Nueva contraseña</p>
              <div className="relative">
                <input
                  type={showNueva ? 'text' : 'password'}
                  value={nueva}
                  onChange={e => { setNueva(e.target.value); setError(null) }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 pr-11 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNueva(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {showNueva ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirmar */}
            <div className="space-y-1.5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Confirmá la contraseña</p>
              <div className="relative">
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => { setConfirmar(e.target.value); setError(null) }}
                  placeholder="Repetí la contraseña"
                  className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 pr-11 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition ${
                    noCoinciden
                      ? 'border-red-500/50 focus:border-red-500'
                      : coinciden
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-zinc-700 focus:border-zinc-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmar(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {showConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {coinciden && (
                  <CheckCheck size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 flex items-center gap-1.5"
                >
                  <X size={12} /> {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 text-sm rounded-2xl border border-zinc-700 text-zinc-300 active:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={loading || !nueva || !confirmar}
              className="flex-1 py-3.5 text-sm rounded-2xl bg-white text-black font-semibold active:bg-zinc-200 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : 'Guardar'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

/* ===== PAGE ===== */
export default function PerfilPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) { router.push('/login'); return }
      const { data, error } = await supabase.from('usuarios').select('*').eq('id', authData.user.id).single()
      if (error) setError('No se pudo cargar el perfil.')
      else setPerfil(data)
      setLoading(false)
    }
    fetchPerfil()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
      </div>
    )
  }

  if (error || !perfil) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">{error ?? 'Sin datos.'}</p>
      </div>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} />

      <AnimatePresence>
        {showPasswordModal && (
          <CambiarPasswordModal
            onClose={() => setShowPasswordModal(false)}
            onSuccess={() => addToast('Contraseña actualizada correctamente', 'success')}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-xl mx-auto pb-24"
      >
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Mi perfil</h1>
          <p className="text-sm text-zinc-500 mt-1">Información de tu cuenta</p>
        </div>

        <AvatarUpload
          perfil={perfil}
          onUpdate={url => setPerfil(prev => prev ? { ...prev, avatar_url: url } : prev)}
        />

        <div className="text-center mb-8">
          <p className="text-base font-medium text-white truncate px-4">{perfil.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <RolBadge rol={perfil.rol} />
            <Badge activo={perfil.activo} />
          </div>
        </div>

        {/* Card de datos */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl px-5 mb-4">
          <InfoRow icon={Shield} label="Rol">
            <RolBadge rol={perfil.rol} />
          </InfoRow>
          <InfoRow icon={CheckCircle} label="Estado de cuenta">
            <Badge activo={perfil.activo} />
          </InfoRow>
          <InfoRow icon={Calendar} label="Miembro desde" value={formatDate(perfil.created_at)} />
          <InfoRow icon={Clock} label="ID de usuario">
            <p className="text-xs text-zinc-500 font-mono break-all">{perfil.id}</p>
          </InfoRow>
        </div>

        {/* Seguridad */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl px-5">
          <div className="flex items-start gap-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <KeyRound size={15} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 mb-1">Seguridad</p>
              <p className="text-sm text-zinc-100 mb-3">Contraseña</p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition"
              >
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-600 text-center mt-6">
          Para modificar otros datos contactá a un administrador.
        </p>
      </motion.div>
    </>
  )
}