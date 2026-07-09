import { drawShadow } from "./shape/shadow";
import type { Vector2D } from "./types";
import { Entity } from "./Entity";
import { subtractVectors } from "./utils";
import { staticQuad } from "./init";


export class Light extends Entity {
	radius: number; // TODO: switch to private
	texture: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;
	constructor(radius: number) {
		super()
		this.radius = radius;
		this.texture = new OffscreenCanvas(radius * 2, radius * 2);
		this.ctx = this.texture.getContext('2d')!;
	}


	update(radius: number) {
		this.texture.width = radius * 2;
		this.texture.height = radius * 2;
		this.radius = radius;
	}

	render(loc: Vector2D) {
		const box = { v1: { x: loc.x - this.radius, y: loc.y - this.radius }, v2: { x: loc.x + this.radius, y: loc.y + this.radius } };
		this.ctx.clearRect(0, 0, this.texture.width, this.texture.height);
		staticQuad.getBB(box).forEach(o => {
			const obBox = o.boundingBox()
			if (!Entity.isRender(obBox, box)) return;
			drawShadow(this.ctx, { x: this.radius, y: this.radius }, this.radius, o.localPoints(subtractVectors(obBox.v1, box.v1), subtractVectors(obBox.v2, box.v1)), "#fff" as any);
		})
	}
}
