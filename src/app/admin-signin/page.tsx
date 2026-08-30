'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Sign in gamit ang Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setErrorMsg('Invalid admin credentials.');
        setLoading(false);
        return;
      }

      // 2. Set Admin local storage flags para sa dashboard guard
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('adminProfile', JSON.stringify({ email: data.user.email, id: data.user.id }));

      // 3. Direct papunta sa Admin Dashboard
      router.replace('/admin-dashboard');
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred. Please try again.');
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
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@feastandfete.com"
              className="w-full px-4 py-3 bg-[#1b110e] border border-amber-900/50 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-amber-200/80 mb-2 font-medium">
              Password
            </label>
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