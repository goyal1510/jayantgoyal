import type { Vector3Tuple } from 'three';
import { DOODLE_GENERATORS } from './doodle-generators';

export interface DoodleConfig {
  position: Vector3Tuple;
  scale: number;
  rotationSpeed: Vector3Tuple;
  doodleIndex: number;
  driftFreq: Vector3Tuple;
  driftAmp: Vector3Tuple;
  driftPhase: Vector3Tuple;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function generateDoodleConfigs(count: number): DoodleConfig[] {
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
