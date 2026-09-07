'use client';
import React, { useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function MenuSearch({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex-1 flex items-center">
      <div className="absolute left-4 z-10 text-foreground/70 pointer-events-none flex items-center justify-center">
        <Icon
          name="MagnifyingGlassIcon"
          size={16}
        />
      </div>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search food trays — Kare-Kare, Lechon, Sinigang…"
        style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }}
        className="input-field w-full text-sm text-foreground placeholder:text-foreground/60 font-medium"
        aria-label="Search menu items"
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          className="absolute right-3.5 z-10 text-foreground/70 hover:text-foreground transition-colors flex items-center justify-center"
          aria-label="Clear search"
        >
          <Icon name="XMarkIcon" size={16} />
        </button>
      )}
    </div>
  );
}