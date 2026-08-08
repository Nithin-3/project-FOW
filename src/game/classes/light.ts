import { drawShadow } from "../shape/shadow";
import type { Vector2D } from "../types";
import { Entity } from "./Entity";
import { staticQuad } from "../init";


export class Light extends Entity {
	private radius: number;
	texture: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;
	constructor(radius: number) {
		super()
		this.radius = radius;
		const width = radius * 2
		this.texture = new OffscreenCanvas(width, width);
		this.ctx = this.texture.getContext('2d')!;
	}


	update(radius: number) {
		this.radius = radius;
		const width = radius * 2
		this.texture.width = width;
		this.texture.height = width;
	}

	worldBox(loc: Vector2D) {
		return {
			v1: { x: loc.x - this.radius, y: loc.y - this.radius },
			v2: { x: loc.x + this.radius, y: loc.y + this.radius },
		};
	}


	render(loc: Vector2D, zIndex: number) {
		const box = this.worldBox(loc);
		const center = { x: this.radius, y: this.radius };

		this.ctx.clearRect(0, 0, this.texture.width, this.texture.height);

		this.ctx.beginPath();
		this.ctx.arc(center.x, center.y, this.radius - 1, 0, Math.PI * 2);
		this.ctx.fillStyle = "#fff";
		this.ctx.fill();

		this.ctx.globalCompositeOperation = "destination-out";
		staticQuad.getBB(box).forEach(o => {
			if (o.zIndex < zIndex) return;
			const obBox = o.boundingBox();
			const origin = { x: obBox.v1.x - loc.x + this.radius, y: obBox.v1.y - loc.y + this.radius };
			const end = { x: obBox.v2.x - loc.x + this.radius, y: obBox.v2.y - loc.y + this.radius };
			drawShadow(this.ctx, center, this.radius, o.localPoints(origin, end));
		});
		this.ctx.globalCompositeOperation = "source-over";
	}


}
