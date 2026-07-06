import type { GameObject } from "./GameObject";
import type { Vector2D } from "./types";
import { vectorLerp } from "./utils";

const CAPACITY = 64;
export class Quad {
	points: GameObject[] = [];
	boundingBox: { v1: Vector2D, v2: Vector2D };
	mid: Vector2D;
	cap: number;

	Iquad: Quad | null = null;
	IIquad: Quad | null = null;
	IIIquad: Quad | null = null;
	IVquad: Quad | null = null;


	private cellW: number;
	private cellH: number;

	constructor(boundingBox: { v1: Vector2D, v2: Vector2D }, cellW: number, cellH: number, capacity: number = CAPACITY) {
		this.boundingBox = boundingBox;
		this.mid = vectorLerp(this.boundingBox.v1, this.boundingBox.v2, 0.5);
		this.cap = capacity;
		this.cellH = cellH;
		this.cellW = cellW;
	}

	pointInside(p: Vector2D): boolean {
		return (
			p.x >= this.boundingBox.v1.x &&
			p.x <= this.boundingBox.v2.x &&
			p.y >= this.boundingBox.v1.y &&
			p.y <= this.boundingBox.v2.y
		);
	}

	contains(box: { v1: Vector2D, v2: Vector2D }): boolean {
		const { v1, v2 } = box;

		const stepX = Math.min(v2.x - v1.x, this.cellW * 0.97);
		const stepY = Math.min(v2.y - v1.y, this.cellH * 0.97);

		for (let x = v1.x; x <= v2.x; x += stepX) {
			for (let y = v1.y; y <= v2.y; y += stepY) {
				if (this.pointInside({ x, y })) {
					return true;
				}
			}
		}

		return this.pointInside(v2);
	}

	insert(obj: GameObject) {

		if (this.Iquad !== null) {
			const objBox = obj.boundingBox;

			if (this.Iquad.contains(objBox)) this.Iquad.insert(obj);
			if (this.IIquad!.contains(objBox)) this.IIquad!.insert(obj);
			if (this.IIIquad!.contains(objBox)) this.IIIquad!.insert(obj);
			if (this.IVquad!.contains(objBox)) this.IVquad!.insert(obj);

			return;
		}

		if (this.points.length < this.cap) {
			this.points.push(obj);
			return;
		}


		this.Iquad = new Quad({ v1: { x: this.mid.x, y: this.mid.y }, v2: this.boundingBox.v2 }, this.cellW, this.cellH);
		this.IIquad = new Quad({ v1: { x: this.boundingBox.v1.x, y: this.mid.y }, v2: { x: this.mid.x, y: this.boundingBox.v2.y } }, this.cellW, this.cellH);
		this.IIIquad = new Quad({ v1: this.boundingBox.v1, v2: { x: this.mid.x, y: this.mid.y } }, this.cellW, this.cellH);
		this.IVquad = new Quad({ v1: { x: this.mid.x, y: this.boundingBox.v1.y }, v2: { x: this.boundingBox.v2.x, y: this.mid.y } }, this.cellW, this.cellH);

		for (const p of this.points) this.insert(p);
		if (this.points.length) this.points = [];

		this.insert(obj);
	}


	getLeafQuad(v: Vector2D): Quad {
		if (this.Iquad !== null) {
			if (v.x >= this.mid.x && v.y >= this.mid.y) return this.Iquad!.getLeafQuad(v)
			else if (v.x < this.mid.x && v.y >= this.mid.y) return this.IIquad!.getLeafQuad(v)
			else if (v.x < this.mid.x && v.y < this.mid.y) return this.IIIquad!.getLeafQuad(v)
			else return this.IVquad!.getLeafQuad(v)
		}
		return this;
	}

	getBB(box: { v1: Vector2D, v2: Vector2D }, result = new Set<GameObject>()) {
		if (!this.contains(box)) return result;

		for (const obj of this.points)
			result.add(obj);

		this.Iquad?.getBB(box, result);
		this.IIquad?.getBB(box, result);
		this.IIIquad?.getBB(box, result);
		this.IVquad?.getBB(box, result);

		return result;
	}

	clear() {
		this.points = [];
		this.Iquad = null;
		this.IIquad = null;
		this.IIIquad = null;
		this.IVquad = null;
	}
}

