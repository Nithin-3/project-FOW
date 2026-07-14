import type { Polygon } from "./types";
import * as pc from "polygon-clipping";
import earcut from "earcut";

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

export function triangulate(outer: Polygon, holes: Polygon[] = []): Polygon[] {
	let freeSpace: pc.MultiPolygon = [[toRing(outer)]];
	const merged = unionHoles(holes);
	for (const poly of merged)
		freeSpace = pc.difference(freeSpace, [poly]);

	const triangles: Polygon[] = [];
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
		for (let i = 0; i < indices.length; i += 3) {
			triangles.push([indices[i], indices[i + 1], indices[i + 2]].map(idx => ({
				x: coords[idx * 2],
				y: coords[idx * 2 + 1],
			})));
		}
	}

	return triangles;
}
