'use client';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const test = async () => {
    const { data, error } = await supabase.auth.getUser();
    console.log(data, error);
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <button
        onClick={test}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Test Supabase
      </button>
    </main>
  );
}
