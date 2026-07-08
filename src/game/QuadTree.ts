import type { Vector2D } from "./types";
import { vectorLerp } from "./utils";

const CAPACITY = 64;
export class Quad<T extends { boundingBox: () => { v1: Vector2D, v2: Vector2D } }> {
	points: T[] = [];
	boundingBox: { v1: Vector2D, v2: Vector2D };
	mid: Vector2D;
	cap: number;

	Iquad: Quad<T> | null = null;
	IIquad: Quad<T> | null = null;
	IIIquad: Quad<T> | null = null;
	IVquad: Quad<T> | null = null;



	constructor(boundingBox: { v1: Vector2D, v2: Vector2D }, capacity: number = CAPACITY) {
		this.boundingBox = boundingBox;
		this.mid = vectorLerp(this.boundingBox.v1, this.boundingBox.v2, 0.5);
		this.cap = capacity;
	}

	private contains(box: { v1: Vector2D; v2: Vector2D }): boolean {
		return (
			box.v1.x >= this.boundingBox.v1.x &&
			box.v1.y >= this.boundingBox.v1.y &&
			box.v2.x <= this.boundingBox.v2.x &&
			box.v2.y <= this.boundingBox.v2.y
		);
	}

	private overlaps(box: { v1: Vector2D; v2: Vector2D }): boolean {
		return (
			this.boundingBox.v1.x < box.v2.x &&
			this.boundingBox.v2.x > box.v1.x &&
			this.boundingBox.v1.y < box.v2.y &&
			this.boundingBox.v2.y > box.v1.y
		);
	}

	insert(obj: T): void {

		if (this.Iquad !== null) {
			const objBox = obj.boundingBox();

			if (this.Iquad.contains(objBox)) return this.Iquad.insert(obj);
			if (this.IIquad!.contains(objBox)) return this.IIquad!.insert(obj);
			if (this.IIIquad!.contains(objBox)) return this.IIIquad!.insert(obj);
			if (this.IVquad!.contains(objBox)) return this.IVquad!.insert(obj);
			this.points.push(obj)
			return;
		}

		if (this.points.length < this.cap) {
			this.points.push(obj);
			return;
		}


		this.Iquad = new Quad({ v1: { x: this.mid.x, y: this.mid.y }, v2: this.boundingBox.v2 }, this.cap);
		this.IIquad = new Quad({ v1: { x: this.boundingBox.v1.x, y: this.mid.y }, v2: { x: this.mid.x, y: this.boundingBox.v2.y } }, this.cap);
		this.IIIquad = new Quad({ v1: this.boundingBox.v1, v2: { x: this.mid.x, y: this.mid.y } }, this.cap);
		this.IVquad = new Quad({ v1: { x: this.mid.x, y: this.boundingBox.v1.y }, v2: { x: this.boundingBox.v2.x, y: this.mid.y } }, this.cap);

		const copy = [...this.points];
		if (this.points.length) this.points = [];
		for (const p of copy) this.insert(p);

		this.insert(obj);
	}


	getLeafQuad(v: Vector2D): Quad<T> {
		if (this.Iquad !== null) {
			if (v.x >= this.mid.x && v.y >= this.mid.y) return this.Iquad!.getLeafQuad(v)
			else if (v.x < this.mid.x && v.y >= this.mid.y) return this.IIquad!.getLeafQuad(v)
			else if (v.x < this.mid.x && v.y < this.mid.y) return this.IIIquad!.getLeafQuad(v)
			else return this.IVquad!.getLeafQuad(v)
		}
		return this;
	}

	getBB(box: { v1: Vector2D, v2: Vector2D }, result = new Set<T>()) {
		if (!this.overlaps(box)) return result;

		for (const obj of this.points)
			result.add(obj);

		this.Iquad?.getBB(box, result);
		this.IIquad?.getBB(box, result);
		this.IIIquad?.getBB(box, result);
		this.IVquad?.getBB(box, result);

		return result;
	}

	getAll(result = new Set<T>()) {
		for (const obj of this.points)
			result.add(obj);

		this.Iquad?.getAll(result);
		this.IIquad?.getAll(result);
		this.IIIquad?.getAll(result);
		this.IVquad?.getAll(result);

		return result;
	}

	clear() {
		this.points = [];
		this.Iquad = null;
		this.IIquad = null;
		this.IIIquad = null;
		this.IVquad = null;
	}

	drawDebug(ctx: CanvasRenderingContext2D, transform: (box: { v1: Vector2D, v2: Vector2D }) => { v1: Vector2D, v2: Vector2D }, depth = 0) {
		const color = `hsl(${(depth + 1) * 60 % 360}, 100%, 50%)`
		const { v1, v2 } = transform(this.boundingBox)
		ctx.beginPath();
		ctx.rect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
		ctx.stroke();
		this.Iquad?.drawDebug(ctx, transform, depth + 1);
		this.IIquad?.drawDebug(ctx, transform, depth + 1);
		this.IIIquad?.drawDebug(ctx, transform, depth + 1);
		this.IVquad?.drawDebug(ctx, transform, depth + 1);
	}
}

