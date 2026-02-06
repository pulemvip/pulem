'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) setError(error.message);
    else router.push('/dashboard/clientes');
  };

  const register = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) setError(error.message);
    else alert('Usuario creado. Revisá tu email.');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-900">
      <div className="w-96 p-8 bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl space-y-6 flex flex-col items-center transform transition duration-500 hover:scale-105">
        {/* Logo */}
        <div className="w-32 h-32 relative">
          <Image
            src="/logo.png" // 🔹 Cambiá por tu logo
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold text-center text-white">Bienvenido</h1>
        <p className="text-sm text-gray-300 text-center">Inicia sesión para continuar</p>

        {/* Form */}
        <div className="w-full flex flex-col gap-4">
          <input
            className="w-full border border-gray-700 rounded-xl p-3 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border border-gray-700 rounded-xl p-3 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-semibold hover:bg-blue-700 transition transform hover:scale-105"
          >
            Entrar
          </button>

          <button
            onClick={register}
            disabled={loading}
            className="w-full bg-gray-700 text-white p-3 rounded-xl font-semibold hover:bg-gray-600 transition transform hover:scale-105"
          >
            Registrarse
          </button>
        </div>
      </div>
    </main>
  );
}
