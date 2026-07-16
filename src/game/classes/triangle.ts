import type { Vector2D } from "../types";
import { distSq } from "../utils";
import { Entity } from "./Entity";

type Neighbor = {
	dist: number;
	neig: tri;
}

export class tri extends Entity {
	readonly vertex: [Vector2D, Vector2D, Vector2D];
	readonly center: Vector2D;
	neighbors: [Neighbor | null, Neighbor | null, Neighbor | null] = [null, null, null];

	FROM: tri | null = null;
	COST: number = Infinity;
	DIST: number = Infinity;
	PRIORITY: number = Infinity;

	clear() {
		this.FROM = null;
		this.COST = Infinity;
		this.DIST = Infinity;
		this.PRIORITY = Infinity;
	}

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

	insert(n: tri, check = true): boolean | null | undefined {
		if (this === n || this.neighbors.some(ne => ne?.neig === n)) return true;
		if (this.neighbors[0] && this.neighbors[1] && this.neighbors[2]) return undefined;
		if (check && !this.sharesEdge(n)) return false;

		const dist = distSq(this.center, n.center)

		for (let i = 0; i < this.neighbors.length; i++) {
			if (!this.neighbors[i]) {
				this.neighbors[i] = { dist, neig: n };
				for (let j = 0; j < n.neighbors.length; j++) {
					if (!n.neighbors[j]) {
						n.neighbors[j] = { dist, neig: this };
						return true;
					}
				}
				return true;
			}
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
