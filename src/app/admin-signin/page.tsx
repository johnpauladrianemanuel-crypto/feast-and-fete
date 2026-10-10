'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminSignInPage() {
  const router = useRouter();
  const [inputVal, setInputVal] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const cleanInput = inputVal.trim().toLowerCase();
      const targetEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@feastandfete.com`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Supabase did not return a signed-in user.');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('This account does not have admin access.');
      }

      router.replace('/admin-dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1b110e] px-4">
      <div className="w-full max-w-md bg-[#281a15] p-8 rounded-2xl border border-amber-900/40 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-amber-500 tracking-wide">Feast & Fête</h1>
          <p className="text-sm text-amber-200/60 mt-1">Admin Panel Access</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/80 border border-red-800/50 text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="block text-xs text-amber-200/80 mb-2 font-medium">
              Admin Username or Email
            </label>
            <input
              type="text"
              required
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Email or username"
              className="w-full px-4 py-3 bg-[#1b110e] border border-amber-900/50 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-amber-200/80 mb-2 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#1b110e] border border-amber-900/50 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
