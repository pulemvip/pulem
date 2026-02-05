'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);

    if (error) setError(error.message);
    else router.push('/dashboard/clientes');
  };

  const register = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    setLoading(false);

    if (error) setError(error.message);
    else alert('Usuario creado. Revisá tu email.');
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-80 space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <input
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-2"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600">{error}</p>}

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Entrar
        </button>

        <button
          onClick={register}
          disabled={loading}
          className="w-full bg-gray-600 text-white p-2 rounded"
        >
          Registrarse
        </button>
      </div>
    </main>
  );
}
