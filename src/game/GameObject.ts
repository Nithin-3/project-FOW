import type { Vector2D, Polygon, Color } from "./types";
import { Entity } from "./Entity";
import { cross } from "./utils";

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
export type GameObjectData = {
	zIndex: number;
	points: Polygon;
	color: Color;
	collision: boolean;
	texture: HTMLCanvasElement;
	door?: Polygon;
	boundingBox: {
		v1: Vector2D;
		v2: Vector2D;
	};
};
export class GameObject extends Entity {
	zIndex: number;
	readonly points: Polygon;
	color: Color;
	collision: boolean;
	texture: HTMLCanvasElement;
	door?: Polygon;
	constructor(zIndex: number, points: Polygon, color: Color, doors?: Vector2D[]) {
		super()
		this._boundingBox = { v1: { x: Infinity, y: Infinity }, v2: { x: -Infinity, y: -Infinity } };
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
			this.door = doors
			this.collision = true
		} else {
			this.collision = false
		}
		for (const p of points) {
			if (p.x < this._boundingBox.v1.x) this._boundingBox.v1.x = p.x;
			if (p.y < this._boundingBox.v1.y) this._boundingBox.v1.y = p.y;
			if (p.x > this._boundingBox.v2.x) this._boundingBox.v2.x = p.x;
			if (p.y > this._boundingBox.v2.y) this._boundingBox.v2.y = p.y;
		}

		const width = Math.ceil(this._boundingBox.v2.x - this._boundingBox.v1.x);
		const height = Math.ceil(this._boundingBox.v2.y - this._boundingBox.v1.y);
		this.texture = document.createElement("canvas");
		this.texture.width = width;
		this.texture.height = height;
		const ctx = this.texture.getContext("2d")!;

		ctx.beginPath();
		ctx.moveTo(points[0].x - this._boundingBox.v1.x, points[0].y - this._boundingBox.v1.y);

		for (let i = 1; i < points.length; i++)
			ctx.lineTo(points[i].x - this._boundingBox.v1.x, points[i].y - this._boundingBox.v1.y);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();


	}

	localPoints(origin: Vector2D) {
		return this.points.map(p => ({
			x: origin.x + (p.x - this._boundingBox.v1.x),
			y: origin.y + (p.y - this._boundingBox.v1.y)
		}));
	}

	render(ctx: CanvasRenderingContext2D, origin: Vector2D): Polygon {
		ctx.drawImage(this.texture, origin.x, origin.y);
		return this.localPoints(origin);
	}

	convexHull(): Polygon {
		if (this.points.length <= 3)
			return [...this.points];

		const pts = [...this.points].sort((a, b) =>
			a.x === b.x ? a.y - b.y : a.x - b.x
		);

		const lower: Polygon = [];
		for (const p of pts) {
			while (
				lower.length >= 2 &&
				cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
			) {
				lower.pop();
			}
			lower.push(p);
		}

		const upper: Polygon = [];
		for (let i = pts.length - 1; i >= 0; i--) {
			const p = pts[i];
			while (
				upper.length >= 2 &&
				cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
			) {
				upper.pop();
			}
			upper.push(p);
		}

		lower.pop();
		upper.pop();

		return lower.concat(upper);
	}

	object(): GameObjectData {
		return {
			zIndex: this.zIndex,
			color: this.color,
			collision: this.collision,
			points: this.points.map(p => ({ ...p })),
			texture: this.texture,
			door: this.door?.map(p => ({ ...p })),
			boundingBox: {
				v1: { ...this._boundingBox.v1 },
				v2: { ...this._boundingBox.v2 }
			}
		};
	}
}
