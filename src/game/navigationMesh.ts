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

function unionHoles(holes: Polygon[]): Polygon[] {
	if (holes.length === 0) return [];
	let merged: pc.MultiPolygon = [[toRing(holes[0])]];
	for (let i = 1; i < holes.length; i++)
		merged = pc.union(merged, [[toRing(holes[i])]]);
	return merged.map((polyRings: pc.Polygon) => ringToPolygon(polyRings[0]));
}

function clipHolesToOuter(outer: Polygon, holes: Polygon[]): Polygon[] {
	const result: Polygon[] = [];
	for (const hole of holes) {
		const clipped = pc.intersection([toRing(outer)], [toRing(hole)]);
		for (const polyRings of clipped) result.push(ringToPolygon(polyRings[0]));
	}
	return result;
}

export function triangulateWithHoles(outer: Polygon, holes: Polygon[]): Polygon[] {
	const cleanedHoles = clipHolesToOuter(outer, unionHoles(holes));

	const coords: number[] = [];
	const holeIndices: number[] = [];

	for (const p of outer) coords.push(p.x, p.y);

	for (const hole of cleanedHoles) {
		holeIndices.push(coords.length / 2);
		for (const p of hole) coords.push(p.x, p.y);
	}

	const indices = earcut(coords, holeIndices);

	const triangles: Polygon[] = [];
	for (let i = 0; i < indices.length; i += 3) {
		const tri: Polygon = [indices[i], indices[i + 1], indices[i + 2]].map(idx => ({
			x: coords[idx * 2],
			y: coords[idx * 2 + 1],
		}));
		triangles.push(tri);
	}

	return triangles;
}

