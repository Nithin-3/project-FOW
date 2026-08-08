import type { Vector2D } from "../types";
import { Entity } from "./Entity";
import { subtractVectors } from "../utils";
import { staticTexture } from "../init";
import type { GameObject } from "./GameObject";
import { movables } from "../setup";
import { player } from "./player";

type RECT = { width: number, height: number };

export class Camera extends Entity {
	private cam: RECT;
	private loc: Vector2D;
	private SW = 0;
	private SH = 0;
	private _scaleX = 1;
	private _scaleY = 1;

	private _texture: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;

	private movementLayer: OffscreenCanvas;
	private movementCtx: OffscreenCanvasRenderingContext2D;

	private fogLayer: OffscreenCanvas;
	private fogCtx: OffscreenCanvasRenderingContext2D;
	private fogMask: OffscreenCanvas;
	private maskCtx: OffscreenCanvasRenderingContext2D;

	private shanMogh = new Map<number, [Vector2D, number, number, number]>();
	private anjana = new Map<number, [Vector2D, number, number]>();

	private draw = true;

	get position(): Vector2D { return this.loc }
	set position(v: Vector2D) {
		this.loc = v;
		this._updateBounds();
		for (const m of movables)
			this.updateMovement(m)
		this.draw = true;
	}

	get texture(): OffscreenCanvas { this.draw = false; return this._texture; }

	get stateChanged(): boolean { return this.draw }


	constructor(loc: Vector2D, width: number, height: number) {
		super()
		this.cam = { width, height };
		this.loc = loc;
		this._texture = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.movementLayer = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.fogLayer = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.fogMask = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.ctx = this._texture.getContext('2d')!;
		this.movementCtx = this.movementLayer.getContext('2d')!;
		this.fogCtx = this.fogLayer.getContext('2d')!;
		this.maskCtx = this.fogMask.getContext('2d')!;

		this._updateBounds();
		this._ensureScale(window.innerWidth, window.innerHeight);
		window.addEventListener("resize", () => this._ensureScale(window.innerWidth, window.innerHeight))
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
			this.updateSize(this.cam.width, (this.cam.width / (window.innerWidth / window.innerHeight)))
		}
	}

	updateSize(width: number, height: number) {
		this.cam.width = width;
		this.cam.height = height;
		this._updateBounds();
		this._scaleX = this.SW / width;
		this._scaleY = this.SH / height;
		this.fogLayer.width = width;
		this.fogLayer.height = height;
		this.fogMask.width = width;
		this.fogMask.height = height;
		this.movementLayer.width = width;
		this.movementLayer.height = height;
		this._texture.width = width;
		this._texture.height = height;
		for (const m of movables)
			this.updateMovement(m)
		this.draw = true
	}

	updateMovement(entity: GameObject) {
		let box = entity instanceof player ? entity.superBox() : entity.boundingBox();
		if (!Entity.isRender(box, this.boundingBox())) return this.clearMovement(entity.id);
		const clr = this.shanMogh.get(entity.id)
		if (clr) {
			if (clr[3] !== 0) {
				const cx2 = clr[0].x + clr[1] / 2;
				const cy2 = clr[0].y + clr[2] / 2;
				this.movementCtx.save();
				this.movementCtx.translate(cx2, cy2);
				this.movementCtx.rotate(clr[3]);
				this.movementCtx.translate(-cx2, -cy2);
				this.movementCtx.clearRect(clr[0].x, clr[0].y, clr[1], clr[2]);
				this.movementCtx.restore();
			} else {
				this.movementCtx.clearRect(clr[0].x, clr[0].y, clr[1], clr[2]);
			}
		}
		box = entity.boundingBox();
		const v1 = subtractVectors(box.v1, this.loc);
		const v2 = subtractVectors(box.v2, this.loc);
		const width = v2.x - v1.x;
		const height = v2.y - v1.y;
		this.shanMogh.set(entity.id, [{ x: v1.x - 1, y: v1.y - 1 }, width + 2, height + 2, "rotation" in entity ? (entity.rotation as number) : 0]);
		if ("rotation" in entity && entity.rotation !== 0 && typeof entity.rotation === "number") {
			const cx = v1.x + width / 2;
			const cy = v1.y + height / 2;
			this.movementCtx.save();
			this.movementCtx.translate(cx, cy);
			this.movementCtx.rotate(entity.rotation);
			this.movementCtx.translate(-cx, -cy);
			entity.render(this.movementCtx, v1, v2);
			this.movementCtx.restore();
		} else {
			entity.render(this.movementCtx, v1, v2);
		}

		if (entity instanceof player) {
			const clr = this.anjana.get(entity.id);
			if (clr) {
				// TODO: check any other entity share this box
				this.maskCtx.clearRect(clr[0].x, clr[0].y, clr[1], clr[2])
			}
			const box = entity.superBox()
			const v1 = subtractVectors(box.v1, this.loc);
			const v2 = subtractVectors(box.v2, this.loc);
			const width = v2.x - v1.x;
			const height = v2.y - v1.y;
			this.anjana.set(entity.id, [{ x: v1.x - 1, y: v1.y - 1 }, width + 2, height + 2]);
			this.maskCtx.globalCompositeOperation = "lighter"
			this.maskCtx.drawImage(entity.shadow.texture, v1.x, v1.y);
			this.maskCtx.globalCompositeOperation = "source-over";

		}
		this.draw = true;
	}

	private clearMovement(entityID: number) {
		let clr = this.shanMogh.get(entityID)
		if (clr) {
			if (clr[3] !== 0) {
				const cx2 = clr[0].x + clr[1] / 2;
				const cy2 = clr[0].y + clr[2] / 2;
				this.movementCtx.save();
				this.movementCtx.translate(cx2, cy2);
				this.movementCtx.rotate(clr[3]);
				this.movementCtx.translate(-cx2, -cy2);
				this.movementCtx.clearRect(clr[0].x, clr[0].y, clr[1], clr[2]);
				this.movementCtx.restore();
			} else {
				this.movementCtx.clearRect(clr[0].x, clr[0].y, clr[1], clr[2]);
			}
			this.shanMogh.delete(entityID)
			this.draw = true;
		}
		const anjClr = this.anjana.get(entityID)
		if (anjClr) {
			this.maskCtx.clearRect(anjClr[0].x, anjClr[0].y, anjClr[1], anjClr[2])
			this.anjana.delete(entityID)
			this.draw = true;
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

	render() {
		if (!staticTexture) return;
		this.ctx.clearRect(0, 0, this._texture.width, this._texture.height)
		const sx = this.loc.x + staticTexture.info.offsetX
		const sy = this.loc.y + staticTexture.info.offsetY
		this.ctx.drawImage(staticTexture, sx, sy, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height)
		this.ctx.drawImage(this.movementLayer, 0, 0, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height);

		this.fogCtx.clearRect(0, 0, this.fogLayer.width, this.fogLayer.height);
		this.fogCtx.globalCompositeOperation = "source-over";
		this.fogCtx.fillStyle = "rgba(0,0,0,0.8)"
		this.fogCtx.fillRect(0, 0, this.fogLayer.width, this.fogLayer.height);
		this.fogCtx.globalCompositeOperation = "destination-out";
		this.fogCtx.drawImage(this.fogMask, 0, 0)

		this.ctx.drawImage(this.fogLayer, 0, 0, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height);
	}

}
