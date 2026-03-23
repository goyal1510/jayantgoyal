'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from './use-reduced-motion';

const Scene = dynamic(() => import('./scene'), { ssr: false });

export function ThreeBackground() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return <Scene />;
}
