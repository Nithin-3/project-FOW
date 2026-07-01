// Game utility functions
import type { Vector2D } from './types.js';

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function distance(a: Vector2D, b: Vector2D): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function scaleVector(v:Vector2D, s:number) {
	return { x: v.x * s, y: v.y * s };
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function multiplyVector(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function normalizeVector(v: Vector2D): Vector2D {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  return length > 0 ? { x: v.x / length, y: v.y / length } : { x: 0, y: 0 };
}

export function vectorLength(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function dotProduct(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

export function crossProduct(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}

export function vectorLerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
