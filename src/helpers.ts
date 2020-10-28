import { IFrozenCanvasPoint } from './interfaces/point.interface';

export const FROZEN_OPTIONS_ICECAST_URL = 'FROZEN_ICECAST_URL';
export const FROZEN_AUDIO_CONTEXT = 'FROZEN_AUDIO_CONTEXT';

const { cos, sin, PI } = Math;

export function getPointOnCircle(center: IFrozenCanvasPoint, angle: number, distance: number): IFrozenCanvasPoint {
  return {
    x: center.x + distance * cos(angle * PI / 180),
    y: center.y + distance * sin(angle * PI / 180),
  };
}

export function average(values: number[]) {
  return values.reduce((t, v) => t + v, 0) / values.length;
}