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
  fecha_evento: string | null // NUEVO CAMPO
}

export default function HomePage() {
  const [homes, setHomes] = useState<HomeContent[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    const cargarHomes = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data } = await supabase
        .from('home_content')
        .select('*')
        .order('updated_at', { ascending: true })

      setHomes(data || [])
      setLoading(false)
    }

    cargarHomes()
  }, [])

  const actualizarCampo = (
    id: string,
    campo: keyof HomeContent,
    valor: any
  ) => {
    setHomes(prev =>
      prev.map(h =>
        h.id === id ? { ...h, [campo]: valor } : h
      )
    )
  }

  const guardarHome = async (home: HomeContent, index: number) => {
    setSavingId(home.id)

    const { error } = await supabase
      .from('home_content')
      .update({
        titulo: home.titulo,
        descripcion: home.descripcion,
        flyer_url: home.flyer_url,
        video_url: index === 0 ? home.video_url : '', // solo el primero guarda video
        boton_texto: home.boton_texto || null,
        boton_link: home.boton_link || null,
        fecha_evento: home.fecha_evento || null, // <-- AGREGADO
      })
      .eq('id', home.id)

    setSavingId(null)

    if (error) {
      alert(error.message)
    } else {
      alert('Evento actualizado correctamente')
    }
  }

  const crearEvento = async () => {
    if (homes.length >= 2) {
      alert('Solo podés tener máximo 2 eventos')
      return
    }

    const { data, error } = await supabase
      .from('home_content')
      .insert({
        titulo: 'Nuevo Evento',
        descripcion: 'Descripción del evento',
        flyer_url: 'https://placehold.co/600x800',
        boton_texto: null,
        boton_link: null,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    setHomes(prev => [...prev, data])
  }

  const eliminarEvento = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return

    const { error } = await supabase
      .from('home_content')
      .delete()
      .eq('id', id)

    if (!error) {
      setHomes(prev => prev.filter(h => h.id !== id))
    }
  }

  const subirArchivoHome = async (
    id: string,
    file: File,
    tipo: 'flyer' | 'video'
  ) => {
    const ext = file.name.split('.').pop()
    const path = `${id}-${tipo}.${ext}`

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

    actualizarCampo(
      id,
      tipo === 'flyer' ? 'flyer_url' : 'video_url',
      data.publicUrl
    )
  }

  if (loading) {
    return <div className="text-zinc-400">Cargando...</div>
  }

  return (
    <div className="space-y-10">

      {homes.map((home, index) => (
        <div
          key={home.id}
          className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4"
        >
          <h2 className="font-semibold text-lg">
            🏠 Evento {index + 1}
          </h2>

          {/* TÍTULO */}
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
            value={home.titulo}
            onChange={e =>
              actualizarCampo(home.id, 'titulo', e.target.value)
            }
            placeholder="Título"
          />

          {/* DESCRIPCIÓN */}
          <textarea
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
            value={home.descripcion}
            onChange={e =>
              actualizarCampo(home.id, 'descripcion', e.target.value)
            }
            placeholder="Descripción"
          />

          {/* FECHA DEL EVENTO */}
          <input
            type="date"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
            value={home.fecha_evento ?? ''}
            onChange={e =>
              actualizarCampo(home.id, 'fecha_evento', e.target.value)
            }
            placeholder="Fecha del evento"
          />

          {/* TEXTO BOTÓN */}
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
            value={home.boton_texto ?? ''}
            onChange={e =>
              actualizarCampo(home.id, 'boton_texto', e.target.value)
            }
            placeholder="Texto del botón"
          />

          {/* LINK BOTÓN */}
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100"
            value={home.boton_link ?? ''}
            onChange={e =>
              actualizarCampo(home.id, 'boton_link', e.target.value)
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
                subirArchivoHome(home.id, e.target.files[0], 'flyer')
              }
            />
          </div>

          {/* VIDEO SOLO PARA EL PRIMER EVENTO */}
          {index === 0 && (
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
                  subirArchivoHome(home.id, e.target.files[0], 'video')
                }
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => guardarHome(home, index)}
              disabled={savingId === home.id}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {savingId === home.id ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <button
              onClick={() => eliminarEvento(home.id)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}

      {homes.length < 2 && (
        <button
          onClick={crearEvento}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Agregar Evento
        </button>
      )}
    </div>
  )
}