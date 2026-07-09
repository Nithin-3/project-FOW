import { GameObject } from "./GameObject";
import { Light } from "./light";
import type { Color, Polygon, Vector2D } from "./types";



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
		super(1, points, "#00ff00" as Color)
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
		const box = super.boundingBox()
		const boxW = (box.v2.x - box.v1.x);
		const boxH = (box.v2.y - box.v1.y);

		this.shadow.render(this.loc);

		const texW = this.texture.width;
		const texH = this.texture.height;
		this.shadow.ctx.drawImage(
			this.texture,
			this.shadow.radius - boxW,
			this.shadow.radius - boxH,
			texW,
			texH,
		);

		const screenW = end.x - origin.x;
		const screenH = end.y - origin.y;
		const camScaleX = screenW / (boxW * 2);
		const camScaleY = screenH / (boxH * 2);
		const shadowScreenW = this.shadow.radius * 2 * camScaleX;
		const shadowScreenH = this.shadow.radius * 2 * camScaleY;
		const cx = (origin.x + end.x) / 2;
		const cy = (origin.y + end.y) / 2;

		ctx.drawImage(
			this.shadow.texture,
			cx - shadowScreenW / 2,
			cy - shadowScreenH / 2,
			shadowScreenW,
			shadowScreenH,
		);
	}

}
