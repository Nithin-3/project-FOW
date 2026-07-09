import type { Vector2D } from "./types";
import { Entity } from "./Entity";
import { addVectors, vectorLerp } from "./utils";
import { staticTexture } from "./init";

type CAMERA = { TL: Vector2D, width: number, height: number };


export class Camera extends Entity {
	private cam: CAMERA;
	private SW = 0;
	private SH = 0;
	private _scaleX = 1;
	private _scaleY = 1;

	texture: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;


	constructor(cam: CAMERA) {
		super()
		this.cam = cam;
		this._updateBounds();
		this.texture = new OffscreenCanvas(cam.width, cam.height);
		this.ctx = this.texture.getContext('2d')!;
	}

	private _updateBounds() {
		this._boundingBox = {
			v1: { ...this.cam.TL },
			v2: { x: this.cam.TL.x + this.cam.width, y: this.cam.TL.y + this.cam.height }
		};
	}

	private _ensureScale(screenW: number, screenH: number) {
		if (screenW !== this.SW || screenH !== this.SH) {
			this.SW = screenW;
			this.SH = screenH;
			this._scaleX = screenW / this.cam.width;
			this._scaleY = screenH / this.cam.height;
		}
	}

	worldSize(screenW: number, screenH: number) {
		this._ensureScale(screenW, screenH)
	}

	moveCamera(vect: Vector2D) {
		this.cam.TL = vectorLerp(this.cam.TL, addVectors(this.cam.TL, vect), 0.1);
		this._updateBounds();
		this.render()
	}

	updateCamera(vect: Vector2D, center: boolean = false) {
		this.cam.TL = center ? { x: vect.x - (this.cam.width * 0.5), y: vect.y - (this.cam.height * 0.5) } : vect;
		this._updateBounds();
		this.render()
	}

	updateSize(width: number, height: number) {
		this.cam.width = width;
		this.cam.height = height;
		this.texture.width = width;
		this.texture.height = height;
		this._updateBounds();
		this.render()
	}

	private render() {
		this.ctx.clearRect(0, 0, this.texture.width, this.texture.height)
		const sx = Math.round(this.cam.TL.x + staticTexture.info.offsetX)
		const sy = Math.round(this.cam.TL.y + staticTexture.info.offsetY)
		this.ctx.drawImage(staticTexture, sx, sy, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height)
	}

	world2screen(v: Vector2D): Vector2D {
		const cx = v.x - this.cam.TL.x;
		const cy = v.y - this.cam.TL.y;
		return { x: cx * this._scaleX, y: cy * this._scaleY }
	}

	screen2world(v: Vector2D): Vector2D {
		const cx = v.x / this._scaleX;
		const cy = v.y / this._scaleY;
		return { x: cx + this.cam.TL.x, y: cy + this.cam.TL.y };
	}

}


