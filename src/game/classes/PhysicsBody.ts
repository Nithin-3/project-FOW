import { camera } from "../setup";
import type { Color, Polygon, Vector2D } from "../types";
import { addVectors, multiplyVector, subtractVectors } from "../utils";
import { GameObject } from "./GameObject";


export class PhysicsBody extends GameObject {
	private area: number;
	private mass: number;
	private COM: { x: number; y: number; };
	private inertia: number;
	private hull: Polygon;


	public get com(): Vector2D {
		return this.COM;
	}


	private _pos: Vector2D;
	public get position(): Vector2D {
		return this._pos;
	}

	private _rot: number;
	public get rotation(): number {
		return this._rot;
	}


	private linearVelocity: Vector2D = { x: 0, y: 0 };
	private angularVelocity: number = 0;

	private lossOverT = 0.3;


	private area_() {
		let sum = 0
		for (let i = 0; i < this.points.length; i++) {
			const v1 = this.points[i];
			const v2 = this.points[(i + 1) % this.points.length];
			sum += v1.x * v2.y - v1.y * v2.x;
		}
		return Math.abs(sum) * 0.5;
	}


	private centroid() {
		let cx = 0;
		let cy = 0;

		const n = this.points.length;

		for (let i = 0; i < n; i++) {
			const v1 = this.points[i];
			const v2 = this.points[(i + 1) % this.points.length];
			const cross = v1.x * v2.y - v1.y * v2.x;
			cx += (v1.x + v2.x) * cross;
			cy += (v1.y + v2.y) * cross;
		}
		return { x: cx / (6 * this.area), y: cy / (6 * this.area) };
	}

	private inertia_() {
		let I = 0;
		const massPerVertex = this.mass / this.points.length;
		for (const p of this.points) {
			const dx = p.x - this.COM.x;
			const dy = p.y - this.COM.y;

			I += massPerVertex * (dx * dx + dy * dy);
		}
		return I;
	}



	constructor(zIndex: number, points: Polygon, fill: Color | HTMLImageElement | ImageBitmap, position: Vector2D, rotation: number, density = 1) {
		super(zIndex, points, fill);
		this.area = this.area_()
		this.mass = this.area * density;
		this.COM = this.centroid();
		this.inertia = this.inertia_();

		this._pos = position;
		this._rot = rotation;

		this.hull = this.convexHull()
		this.hull
	}


	// Transform the hull to `pos` using the current rotation and refresh hullBox.
	// Reuses the worldHull points and the hullBox object, so no allocation here.
	// private buildWorldHull(pos: Vector2D) {
	// 	const s = Math.sin(this._rot), c = Math.cos(this._rot);
	// 	const local = this.localHull;
	// 	const n = local.length;
	//
	// 	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	// 	for (let i = 0; i < n; i++) {
	// 		const p = local[i];
	// 		const x = pos.x + p.x * c - p.y * s;
	// 		const y = pos.y + p.x * s + p.y * c;
	// 		this.hull[i].x = x;
	// 		this.hull[i].y = y;
	// 		if (x < minX) minX = x;
	// 		if (y < minY) minY = y;
	// 		if (x > maxX) maxX = x;
	// 		if (y > maxY) maxY = y;
	// 	}
	//
	// 	this.hullBox.v1.x = minX;
	// 	this.hullBox.v1.y = minY;
	// 	this.hullBox.v2.x = maxX;
	// 	this.hullBox.v2.y = maxY;
	// }

	// Fill this.normals with the outward normal of every static edge the
	// current world hull overlaps. Must be preceded by buildWorldHull.
	// private collectNormals() {
	// 	this.normals.length = 0;
	// 	const hullBox = this.hullBox;
	// 	const debugCollisions = import.meta.env.DEV ? camera.primary.debugCollisions : null;
	//
	// 	triQuad.forEachBB(hullBox, (convex) => {
	// 		for (const edge of convex.collitionEdge) {
	// 			if (!segmentOverlapsBox(edge[0], edge[1], hullBox)) continue;
	// 			if (!segmentHitsConvexHull(edge[0], edge[1], this.hull)) continue;
	//
	// 			// convex.center sits in the walkable triangle, so the normal
	// 			// oriented toward it always points out of the obstacle.
	// 			this.normals.push(edgeNormal(edge[0], edge[1], convex.center));
	//
	// 			if (debugCollisions && debugCollisions.length < DEBUG_COLLISION_CAP)
	// 				debugCollisions.push({ a: edge[0], b: edge[1], t: performance.now() });
	// 		}
	// 	});
	// }

	// Cancel the part of the body's motion that pushes into `normal` while
	// keeping the sliding part: this is the equal-and-opposite reaction force.
	// private applyNormalForce(normal: Vector2D) {
	// 	if (dot(this.linearVelocity, normal) >= 0) return; // already moving away
	// 	this.linearVelocity = cancelForceAlongDirection(this.linearVelocity, normal).remaining;
	// }

	// Move by the current velocity, sliding along anything it runs into.
	private move(delta: number) {
		let dx = this.linearVelocity.x * delta;
		let dy = this.linearVelocity.y * delta;
		if (dx === 0 && dy === 0) return;

		// Re-collect normals at each projected position so sliding against one
		// wall can't leave the body embedded in another; stop once a pass makes
		// no further correction.
		// for (let pass = 0; pass < 6; pass++) {
			// this.candidate.x = this._pos.x + dx;
			// this.candidate.y = this._pos.y + dy;
			// this.buildWorldHull(this.candidate);
			// this.collectNormals();
			// if (this.normals.length === 0) return;
			//
			// const beforeX = dx, beforeY = dy;
			// for (const n of this.normals) {
			// 	const mag = dx * n.x + dy * n.y;
			// 	if (mag < 0) {
			// 		dx -= n.x * mag;
			// 		dy -= n.y * mag;
			// 	}
			// 	this.applyNormalForce(n);
			// }
			// if (Math.abs(dx - beforeX) < 1e-9 && Math.abs(dy - beforeY) < 1e-9) return;
		// }

		this._pos = { x: this._pos.x + dx, y: this._pos.y + dy };
	}

	// Push the current state to the cameras. Called once per physics step
	// rather than once per mutated property.
	private commit() {
		for (const c in camera)
			camera[c].updateMovement(this)
	}


	public rotateToward(target: number, speed: number, delta: number) {
		let diff = target - this._rot;
		while (diff > Math.PI) diff -= 2 * Math.PI;
		while (diff < -Math.PI) diff += 2 * Math.PI;
		this._rot = this._rot + diff * (1 - Math.exp(-speed * delta / 300));
		this.commit();
	}

	applyForce(force: Vector2D, intractPoint: Vector2D, delta: number) {
		const a = { x: force.x / this.mass, y: force.y / this.mass }
		this.linearVelocity = addVectors(this.linearVelocity, multiplyVector(a, delta));
		const dist = subtractVectors(intractPoint, this.COM);
		const t = dist.x * force.y - dist.y * force.x;
		this.angularVelocity += (t / this.inertia) * delta;

		this.apply(delta);
	}


	private apply(delta: number) {
		this._rot += this.angularVelocity * delta;
		this.angularVelocity *= this.lossOverT;

		this.move(delta);
		this.linearVelocity = multiplyVector(this.linearVelocity, this.lossOverT);

		this.commit();
	}
}
