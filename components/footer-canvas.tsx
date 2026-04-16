'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Footer animation — "Two travellers meeting on a flight path."
 *
 * A warm dark canvas strip showing:
 *   - A curved 3D arc (the flight path)
 *   - Two glowing spheres: marigold (family/loved one) and matcha
 *     (companion) travelling toward each other
 *   - When they meet at the centre, a soft pulse of light
 *   - Then they continue together along the remaining path
 *   - A field of drifting particles (ambient atmosphere)
 *
 * Visual metaphor for the Saathi match: two strangers, same plane,
 * meeting mid-journey. Loops seamlessly.
 *
 * Three.js is dynamically imported by the footer wrapper (ssr: false)
 * so this never blocks the server render.
 */

// ── Colour palette (matching the design system) ─────────────────────

const BG_COLOR = 0x2e241c; // warm espresso
const PATH_COLOR = 0xdad4c8; // oat
const MARIGOLD = 0xf59e0b; // marigold-400
const MATCHA = 0x84e7a5; // matcha-300
const PARTICLE_COLOR = 0x9f9b93; // warm-silver

// ── Easing ──────────────────────────────────────────────────────────

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function FooterCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene setup ──────────────────────────────────────────────
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const aspect = width / height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG_COLOR);
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.0015);

    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 2, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Flight path (curved arc in 3D) ───────────────────────────
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, -0.5, 0),
      new THREE.Vector3(-4, 2.5, -1),
      new THREE.Vector3(0, 3.5, -0.5),
      new THREE.Vector3(4, 2.5, -1),
      new THREE.Vector3(8, -0.5, 0),
    ]);

    const pathPoints = pathCurve.getPoints(120);
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({
      color: PATH_COLOR,
      transparent: true,
      opacity: 0.3,
    });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    // Dashed duplicate for a subtle double-line effect
    const dashMaterial = new THREE.LineDashedMaterial({
      color: PATH_COLOR,
      transparent: true,
      opacity: 0.15,
      dashSize: 0.3,
      gapSize: 0.2,
    });
    const dashLine = new THREE.Line(pathGeometry.clone(), dashMaterial);
    dashLine.computeLineDistances();
    dashLine.position.y = -0.08;
    scene.add(dashLine);

    // ── Traveller spheres ────────────────────────────────────────
    const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16);

    // Marigold (family / loved one) — starts from the left
    const marigoldMat = new THREE.MeshBasicMaterial({ color: MARIGOLD });
    const marigoldSphere = new THREE.Mesh(sphereGeo, marigoldMat);
    scene.add(marigoldSphere);

    // Marigold glow
    const marigoldGlowGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const marigoldGlowMat = new THREE.MeshBasicMaterial({
      color: MARIGOLD,
      transparent: true,
      opacity: 0.12,
    });
    const marigoldGlow = new THREE.Mesh(marigoldGlowGeo, marigoldGlowMat);
    scene.add(marigoldGlow);

    // Matcha (companion) — starts from the right
    const matchaMat = new THREE.MeshBasicMaterial({ color: MATCHA });
    const matchaSphere = new THREE.Mesh(sphereGeo, matchaMat);
    scene.add(matchaSphere);

    // Matcha glow
    const matchaGlowMat = new THREE.MeshBasicMaterial({
      color: MATCHA,
      transparent: true,
      opacity: 0.12,
    });
    const matchaGlow = new THREE.Mesh(marigoldGlowGeo.clone(), matchaGlowMat);
    scene.add(matchaGlow);

    // Meeting pulse — appears at the centre when they meet
    const pulseGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulse);

    // ── Particle field ───────────────────────────────────────────
    const PARTICLE_COUNT = 200;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 30;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: PARTICLE_COLOR,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Animation loop ───────────────────────────────────────────
    const CYCLE_DURATION = 8; // seconds per loop
    const startTime = performance.now() / 1000;
    let rafId = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const now = performance.now() / 1000;
      const elapsed = now - startTime;
      const cycleT = (elapsed % CYCLE_DURATION) / CYCLE_DURATION; // 0 → 1

      // Phase 1 (0 → 0.45): both travel toward the centre
      // Phase 2 (0.45 → 0.55): meeting pulse
      // Phase 3 (0.55 → 1.0): they continue together to the right

      let marigoldT: number;
      let matchaT: number;
      let pulseOpacity = 0;
      let pulseScale = 0.1;

      if (cycleT < 0.45) {
        // Phase 1: approach
        const p = smoothstep(cycleT / 0.45);
        marigoldT = p * 0.5; // 0 → 0.5
        matchaT = 1 - p * 0.5; // 1 → 0.5
      } else if (cycleT < 0.55) {
        // Phase 2: meeting
        const p = (cycleT - 0.45) / 0.1; // 0 → 1 over the meeting window
        marigoldT = 0.5;
        matchaT = 0.5;
        pulseOpacity = Math.sin(p * Math.PI) * 0.5;
        pulseScale = 0.3 + p * 1.2;
      } else {
        // Phase 3: continue together
        const p = smoothstep((cycleT - 0.55) / 0.45);
        marigoldT = 0.5 + p * 0.5; // 0.5 → 1
        matchaT = 0.5 + p * 0.5; // 0.5 → 1 (together)
      }

      // Position spheres on the curve
      const marigoldPos = pathCurve.getPointAt(Math.min(marigoldT, 1));
      marigoldSphere.position.copy(marigoldPos);
      marigoldGlow.position.copy(marigoldPos);

      const matchaPos = pathCurve.getPointAt(Math.min(matchaT, 1));
      matchaSphere.position.copy(matchaPos);
      matchaGlow.position.copy(matchaPos);

      // Pulse at centre
      const centrePos = pathCurve.getPointAt(0.5);
      pulse.position.copy(centrePos);
      pulseMat.opacity = pulseOpacity;
      pulse.scale.setScalar(pulseScale);

      // Glow breathing
      const breathe = 0.8 + Math.sin(now * 3) * 0.2;
      marigoldGlowMat.opacity = 0.12 * breathe;
      matchaGlowMat.opacity = 0.12 * breathe;

      // Particle drift
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;

      // Subtle camera sway
      camera.position.x = Math.sin(now * 0.15) * 0.3;
      camera.position.y = 2 + Math.sin(now * 0.2) * 0.15;
      camera.lookAt(0, 1.5, 0);

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize handler ───────────────────────────────────────────
    function onResize() {
      if (!container) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // ── Cleanup ──────────────────────────────────────────────────
    cleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[280px] w-full md:h-[320px]"
      aria-hidden
      style={{ contain: 'strict' }}
    />
  );
}
