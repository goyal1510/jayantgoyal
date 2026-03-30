'use client';

import { useEffect } from 'react';
import { useThreeBgStore } from '@/lib/stores/use-three-bg-store';
import { ThreeBackground } from './three-background';

export function ThreeBgWrapper() {
  const enabled = useThreeBgStore((s) => s.enabled);

  useEffect(() => {
    useThreeBgStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (enabled) {
      document.body.dataset.threeBg = 'active';

      // Inject backdrop-filter styles at runtime to avoid production CSS bundler stripping them
      const style = document.createElement('style');
      style.id = 'three-bg-backdrop';
      style.textContent = `
        body[data-three-bg="active"] [data-slot="sidebar-inner"] {
          -webkit-backdrop-filter: blur(8px) !important;
          backdrop-filter: blur(8px) !important;
        }
        .dark body[data-three-bg="active"] [data-slot="sidebar-inner"] {
          -webkit-backdrop-filter: blur(6px) !important;
          backdrop-filter: blur(6px) !important;
        }
        body[data-three-bg="active"] [data-slot="card"] {
          -webkit-backdrop-filter: blur(12px) !important;
          backdrop-filter: blur(12px) !important;
        }
        .dark body[data-three-bg="active"] [data-slot="card"] {
          -webkit-backdrop-filter: blur(8px) !important;
          backdrop-filter: blur(8px) !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      delete document.body.dataset.threeBg;
      document.getElementById('three-bg-backdrop')?.remove();
    }
    return () => {
      delete document.body.dataset.threeBg;
      document.getElementById('three-bg-backdrop')?.remove();
    };
  }, [enabled]);

  if (!enabled) return null;

  return <ThreeBackground />;
}
