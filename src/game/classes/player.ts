import { GameObject } from "./GameObject";
import { Light } from "./light";
import type { Color, Polygon, Vector2D } from "../types";



export class player extends GameObject {
	loc: Vector2D;
	shadow: Light;
	constructor(loc: Vector2D) {
		const points: Polygon = [
			{ x: 5, y: 0 },
			{ x: 0, y: 10 },
			{ x: 5, y: 5 },
			{ x: 10, y: 10 },
			{ x: 5, y: 0 },
		];
		super(0, points, "#00ff00" as Color)
		this.collision = true;
		this.loc = loc;
		this.shadow = new Light(100);
	}
	boundingBox(): { v1: Vector2D; v2: Vector2D; } {
		const box = super.boundingBox()
		const width = (box.v2.x - box.v1.x);
		const height = (box.v2.y - box.v1.y);
		return { v1: { x: this.loc.x - width, y: this.loc.y - height }, v2: { x: this.loc.x + width, y: this.loc.y + height } }
	}

	render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, origin: Vector2D, end: Vector2D): void {
		super.render(ctx, origin, end);

		const box = super.boundingBox()
		const boxW = box.v2.x - box.v1.x;
		const boxH = box.v2.y - box.v1.y;

		const scaleX = (end.x - origin.x) / (boxW * 2);
		const scaleY = (end.y - origin.y) / (boxH * 2);

		const camTL = { x: this.loc.x - boxW - origin.x / scaleX, y: this.loc.y - boxH - origin.y / scaleY, };

		this.shadow.render(this.loc, this.zIndex, (b) => ({
			v1: { x: (b.v1.x - camTL.x) * scaleX, y: (b.v1.y - camTL.y) * scaleY },
			v2: { x: (b.v2.x - camTL.x) * scaleX, y: (b.v2.y - camTL.y) * scaleY },
		}));
	}


	findPath(to:Vector2D){
		to

		// TODO: find path

	}

}
