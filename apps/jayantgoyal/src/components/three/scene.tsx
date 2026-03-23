'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';
import { ParticleField } from './particle-field';
import { FloatingGeometries } from './floating-geometries';
import { FloatingDoodles } from './floating-doodles';

export default function Scene() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  const color = isDark ? '#a5b4fc' : '#1e293b'; // indigo-300 / slate-800
  const particleCount = isMobile ? 800 : 2000;
  const shapeCount = isMobile ? 3 : 6;
  const doodleCount = isMobile ? 5 : 10;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false }}
        camera={{ position: [0, 0, 12], fov: 60 }}
      >
        <ParticleField count={particleCount} color={color} isDark={isDark} />
        <FloatingGeometries count={shapeCount} color={color} isDark={isDark} />
        <FloatingDoodles count={doodleCount} color={color} isDark={isDark} />
      </Canvas>
    </div>
  );
}
