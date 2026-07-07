import type { Vector2D } from "./types";
import { Entity } from "./Entity";
import { addVectors } from "./utils";

type CAMERA = { TL: Vector2D, width: number, height: number };


export class Camera extends Entity {
	private cam: CAMERA;
	private _lastSW = 0;
	private _lastSH = 0;
	private _scaleX = 1;
	private _scaleY = 1;

	constructor(cam: CAMERA) {
		super()
		this.cam = cam;
		this._updateBounds();
	}

	private _updateBounds() {
		this._boundingBox = {
			v1: { ...this.cam.TL },
			v2: { x: this.cam.TL.x + this.cam.width, y: this.cam.TL.y + this.cam.height }
		};
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
		this._updateBounds();
	}

	updateCamera(vect: Vector2D, center: boolean = false) {
		this.cam.TL = center ? { x: vect.x - (this.cam.width * 0.5), y: vect.y - (this.cam.height * 0.5) } : vect;
		this._updateBounds();
	}

	updateSize(width: number, height: number) {
		this.cam.width = width;
		this.cam.height = height;
		this._updateBounds();
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

}


