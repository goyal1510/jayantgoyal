'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';

import { DOODLE_GENERATORS } from './doodle-generators';
import { type DoodleConfig, generateDoodleConfigs } from './doodle-config';

interface FloatingDoodlesProps {
  count: number;
  color: string;
  isDark: boolean;
}

function FloatingDoodle({ config, color, isDark }: { config: DoodleConfig; color: string; isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const driftRef = useRef<THREE.Group>(null);

  const strokes = useMemo(() => {
    const generator = DOODLE_GENERATORS[config.doodleIndex]!;
    return generator().map((pts) =>
      pts.map((p) => [p.x, p.y, p.z] as Vector3Tuple)
    );
  }, [config.doodleIndex]);

  const opacity = isDark ? 0.45 : 0.65;

  useFrame((state, delta) => {
    if (!groupRef.current || !driftRef.current) return;

    groupRef.current.rotation.x += delta * config.rotationSpeed[0];
    groupRef.current.rotation.y += delta * config.rotationSpeed[1];
    groupRef.current.rotation.z += delta * config.rotationSpeed[2];

    const t = state.clock.elapsedTime;
    driftRef.current.position.x = config.position[0] + Math.sin(t * config.driftFreq[0] + config.driftPhase[0]) * config.driftAmp[0];
    driftRef.current.position.y = config.position[1] + Math.sin(t * config.driftFreq[1] + config.driftPhase[1]) * config.driftAmp[1];
    driftRef.current.position.z = config.position[2] + Math.sin(t * config.driftFreq[2] + config.driftPhase[2]) * config.driftAmp[2];
  });

  return (
    <group ref={driftRef}>
      <group ref={groupRef} scale={config.scale}>
        {strokes.map((pts, i) => (
          <Line
            key={i}
            points={pts}
            color={color}
            lineWidth={2.5}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        ))}
      </group>
    </group>
  );
}

export function FloatingDoodles({ count, color, isDark }: FloatingDoodlesProps) {
  const configs = useMemo(() => generateDoodleConfigs(count), [count]);

  return (
    <group>
      {configs.map((config, i) => (
        <FloatingDoodle key={i} config={config} color={color} isDark={isDark} />
      ))}
    </group>
  );
}
