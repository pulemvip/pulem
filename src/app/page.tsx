'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

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

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-950 animate-pulse">
      <div className="w-full h-56 sm:h-64 md:h-72 bg-zinc-800" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="h-5 bg-zinc-800 rounded-lg w-2/3" />
        <div className="h-4 bg-zinc-800 rounded-lg w-1/2" />
      </div>
    </div>
  )
}

function isEventoPasado(fecha?: string | null): boolean {
  if (!fecha) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaEvento = new Date(fecha)
  fechaEvento.setHours(0, 0, 0, 0)
  return fechaEvento < hoy
}

function MantenimientoHome({ mensaje }: { mensaje: string }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 space-y-8 max-w-md"
      >
        <Image src="/logo.png" alt="Logo" width={140} height={50} className="mx-auto drop-shadow-lg" />
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Sparkles size={28} className="text-white/60" />
          </div>
          <p className="text-zinc-300 text-lg leading-relaxed">{mensaje}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse [animation-delay:0.4s]" />
        </div>
      </motion.div>
    </div>
  )
}

export default function Home() {
  const [events, setEvents] = useState<HomeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [mantenimientoHome, setMantenimientoHome] = useState(false)
  const [mensajeMantenimiento, setMensajeMantenimiento] = useState('Estamos preparando algo increíble. ¡Volvé pronto!')

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: configData }, { data: eventsData, error }] = await Promise.all([
        supabase.from('configuracion').select('mantenimiento_home, mensaje_mantenimiento_home').eq('id', 'global').single(),
        supabase.from('home_content').select('*').eq('activo', true).order('orden', { ascending: true }),
      ])
      if (configData?.mantenimiento_home) {
        setMantenimientoHome(true)
        setMensajeMantenimiento(configData.mensaje_mantenimiento_home)
      }
      setTimeout(() => {
        if (!error && eventsData) setEvents(eventsData)
        setLoading(false)
      }, 800)
    }
    fetchAll()
  }, [])

  const formatDate = (fecha?: string | null) => {
    if (!fecha) return { dia: '--', mes: '--' }
    const d = new Date(fecha)
    return {
      dia: d.getDate(),
      mes: d.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase(),
    }
  }

  if (!loading && mantenimientoHome) {
    return <MantenimientoHome mensaje={mensajeMantenimiento} />
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

      <div className="relative z-20 px-6 sm:px-12 lg:px-20 py-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 pt-1 pb-1">
          <Image src="/logo.png" alt="Logo" width={140} height={50} className="drop-shadow-lg" />
          <Link
            href="/login"
            className="rounded-xl bg-sky-600 px-4 py-1.5 text-sm font-semibold hover:bg-sky-500 transition shadow-lg"
          >
            Acceso Administrativos
          </Link>
        </div>

        {/* GRID — siempre centrado y simétrico */}
        <div className={`grid gap-8 sm:gap-16 ${
          loading || events.length === 1
            ? 'grid-cols-1 max-w-xs mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 sm:gap-40 md:gap-52'
        }`}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : events.length === 0 ? (
            <div className="text-center text-zinc-300 py-20">
              No hay eventos activos
            </div>
          ) : (
            events.map((event) => {
              const { dia, mes } = formatDate(event.fecha_evento)
              const pasado = isEventoPasado(event.fecha_evento)

              const inner = (
                <>
                  {event.flyer_url && (
                    <div className="relative w-full h-72 sm:h-80 md:h-[420px] overflow-hidden">
                      <img
                        src={event.flyer_url}
                        alt={event.titulo}
                        className={`w-full h-full object-cover transition duration-500 ${
                          pasado ? 'grayscale brightness-50' : 'group-hover:scale-110'
                        }`}
                      />
                    </div>
                  )}

                  {pasado && (
                    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-2xl">
                      <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[38deg] w-[160%] py-4 text-center bg-black/85 border-y-2 border-white/20 backdrop-blur-[2px]">
                        <span className="text-white font-black text-2xl sm:text-3xl tracking-[0.4em] uppercase drop-shadow-xl">
                          Finalizado
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-black/80 border border-white/20 rounded-lg px-4 py-2 text-center z-20 backdrop-blur-sm">
                    <div className="text-2xl font-bold leading-none">{dia}</div>
                    <div className="text-xs uppercase tracking-wide">{mes}</div>
                  </div>

                  {!pasado && event.boton_link && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-700/70 to-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 z-20">
                      <span className="text-3xl font-extrabold tracking-wide">
                        {event.boton_texto || 'COMPRAR'}
                      </span>
                    </div>
                  )}

                  <div className="p-3 sm:p-4 space-y-1 relative z-30 rounded-b-xl bg-zinc-950">
                    <h2 className={`text-lg font-bold uppercase ${pasado ? 'text-zinc-500' : ''}`}>
                      {event.titulo}
                    </h2>
                    <p className={`text-sm flex items-center gap-2 ${pasado ? 'text-zinc-600' : 'text-zinc-100'}`}>
                      <span>📍</span>
                      {event.descripcion}
                    </p>
                    {pasado && <p className="text-xs text-zinc-700 pt-0.5">Este evento ya finalizó</p>}
                  </div>
                </>
              )

              if (pasado) {
                return (
                  <div key={event.id} className="group relative rounded-2xl shadow-xl bg-zinc-950 cursor-default overflow-hidden">
                    {inner}
                  </div>
                )
              }

              return (
                <a
                  key={event.id}
                  href={event.boton_link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-2xl overflow-hidden shadow-xl transition duration-300 hover:scale-[1.02] bg-zinc-950"
                >
                  {inner}
                </a>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}