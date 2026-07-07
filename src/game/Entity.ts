import { Uid } from "./uid";
import type { Vector2D } from "./types";

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
}
