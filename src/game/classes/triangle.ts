import type { Vector2D } from "../types";
import { distSq, cross } from "../utils";
import { Entity } from "./Entity";

type Neighbor = {
	dist: number;
	neig: tri;
}

export class tri extends Entity {
	readonly vertex: Vector2D[];
	readonly center: Vector2D;
	neighbors: Neighbor[] = [];

	weight: number = 1;
	COST_F: number = Infinity;
	COST_B: number = Infinity;
	DIST_F: number = Infinity;
	DIST_B: number = Infinity;
	PRIORITY_F: number = Infinity;
	PRIORITY_B: number = Infinity;

	FROM_F: tri | null = null;
	timeStamp_F: number = 0;

	FROM_B: tri | null = null;
	timeStamp_B: number = 0;

	constructor(...vertices: Vector2D[]) {
		super()
		this.vertex = vertices;
		let cx = 0, cy = 0;
		for (const p of vertices) {
			cx += p.x;
			cy += p.y;
			if (p.x < this._boundingBox.v1.x) this._boundingBox.v1.x = p.x;
			if (p.y < this._boundingBox.v1.y) this._boundingBox.v1.y = p.y;
			if (p.x > this._boundingBox.v2.x) this._boundingBox.v2.x = p.x;
			if (p.y > this._boundingBox.v2.y) this._boundingBox.v2.y = p.y;
		}
		this.center = { x: cx / vertices.length, y: cy / vertices.length };
	}

	private sameEdge(a1: Vector2D, a2: Vector2D, b1: Vector2D, b2: Vector2D, eps: number): boolean {
		if (Math.abs(cross(a1, a2, b1)) > eps || Math.abs(cross(a1, a2, b2)) > eps)
			return false;

		const useX = Math.abs(a2.x - a1.x) >= Math.abs(a2.y - a1.y);
		const aMin = Math.min(useX ? a1.x : a1.y, useX ? a2.x : a2.y);
		const aMax = Math.max(useX ? a1.x : a1.y, useX ? a2.x : a2.y);
		const bMin = Math.min(useX ? b1.x : b1.y, useX ? b2.x : b2.y);
		const bMax = Math.max(useX ? b1.x : b1.y, useX ? b2.x : b2.y);

		return Math.min(aMax, bMax) - Math.max(aMin, bMin) > eps;
	}

	private sharesEdge(n: tri, eps = 1e-6): boolean {
		const nv = this.vertex.length;
		const mv = n.vertex.length;
		for (let i = 0; i < nv; i++) {
			const a1 = this.vertex[i];
			const a2 = this.vertex[(i + 1) % nv];
			for (let j = 0; j < mv; j++) {
				const b1 = n.vertex[j];
				const b2 = n.vertex[(j + 1) % mv];
				if (this.sameEdge(a1, a2, b1, b2, eps))
					return true;
			}
		}
		return false;
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
		const nv = this.vertex.length;
		for (let i = 0; i < nv; i++) {
			const a = this.vertex[i];
			const b = this.vertex[(i + 1) % nv];
			if (Math.abs(cross(a, b, v1)) > eps || Math.abs(cross(a, b, v2)) > eps) continue;
			const overlapX = Math.max(Math.min(a.x, b.x), Math.min(v1.x, v2.x)) <= Math.min(Math.max(a.x, b.x), Math.max(v1.x, v2.x)) + eps;
			const overlapY = Math.max(Math.min(a.y, b.y), Math.min(v1.y, v2.y)) <= Math.min(Math.max(a.y, b.y), Math.max(v1.y, v2.y)) + eps;
			if (overlapX && overlapY) return true;
		}
		return false;
	}
}
