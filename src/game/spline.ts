import type { Vector2D } from "./types";
import { subtractVectors, vectorLength } from "./utils";

const TENSION = 0.5;
const SEGMENTS_PER_SPAN = 8;

export function catmullRom(points: Vector2D[], tension = TENSION): Vector2D[] {
	if (points.length < 2) return points.slice();
	if (points.length === 2) return points.slice();

	const result: Vector2D[] = [points[0]];

	let p0 = {
		x: points[0].x - (points[1].x - points[0].x),
		y: points[0].y - (points[1].y - points[0].y)
	};

	for (let i = 0; i < points.length - 1; i++) {
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = (i + 2 < points.length) ? points[i + 2] : {
			x: p2.x + (p2.x - p1.x),
			y: p2.y + (p1.y - p2.y)
		};

		for (let s = 1; s <= SEGMENTS_PER_SPAN; s++) {
			const t = s / SEGMENTS_PER_SPAN;
			const t2 = t * t;
			const t3 = t2 * t;

			// Catmull-Rom basis
			const q1 = -0.5 * t3 + t2 - 0.5 * t;
			const q2 = 1.5 * t3 - 2.5 * t2 + 1;
			const q3 = -1.5 * t3 + 2 * t2 + 0.5 * t;
			const q4 = 0.5 * t3 - 0.5 * t2;

			// Apply tension
			const w1 = q1 * tension;
			const w2 = q2 * tension + (1 - tension);
			const w3 = q3 * tension + (1 - tension);
			const w4 = q4 * tension;

			const x = w1 * p0.x + w2 * p1.x + w3 * p2.x + w4 * p3.x;
			const y = w1 * p0.y + w2 * p1.y + w3 * p2.y + w4 * p3.y;

			result.push({ x, y });
		}

		p0 = p1;
	}

	// Ensure the last point is included
	if (result.length > 0) {
		const last = points[points.length - 1];
		const diff = vectorLength(subtractVectors(result[result.length - 1], last));
		if (diff > 1e-6) {
			result.push(last);
		}
	}

	return result;
}

export function roundCorners(points: Vector2D[]): Vector2D[] {
	return catmullRom(points);
}