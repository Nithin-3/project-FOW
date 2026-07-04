import { drawShadow } from "./shape/shadow";
import type { Color, Polygon, Vector2D } from "./types";
import { addVectors } from "./utils";


export class Light {
	loc: Vector2D;
	radius: number;
	constructor(loc: Vector2D, radius: number) {
		this.loc = loc;
		this.radius = radius;
	}


	update(loc?: Vector2D, radius?: number) {
		if (loc) this.loc = loc;
		if (radius) this.radius = radius;
	}

	move(dir: Vector2D) {
		this.loc = addVectors(this.loc, dir);
	}
	boundingBox(): { v1: Vector2D; v2: Vector2D; } {
		return { v1: { x: this.loc.x - this.radius, y: this.loc.y - this.radius }, v2: { x: this.loc.x + this.radius, y: this.loc.y + this.radius } }
	}


	isRender(v1: Vector2D, v2: Vector2D) { // pass boundingBox of game object
		const box = this.boundingBox()
		if (v1.x < box.v1.x && v2.x < box.v1.x) return false;
		if (v1.x > box.v2.x && v2.x > box.v2.x) return false;
		if (v1.y < box.v1.y && v2.y < box.v1.y) return false;
		if (v1.y > box.v2.y && v2.y > box.v2.y) return false;
		return true;
	}

	static drawshadow(ctx: OffscreenCanvasRenderingContext2D, origin: Vector2D, radius: number, polygons: Polygon[], fillcolor?: Color) {
		for (const poly of polygons)
			drawShadow(ctx, origin, radius, poly, fillcolor)
	}

}
