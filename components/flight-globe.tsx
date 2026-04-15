'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import type { Arc, COBEOptions, Globe } from 'cobe';
import { getCoords } from '@/lib/airport-coords';

interface FlightGlobeProps {
  /** Ordered list of IATA airport codes, e.g. ["CCU", "DOH", "AMS"] */
  route: string[];
  className?: string | undefined;
}

// cobe uses [r, g, b] in 0–1 range
const MATCHA_600: [number, number, number] = [0.027, 0.541, 0.322]; // #078a52
const MATCHA_ARC: [number, number, number] = [0.518, 0.906, 0.647]; // #84e7a5 (bright on cream)

function lngToPhi(lng: number): number {
  return (-lng * Math.PI) / 180;
}

function midLng(lng1: number, lng2: number): number {
  let diff = lng2 - lng1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return lng1 + diff / 2;
}

export function FlightGlobe({ route, className }: FlightGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const rafRef = useRef<number>(0);
  const phi = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const dragDelta = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resolve coordinates for each known IATA code in the route
    const resolvedCoords = route
      .map((iata) => ({ iata, coord: getCoords(iata) }))
      .filter((e): e is { iata: string; coord: [number, number] } => e.coord !== undefined);

    // Center globe on the midpoint of departure → final destination
    if (resolvedCoords.length >= 2) {
      const fromLng = resolvedCoords[0]!.coord[1];
      const toLng = resolvedCoords[resolvedCoords.length - 1]!.coord[1];
      phi.current = lngToPhi(midLng(fromLng, toLng));
    }

    // Build arcs (cobe v2: from/to as [lat, lng])
    const arcs: Arc[] = [];
    for (let i = 0; i < resolvedCoords.length - 1; i++) {
      const from = resolvedCoords[i]!;
      const to = resolvedCoords[i + 1]!;
      arcs.push({
        from: [from.coord[0], from.coord[1]],
        to: [to.coord[0], to.coord[1]],
        color: MATCHA_ARC,
      });
    }

    // Markers at each airport in the route
    const markers: COBEOptions['markers'] = resolvedCoords.map(({ coord: [lat, lng] }) => ({
      location: [lat, lng],
      size: 0.06,
    }));

    const opts: COBEOptions = {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: canvas.offsetWidth * 2,
      height: canvas.offsetHeight * 2,
      phi: phi.current,
      theta: 0.3,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 5,
      baseColor: [0.98, 0.97, 0.96],
      markerColor: MATCHA_600,
      glowColor: [0.94, 0.93, 0.91],
      markers,
      arcs,
      arcColor: MATCHA_ARC,
      arcWidth: 2,
      arcHeight: 0.4,
    };

    globeRef.current?.destroy();
    globeRef.current = createGlobe(canvas, opts);

    // Static render loop — no auto-rotation. The globe holds its
    // orientation and only moves when the user drags. rAF is still needed
    // so pointer-driven phi changes are reflected, but no passive motion.
    function animate() {
      globeRef.current?.update({ phi: phi.current + dragDelta.current });
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      globeRef.current?.destroy();
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.join(',')]);

  return (
    <div
      className={className}
      style={{ aspectRatio: '1 / 1', userSelect: 'none', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
        onPointerDown={(e) => {
          dragging.current = true;
          lastX.current = e.clientX;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          (e.target as HTMLCanvasElement).style.cursor = 'grabbing';
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const delta = e.clientX - lastX.current;
          dragDelta.current += delta / 200;
          lastX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          phi.current += dragDelta.current;
          dragDelta.current = 0;
          (e.target as HTMLCanvasElement).style.cursor = 'grab';
        }}
        onPointerCancel={() => {
          dragging.current = false;
          phi.current += dragDelta.current;
          dragDelta.current = 0;
        }}
      />
    </div>
  );
}
