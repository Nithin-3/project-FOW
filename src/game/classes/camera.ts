import type { Vector2D } from "../types";
import { Entity } from "./Entity";
import { subtractVectors } from "../utils";
import { staticTexture } from "../init";
import type { GameObject } from "./GameObject";

type RECT = { width: number, height: number };

export class Camera extends Entity {
	private cam: RECT;
	private loc: Vector2D;
	private SW = 0;
	private SH = 0;
	private _scaleX = 1;
	private _scaleY = 1;

	texture: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;

	private movementLayer: OffscreenCanvas;
	private movementCtx: OffscreenCanvasRenderingContext2D;

	private shanMogh = new Map<number, [Vector2D, number, number]>();

	private movables = new Set<GameObject>()

	get position(): Vector2D { return this.loc }
	set position(v: Vector2D) {
		this.loc = v;
		this._updateBounds();
		this.render();
	}

	constructor(loc: Vector2D, width: number, height: number) {
		super()
		this.cam = { width, height };
		this.loc = loc;
		this._updateBounds();
		this.texture = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.ctx = this.texture.getContext('2d')!;

		this.movementLayer = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.movementCtx = this.movementLayer.getContext('2d')!;
	}

	private _updateBounds() {
		this._boundingBox = {
			v1: { ...this.loc },
			v2: { x: this.loc.x + this.cam.width, y: this.loc.y + this.cam.height }
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

	updateSize(width: number, height: number) {
		this.cam.width = width;
		this.cam.height = height;
		this._updateBounds();
		this._scaleX = this.SW / width;
		this._scaleY = this.SH / height;
		if (this.texture) {
			this.movementLayer.width = width;
			this.movementLayer.height = height;
			this.texture.width = width;
			this.texture.height = height;
			this.render()
		}
	}

	updateMovement(entity: GameObject) {
		const box = entity.boundingBox();
		if (!Entity.isRender(box, this.boundingBox())) return this.clearMovement(entity.id);
		const clr = this.shanMogh.get(entity.id)
		if (clr) {
			// TODO: check any other entity share this box
			this.movementCtx.clearRect(clr[0].x, clr[0].y, clr[1], clr[2])
		}
		const v1 = subtractVectors(box.v1, this.loc);
		const v2 = subtractVectors(box.v2, this.loc);
		const width = v2.x - v1.x;
		const height = v2.y - v1.y;
		this.shanMogh.set(entity.id, [{ x: v1.x - 1, y: v1.y - 1 }, width + 2, height + 2]);
		entity.render(this.movementCtx, v1, v2);
	}

	private clearMovement(entityID: number) {
		const clr = this.shanMogh.get(entityID)
		if (clr) {
			this.movementCtx.clearRect(clr[0].x, clr[0].y, clr[1], clr[2])
			this.shanMogh.delete(entityID)
		}
	}

	addMovable(obj: GameObject) {
		this.movables.add(obj);
		this.render();
	}

	removeMovable(id: number) {
		for (const m of this.movables) {
			if (m.id === id) {
				this.movables.delete(m);
				this.clearMovement(id);
				this.render();
				break;
			}
		}
	}

	world2screen(v: Vector2D): Vector2D {
		const cx = v.x - this.loc.x;
		const cy = v.y - this.loc.y;
		return { x: cx * this._scaleX, y: cy * this._scaleY }
	}

	screen2world(v: Vector2D): Vector2D {
		const cx = v.x / this._scaleX;
		const cy = v.y / this._scaleY;
		return { x: cx + this.loc.x, y: cy + this.loc.y };
	}

	private render() {
		if (!staticTexture) return;
		this.ctx.clearRect(0, 0, this.texture.width, this.texture.height)
		const sx = this.loc.x + staticTexture.info.offsetX
		const sy = this.loc.y + staticTexture.info.offsetY
		this.ctx.drawImage(staticTexture, sx, sy, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height)

		// this.movementCtx.clearRect(0,0,this.movementLayer.width,this.movementLayer.height)
		for (const m of this.movables)
			this.updateMovement(m)

		this.ctx.drawImage(this.movementLayer, 0, 0, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height);
	}

}
