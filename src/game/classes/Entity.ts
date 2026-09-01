import { Uid } from "../uid";
import type { Polygon, Vector2D } from "../types";

export abstract class Entity {
	readonly id: number;
	protected _boundingBox: { v1: Vector2D; v2: Vector2D } = { v1: { x: Infinity, y: Infinity }, v2: { x: -Infinity, y: -Infinity } };

	constructor() {
		this.id = Uid.next().value!;
	}

	boundingBox(): { v1: Vector2D; v2: Vector2D } {
		return this._boundingBox;
	}

	static isRender(a: { v1: Vector2D; v2: Vector2D }, b: { v1: Vector2D; v2: Vector2D }): boolean {
		if (a.v1.x < b.v1.x && a.v2.x < b.v1.x) return false;
		if (a.v1.x > b.v2.x && a.v2.x > b.v2.x) return false;
		if (a.v1.y < b.v1.y && a.v2.y < b.v1.y) return false;
		if (a.v1.y > b.v2.y && a.v2.y > b.v2.y) return false;
		return true;
	}
	static rotate(polygon: Polygon, Rad: number) {
		const s = Math.sin(Rad);
		const c = Math.cos(Rad);
		return polygon.map(p => {
			return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }

		})
	}

	static localPoints(points: Polygon, box: { v1: Vector2D, v2: Vector2D }, origin: Vector2D, end: Vector2D, Rad: number) {

		const scaleX = (end.x - origin.x) / (box.v2.x - box.v1.x);
		const scaleY = (end.y - origin.y) / (box.v2.y - box.v1.y);

		return Entity.rotate(points.map(p => ({
			x: origin.x + (p.x - box.v1.x) * scaleX,
			y: origin.y + (p.y - box.v1.y) * scaleY,
		})), Rad);
	}
}
