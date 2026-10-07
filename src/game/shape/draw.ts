import { GameObject } from "../classes/GameObject";
import type { Color, Polygon, Vector2D } from "../types";

// ---------- seeded helpers ----------
const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);

// hashes any list of numbers (including decimals and large values) into one 32-bit seed
function hashNumbers(...nums: number[]): number {
	let h = 2166136261;
	for (const n of nums) {
		f64[0] = n + 0; // +0 turns -0 into 0
		for (let i = 0; i < 2; i++) {
			h = Math.imul(h ^ u32[i], 16777619);
			h ^= h >>> 15;
		}
	}
	// final avalanche so a tiny input change flips many bits
	h ^= h >>> 16;
	h = Math.imul(h, 2246822507);
	h ^= h >>> 13;
	h = Math.imul(h, 3266489909);
	h ^= h >>> 16;
	return h >>> 0;
}

// small fast seeded random generator (mulberry32): returns a function giving 0..1
function createRng(seed: number) {
	return () => {
		seed = (seed + 0x6D2B79F5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---------- polygon ----------
const MIN_DOOR_LENGTH = 60;

export function drawRandomPolygon( center: Vector2D, numPoints: number, maxRadius: number, zIndex: number, color?: Color) {
	const rand = createRng(hashNumbers(center.x, center.y, numPoints, maxRadius, zIndex));

	const angleStep = (Math.PI * 2) / numPoints;
	const pts: Polygon = [];

	for (let i = 0; i < numPoints; i++) {
		const angle = (i + (rand() - 0.5) * 0.6) * angleStep;
		const radius = maxRadius * (0.4 + rand() * 0.6);
		pts.push({
			x: center.x + radius * Math.cos(angle),
			y: center.y + radius * Math.sin(angle)
		});
	}

	const doorCount = Math.floor(rand() * Math.min(4, Math.floor(pts.length / 2)));
	const doors: Vector2D[] = [];
	if (doorCount > 0) {
		const valid: number[] = [];
		for (let i = 0; i < pts.length; i++) {
			const a = pts[i], b = pts[(i + 1) % pts.length];
			if (Math.hypot(b.x - a.x, b.y - a.y) > MIN_DOOR_LENGTH) valid.push(i);
		}
		const count = Math.min(doorCount, valid.length);
		const step = Math.max(1, Math.floor(valid.length / count));
		let vi = Math.floor(rand() * valid.length);
		for (let i = 0; i < count; i++) {
			const idx = valid[vi];
			doors.push(pts[idx], pts[(idx + 1) % pts.length]);
			vi = (vi + step) % valid.length;
		}
	}

	// color is also derived from the seed unless you pass one in
	const finalColor =
		color ?? (`#${Math.floor(rand() * 16777215).toString(16).padStart(6, '0')}` as Color);

	return new GameObject(zIndex, pts, finalColor, doors.length ? doors : undefined);
}
