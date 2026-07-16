import type { Vector2D } from "../types";
import { Entity } from "./Entity";
import { addVectors, vectorLerp } from "../utils";
import { staticTexture } from "../init";

type RECT = { loc: Vector2D, width: number, height: number };

export class Camera extends Entity {
	private cam: RECT;
	private SW = 0;
	private SH = 0;
	private _scaleX = 1;
	private _scaleY = 1;

	texture: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;


	constructor(cam: RECT) {
		super()
		this.cam = cam;
		this._updateBounds();
		this.texture = new OffscreenCanvas(cam.width, cam.height);
		this.ctx = this.texture.getContext('2d')!;
	}

	private _updateBounds() {
		this._boundingBox = {
			v1: { ...this.cam.loc },
			v2: { x: this.cam.loc.x + this.cam.width, y: this.cam.loc.y + this.cam.height }
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

	screenSize(screenW: number, screenH: number) {
		this._ensureScale(screenW, screenH)
	}

	moveCamera(vect: Vector2D) {
		this.cam.loc = vectorLerp(this.cam.loc, addVectors(this.cam.loc, vect), 0.05);
		this._updateBounds();
		this.render()
	}

	updateCamera(vect: Vector2D, center: boolean = false) {
		this.cam.loc = center ? { x: vect.x - (this.cam.width * 0.5), y: vect.y - (this.cam.height * 0.5) } : vect;
		this._updateBounds();
		this.render()
	}

	updateSize(width: number, height: number) {
		this.cam.width = width;
		this.cam.height = height;
		this._updateBounds();
		if (this.texture) {
			this.texture.width = width;
			this.texture.height = height;
			this.render()
		}
	}

	private render() {
		if(!staticTexture) return;
		this.ctx.clearRect(0, 0, this.texture.width, this.texture.height)
		const sx = Math.round(this.cam.loc.x + staticTexture.info.offsetX)
		const sy = Math.round(this.cam.loc.y + staticTexture.info.offsetY)
		this.ctx.drawImage(staticTexture, sx, sy, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height)
	}

	world2screen(v: Vector2D): Vector2D {
		const cx = v.x - this.cam.loc.x;
		const cy = v.y - this.cam.loc.y;
		return { x: cx * this._scaleX, y: cy * this._scaleY }
	}

	screen2world(v: Vector2D): Vector2D {
		const cx = v.x / this._scaleX;
		const cy = v.y / this._scaleY;
		return { x: cx + this.cam.loc.x, y: cy + this.cam.loc.y };
	}

}


