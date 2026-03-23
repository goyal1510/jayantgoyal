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
    } else {
      delete document.body.dataset.threeBg;
    }
    return () => {
      delete document.body.dataset.threeBg;
    };
  }, [enabled]);

  if (!enabled) return null;

  return <ThreeBackground />;
}
