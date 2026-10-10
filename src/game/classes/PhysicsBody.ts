import { triQuad } from "../init";
import { camera } from "../setup";
import { segmentHitsConvexHull, segmentOverlapsBox } from "../tools";
import type { Color, Polygon, Vector2D } from "../types";
import { addVectors, multiplyVector, subtractVectors } from "../utils";
import { GameObject } from "./GameObject";


export class PhysicsBody extends GameObject {
	private area: number;
	private mass: number;
	private COM: { x: number; y: number; };
	private inertia: number;
	private localHull: Polygon;
	private hull: Polygon;
	private hullBox: { v1: Vector2D, v2: Vector2D };

	#tok = Symbol(); // # -> private


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

		this.localHull = this.convexHull()
		// Deep copy: buildWorldHull() writes into hull[i], and convexHull()
		// returns refs into this.points — a shallow copy would corrupt both.
		this.hull = this.localHull.map(p => ({ x: p.x, y: p.y }));
		this.hullBox = this.boundingBox();
	}


	// Transform the hull to `pos` using the current rotation and refresh hullBox.
	// Reuses the worldHull points and the hullBox object, so no allocation here.
	private buildWorldHull(pos: Vector2D) {
		const s = Math.sin(this._rot), c = Math.cos(this._rot);
		const local = this.localHull;
		const n = local.length;

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (let i = 0; i < n; i++) {
			const p = local[i];
			const x = pos.x + p.x * c - p.y * s;
			const y = pos.y + p.x * s + p.y * c;
			this.hull[i].x = x;
			this.hull[i].y = y;
			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
		}

		this.hullBox.v1.x = minX;
		this.hullBox.v1.y = minY;
		this.hullBox.v2.x = maxX;
		this.hullBox.v2.y = maxY;
	}

	// Fill this.normals with the outward normal of every static edge the
	// current world hull overlaps. Must be preceded by buildWorldHull.
	// private collectNormals() {
	// 	this.normals.length = 0;
	// 	const hullBox = this.hullBox;
	//
	// 	triQuad.forEachBB(hullBox, (convex) => {
	// 		for (const edge of convex.collitionEdge) {
	//
	// 			// convex.center sits in the walkable triangle, so the normal
	// 			// oriented toward it always points out of the obstacle.
	// 			this.normals.push(edgeNormal(edge[0], edge[1], convex.center));
	//
	// 		}
	// 	});
	// }

	// Cancel the part of the body's motion that pushes into `normal` while
	// keeping the sliding part: this is the equal-and-opposite reaction force.
	// private applyNormalForce(normal: Vector2D) {
	// 	if (dot(this.linearVelocity, normal) >= 0) return; // already moving away
	// 	this.linearVelocity = cancelForceAlongDirection(this.linearVelocity, normal).remaining;
	// }

	// Build the world hull at `pos`, then push every static edge it overlaps
	// to the debug layer.
	private detectAt(pos: Vector2D) {
		this.buildWorldHull(pos);

		console.time("quad");

		triQuad.forEachBB(this.hullBox, (convex) => {
			for (const edge of convex.collitionEdge) {
				if (!segmentOverlapsBox(edge[0], edge[1], this.hullBox)) continue;
				const hit = segmentHitsConvexHull(edge[0], edge[1], this.hull);
				if (!hit) continue;
				camera.primary.debugLine.push({ a: edge[0], b: edge[1], t: performance.now() });
			}
		});

		console.timeEnd("quad");
	}

	protected movement():void{
		return;
	}

	// Move by the current velocity, sliding along anything it runs into.
	private move(delta: number) {
		let dx = this.linearVelocity.x * delta;
		let dy = this.linearVelocity.y * delta;
		if (dx === 0 && dy === 0) return;

		this.detectAt({ x: this._pos.x + dx, y: this._pos.y + dy });


		this._pos = { x: this._pos.x + dx, y: this._pos.y + dy };
		this.movement();
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
		// move() already tests the translated hull before this rotation lands,
		// so re-test the rotated hull here or the new pose goes unchecked.
		if (diff !== 0) this.detectAt(this._pos);
		this.commit();
	}

	applyForce(force: Vector2D, intractPoint: Vector2D, delta: number, tok?: Symbol) {
		const a = { x: force.x / this.mass, y: force.y / this.mass }
		this.linearVelocity = addVectors(this.linearVelocity, multiplyVector(a, delta));
		const dist = subtractVectors(intractPoint, this.COM);
		const t = dist.x * force.y - dist.y * force.x;
		this.angularVelocity += (t / this.inertia) * delta;

		tok !== this.#tok &&
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
