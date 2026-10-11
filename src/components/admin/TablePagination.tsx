'use client';

import React, { useEffect, useRef, useState } from 'react';

export function usePagination<T>(items: T[], pageSize = 10, resetKey = '') {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { page: safePage, setPage, totalPages, pageItems, total: items.length, pageSize };
}

// True briefly whenever the given key changes (skips the first render).
export function useFilterLoading(key: string, ms = 350) {
  const [loading, setLoading] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [key, ms]);

  return loading;
}

export function TableLoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl" style={{ background: 'var(--admin-border)', opacity: 0.5 }} />
      ))}
    </div>
  );
}

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export default function TablePagination({ page, totalPages, total, pageSize, onPageChange }: Props) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  const btn = (active: boolean, disabled = false): React.CSSProperties => ({
    background: active ? '#D4A017' : 'var(--admin-surface)',
    color: active ? '#1A0F0A' : 'var(--admin-muted)',
    border: '1px solid var(--admin-border)',
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
      style={{ borderTop: '1px solid var(--admin-border)' }}
    >
      <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={btn(false, page <= 1)}
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-xs" style={{ color: 'var(--admin-muted)' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className="min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-medium"
              style={btn(p === page)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={btn(false, page >= totalPages)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
