import type { Vector2D, Polygon } from './types';
import { subtractVectors, crossProduct, vectorLength, multiplyVector, addVectors, } from './utils';

// Perpendicular distance from point P to infinite line AB
// formula: |(B-A) × (P-A)| / |B-A|
export function distancePointToLine(A: Vector2D, B: Vector2D, P: Vector2D): number {
	const AB = subtractVectors(B, A);
	const AP = subtractVectors(P, A);
	return Math.abs(crossProduct(AB, AP)) / vectorLength(AB);
}

// Intersection of two finite line segments (a-b and c-d), or null
// formula: a + t*(b-a) where t = ((c-a) × s) / (r × s), u = ((c-a) × r) / (r × s)
export function segmentIntersect(a: Vector2D, b: Vector2D, c: Vector2D, d: Vector2D): Vector2D | null {
	const r = subtractVectors(b, a);
	const s = subtractVectors(d, c);
	const denom = crossProduct(r, s);
	if (denom === 0) return null;
	const ca = subtractVectors(c, a);
	const t = crossProduct(ca, s) / denom;
	const u = crossProduct(ca, r) / denom;
	if (t < 0 || t > 1 || u < 0 || u > 1) return null;
	return addVectors(a, multiplyVector(r, t));
}

// Intersection of two infinite lines (a-b and c-d), or null
// formula: a + t*(b-a) where t = ((c-a) × s) / (r × s)
export function lineIntersec(a: Vector2D, b: Vector2D, c: Vector2D, d: Vector2D): Vector2D | null {
	const r = subtractVectors(b, a);
	const s = subtractVectors(d, c);
	const denom = crossProduct(r, s);
	if (denom === 0) return null;
	const ca = subtractVectors(c, a);
	const t = crossProduct(ca, s) / denom;
	return addVectors(a, multiplyVector(r, t));
}

// Intersection of infinite line A-B with segment C-D, or null
// formula: A + t*(B-A) where t = ((C-A) × s) / (r × s), u = ((C-A) × r) / (r × s)
export function lineSegmentIntersection(A: Vector2D, B: Vector2D, C: Vector2D, D: Vector2D): Vector2D | null {
	const r = subtractVectors(B, A);
	const s = subtractVectors(D, C);
	const denom = crossProduct(r, s);
	if (Math.abs(denom) < 1e-9) return null;
	const CA = subtractVectors(C, A);
	const t = crossProduct(CA, s) / denom;
	const u = crossProduct(CA, r) / denom;
	if (u < 0 || u > 1) return null;
	return addVectors(A, multiplyVector(r, t));
}

// All intersection points of a ray (x1,y1→x2,y2) with a polygon, sorted by distance
export function lineIntersectPolygon(p1: Vector2D, p2: Vector2D, polygon: Polygon): (Vector2D & { A: Vector2D; B: Vector2D })[] {
	const pts: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const hit = segmentIntersect(p1, p2, polygon[j], polygon[i]);
		if (hit) pts.push({ x: hit.x, y: hit.y, A: polygon[j], B: polygon[i] });
	}
	const unique: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	for (const p of pts) {
		if (!unique.some(u => Math.abs(u.x - p.x) < 0.001 && Math.abs(u.y - p.y) < 0.001)) {
			unique.push(p);
		}
	}
	return unique;
}

// Point-in-polygon test using ray casting algorithm
// formula: count edge crossings; odd = inside, even = outside
export function pointInPolygon(v: Vector2D, polygon: Polygon): boolean {
	const px = v.x;
	const py = v.y;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x, yi = polygon[i].y;
		const xj = polygon[j].x, yj = polygon[j].y;
		if ((yi > py) !== (yj > py) &&
			px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

// All intersection points between a circle and a polygon's edges
// formula: solve |A + t*(B-A) - C|² = r² for t ∈ [0,1]
export function circlePolygonIntersect(o: Vector2D, r: number, polygon: Polygon): (Vector2D & { A: Vector2D; B: Vector2D })[] {
	const pts: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const A = polygon[j], B = polygon[i];
		const dx = B.x - A.x, dy = B.y - A.y;
		const ex = o.x - A.x, ey = o.y - A.y;
		const a = dx * dx + dy * dy;
		const b = dx * ex + dy * ey;
		const c = ex * ex + ey * ey - r * r;
		const disc = b * b - a * c;
		if (disc < 0) continue;
		const sqrtDisc = Math.sqrt(disc);
		const t1 = (b - sqrtDisc) / a;
		const t2 = (b + sqrtDisc) / a;
		if (t1 >= 0 && t1 <= 1) {
			pts.push({ x: A.x + t1 * dx, y: A.y + t1 * dy, A, B });
		}
		if (t2 >= 0 && t2 <= 1 && disc > 0) {
			pts.push({ x: A.x + t2 * dx, y: A.y + t2 * dy, A, B });
		}
	}
	const unique: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	for (const p of pts) {
		if (!unique.some(u => Math.abs(u.x - p.x) < 0.001 && Math.abs(u.y - p.y) < 0.001)) {
			unique.push(p);
		}
	}
	return unique;
}


// Compute forward and backward paths along a polygon from start to end index
export function polygonPath(points: Polygon, start: number, end: number): { forward: Polygon; backward: Polygon } {
	const n = points.length;

	const forward: Polygon = [];
	let i = start;
	while (true) {
		forward.push(points[i]);
		if (i === end) break;
		i = (i + 1) % n;
	}

	const backward: Polygon = [];
	i = start;
	while (true) {
		backward.push(points[i]);
		if (i === end) break;
		i = (i - 1 + n) % n;
	}

	return { forward, backward };
}

// Centroid of a polygon (center of mass of uniform density)
// formula: Cx = (1/(6A)) * Σ (xi + xi+1) * cross(xi, xi+1), Cy = (1/(6A)) * Σ (yi + yi+1) * cross(xi, xi+1)
export function polygonCenter(points: Polygon): Vector2D | null {
	const n = points.length;
	if (n === 0) return null;

	let area = 0;
	let cx = 0;
	let cy = 0;

	for (let i = 0, j = n - 1; i < n; j = i++) {
		const cross = points[j].x * points[i].y - points[i].x * points[j].y;
		area += cross;
		cx += (points[j].x + points[i].x) * cross;
		cy += (points[j].y + points[i].y) * cross;
	}

	area /= 2;

	if (Math.abs(area) < 1e-10) {
		return {
			x: points.reduce((s, p) => s + p.x, 0) / n,
			y: points.reduce((s, p) => s + p.y, 0) / n,
		};
	}

	const factor = 6 * area;
	return { x: cx / factor, y: cy / factor };
}
