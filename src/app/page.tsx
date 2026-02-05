'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login'); // 🔹 redirige al login
      } else {
        router.replace('/dashboard/clientes'); // 🔹 opcional: si ya está logueado
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Verificando sesión...
    </div>
  );
}
