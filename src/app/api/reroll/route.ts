import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

const ADMIN_ID = '732b5ed0-351a-459b-926c-a30a0cf75d54'

export async function POST(req: Request) {
  try {
    const { ejecutar } = await req.json()
    console.log("EJECUTAR:", ejecutar)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ==========================
    // 🔐 AUTH
    // ==========================

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(token)

    if (!userData?.user || userData.user.id !== ADMIN_ID) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // ==========================
    // 👤 TODOS LOS CLIENTES
    // ==========================

    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nombre, user_id')
      .range(0, 5000)

    if (!clientes || clientes.length === 0) {
      return NextResponse.json(
        { error: 'No hay clientes para reroll' },
        { status: 400 }
      )
    }

    // ==========================
    // 👥 VENDEDORES REALES (desde clientes)
    // ==========================

    const vendedoresIds = [...new Set(clientes.map(c => c.user_id))]

    if (vendedoresIds.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 vendedores' },
        { status: 400 }
      )
    }

    // Si querés nombres reales desde auth:
    const vendedoresMap = new Map<string, string>()

    for (const vendedorId of vendedoresIds) {
      const { data } = await supabase.auth.admin.getUserById(vendedorId)
      vendedoresMap.set(
        vendedorId,
        data.user?.user_metadata?.nombre ||
        data.user?.email ||
        'Sin nombre'
      )
    }


    // ==========================
    // 🧠 REROLL GLOBAL EQUITATIVO
    // ==========================

    function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const clientesMezclados = shuffle(clientes)
const vendedoresMezclados = shuffle(vendedoresIds)

const preview: any[] = []
const updates: { id: string; user_id: string }[] = []

let vendedorIndex = 0

for (const cliente of clientesMezclados) {
  let nuevoVendedor =
    vendedoresMezclados[vendedorIndex % vendedoresMezclados.length]

  if (nuevoVendedor === cliente.user_id) {
    vendedorIndex++
    nuevoVendedor =
      vendedoresMezclados[vendedorIndex % vendedoresMezclados.length]
  }

  preview.push({
    cliente_id: cliente.id,
    cliente_nombre: cliente.nombre,
    vendedor_actual_nombre:
      vendedoresMap.get(cliente.user_id) || 'Desconocido',
    vendedor_nuevo_nombre:
      vendedoresMap.get(nuevoVendedor) || 'Desconocido',
  })

  updates.push({
    id: cliente.id,
    user_id: nuevoVendedor,
  })

  vendedorIndex++
}




    // ==========================
    // 🧪 PREVIEW
    // ==========================

    if (!ejecutar) {
      return NextResponse.json({
        preview,
        total: preview.length,
      })
    }

    // ==========================
    // 🚀 BULK UPDATE REAL
    // ==========================

    console.log("UPDATES LENGTH:", updates.length)

    for (let i = 0; i < updates.length; i += 500) {
      const batch = updates.slice(i, i + 500)

      const { error } = await supabase
        .from('clientes')
        .upsert(batch, { onConflict: 'id' })

      if (error) {
        return NextResponse.json(
          { error: 'Error actualizando clientes' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      totalProcesados: preview.length,
    })

  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
