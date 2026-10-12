'use client';

import { useEffect, useState } from 'react';

// 71 Champaca St, Marikina
const STORE_COORDS = { lat: 14.6507, lng: 121.1029 };


// Straight-line distance is multiplied to approximate road distance.
const ROAD_FACTOR = 1.3;

const TIERS: { maxKm: number; fee: number }[] = [
  { maxKm: 3, fee: 100 },
  { maxKm: 6, fee: 150 },
  { maxKm: 10, fee: 200 },
  { maxKm: 15, fee: 250 },
  { maxKm: 25, fee: 350 },
  { maxKm: Infinity, fee: 500 },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function feeForDistance(km: number) {
  return (TIERS.find((t) => km <= t.maxKm) ?? TIERS[TIERS.length - 1]).fee;
}

export interface DeliveryQuote {
  fee: number | null;
  distanceKm: number | null;
  loading: boolean;
  estimated: boolean;
}

export function useDeliveryFee(enabled: boolean, address: string): DeliveryQuote {
  const [quote, setQuote] = useState<{ fee: number | null; distanceKm: number | null; loading: boolean }>({
    fee: null,
    distanceKm: null,
    loading: false,
  });

  useEffect(() => {
    const query = address.trim();
    if (!enabled || !query) {
      setQuote({ fee: null, distanceKm: null, loading: false });
      return;
    }

    const controller = new AbortController();
    setQuote({ fee: null, distanceKm: null, loading: true });

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const results = (await res.json()) as { lat: string; lon: string }[];
        if (!results.length) {
          setQuote({ fee: null, distanceKm: null, loading: false });
          return;
        }
        const km =
          haversineKm(STORE_COORDS, { lat: Number(results[0].lat), lng: Number(results[0].lon) }) *
          ROAD_FACTOR;
        setQuote({ fee: feeForDistance(km), distanceKm: km, loading: false });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setQuote({ fee: null, distanceKm: null, loading: false });
        }
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, address]);

  return { ...quote, estimated: quote.distanceKm === null };
}
