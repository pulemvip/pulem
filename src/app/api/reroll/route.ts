import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { ejecutar } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ==========================
    // 🔐 AUTH — valida por rol, no por ID hardcodeado
    // ==========================
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(token)
    if (!userData?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: solicitante } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', userData.user.id)
      .single()

    if (!solicitante || !['admin', 'jefe'].includes(solicitante.rol)) {
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
      return NextResponse.json({ error: 'No hay clientes para reroll' }, { status: 400 })
    }

    // ==========================
    // 👥 SOLO VENDEDORES (rol = 'vendedor' y activos)
    // ==========================
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('rol', 'vendedor')
      .eq('activo', true)

    if (vendedoresError || !vendedores || vendedores.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 vendedores activos' },
        { status: 400 }
      )
    }

    const vendedoresIds = vendedores.map(v => v.id)
    const vendedoresMap = new Map<string, string>(
      vendedores.map(v => [v.id, v.email])
    )

    // Para mostrar el vendedor actual también necesitamos sus nombres
    // Incluimos admins/jefes en el map solo para display
    const todosLosUserIds = [...new Set(clientes.map(c => c.user_id).filter(Boolean))]
    const faltantes = todosLosUserIds.filter(id => !vendedoresMap.has(id))
    if (faltantes.length > 0) {
      const { data: otros } = await supabase
        .from('usuarios')
        .select('id, email')
        .in('id', faltantes)
      otros?.forEach(u => vendedoresMap.set(u.id, u.email))
    }

    // ==========================
    // 🧠 REROLL EQUITATIVO — solo entre vendedores
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
      // Buscar un vendedor distinto al actual
      let intentos = 0
      let nuevoVendedor = vendedoresMezclados[vendedorIndex % vendedoresMezclados.length]

      while (nuevoVendedor === cliente.user_id && intentos < vendedoresMezclados.length) {
        vendedorIndex++
        intentos++
        nuevoVendedor = vendedoresMezclados[vendedorIndex % vendedoresMezclados.length]
      }

      preview.push({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre,
        vendedor_actual_nombre: vendedoresMap.get(cliente.user_id) ?? 'Sin asignar',
        vendedor_nuevo_nombre: vendedoresMap.get(nuevoVendedor) ?? '—',
      })

      updates.push({ id: cliente.id, user_id: nuevoVendedor })
      vendedorIndex++
    }

    // ==========================
    // 🧪 PREVIEW
    // ==========================
    if (!ejecutar) {
      return NextResponse.json({ preview, total: preview.length })
    }

    // ==========================
    // 🚀 BULK UPDATE
    // ==========================
    for (let i = 0; i < updates.length; i += 500) {
      const batch = updates.slice(i, i + 500)
      const { error } = await supabase
        .from('clientes')
        .upsert(batch, { onConflict: 'id' })

      if (error) {
        return NextResponse.json({ error: 'Error actualizando clientes' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, totalProcesados: updates.length })

  } catch (err) {
    console.error('Reroll error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}