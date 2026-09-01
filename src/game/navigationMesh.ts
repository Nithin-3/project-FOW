import type { Polygon, Vector2D } from "./types";
import * as pc from "polygon-clipping";
import { removeHoles, convexPartition } from "poly-partition";
import { tri } from "./classes/triangle";
import { Quad } from "./classes/QuadTree";

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

class EdgeEnt {
	readonly edge: [Vector2D, Vector2D];
	private _box: { v1: Vector2D; v2: Vector2D };
	constructor(a: Vector2D, b: Vector2D) {
		this.edge = [a, b];
		this._box = {
			v1: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
			v2: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) },
		};
	}
	boundingBox() { return this._box; }
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
	const allEdges: EdgeEnt[] = [];
	const min = { x: Infinity, y: Infinity };
	const max = { x: -Infinity, y: -Infinity };
	const addRing = (ring: Polygon) => {
		for (let i = 0; i < ring.length; i++) {
			const a = ring[i], b = ring[(i + 1) % ring.length];
			const id = edgeId(a, b);
			if (seen.has(id) || doorSet.has(id)) continue;
			seen.add(id);
			const e = new EdgeEnt(a, b);
			const box = e.boundingBox();
			if (box.v1.x < min.x) min.x = box.v1.x;
			if (box.v1.y < min.y) min.y = box.v1.y;
			if (box.v2.x > max.x) max.x = box.v2.x;
			if (box.v2.y > max.y) max.y = box.v2.y;
			allEdges.push(e);
		}
	};

	addRing(outer);
	for (const hole of holes) addRing(hole);

	if (min.x === Infinity || min.y === Infinity) {
		min.x = Math.min(outer[0].x, 0); min.y = Math.min(outer[0].y, 0);
		max.x = Math.max(outer[0].x, 1); max.y = Math.max(outer[0].y, 1);
	}

	const edgeQuad = new Quad<EdgeEnt>(
		{ v1: { ...min }, v2: { ...max } },
		16,
	);
	for (const e of allEdges) edgeQuad.insert(e);

	const bucketQuad = new Quad<tri>({ v1: { ...min }, v2: { ...max } }, 16);
	const raw: tri[] = [];

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
			let px1 = Infinity, py1 = Infinity, px2 = -Infinity, py2 = -Infinity;
			for (const p of polygon) {
				if (p.x < px1) px1 = p.x;
				if (p.y < py1) py1 = p.y;
				if (p.x > px2) px2 = p.x;
				if (p.y > py2) py2 = p.y;
			}
			const candidates: [Vector2D, Vector2D][] = [];
			for (const e of edgeQuad.getBB({ v1: { x: px1, y: py1 }, v2: { x: px2, y: py2 } }))
				candidates.push(e.edge);
			const TRI = new tri(polygon, candidates);
			for (const t of bucketQuad.getBB(TRI.boundingBox()))
				TRI.insert(t);
			bucketQuad.insert(TRI);
			raw.push(TRI);
		}
	}

	for (const t of raw) triQuad.insert(t);
	return raw;
}
