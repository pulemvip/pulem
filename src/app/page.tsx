'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type HomeContent = {
  titulo: string
  descripcion: string
  flyer_url: string
  video_url: string
  boton_texto: string | null
  boton_link: string | null
}

export default function Home() {
  const [content, setContent] = useState<HomeContent | null>(null)

  useEffect(() => {
    const fetchHome = async () => {
      const { data, error } = await supabase
        .from('home_content')
        .select(
          'titulo, descripcion, flyer_url, video_url, boton_texto, boton_link'
        )
        .single()

      if (!error) setContent(data)
    }

    fetchHome()
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* VIDEO FONDO */}
      {content?.video_url && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src={content.video_url}
        />
      )}

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/60" />

      {/* ACCESO DUEÑOS */}
      <div
        className="
    relative z-20
    mb-4 mt-4 px-4
    flex w-full justify-end

    sm:absolute sm:right-6 sm:top-6
    sm:mb-0 sm:mt-0 sm:px-0 sm:w-auto
  "
      >
        <Link
          href="/login"
          className="
      inline-flex items-center justify-center
      rounded-xl
      bg-gradient-to-r from-sky-500 to-cyan-400
      px-4 py-2 text-sm font-bold text-white
      shadow-lg shadow-sky-500/30
      transition-all duration-300
      hover:scale-105 hover:shadow-sky-500/50
      active:scale-95
      sm:px-5 sm:py-2 sm:text-base
    "
        >
          Acceso Administrativos
        </Link>
      </div>




      {/* CONTENIDO */}
      <div
        className="
          relative z-10 flex min-h-screen flex-col items-center
          px-4 py-8 text-center text-white
          sm:justify-center
        "
      >
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
          {content?.titulo}
        </h1>
        {content?.flyer_url && (
          <img
            src={content.flyer_url}
            alt="Flyer del evento"
            className="
              mb-5 w-full max-w-xs rounded-xl shadow-2xl
              max-h-[45vh] object-contain
              sm:max-h-[55vh]
            "
          />
        )}

        <p className="mt-3 max-w-md text-sm opacity-90 sm:text-base md:text-lg">
          {content?.descripcion}
        </p>

        {content?.boton_texto && content?.boton_link && (
          <a
            href={content.boton_link}
            target="_blank"
            rel="noopener noreferrer"
            className="
              relative mt-6 inline-flex items-center justify-center
              rounded-2xl
              bg-gradient-to-r from-sky-500 to-cyan-400
              px-8 py-4 text-lg font-bold text-white
              shadow-xl shadow-sky-500/30
              transition-all duration-300
              hover:scale-105 hover:shadow-sky-500/50
              active:scale-95
            "
          >
            {content.boton_texto}
          </a>
        )}
      </div>
    </div>
  )
}
