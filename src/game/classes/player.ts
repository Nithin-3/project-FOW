import { GameObject } from "./GameObject";
import { Light } from "./light";
import type { Color, Polygon, Vector2D } from "../types";
import { dijkstra } from "../A*";
import { triQuad } from "../init";
import { pointInPolygon } from "../tools";
import type { tri } from "./triangle";
import { tuneingPath } from "../tunePath";



export class player extends GameObject {
	private _loc: Vector2D;
	public get loc(): Vector2D {
		return this._loc;
	}
	public set loc(value: Vector2D) {
		this._loc = value;
	}
	shadow: Light;
	constructor(loc: Vector2D) {
		const points: Polygon = [
			{ x: 5, y: 0 },
			{ x: 0, y: 10 },
			{ x: 5, y: 5 },
			{ x: 10, y: 10 },
			{ x: 5, y: 0 },
		];
		super(0, points, "#00ffff" as Color)
		this.collision = true;
		this._loc = loc;
		this.shadow = new Light(100);
	}
	boundingBox(): { v1: Vector2D; v2: Vector2D; } {
		const box = super.boundingBox()
		const dx = this._loc.x - (box.v1.x + box.v2.x) / 2;
		const dy = this._loc.y - (box.v1.y + box.v2.y) / 2;
		return { v1: { x: box.v1.x + dx, y: box.v1.y + dy, }, v2: { x: box.v2.x + dx, y: box.v2.y + dy, }, };

	}

	superBox(): { v1: Vector2D; v2: Vector2D; } {
		return this.shadow.worldBox(this._loc)
	}

	render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, origin: Vector2D, end: Vector2D): void {
		super.render(ctx, origin, end);
		this.shadow.render(this._loc, this.zIndex);
	}


	async findPath(to: Vector2D) {
		let fromTri: tri | undefined;
		let toTri: tri | undefined;
		for (const v of triQuad.getLeafQuad(this._loc)) {
			if (pointInPolygon(this._loc, v.vertex)) {
				fromTri = v;
				continue;
			}
			if (pointInPolygon(to, v.vertex)) {
				toTri = v;
				continue;
			}
		}

		if (!toTri)
			for (const v of triQuad.getLeafQuad(to)) {
				if (pointInPolygon(to, v.vertex)) {
					toTri = v;
					break;
				}
			}

		if (!fromTri || !toTri) return [];
		return tuneingPath(this._loc, to, await dijkstra(fromTri, toTri, this._loc, to));
	}

}
