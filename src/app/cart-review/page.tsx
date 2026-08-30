'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled stops Netlify from pre-rendering this page at build time
const CartReviewContent = dynamic(() => import('./CartReviewContent'), {
  ssr: false,
});

export default function CartReviewPage() {
  return <CartReviewContent />;
}