// dashboard/admin/components/Sidebar.tsx
import Link from 'next/link'

// dashboard/admin/page.tsx
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
          <p className="text-sm text-zinc-500">Clientes Totales</p>
          <p className="text-3xl font-bold">5000</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
          <p className="text-sm text-zinc-500">Rerolls ejecutados</p>
          <p className="text-3xl font-bold">120</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
          <p className="text-sm text-zinc-500">Vendedores activos</p>
          <p className="text-3xl font-bold">35</p>
        </div>
      </div>

      <p className="text-zinc-400 mt-4">
        Resumen rápido: desde aquí podés acceder a todas las herramientas de administración: 
        reroll de clientes, historial, gestión de vendedores y configuración.
      </p>
    </div>
  )
}
