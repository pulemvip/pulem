'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type HomeContent = {
  id: string
  titulo: string
  descripcion: string
  flyer_url: string
  video_url: string
  boton_texto: string | null
  boton_link: string | null
}

export default function HomePage() {
  const [home, setHome] = useState<HomeContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingHome, setSavingHome] = useState(false)

  const HOME_ID = '4c5c253b-2724-4e2a-b69e-7fc0ac0b3ea2'

  useEffect(() => {
    const cargarHome = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data } = await supabase
        .from('home_content')
        .select('*')
        .eq('id', HOME_ID)
        .single()

      setHome(data)
      setLoading(false)
    }

    cargarHome()
  }, [])

  const guardarHome = async () => {
    if (!home) return

    setSavingHome(true)

    const { error } = await supabase
      .from('home_content')
      .update({
        titulo: home.titulo,
        descripcion: home.descripcion,
        flyer_url: home.flyer_url,
        video_url: home.video_url,
        boton_texto: home.boton_texto || null,
        boton_link: home.boton_link || null,
      })
      .eq('id', HOME_ID)

    setSavingHome(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Home actualizada correctamente')
    }
  }

  const subirArchivoHome = async (
    file: File,
    tipo: 'flyer' | 'video'
  ) => {
    if (!home) return

    const ext = file.name.split('.').pop()
    const path = `${tipo}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('home-assets')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      alert('Error al subir el archivo')
      return
    }

    const { data } = supabase.storage
      .from('home-assets')
      .getPublicUrl(path)

    setHome(prev =>
      prev
        ? {
            ...prev,
            [tipo === 'flyer' ? 'flyer_url' : 'video_url']: data.publicUrl,
          }
        : prev
    )
  }

  if (loading) {
    return <div className="text-zinc-400">Cargando...</div>
  }

  if (!home) {
    return <div className="text-zinc-400">No se encontró contenido</div>
  }

  return (
    <div className="space-y-6">

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 className="font-semibold text-lg">🏠 Home pública</h2>

        {/* TÍTULO */}
        <input
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
          value={home.titulo}
          onChange={e => setHome({ ...home, titulo: e.target.value })}
          placeholder="Título"
        />

        {/* DESCRIPCIÓN */}
        <textarea
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
          value={home.descripcion}
          onChange={e => setHome({ ...home, descripcion: e.target.value })}
          placeholder="Descripción"
        />

        {/* TEXTO BOTÓN */}
        <input
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
          value={home.boton_texto ?? ''}
          onChange={e =>
            setHome({ ...home, boton_texto: e.target.value })
          }
          placeholder="Texto del botón"
        />

        {/* LINK BOTÓN */}
        <input
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
          value={home.boton_link ?? ''}
          onChange={e =>
            setHome({ ...home, boton_link: e.target.value })
          }
          placeholder="Link del botón (https://...)"
        />

        {/* FLYER */}
        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Flyer</div>
          {home.flyer_url && (
            <img
              src={home.flyer_url}
              className="max-h-64 w-full object-contain rounded-lg"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={e =>
              e.target.files &&
              subirArchivoHome(e.target.files[0], 'flyer')
            }
          />
        </div>

        {/* VIDEO */}
        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Video</div>
          {home.video_url && (
            <video
              src={home.video_url}
              controls
              className="max-h-64 w-full object-contain rounded-lg"
            />
          )}
          <input
            type="file"
            accept="video/*"
            onChange={e =>
              e.target.files &&
              subirArchivoHome(e.target.files[0], 'video')
            }
          />
        </div>

        <button
          onClick={guardarHome}
          disabled={savingHome}
          className="bg-green-600 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          {savingHome ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

    </div>
  )
}