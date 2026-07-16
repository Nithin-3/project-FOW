import type { Polygon } from "./types";
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
		const edgeMap = new Map<string, tri>();
		for (let i = 0; i < indices.length; i += 3) {
			const idxs = [indices[i], indices[i + 1], indices[i + 2]];
			const verts = idxs.map(idx => ({ x: coords[idx * 2], y: coords[idx * 2 + 1] }));
			const TRI = new tri(verts[0], verts[1], verts[2]);

			for (let e = 0; e < 3; e++) {
				const a = verts[e];
				const b = verts[(e + 1) % 3];
				const key = a.x < b.x || (a.x === b.x && a.y < b.y)
					? `${a.x},${a.y}-${b.x},${b.y}`
					: `${b.x},${b.y}-${a.x},${a.y}`;
				const existing = edgeMap.get(key);
				if (existing) TRI.insert(existing, false);
				edgeMap.set(key, TRI);
			}

			triangles.push(TRI);
			triQuad.insert(TRI);
		}
	}

	return triangles;
}
