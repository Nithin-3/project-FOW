import type { Polygon, Vector2D } from "./types";
import * as pc from "polygon-clipping";
import earcut from "earcut";
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

export function triangulate(outer: Polygon, triQuad: Quad<tri>, holes: Polygon[] = []): tri[] {
	let freeSpace: pc.MultiPolygon = [[toRing(outer)]];
	const merged = unionHoles(holes);
	for (const poly of merged)
		freeSpace = pc.difference(freeSpace, [poly]);

	const triangles: tri[] = [];
	for (const polyRings of freeSpace) {
		const outerRing = ringToPolygon(polyRings[0]);
		const innerHoles = polyRings.slice(1).map(ringToPolygon);

		const coords: number[] = [];
		const holeIndices: number[] = [];

		for (const p of outerRing) coords.push(p.x, p.y);
		for (const hole of innerHoles) {
			holeIndices.push(coords.length / 2);
			for (const p of hole) coords.push(p.x, p.y);
		}

		const indices = earcut(coords, holeIndices.length ? holeIndices : undefined);
		const buckets = new Set<tri>();
		for (let i = 0; i < indices.length; i += 3) {
			const idxs = [indices[i], indices[i + 1], indices[i + 2]];
			const verts = idxs.map(idx => ({ x: coords[idx * 2], y: coords[idx * 2 + 1] }));
			const TRI = new tri(verts[0], verts[1], verts[2]);

			buckets.forEach(t=>TRI.insert(t))
			buckets.add(TRI)

			

			// for (let e = 0; e < 3; e++) {
			// 	const a = verts[e];
			// 	const b = verts[(e + 1) % 3];
			//
			// 	let dx = b.x - a.x;
			// 	let dy = b.y - a.y;
			// 	if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; }
			// 	const key = Math.round(dx / 100) * 1000000 + Math.round(dy / 100) * 1000 + Math.round((a.x + b.x) / 400) * 100 + Math.round((a.y + b.y) / 400);
			//
			// 	const bucket = edgeBuckets.get(key);
			// 	if (bucket) {
			// 		const eps = 1e-6;
			// 		for (const entry of bucket) {
			// 			let shared = 0;
			// 			for (const v1 of [entry.a, entry.b])
			// 				for (const v2 of [a, b])
			// 					if (Math.abs(v1.x - v2.x) <= eps && Math.abs(v1.y - v2.y) <= eps) shared++;
			// 			if (shared >= 2) TRI.insert(entry.tri, false);
			// 		}
			// 	} else {
			// 		edgeBuckets.set(key, []);
			// 	}
			// 	edgeBuckets.get(key)!.push({ a, b, tri: TRI });
			// }

			triangles.push(TRI);
			triQuad.insert(TRI);
		}
	}

	return triangles;
}
