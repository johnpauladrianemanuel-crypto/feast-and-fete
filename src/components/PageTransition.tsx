'use client';
import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<'enter' | 'exit' | 'idle'>('enter');
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevPathname = useRef(pathname);

  // First mount — slide in from below
  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 420);
    return () => clearTimeout(t);
  }, []);

  // Route change — exit → swap → enter
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    setPhase('exit');
    const swap = setTimeout(() => {
      setDisplayChildren(children);
      setPhase('enter');
    }, 200);
    const settle = setTimeout(() => setPhase('idle'), 620);
    return () => { clearTimeout(swap); clearTimeout(settle); };
  }, [pathname, children]);

  // Same-route re-renders
  useEffect(() => {
    if (prevPathname.current === pathname) {
      setDisplayChildren(children);
    }
  }, [children, pathname]);

  const style: React.CSSProperties =
    phase === 'exit'
      ? {
          opacity: 0,
          transform: 'translateY(-10px) scale(0.99)',
          transition: 'opacity 200ms cubic-bezier(0.4,0,1,1), transform 200ms cubic-bezier(0.4,0,1,1)',
          willChange: 'opacity, transform',
        }
      : phase === 'enter'
      ? {
          opacity: 0,
          transform: 'translateY(18px) scale(0.985)',
          transition: 'none',
          willChange: 'opacity, transform',
        }
      : {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
          transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.34,1.56,0.64,1)',
          willChange: 'opacity, transform',
        };

  return <div style={style}>{displayChildren}</div>;
}
