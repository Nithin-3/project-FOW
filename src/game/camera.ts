import type { Vector2D } from "./types";
import { addVectors } from "./utils";

type CAMERA = { TL: Vector2D, width: number, height: number };
// TL-> top left 
// boundingBox TL <=> TL+{width,height}


export class Camera {
	private cam: CAMERA;
	private _lastSW = 0;
	private _lastSH = 0;
	private _scaleX = 1;
	private _scaleY = 1;

	constructor(cam: CAMERA) {
		this.cam = cam;
	}

	private _ensureScale(screenW: number, screenH: number) {
		if (screenW !== this._lastSW || screenH !== this._lastSH) {
			this._lastSW = screenW;
			this._lastSH = screenH;
			this._scaleX = screenW / this.cam.width;
			this._scaleY = screenH / this.cam.height;
		}
	}

	moveCamera(vect: Vector2D) {
		this.cam.TL = addVectors(this.cam.TL, vect);
	}

	updateCamera(vect: Vector2D, center: boolean = false) {
		this.cam.TL = center ? { x: vect.x - (this.cam.width * 0.5), y: vect.y - (this.cam.height * 0.5) } : vect;
	}

	boundingBox(): { v1: Vector2D, v2: Vector2D } {
		return { v1: this.cam.TL, v2: { x: this.cam.TL.x + this.cam.width, y: this.cam.TL.y + this.cam.height } }
	}

	world2screen(v: Vector2D, screenW: number, screenH: number): Vector2D {
		this._ensureScale(screenW, screenH);
		const cx = v.x - this.cam.TL.x;
		const cy = v.y - this.cam.TL.y;
		return { x: cx * this._scaleX, y: cy * this._scaleY }
	}

	screen2world(v: Vector2D, screenW: number, screenH: number): Vector2D {
		this._ensureScale(screenW, screenH);
		const cx = v.x / this._scaleX;
		const cy = v.y / this._scaleY;
		return { x: cx + this.cam.TL.x, y: cy + this.cam.TL.y };
	}

	isRender(v1: Vector2D, v2: Vector2D) { // pass boundingBox of game object
		if (v1.x < this.cam.TL.x && v2.x < this.cam.TL.x) return false;
		if (v1.x > this.cam.TL.x + this.cam.width && v2.x > this.cam.TL.x + this.cam.width) return false;
		if (v1.y < this.cam.TL.y && v2.y < this.cam.TL.y) return false;
		if (v1.y > this.cam.TL.y + this.cam.width && v2.y > this.cam.TL.y + this.cam.width) return false;
		return true;
	}
}


