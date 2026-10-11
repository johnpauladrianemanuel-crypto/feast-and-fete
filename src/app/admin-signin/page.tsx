'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { assertLoginAllowed, recordLoginFailure, resetLoginAttempts } from '@/lib/loginAttempts';

const BG_IMAGES = [
  'https://img.rocket.new/generatedImages/rocket_gen_img_15b5bd873-1765211057457.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_14a51a9d3-1772868034765.png',
  'https://img.rocket.new/generatedImages/rocket_gen_img_1c8439ecd-1771179335894.png',
];

export default function AdminSignInPage() {
  const router = useRouter();
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBgIndex((i) => (i + 1) % BG_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);
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
      assertLoginAllowed('admin');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) {
        recordLoginFailure('admin');
        throw error;
      }
      resetLoginAttempts('admin');
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

      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next && /^\/admin-[a-z-]+$/.test(next) ? next : '/admin-dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#1b110e] px-4 overflow-hidden">
      {BG_IMAGES.map((src, i) => (
        <div
          key={src}
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
          style={{ backgroundImage: `url(${src})`, opacity: i === bgIndex ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <img
            src="/assets/images/Logo123.png"
            alt="Feast & Fête logo"
            className="w-20 h-20 object-contain mx-auto mb-3"
          />
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
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-500 transition"
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
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-500 transition"
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
