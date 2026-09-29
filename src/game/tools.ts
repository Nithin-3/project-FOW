import type { Vector2D, Polygon } from './types';
import { subtractVectors, crossProduct, vectorLength, multiplyVector, addVectors, cross, } from './utils';

// Walk `distance` from A along the line towards B.
export function moveAlongLine(A: Vector2D, B: Vector2D, distance: number): Vector2D {
	const dx = B.x - A.x;
	const dy = B.y - A.y;
	const len = Math.sqrt(dx * dx + dy * dy);
	if (len === 0) return { x: A.x, y: A.y }; // A and B are the same point
	return {
		x: A.x + (dx / len) * distance,
		y: A.y + (dy / len) * distance
	};
}

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

// Boolean segment intersection, allocation-free (no intermediate vectors)
export function segmentsIntersect(a: Vector2D, b: Vector2D, c: Vector2D, d: Vector2D): boolean {
	const rx = b.x - a.x, ry = b.y - a.y;
	const sx = d.x - c.x, sy = d.y - c.y;
	const denom = rx * sy - ry * sx;
	if (denom === 0) return false;
	const cax = c.x - a.x, cay = c.y - a.y;
	const t = (cax * sy - cay * sx) / denom;
	if (t < 0 || t > 1) return false;
	const u = (cax * ry - cay * rx) / denom;
	return u >= 0 && u <= 1;
}

// Does segment AB overlap an axis-aligned box? (allocation-free Liang–Barsky clip)
export function segmentOverlapsBox(a: Vector2D, b: Vector2D, box: { v1: Vector2D; v2: Vector2D }): boolean {
	if ((a.x < box.v1.x && b.x < box.v1.x) || (a.x > box.v2.x && b.x > box.v2.x)) return false;
	if ((a.y < box.v1.y && b.y < box.v1.y) || (a.y > box.v2.y && b.y > box.v2.y)) return false;

	const dx = b.x - a.x, dy = b.y - a.y;
	let tmin = 0, tmax = 1;

	// clip against -x
	let p = -dx, q = a.x - box.v1.x;
	if (p === 0) { if (q < 0) return false; }
	else {
		const t = q / p;
		if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
		else { if (t < tmin) return false; if (t < tmax) tmax = t; }
	}
	// clip against +x
	p = dx; q = box.v2.x - a.x;
	if (p === 0) { if (q < 0) return false; }
	else {
		const t = q / p;
		if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
		else { if (t < tmin) return false; if (t < tmax) tmax = t; }
	}
	// clip against -y
	p = -dy; q = a.y - box.v1.y;
	if (p === 0) { if (q < 0) return false; }
	else {
		const t = q / p;
		if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
		else { if (t < tmin) return false; if (t < tmax) tmax = t; }
	}
	// clip against +y
	p = dy; q = box.v2.y - a.y;
	if (p === 0) { if (q < 0) return false; }
	else {
		const t = q / p;
		if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
		else { if (t < tmin) return false; if (t < tmax) tmax = t; }
	}

	return tmin <= tmax;
}

// Boolean collision: does segment AB touch convex polygon (early-exit, no allocation)?
export function segmentHitsConvexHull(a: Vector2D, b: Vector2D, polygon: Polygon): boolean {
	if (pointInPolygon(a, polygon) || pointInPolygon(b, polygon)) return true;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		if (segmentsIntersect(a, b, polygon[j], polygon[i])) return true;
	}
	return false;
}

// Unit normal of segment a->b, oriented to point toward `center`.
// `center` must be a point known to sit in free space (e.g. the walkable
// triangle's centre), which makes the result independent of edge winding.
export function edgeNormal(a: Vector2D, b: Vector2D, center: Vector2D): Vector2D {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.sqrt(dx * dx + dy * dy);
	if (len === 0) return { x: 0, y: 0 };
	let nx = -dy / len;
	let ny = dx / len;
	if (nx * (center.x - a.x) + ny * (center.y - a.y) < 0) {
		nx = -nx;
		ny = -ny;
	}
	return { x: nx, y: ny };
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
export function segmentIntersectPolygon(p1: Vector2D, p2: Vector2D, polygon: Polygon): (Vector2D & { A: Vector2D; B: Vector2D })[] {
	const pts: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const hit = segmentIntersect(p1, p2, polygon[j], polygon[i]);
		if (hit) pts.push({ x: hit.x, y: hit.y, A: polygon[j], B: polygon[i] });
	}
	const unique: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	const dedupSet = new Set<string>();
	for (const p of pts) {
		const qk = `${Math.round(p.x * 1000)},${Math.round(p.y * 1000)}`;
		if (dedupSet.has(qk)) continue;
		dedupSet.add(qk);
		unique.push(p);
	}
	return unique;
}

export function linetIntersectPolygon(p1: Vector2D, p2: Vector2D, polygon: Polygon): (Vector2D & { A: Vector2D; B: Vector2D })[] {
	const pts: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const hit = lineIntersec(p1, p2, polygon[j], polygon[i]);
		if (hit) pts.push({ x: hit.x, y: hit.y, A: polygon[j], B: polygon[i] });
	}
	const unique: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	const dedupSet = new Set<string>();
	for (const p of pts) {
		const qk = `${Math.round(p.x * 1000)},${Math.round(p.y * 1000)}`;
		if (dedupSet.has(qk)) continue;
		dedupSet.add(qk);
		unique.push(p);
	}
	return unique;
}

export function pointOnSegment(p: Vector2D, a: Vector2D, b: Vector2D, eps = 1e-9): boolean {
	// Collinear?
	if (Math.abs(cross(a, b, p)) > eps) {
		return false;
	}

	return (
		p.x >= Math.min(a.x, b.x) - eps &&
		p.x <= Math.max(a.x, b.x) + eps &&
		p.y >= Math.min(a.y, b.y) - eps &&
		p.y <= Math.max(a.y, b.y) + eps
	);
}

// Point-in-polygon test using ray casting algorithm
// formula: count edge crossings; odd = inside, even = outside
export function pointInPolygon(v: Vector2D, polygon: Polygon): boolean {
	const px = v.x;
	const py = v.y;

	let inside = false;

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const a = polygon[j];
		const b = polygon[i];

		// Boundary is considered outside
		if (pointOnSegment(v, a, b))
			return false;

		if ((a.y > py) !== (b.y > py) && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x)
			inside = !inside;
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
		const EPS = 1e-9;
		if (t1 >= -EPS && t1 <= 1 + EPS) {
			const tc = Math.max(0, Math.min(1, t1));
			pts.push({ x: A.x + tc * dx, y: A.y + tc * dy, A, B });
		}
		if (t2 >= -EPS && t2 <= 1 + EPS && disc > 0) {
			const tc = Math.max(0, Math.min(1, t2));
			pts.push({ x: A.x + tc * dx, y: A.y + tc * dy, A, B });
		}
	}
	const unique: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
	const dedupSet = new Set<string>();
	for (const p of pts) {
		const qk = `${Math.round(p.x * 1000)},${Math.round(p.y * 1000)}`;
		if (dedupSet.has(qk)) continue;
		dedupSet.add(qk);
		unique.push(p);
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
