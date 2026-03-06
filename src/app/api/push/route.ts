// /app/api/push/route.ts

import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { title, body, url } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Traer todas las suscripciones
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')

    if (error) throw error
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'Sin suscriptores' })
    }

    const payload = JSON.stringify({ title, body, url: url || '/dashboard/user' })

    // Enviar a todos en paralelo
    const results = await Promise.allSettled(
      subs.map(({ subscription }) =>
        webpush.sendNotification(subscription, payload)
      )
    )

    const enviados = results.filter(r => r.status === 'fulfilled').length
    const fallidos = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ enviados, fallidos })
  } catch (err) {
    console.error('Push error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
