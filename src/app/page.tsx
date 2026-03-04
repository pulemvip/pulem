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

      // Mantener loader mínimo 1.5s
      setTimeout(() => {
        if (!error && data) setEvents(data)
        setLoading(false)
      }, 1500)
    }

    fetchEvents()
  }, [])

  const formatDate = (fecha?: string | null) => {
    if (!fecha) return { dia: '--', mes: '--' }
    const d = new Date(fecha)
    const opciones = { month: 'short' as const }
    const mes = d.toLocaleDateString('es-AR', opciones).toUpperCase()
    const dia = d.getDate()
    return { dia, mes }
  }

  const backgroundVideo = events[0]?.video_url

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#000',
          gap: '1rem',
        }}
      >
        <Image src={logoSrc} alt="Logo" width={120} height={120} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={dotStyle(0)}></span>
          <span style={dotStyle(150)}></span>
          <span style={dotStyle(300)}></span>
        </div>

        <style jsx>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
        `}</style>
      </div>
    )
  }

  function dotStyle(delay: number) {
    return {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: '#0ea5e9',
      display: 'inline-block',
      animation: `bounce 0.6s ${delay}ms infinite`,
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {backgroundVideo && (
        <video
          src={backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0"
        />
      )}

      <div className="absolute inset-0 bg-black/50 z-10"></div>

      <div className="relative z-20 px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* HEADER */}
        <div
          className="flex justify-between items-center"
          style={{ marginBottom: '0.5rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
        >
          <Image src={logoSrc} alt="Logo" width={140} height={50} className="drop-shadow-lg" />
          <Link
            href="/login"
            className="rounded-xl bg-sky-600 px-4 py-1.5 text-sm font-semibold hover:bg-sky-500 transition shadow-lg"
          >
            Acceso Administrativos
          </Link>
        </div>

        {events.length === 0 && <div className="text-center text-zinc-300">No hay eventos activos</div>}

        <div className="grid gap-8 sm:gap-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          {events.map((event, idx) => {
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
                  <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
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
          })}
        </div>
      </div>
    </div>
  )
}