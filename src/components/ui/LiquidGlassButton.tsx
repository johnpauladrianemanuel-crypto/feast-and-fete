'use client';
import React from 'react';

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'primary' | 'crystal' | 'cyan' | 'emerald' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function LiquidGlassButton({
  variant = 'glass',
  size = 'md',
  children,
  className = '',
  ...props
}: LiquidGlassButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full select-none overflow-hidden backdrop-blur-md cursor-pointer border shadow-lg hover:scale-[1.03] active:scale-[0.97]';

  const sizeStyles = {
    sm: 'px-4 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2',
    xl: 'px-8 py-3 text-lg gap-2.5',
  };

  const variantStyles = {
    glass:
      'bg-white/10 hover:bg-white/20 text-white border-white/30 shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.25)]',
    primary:
      'bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-500 hover:to-red-500 text-white border-orange-300/40 shadow-[0_4px_20px_rgba(249,115,22,0.4)]',
    crystal:
      'bg-white/40 hover:bg-white/60 text-slate-800 border-white/60 shadow-[0_4px_20px_rgba(255,255,255,0.4)]',
    cyan:
      'bg-cyan-500/80 hover:bg-cyan-500 text-white border-cyan-300/40 shadow-[0_4px_20px_rgba(6,182,212,0.4)]',
    emerald:
      'bg-emerald-500/80 hover:bg-emerald-500 text-white border-emerald-300/40 shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
    outline:
      'bg-transparent hover:bg-white/10 text-white border-white/40 shadow-[0_4px_15px_rgba(0,0,0,0.1)]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Glossy top highlight overlay */}
      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}