'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type HomeEvent = {
  id: string
  titulo: string
  descripcion: string
  flyer_url: string
  video_url: string | null
  boton_texto: string | null
  boton_link: string | null
  activo: boolean
  orden: number | null
  fecha_evento: string | null
}

/* ===== SKELETON CARD ===== */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900 animate-pulse">
      <div className="w-full h-80 sm:h-80 md:h-96 bg-zinc-800" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="h-5 bg-zinc-800 rounded-lg w-2/3" />
        <div className="h-4 bg-zinc-800 rounded-lg w-1/2" />
      </div>
    </div>
  )
}

export default function Home() {
  const [events, setEvents] = useState<HomeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const logoSrc = '/logo.png'

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('home_content')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true })

      setTimeout(() => {
        if (!error && data) setEvents(data)
        setLoading(false)
      }, 1000)
    }

    fetchEvents()
  }, [])

  const formatDate = (fecha?: string | null) => {
    if (!fecha) return { dia: '--', mes: '--' }
    const d = new Date(fecha)
    const mes = d.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()
    const dia = d.getDate()
    return { dia, mes }
  }

  const backgroundVideo = events[0]?.video_url

  return (
    <div className="relative min-h-screen bg-black text-white">
      {!loading && backgroundVideo && (
        <video
          src={backgroundVideo}
          autoPlay muted loop playsInline
          className="fixed inset-0 w-full h-full object-cover z-0"
        />
      )}

      <div className="absolute inset-0 bg-black/50 z-10" />

      <div className="relative z-20 px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 pt-1 pb-1">
          <Image src={logoSrc} alt="Logo" width={140} height={50} className="drop-shadow-lg" />
          <Link
            href="/login"
            className="rounded-xl bg-sky-600 px-4 py-1.5 text-sm font-semibold hover:bg-sky-500 transition shadow-lg"
          >
            Acceso Administrativos
          </Link>
        </div>

        {/* GRID */}
        <div className="grid gap-8 sm:gap-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : events.length === 0 ? (
            <div className="col-span-2 text-center text-zinc-300 py-20">
              No hay eventos activos
            </div>
          ) : (
            events.map((event, idx) => {
              const { dia, mes } = formatDate(event.fecha_evento)
              const marginClass = idx === 0 ? 'sm:mr-auto' : idx === 1 ? 'sm:ml-auto' : ''

              return (
                <a
                  key={event.id}
                  href={event.boton_link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative rounded-2xl overflow-hidden shadow-xl transition duration-300 hover:scale-[1.02] bg-zinc-900 ${marginClass}`}
                >
                  {event.flyer_url && (
                    <div className="relative w-full h-80 sm:h-80 md:h-96 overflow-hidden">
                      <img
                        src={event.flyer_url}
                        alt={event.titulo}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-black border border-white/20 rounded-lg px-4 py-2 text-center z-20">
                    <div className="text-2xl font-bold leading-none">{dia}</div>
                    <div className="text-xs uppercase">{mes}</div>
                  </div>

                  {event.boton_link && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-700/70 to-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 z-20">
                      <span className="text-3xl font-extrabold tracking-wide">
                        {event.boton_texto || 'COMPRAR'}
                      </span>
                    </div>
                  )}

                  <div className="p-3 sm:p-5 space-y-2 relative z-30 bg-black/60 rounded-b-xl">
                    <h2 className="text-lg font-bold uppercase">{event.titulo}</h2>
                    <p className="text-sm text-zinc-100 flex items-center gap-2">
                      <span>📍</span>
                      {event.descripcion}
                    </p>
                  </div>
                </a>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}