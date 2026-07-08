import { drawShadow } from "./shape/shadow";
import type { Color, Vector2D } from "./types";
import { Entity } from "./Entity";
import { addVectors, subtractVectors } from "./utils";
import { staticQuad } from "./init";


export class Light extends Entity {
	loc: Vector2D;
	radius: number;
	texture: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;
	constructor(loc: Vector2D, radius: number) {
		super()
		this.loc = loc;
		this.radius = radius;
		this._updateBounds();
		this.texture = new OffscreenCanvas(radius * 2, radius * 2);
		this.ctx = this.texture.getContext('2d')!;
	}

	private _updateBounds() {
		this._boundingBox = {
			v1: { x: this.loc.x - this.radius, y: this.loc.y - this.radius },
			v2: { x: this.loc.x + this.radius * 2, y: this.loc.y + this.radius * 2 }
		};
	}

	update(loc?: Vector2D, radius?: number) {
		if (loc) this.loc = loc;
		if (radius) this.radius = radius;
		this._updateBounds();
		this.render()
	}

	move(dir: Vector2D) {
		this.loc = addVectors(this.loc, dir);
		this._updateBounds();
		this.render()
	}

	private render() {
		const box = this.boundingBox();
		this.ctx.clearRect(0, 0, this.texture.width, this.texture.height);
		staticQuad.getBB(box).forEach(o => {
			const obBox = o.boundingBox()
			if (!Entity.isRender(obBox, box)) return;
			drawShadow(this.ctx, { x: this.radius, y: this.radius }, this.radius, o.localPoints(subtractVectors(obBox.v1, box.v1), subtractVectors(obBox.v2, box.v2)), "#fff" as Color);
		})
	}
}
