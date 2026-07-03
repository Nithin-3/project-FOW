import type { Vector2D, Polygon, Color } from "./types";

export function vectorEquals(a: Vector2D, b: Vector2D): boolean {
	return a.x === b.x && a.y === b.y;
}

export function areAdjacent(a: Vector2D, b: Vector2D, polygon: Polygon): boolean {
	const n = polygon.length;
	for (let i = 0; i < n; i++) {
		if (vectorEquals(polygon[i], a)) {
			const next = polygon[(i + 1) % n];
			const prev = polygon[(i - 1 + n) % n];
			return vectorEquals(next, b) || vectorEquals(prev, b);
		}
	}
	return false;
}

const hexColorRegex = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const rgbRegex = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
const hslRegex = /^hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;

function asColor(value: string): Color {
  if (!hexColorRegex.test(value) && !rgbRegex.test(value) && !hslRegex.test(value)) throw new Error("Invalid color");
  return value as Color;
}

export class GameObject {
	zIndex: number;
	points: Polygon;
	color: Color;
	wall: boolean;
	private _boundingBox: { v1: Vector2D; v2: Vector2D; } = { v1: { x: Infinity, y: Infinity }, v2: { x: -Infinity, y: -Infinity } };
	constructor(zIndex: number, points: Polygon, color: Color, doors?: Vector2D[]) {
		this.zIndex = zIndex;
		this.points = points;
		this.color = asColor(color);
		if (doors) {
			if (doors.length % 2 !== 0) throw new Error("Not a valid door(s)")
			for (let i = 0; i < doors.length; i += 2) {
				const a = doors[i];
				const b = doors[i + 1];
				if (!this.points.some(p => vectorEquals(p, a)) || !this.points.some(p => vectorEquals(p, b))) throw new Error("Door point not found in polygon")
				if (!areAdjacent(a, b, this.points)) throw new Error("Door points are not adjacent")
			}
			this.wall = true
		} else {
			this.wall = false
		}
		for (const p of points) {
			if (p.x < this._boundingBox.v1.x) this._boundingBox.v1.x = p.x;
			if (p.y < this._boundingBox.v1.y) this._boundingBox.v1.y = p.y;
			if (p.x > this._boundingBox.v2.x) this._boundingBox.v2.x = p.x;
			if (p.y > this._boundingBox.v2.y) this._boundingBox.v2.y = p.y;
		}
	}

	get boundingBox(): { v1: Vector2D; v2: Vector2D; } {
		return this._boundingBox;
	}
}
