import type { Polygon, Vector2D } from "./types";
import * as pc from "polygon-clipping";
import { removeHoles, convexPartition } from "poly-partition";
import { tri } from "./classes/triangle";
import type { Quad } from "./classes/QuadTree";

function toRing(poly: Polygon): [number, number][] {
	const ring = poly.map(p => [p.x, p.y] as [number, number]);
	ring.push(ring[0]);
	return ring;
}

function ringToPolygon(ring: [number, number][]): Polygon {
	return ring.slice(0, -1).map(([x, y]) => ({ x, y }));
}

function unionHoles(holes: Polygon[]): pc.Polygon[] {
	if (holes.length === 0) return [];
	let merged: pc.MultiPolygon = [[toRing(holes[0])]];
	for (let i = 1; i < holes.length; i++)
		merged = pc.union(merged, [[toRing(holes[i])]]);
	return merged;
}

function edgeId(a: Vector2D, b: Vector2D): string {
	const [p, q] = (a.x < b.x || (a.x === b.x && a.y <= b.y)) ? [a, b] : [b, a];
	return `${p.x},${p.y}|${q.x},${q.y}`;
}

export function triangulate(outer: Polygon, door: Vector2D[] | undefined, triQuad: Quad<tri>, holes: Polygon[] = []): tri[] {
	let freeSpace: pc.MultiPolygon = [[toRing(outer)]];
	const merged = unionHoles(holes);
	for (const poly of merged)
		freeSpace = pc.difference(freeSpace, [poly]);

	const doorSet = new Set<string>();
	if (door) for (let i = 0; i + 1 < door.length; i += 2)
		doorSet.add(edgeId(door[i], door[i + 1]));

	const seen = new Set<string>();
	const edges: [Vector2D, Vector2D][] = [];
	const addRing = (ring: Polygon) => {
		for (let i = 0; i < ring.length; i++) {
			const a = ring[i], b = ring[(i + 1) % ring.length];
			const id = edgeId(a, b);
			if (seen.has(id) || doorSet.has(id)) continue;
			seen.add(id);
			edges.push([a, b]);
		}
	};

	addRing(outer);
	for (const hole of holes) addRing(hole);

	const raw: tri[] = [];
	const buckets = new Set<tri>();

	for (const polyRings of freeSpace) {
		const outerRing = ringToPolygon(polyRings[0]);
		const innerHoles = polyRings.slice(1).map(ringToPolygon);

		let contour = outerRing.map(p => ({ x: p.x, y: p.y }));
		if (innerHoles.length > 0) {
			contour = removeHoles(contour, innerHoles.map(h => h.map(p => ({ x: p.x, y: p.y }))), true);
		}

		const convexes = convexPartition(contour, true);
		for (const polygon of convexes) {
			if (polygon.length < 3) continue;
			const TRI = new tri(polygon, edges);
			buckets.forEach(t => TRI.insert(t));
			buckets.add(TRI);
			raw.push(TRI);
		}
	}

	for (const t of raw) triQuad.insert(t);
	return raw;
}
