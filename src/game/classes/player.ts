import { Light } from "./light";
import type { Color, Polygon, Vector2D } from "../types";
import { dijkstra } from "../A*";
import { triQuad } from "../init";
import { pointInPolygon, } from "../tools";
import type { tri } from "./triangle";
import { tuneingPath } from "../tunePath";
import { PhysicsBody } from "./PhysicsBody";



export class player extends PhysicsBody {

	shadow: Light;
	constructor(loc: Vector2D) {
		const points: Polygon = [
			{ x: 5, y: 0 },
			{ x: 0, y: 10 },
			{ x: 5, y: 5 },
			{ x: 10, y: 10 },
			{ x: 5, y: 0 },
		];
		super(0, points, "#00ffff" as Color,loc,0)
		this.collision = true;
		this.shadow = new Light(100);
	}
	boundingBox(): { v1: Vector2D; v2: Vector2D; } {
		const box = super.boundingBox()
		const dx = this.position.x - (box.v1.x + box.v2.x) / 2;
		const dy = this.position.y - (box.v1.y + box.v2.y) / 2;
		return { v1: { x: box.v1.x + dx, y: box.v1.y + dy, }, v2: { x: box.v2.x + dx, y: box.v2.y + dy, }, };

	}

	superBox(): { v1: Vector2D; v2: Vector2D; } {
		return this.shadow.worldBox(this.position)
	}

	render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, origin: Vector2D, end: Vector2D): void {
		super.render(ctx, origin, end);
		this.shadow.render(this.position, this.zIndex);
	}


	async findPath(to: Vector2D) {
		let fromTri: tri | undefined;
		let toTri: tri | undefined;
		for (const v of triQuad.getLeafQuad(this.position)) {
			if (pointInPolygon(this.position, v.vertex)) {
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
		return tuneingPath(this.position, to, await dijkstra(fromTri, toTri, this.position, to));
	}

}
