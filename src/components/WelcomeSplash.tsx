'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface WelcomeSplashProps {
  userName: string;
  onComplete: () => void;
}

export default function WelcomeSplash({ userName, onComplete }: WelcomeSplashProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const onCompleteRef = useRef(onComplete);

  // Keep reference to onComplete fresh without re-triggering effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Phase 1: fade in (0 → 400ms)
    const t1 = setTimeout(() => setPhase('show'), 400);
    // Phase 2: hold (400ms → 2400ms)
    const t2 = setTimeout(() => setPhase('exit'), 2400);
    // Phase 3: fade out complete → call onComplete
    const t3 = setTimeout(() => onCompleteRef.current(), 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      role="dialog"
      aria-live="polite"
      style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #6b2d00 70%, #8b3a00 100%)',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 0.7s ease-in-out' : 'opacity 0.4s ease-in-out',
      }}
    >
      {/* Decorative blurred circles */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,120,30,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: phase === 'show' ? 'scale(1.2)' : 'scale(0.8)',
          transition: 'transform 1s ease-out',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(180,80,10,0.2) 0%, transparent 70%)',
          filter: 'blur(50px)',
          transform: phase === 'show' ? 'scale(1.3)' : 'scale(0.7)',
          transition: 'transform 1.2s ease-out',
        }}
      />

      {/* Content */}
      <div
        className="relative flex flex-col items-center gap-6 px-8 text-center"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(24px)' : 'translateY(0)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        {/* Logo */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(212,120,30,0.5)' }}
        >
          <Image
            src="/assets/images/app_logo.png"
            alt="Feast & Fête logo"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>

        {/* Welcome text */}
        <div className="space-y-2">
          <p
            className="text-sm font-medium tracking-[0.25em] uppercase"
            style={{ color: 'rgba(212,120,30,0.9)' }}
          >
            Welcome to
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            style={{
              color: '#fff',
              fontFamily: 'Georgia, "Times New Roman", serif',
              textShadow: '0 2px 20px rgba(212,120,30,0.4)',
            }}
          >
            Feast &amp; Fête
          </h1>
        </div>

        {/* Divider */}
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,120,30,0.8), transparent)' }}
        />

        {/* User name */}
        <p
          className="text-xl sm:text-2xl font-light"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          Hello,{' '}
          <span className="font-semibold" style={{ color: '#f5a623' }}>
            {userName}
          </span>
          !
        </p>

        {/* Animated dots loader */}
        <div className="flex items-center gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'rgba(212,120,30,0.7)',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}