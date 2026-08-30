'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
  variant?: 'default' | 'primary';
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  staggerDelay?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  className?: string;
  textClassName?: string;
}

export function ScrollReveal({
  children,
  size = 'md',
  align = 'left',
  variant = 'default',
  enableBlur = false,
  baseOpacity = 0,
  blurStrength = 8,
  className = '',
  textClassName = '',
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const sizeClasses = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-2xl sm:text-3xl font-bold',
    xl: 'text-4xl sm:text-5xl lg:text-6xl font-extrabold',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const variantClasses = {
    default: 'text-foreground',
    primary: 'bg-gradient-to-r from-[#FFF0B3] via-[#FFD700] to-[#E6A100] bg-clip-text text-transparent',
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : baseOpacity,
        transform: isVisible ? 'translateY(0px)' : 'translateY(30px)',
        filter: isVisible ? 'blur(0px)' : enableBlur ? `blur(${blurStrength}px)` : 'none',
        transition: 'all 0.6s cubic-bezier(0.21, 0.47, 0.32, 0.98)',
      }}
      className={`${alignClasses[align]} ${className}`}
    >
      <span className={`${sizeClasses[size]} ${variantClasses[variant]} ${textClassName}`}>
        {children}
      </span>
    </div>
  );
}