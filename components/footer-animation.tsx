'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy-loaded Three.js footer animation. The actual scene lives in
 * footer-canvas.tsx; this wrapper handles the dynamic import so the
 * ~500KB three.js bundle doesn't block server render or first paint.
 */
const FooterCanvas = dynamic(
  () => import('@/components/footer-canvas').then((m) => m.FooterCanvas),
  {
    ssr: false,
    loading: () => <div className="h-[280px] w-full bg-[#2e241c] md:h-[320px]" aria-hidden />,
  },
);

export function FooterAnimation() {
  return <FooterCanvas />;
}
