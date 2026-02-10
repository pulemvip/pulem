'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type HomeContent = {
  titulo: string
  descripcion: string
  flyer_url: string
  video_url: string
}

export default function Home() {
  const [content, setContent] = useState<HomeContent | null>(null)

  useEffect(() => {
    const fetchHome = async () => {
      const { data, error } = await supabase
        .from('home_content')
        .select('titulo, descripcion, flyer_url, video_url')
        .single()

      if (!error) setContent(data)
    }

    fetchHome()
  }, [])

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white bg-black">
        Cargando...
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* VIDEO FONDO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src={content.video_url}
      />

      {/* OVERLAY OSCURO */}
      <div className="absolute inset-0 bg-black/60" />

      {/* BOTÓN LOGIN */}
      <div className="absolute top-6 right-6 z-20">
        <Link
          href="/login"
          className="rounded-lg bg-white px-5 py-2 font-semibold text-black hover:bg-gray-200"
        >
          Acceso dueños
        </Link>
      </div>

      {/* CONTENIDO CENTRAL */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
        <img
          src={content.flyer_url}
          alt="Flyer del evento"
          className="mb-6 max-h-[420px] rounded-xl shadow-2xl"
        />

        <h1 className="text-4xl font-bold">{content.titulo}</h1>
        <p className="mt-3 max-w-xl text-lg opacity-90">
          {content.descripcion}
        </p>
      </div>
    </div>
  )
}
