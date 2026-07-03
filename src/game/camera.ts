import type { Vector2D } from "./types";
import { addVectors } from "./utils";

type CAMERA = { TL: Vector2D, width: number, height: number };
// TL-> top left 
// boundingBox TL <=> TL+{width,height}
export class Camera {
	private cam: CAMERA;
	constructor(cam: CAMERA) {
		this.cam = cam;
	}

	moveCamera(vect: Vector2D) {
		this.cam.TL = addVectors(this.cam.TL, vect);
	}

	updateCamera(vect: Vector2D, center: boolean = false) {
		this.cam.TL = center ? { x: this.cam.TL.x - (this.cam.width * 0.5), y: this.cam.TL.y - (this.cam.TL.y - (this.cam.height * 0.5)) } : vect;
	}

	boundingBox(): { v1: Vector2D, v2: Vector2D } {
		return { v1: this.cam.TL, v2: { x: this.cam.TL.x + this.cam.width, y: this.cam.TL.y + this.cam.height } }
	}

	world2screen(v: Vector2D, screenW: number, screenH: number): Vector2D {
		const scaleX = screenW / this.cam.width;
		const scaleY = screenH / this.cam.height;

		// convert world -> camera space
		const cx = v.x - this.cam.TL.x;
		const cy = v.y - this.cam.TL.y;

		// camera space -> screen space
		return { x: cx * scaleX, y: cy * scaleY }
	}
}


// cam x - width
// cam y - height
//
//
//
// .<x1 && .len <x1
// .>x2 && .len >x2
// .<y1 && .len <y1
// .>y2 && .len >y2
// 
