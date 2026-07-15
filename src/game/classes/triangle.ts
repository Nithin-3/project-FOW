import type { Vector2D } from "../types";
import { Entity } from "./Entity";


export class tri extends Entity {
	readonly vertex: [Vector2D, Vector2D, Vector2D];
	readonly center: Vector2D;
	neighbor0: tri | null = null;
	neighbor1: tri | null = null;
	neighbor2: tri | null = null;

	constructor(v1: Vector2D, v2: Vector2D, v3: Vector2D) {
		super()
		this.vertex = [v1, v2, v3];
		this.center = {
			x: (v1.x + v2.x + v3.x) / 3,
			y: (v1.y + v2.y + v3.y) / 3,
		};
		for (const p of this.vertex) {
			if (p.x < this._boundingBox.v1.x) this._boundingBox.v1.x = p.x;
			if (p.y < this._boundingBox.v1.y) this._boundingBox.v1.y = p.y;
			if (p.x > this._boundingBox.v2.x) this._boundingBox.v2.x = p.x;
			if (p.y > this._boundingBox.v2.y) this._boundingBox.v2.y = p.y;
		}
	}

	private sharesEdge(n: tri): boolean {
		let count = 0;
		for (const a of this.vertex)
			for (const b of n.vertex)
				if (a.x === b.x && a.y === b.y) count++;
		return count === 2;
	}

	insert(n: tri): boolean | null | undefined {
		if (this === n || this.neighbor0 === n || this.neighbor1 === n || this.neighbor2 === n) return true;
		if (this.neighbor0 && this.neighbor1 && this.neighbor2) return undefined;
		if (!this.sharesEdge(n)) return false;

		if (!this.neighbor0) {
			this.neighbor0 = n;
			if (!n.neighbor0) { n.neighbor0 = this; return true; }
			if (!n.neighbor1) { n.neighbor1 = this; return true; }
			if (!n.neighbor2) { n.neighbor2 = this; return true; }
		}
		if (!this.neighbor1) {
			this.neighbor1 = n;
			if (!n.neighbor0) { n.neighbor0 = this; return true; }
			if (!n.neighbor1) { n.neighbor1 = this; return true; }
			if (!n.neighbor2) { n.neighbor2 = this; return true; }
		}
		if (!this.neighbor2) {
			this.neighbor2 = n;
			if (!n.neighbor0) { n.neighbor0 = this; return true; }
			if (!n.neighbor1) { n.neighbor1 = this; return true; }
			if (!n.neighbor2) { n.neighbor2 = this; return true; }
		}

		return null;
	}

	hasEdge(v1: Vector2D, v2: Vector2D): boolean {
		let foundV1 = false, foundV2 = false;
		for (const v of this.vertex) {
			if (v.x === v1.x && v.y === v1.y) foundV1 = true;
			if (v.x === v2.x && v.y === v2.y) foundV2 = true;
		}
		return foundV1 && foundV2;
	}
}
