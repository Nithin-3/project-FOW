import type { Vector2D } from "./types";

export function distSq(a: Vector2D, b: Vector2D): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

export function vectorLength(v: Vector2D): number {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
	return { x: a.x + b.x, y: a.y + b.y };
}

export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
	return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVector(v: Vector2D, s: number): Vector2D {
	return { x: v.x * s, y: v.y * s };
}

export function normalizeVector(v: Vector2D): Vector2D {
	const len = vectorLength(v);
	return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
}

export function vectorLerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function crossProduct(a: Vector2D, b: Vector2D): number {
	return a.x * b.y - a.y * b.x;
}

export function multiplyVector(v: Vector2D, s: number): Vector2D {
	return { x: v.x * s, y: v.y * s };
}

export function cross(o: Vector2D, a: Vector2D, b: Vector2D): number {
	return (a.x - o.x) * (b.y - o.y)
		- (a.y - o.y) * (b.x - o.x);
}

export function key(v: Vector2D): string {
	return `${v.x},${v.y}`;
}
