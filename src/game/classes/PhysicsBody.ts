import { camera } from "../setup";
import type { Color, Polygon, Vector2D } from "../types";
import { addVectors, multiplyVector, subtractVectors } from "../utils";
import { GameObject } from "./GameObject";

export class PhysicsBody extends GameObject {
	private area: number;
	private mass: number;
	private COM: { x: number; y: number; };
	private inertia: number;


	public get com():Vector2D{
		return this.COM;
	}


	private _pos: Vector2D;
	public get position(): Vector2D {
		return this._pos;
	}
	private set position(value: Vector2D) {
		this._pos = value;
		const keys = Object.keys(camera)
		for (const c of keys)
			camera[c].updateMovement(this)
	}

	private _rot: number;
	public get rotation(): number {
		return this._rot;
	}
	private set rotation(value: number) {
		this._rot = value;
		const keys = Object.keys(camera)
		for (const c of keys)
			camera[c].updateMovement(this)
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
	}


	public rotateToward(target: number, speed: number, delta: number) {
		let diff = target - this._rot;
		while (diff > Math.PI) diff -= 2 * Math.PI;
		while (diff < -Math.PI) diff += 2 * Math.PI;
		this.rotation = this._rot + diff * (1 - Math.exp(-speed * delta / 300));
	}

	applyForce(force: Vector2D, intractPoint: Vector2D,delta:number) {
		const a = { x: force.x / this.mass, y: force.y / this.mass }
		this.linearVelocity = addVectors(this.linearVelocity, multiplyVector(a, delta));
		const dist = subtractVectors(intractPoint,this.COM);
		const t = dist.x * force.y - dist.y * force.x;
		this.angularVelocity += (t / this.inertia) * delta;

		this.apply(delta);
	}


	private apply(delta: number) {
		this.position = addVectors(this._pos, multiplyVector(this.linearVelocity, delta));
		this.linearVelocity = multiplyVector(this.linearVelocity, this.lossOverT);
		this.rotation += this.angularVelocity * delta;
		this.angularVelocity *= this.lossOverT;
	}
}
