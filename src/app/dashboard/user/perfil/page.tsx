'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Loader2,
} from 'lucide-react'

type Perfil = {
  id: string
  email: string
  rol: string
  activo: boolean
  created_at: string
  avatar_url: string | null
}

function Badge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        activo
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
      }`}
    >
      {activo ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function RolBadge({ rol }: { rol: string }) {
  const isAdmin = rol === 'admin'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isAdmin
          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          : 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
      }`}
    >
      <Shield size={11} />
      {rol.charAt(0).toUpperCase() + rol.slice(1)}
    </span>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value?: string
  children?: React.ReactNode
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
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/* ===== AVATAR CON UPLOAD ===== */
function AvatarUpload({
  perfil,
  onUpdate,
}: {
  perfil: Perfil
  onUpdate: (url: string) => void
}) {
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

    if (!file.type.startsWith('image/')) {
      showToast('Solo se permiten imágenes', false)
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('La imagen no puede superar 3MB', false)
      return
    }

    setUploading(true)

    // Preview local inmediato para que se sienta rápido
    setPreview(URL.createObjectURL(file))

    const ext = file.name.split('.').pop()
    const path = `${perfil.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      showToast('Error al subir la imagen', false)
      setPreview(perfil.avatar_url)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    // Cache buster para que no quede la imagen vieja
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('usuarios')
      .update({ avatar_url: publicUrl })
      .eq('id', perfil.id)

    if (dbError) {
      showToast('Error al guardar', false)
    } else {
      setPreview(publicUrl)
      onUpdate(publicUrl)
      showToast('Foto actualizada', true)
    }

    setUploading(false)
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      {/* Avatar */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-zinc-700 border-2 border-zinc-600 overflow-hidden flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-2xl font-bold text-white select-none">
              {getInitials(perfil.email)}
            </span>
          )}
        </div>

        {/* Botón cámara */}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:bg-zinc-200 disabled:opacity-60 transition"
        >
          {uploading
            ? <Loader2 size={15} className="animate-spin" />
            : <Camera size={15} />
          }
        </button>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-zinc-500 active:text-zinc-300 transition mt-2"
      >
        {uploading ? 'Subiendo...' : 'Cambiar foto de perfil'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {toast && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-medium ${toast.ok ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {toast.msg}
        </motion.p>
      )}
    </div>
  )
}

/* ===== PAGE ===== */
export default function PerfilPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single()

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-xl mx-auto pb-24"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Mi perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">Información de tu cuenta</p>
      </div>

      {/* Avatar upload */}
      <AvatarUpload
        perfil={perfil}
        onUpdate={url => setPerfil(prev => prev ? { ...prev, avatar_url: url } : prev)}
      />

      {/* Email + badges centrados */}
      <div className="text-center mb-8">
        <p className="text-base font-medium text-white truncate px-4">{perfil.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <RolBadge rol={perfil.rol} />
          <Badge activo={perfil.activo} />
        </div>
      </div>

      {/* Card de datos */}
      <div className="bg-[#0f0f14] border border-zinc-800 rounded-2xl px-5">
        <InfoRow icon={Shield} label="Rol">
          <RolBadge rol={perfil.rol} />
        </InfoRow>

        <InfoRow icon={CheckCircle} label="Estado de cuenta">
          <Badge activo={perfil.activo} />
        </InfoRow>

        <InfoRow
          icon={Calendar}
          label="Miembro desde"
          value={formatDate(perfil.created_at)}
        />

        <InfoRow icon={Clock} label="ID de usuario">
          <p className="text-xs text-zinc-500 font-mono break-all">{perfil.id}</p>
        </InfoRow>
      </div>

      <p className="text-xs text-zinc-600 text-center mt-6">
        Para modificar tu cuenta contactá a un administrador.
      </p>
    </motion.div>
  )
}