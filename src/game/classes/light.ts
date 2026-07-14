import { drawShadow } from "../shape/shadow";
import type { Vector2D } from "../types";
import { Entity } from "./Entity";
import { vectorLerp } from "../utils";
import { staticQuad } from "../init";


export class Light extends Entity {
	private radius: number;
	texture: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;
	constructor(radius: number) {
		super()
		this.radius = radius;
		this.texture = new OffscreenCanvas(window.innerWidth, window.innerHeight);
		this.ctx = this.texture.getContext('2d')!;
		window.addEventListener('resize', () => {
			this.texture.width = window.innerWidth;
			this.texture.height = window.innerHeight;
		})
	}


	update(radius: number) {
		this.radius = radius;
	}

	worldBox(loc: Vector2D) {
		return {
			v1: { x: loc.x - this.radius, y: loc.y - this.radius },
			v2: { x: loc.x + this.radius, y: loc.y + this.radius },
		};
	}


	render(loc: Vector2D, zIndex: number, transform: (box: { v1: Vector2D, v2: Vector2D }) => { v1: Vector2D, v2: Vector2D }) {
		const box = this.worldBox(loc);
		const { v1, v2 } = transform(box)
		const center = vectorLerp(v1, v2, 0.5);
		const screenRadius = (v2.x - v1.x) / 2;

		this.ctx.clearRect(0, 0, this.texture.width, this.texture.height);

		this.ctx.beginPath();
		this.ctx.arc(center.x, center.y, screenRadius - 1, 0, Math.PI * 2);
		this.ctx.fillStyle = "#fff";
		this.ctx.fill();

		this.ctx.globalCompositeOperation = "destination-out";
		staticQuad.getBB(box).forEach(o => {
			if(o.zIndex < zIndex) return;
			const obBox = o.boundingBox();
			if (!Entity.isRender(obBox, box)) return;
			const sObBox = transform(obBox);
			drawShadow(this.ctx, center, screenRadius, o.localPoints(sObBox.v1, sObBox.v2));
		});
		this.ctx.globalCompositeOperation = "source-over";
	}


}
