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
    <div className="relative flex-1">
      <Icon
        name="MagnifyingGlassIcon"
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search food trays — Kare-Kare, Lechon, Sinigang…"
        className="input-field pl-9 pr-9 text-sm"
        aria-label="Search menu items"
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <Icon name="XMarkIcon" size={16} />
        </button>
      )}
    </div>
  );
}