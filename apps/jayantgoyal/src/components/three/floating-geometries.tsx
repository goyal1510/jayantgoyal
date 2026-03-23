/* eslint-disable react/no-unknown-property */
'use client';

import { useRef, useMemo } from 'react';
import { Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';

interface FloatingGeometriesProps {
  count: number;
  color: string;
  isDark: boolean;
}

interface ShapeConfig {
  position: Vector3Tuple;
  scale: number;
  rotationSpeed: Vector3Tuple;
  floatSpeed: number;
  floatIntensity: number;
  geometry: 'simple' | 'compound';
  type: string;
}

// Golden angle for uniform angular distribution
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function spreadPosition(i: number, total: number): Vector3Tuple {
  const angle = i * GOLDEN_ANGLE;
  const r = 5 + (i / total) * 4;
  const x = Math.cos(angle) * r;
  const y = Math.sin(angle) * r * 0.6;
  const z = -4 + (i / total) * 16;
  return [x, y, z];
}

const SIMPLE_TYPES = ['icosahedron', 'octahedron', 'torusKnot', 'dodecahedron', 'tetrahedron', 'torus'] as const;
const COMPOUND_TYPES = ['icoSpheres', 'doubleKnot', 'cubeGrid', 'octaDodec', 'sphereRing', 'coneTorus'] as const;

const SIMPLE_SHAPES: ShapeConfig[] = SIMPLE_TYPES.map((type, i) => ({
  position: spreadPosition(i, SIMPLE_TYPES.length),
  scale: 0.5 + (i % 3) * 0.15,
  rotationSpeed: [0.15 + i * 0.05, 0.25 + i * 0.04, 0.08 + i * 0.03] as Vector3Tuple,
  floatSpeed: 1.0 + i * 0.15,
  floatIntensity: 0.7 + i * 0.1,
  geometry: 'simple' as const,
  type,
}));

const COMPOUND_SHAPES: ShapeConfig[] = COMPOUND_TYPES.map((type, i) => ({
  position: spreadPosition(i + SIMPLE_TYPES.length, SIMPLE_TYPES.length + COMPOUND_TYPES.length),
  scale: 0.55 + (i % 3) * 0.15,
  rotationSpeed: [0.1 + i * 0.04, 0.15 + i * 0.03, 0.06 + i * 0.025] as Vector3Tuple,
  floatSpeed: 0.8 + i * 0.12,
  floatIntensity: 0.6 + i * 0.08,
  geometry: 'compound' as const,
  type,
}));

// --- Simple geometry lookup ---

function SimpleGeometry({ type }: { type: string }) {
  switch (type) {
    case 'icosahedron':
      return <icosahedronGeometry args={[1, 0]} />;
    case 'octahedron':
      return <octahedronGeometry args={[1, 0]} />;
    case 'torusKnot':
      return <torusKnotGeometry args={[0.8, 0.3, 64, 8]} />;
    case 'dodecahedron':
      return <dodecahedronGeometry args={[1, 0]} />;
    case 'tetrahedron':
      return <tetrahedronGeometry args={[1, 0]} />;
    case 'torus':
      return <torusGeometry args={[0.8, 0.3, 12, 24]} />;
    default:
      return <icosahedronGeometry args={[1, 0]} />;
  }
}

// --- Compound geometry designs ---

function IcoSpheresDesign({ color, opacity }: { color: string; opacity: number }) {
  return (
    <>
      <mesh>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
      </mesh>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 2.5;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, (i % 3 - 1) * 0.6]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}

function DoubleKnotDesign({ color, opacity }: { color: string; opacity: number }) {
  return (
    <>
      <mesh rotation={[0, 0, 0.4]}>
        <torusKnotGeometry args={[1.0, 0.3, 64, 8, 2, 3]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, -0.4]}>
        <torusKnotGeometry args={[1.0, 0.25, 64, 8, 3, 2]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
      </mesh>
    </>
  );
}

function CubeGridDesign({ color, opacity }: { color: string; opacity: number }) {
  const cubes: THREE.Vector3[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubes.push(new THREE.Vector3(x * 0.8, y * 0.8, z * 0.8));
      }
    }
  }
  return (
    <>
      {cubes.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function OctaDodecDesign({ color, opacity }: { color: string; opacity: number }) {
  return (
    <>
      <mesh>
        <octahedronGeometry args={[1.2, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
      </mesh>
      {[...Array(4)].map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const r = 2.0;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}

function SphereRingDesign({ color, opacity }: { color: string; opacity: number }) {
  return (
    <>
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 1.8;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}

function ConeTorusDesign({ color, opacity }: { color: string; opacity: number }) {
  return (
    <>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.8, 1.6, 6]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.2, 12, 24]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
      </mesh>
    </>
  );
}

function CompoundDesign({ type, color, opacity }: { type: string; color: string; opacity: number }) {
  switch (type) {
    case 'icoSpheres':
      return <IcoSpheresDesign color={color} opacity={opacity} />;
    case 'doubleKnot':
      return <DoubleKnotDesign color={color} opacity={opacity} />;
    case 'cubeGrid':
      return <CubeGridDesign color={color} opacity={opacity} />;
    case 'octaDodec':
      return <OctaDodecDesign color={color} opacity={opacity} />;
    case 'sphereRing':
      return <SphereRingDesign color={color} opacity={opacity} />;
    case 'coneTorus':
      return <ConeTorusDesign color={color} opacity={opacity} />;
    default:
      return null;
  }
}

// --- Animated wrapper with continuous rotation + drifting ---

interface DriftParams {
  freqX: number;
  freqY: number;
  freqZ: number;
  ampX: number;
  ampY: number;
  ampZ: number;
  phaseX: number;
  phaseY: number;
  phaseZ: number;
}

function RotatingFloat({ shape, color, isDark, index }: { shape: ShapeConfig; color: string; isDark: boolean; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const driftRef = useRef<THREE.Group>(null);
  const opacity = isDark ? 0.3 : 0.55;

  // Unique drift parameters — golden angle offsets prevent clustering
  const drift = useMemo<DriftParams>(() => {
    const phi = index * GOLDEN_ANGLE;
    return {
      freqX: 0.06 + (index % 5) * 0.02,
      freqY: 0.05 + (index % 4) * 0.018,
      freqZ: 0.035 + (index % 3) * 0.015,
      ampX: 4 + (index % 3) * 1.5,
      ampY: 3 + (index % 4) * 1.2,
      ampZ: 2.5 + (index % 3) * 1.0,
      phaseX: phi,
      phaseY: phi + Math.PI * 0.67,
      phaseZ: phi + Math.PI * 1.33,
    };
  }, [index]);

  useFrame((state, delta) => {
    if (!groupRef.current || !driftRef.current) return;

    // Continuous rotation
    groupRef.current.rotation.x += delta * shape.rotationSpeed[0];
    groupRef.current.rotation.y += delta * shape.rotationSpeed[1];
    groupRef.current.rotation.z += delta * shape.rotationSpeed[2];

    // Sine-wave drifting around the origin position
    const t = state.clock.elapsedTime;
    driftRef.current.position.x = shape.position[0] + Math.sin(t * drift.freqX + drift.phaseX) * drift.ampX;
    driftRef.current.position.y = shape.position[1] + Math.sin(t * drift.freqY + drift.phaseY) * drift.ampY;
    driftRef.current.position.z = shape.position[2] + Math.sin(t * drift.freqZ + drift.phaseZ) * drift.ampZ;
  });

  return (
    <group ref={driftRef}>
      <Float speed={shape.floatSpeed} floatIntensity={shape.floatIntensity} rotationIntensity={0}>
        <group ref={groupRef} scale={shape.scale}>
          {shape.geometry === 'simple' ? (
            <mesh>
              <SimpleGeometry type={shape.type} />
              <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
            </mesh>
          ) : (
            <CompoundDesign type={shape.type} color={color} opacity={opacity} />
          )}
        </group>
      </Float>
    </group>
  );
}

export function FloatingGeometries({ count, color, isDark }: FloatingGeometriesProps) {
  // Take `count` simple shapes + `count` compound shapes
  const simples = SIMPLE_SHAPES.slice(0, count);
  const compounds = COMPOUND_SHAPES.slice(0, count);

  return (
    <group>
      {simples.map((shape, i) => (
        <RotatingFloat key={`s-${i}`} shape={shape} color={color} isDark={isDark} index={i} />
      ))}
      {compounds.map((shape, i) => (
        <RotatingFloat key={`c-${i}`} shape={shape} color={color} isDark={isDark} index={i + count} />
      ))}
    </group>
  );
}
