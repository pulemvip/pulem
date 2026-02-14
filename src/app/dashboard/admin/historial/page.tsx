'use client'

export default function HistorialPage() {
  const dummyData = Array.from({ length: 50 }).map((_, i) => ({
    id: i + 1,
    fecha: new Date().toLocaleString(),
    usuario: `admin${i % 3 + 1}@mail.com`,
    cambios: Math.floor(Math.random() * 100),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Historial de Rerolls</h1>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Usuario</th>
              <th className="text-left px-4 py-3">Cambios</th>
            </tr>
          </thead>
          <tbody>
            {dummyData.map((item) => (
              <tr key={item.id} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3">{item.fecha}</td>
                <td className="px-4 py-3 text-zinc-400">{item.usuario}</td>
                <td className="px-4 py-3 text-blue-500 font-semibold">{item.cambios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
