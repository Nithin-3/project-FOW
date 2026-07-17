import type { Vector2D } from "../types";
import { distSq, cross } from "../utils";
import { Entity } from "./Entity";

type Neighbor = {
	dist: number;
	neig: tri;
}

export class tri extends Entity {
	readonly vertex: [Vector2D, Vector2D, Vector2D];
	readonly center: Vector2D;
	neighbors: Neighbor[] = [];

	weight: number = 1;
	FROM: tri | null = null;
	COST: number = Infinity;
	DIST: number = Infinity;
	PRIORITY: number = Infinity;
	timeStamp: number = 0;

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

	private sharesEdge(n: tri, eps = 1e-6): boolean {
		let count = 0;
		for (const a of this.vertex)
			for (const b of n.vertex)
				if (Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps) count++;
		return count === 2;
	}

	insert(n: tri, check = true): boolean {
		if (this === n || this.neighbors.some(ne => ne.neig === n)) return true;
		if (check && !this.sharesEdge(n)) return false;

		const dist = distSq(this.center, n.center)
		this.neighbors.push({ dist, neig: n });
		n.neighbors.push({ dist, neig: this });
		return true;
	}

	hasEdge(v1: Vector2D, v2: Vector2D, eps = 1e-6): boolean {
		for (let i = 0; i < 3; i++) {
			const a = this.vertex[i];
			const b = this.vertex[(i + 1) % 3];
			if (Math.abs(cross(a, b, v1)) > eps || Math.abs(cross(a, b, v2)) > eps) continue;
			const overlapX = Math.max(Math.min(a.x, b.x), Math.min(v1.x, v2.x)) <= Math.min(Math.max(a.x, b.x), Math.max(v1.x, v2.x)) + eps;
			const overlapY = Math.max(Math.min(a.y, b.y), Math.min(v1.y, v2.y)) <= Math.min(Math.max(a.y, b.y), Math.max(v1.y, v2.y)) + eps;
			if (overlapX && overlapY) return true;
		}
		return false;
	}
}
