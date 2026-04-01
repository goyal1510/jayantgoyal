'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';

interface FloatingDoodlesProps {
  count: number;
  color: string;
  isDark: boolean;
}

// --- Helper: slight hand-drawn wobble ---

function w(x: number, y: number, amt = 0.03): THREE.Vector3 {
  return new THREE.Vector3(
    x + (Math.random() - 0.5) * amt,
    y + (Math.random() - 0.5) * amt,
    0,
  );
}

function arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, steps = 20): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    pts.push(w(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.02));
  }
  return pts;
}

function circle(cx: number, cy: number, r: number, steps = 24): THREE.Vector3[] {
  return arc(cx, cy, r, 0, Math.PI * 2, steps);
}

// --- Cartoon doodle generators (each returns multiple strokes) ---

function makeSmileyFace(): THREE.Vector3[][] {
  return [
    circle(0, 0, 0.8),                                  // face outline
    circle(-0.3, 0.2, 0.1, 8),                          // left eye
    circle(0.3, 0.2, 0.1, 8),                           // right eye
    arc(0, -0.05, 0.45, Math.PI * 0.2, Math.PI * 0.8),  // smile
  ];
}

function makeCloud(): THREE.Vector3[][] {
  // Fluffy cloud from overlapping bumps
  const outline: THREE.Vector3[] = [];
  const bumps = [
    { cx: -0.5, cy: 0, r: 0.4 },
    { cx: -0.15, cy: 0.3, r: 0.45 },
    { cx: 0.3, cy: 0.25, r: 0.4 },
    { cx: 0.55, cy: -0.05, r: 0.35 },
    { cx: 0.2, cy: -0.3, r: 0.3 },
    { cx: -0.3, cy: -0.25, r: 0.35 },
  ];
  for (const bump of bumps) {
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      outline.push(w(bump.cx + Math.cos(a) * bump.r, bump.cy + Math.sin(a) * bump.r, 0.04));
    }
  }
  return [outline];
}

function makeRocket(): THREE.Vector3[][] {
  // Body
  const body = [
    w(-0.2, -0.8), w(-0.25, 0), w(-0.15, 0.5), w(0, 0.9),
    w(0.15, 0.5), w(0.25, 0), w(0.2, -0.8), w(-0.2, -0.8),
  ];
  // Left fin
  const finL = [w(-0.25, -0.4), w(-0.55, -0.9), w(-0.2, -0.7)];
  // Right fin
  const finR = [w(0.25, -0.4), w(0.55, -0.9), w(0.2, -0.7)];
  // Window
  const win = circle(0, 0.15, 0.12, 10);
  // Flame
  const flame = [
    w(-0.15, -0.8), w(-0.1, -1.05), w(0, -0.9), w(0.1, -1.1), w(0.15, -0.8),
  ];
  return [body, finL, finR, win, flame];
}

function makePaperPlane(): THREE.Vector3[][] {
  const outline = [
    w(0.9, 0), w(-0.7, 0.5), w(-0.3, 0), w(-0.7, -0.5), w(0.9, 0),
  ];
  const fold = [w(-0.3, 0), w(0.9, 0)];
  const wing = [w(-0.3, 0), w(-0.1, 0.3)];
  return [outline, fold, wing];
}

function makeSun(): THREE.Vector3[][] {
  const strokes: THREE.Vector3[][] = [circle(0, 0, 0.4, 16)];
  // 8 rays
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    strokes.push([
      w(Math.cos(a) * 0.5, Math.sin(a) * 0.5),
      w(Math.cos(a) * 0.85, Math.sin(a) * 0.85),
    ]);
  }
  return strokes;
}

function makeLightbulb(): THREE.Vector3[][] {
  // Bulb top
  const bulb = arc(0, 0.2, 0.5, -Math.PI * 0.2, Math.PI * 1.2, 16);
  // Narrow at bottom
  const neck = [
    w(-0.2, -0.2), w(-0.2, -0.45), w(0.2, -0.45), w(0.2, -0.2),
  ];
  // Screw lines
  const screw1 = [w(-0.18, -0.3), w(0.18, -0.3)];
  const screw2 = [w(-0.16, -0.38), w(0.16, -0.38)];
  // Filament
  const filament = [w(-0.1, 0), w(0, 0.15), w(0.1, 0)];
  return [bulb, neck, screw1, screw2, filament];
}

function makeCrown(): THREE.Vector3[][] {
  const outline = [
    w(-0.7, -0.3), w(-0.7, 0.15), w(-0.4, -0.05), w(-0.15, 0.35),
    w(0, 0), w(0.15, 0.35), w(0.4, -0.05), w(0.7, 0.15), w(0.7, -0.3),
    w(-0.7, -0.3),
  ];
  // Jewels
  const j1 = circle(-0.15, 0.2, 0.05, 6);
  const j2 = circle(0.15, 0.2, 0.05, 6);
  const j3 = circle(0, -0.1, 0.05, 6);
  return [outline, j1, j2, j3];
}

function makeMusicNote(): THREE.Vector3[][] {
  // Note head
  const head = circle(-0.15, -0.6, 0.2, 12);
  // Stem
  const stem = [w(0.05, -0.6), w(0.05, 0.6)];
  // Flag
  const flag: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    flag.push(w(0.05 + t * 0.4, 0.6 - t * 0.5 + Math.sin(t * Math.PI) * 0.15, 0.02));
  }
  return [head, stem, flag];
}

function makePlanet(): THREE.Vector3[][] {
  // Planet body
  const body = circle(0, 0, 0.5, 20);
  // Ring (ellipse tilted)
  const ring: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ring.push(w(Math.cos(a) * 0.9, Math.sin(a) * 0.25, 0.02));
  }
  // Surface line
  const surface = arc(0, 0, 0.35, 0.3, 1.8, 8);
  return [body, ring, surface];
}

function makeSpeechBubble(): THREE.Vector3[][] {
  // Rounded rectangle-ish bubble
  const bubble: THREE.Vector3[] = [
    ...arc(0.45, 0.25, 0.2, -Math.PI * 0.5, 0, 4),
    ...arc(0.45, -0.15, 0.2, 0, Math.PI * 0.5, 4),
    // Tail
    w(0.15, -0.35), w(-0.1, -0.65), w(-0.05, -0.35),
    ...arc(-0.45, -0.15, 0.2, Math.PI * 0.5, Math.PI, 4),
    ...arc(-0.45, 0.25, 0.2, Math.PI, Math.PI * 1.5, 4),
    w(0.45, 0.45),
  ];
  // Dots inside (like typing)
  const d1 = circle(-0.2, 0.05, 0.05, 6);
  const d2 = circle(0, 0.05, 0.05, 6);
  const d3 = circle(0.2, 0.05, 0.05, 6);
  return [bubble, d1, d2, d3];
}

function makeStarCartoon(): THREE.Vector3[][] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 0.9 : 0.38;
    points.push(w(Math.cos(angle) * r, Math.sin(angle) * r));
  }
  points.push(points[0]!.clone());
  // Sparkle lines
  const s1 = [w(0, 1.05), w(0, 1.2)];
  const s2 = [w(-0.5, 0.8), w(-0.6, 0.95)];
  const s3 = [w(0.5, 0.8), w(0.6, 0.95)];
  return [points, s1, s2, s3];
}

function makeHeart(): THREE.Vector3[][] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = (i / 32) * Math.PI * 2;
    const x = 0.7 * (16 * Math.pow(Math.sin(t), 3)) / 16;
    const y = 0.7 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
    pts.push(w(x, y, 0.02));
  }
  pts.push(pts[0]!.clone());
  return [pts];
}

const DOODLE_GENERATORS = [
  makeSmileyFace,
  makeCloud,
  makeRocket,
  makePaperPlane,
  makeSun,
  makeLightbulb,
  makeCrown,
  makeMusicNote,
  makePlanet,
  makeSpeechBubble,
  makeStarCartoon,
  makeHeart,
];

// --- Doodle config ---

interface DoodleConfig {
  position: Vector3Tuple;
  scale: number;
  rotationSpeed: Vector3Tuple;
  doodleIndex: number;
  driftFreq: Vector3Tuple;
  driftAmp: Vector3Tuple;
  driftPhase: Vector3Tuple;
}

// Golden angle for uniform spread
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function generateDoodleConfigs(count: number): DoodleConfig[] {
  const configs: DoodleConfig[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE;
    const r = 4 + (i / count) * 5;
    const phi = angle;
    configs.push({
      position: [
        Math.cos(angle) * r,
        Math.sin(angle) * r * 0.6,
        -3 + (i / count) * 14,
      ],
      scale: 1.2 + (i % 3) * 0.3,
      rotationSpeed: [
        0.08 + (i % 5) * 0.03,
        0.1 + (i % 4) * 0.025,
        0.04 + (i % 3) * 0.02,
      ],
      doodleIndex: i % DOODLE_GENERATORS.length,
      driftFreq: [
        0.06 + (i % 5) * 0.018,
        0.05 + (i % 4) * 0.016,
        0.035 + (i % 3) * 0.014,
      ],
      driftAmp: [
        4 + (i % 3) * 1.5,
        3 + (i % 4) * 1.2,
        2.5 + (i % 3) * 1.0,
      ],
      driftPhase: [
        phi,
        phi + Math.PI * 0.67,
        phi + Math.PI * 1.33,
      ],
    });
  }
  return configs;
}

// --- Single doodle component (multi-stroke) ---

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

// --- Main export ---

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
