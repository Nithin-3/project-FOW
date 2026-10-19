import type { Vector2D } from "../../src/game/types";
import { Entity } from "../../src/game/classes/Entity";

type RECT = { width: number; height: number };

export class Camera extends Entity {
	private cam: RECT;
	private loc: Vector2D;
	private SW = 0;
	private SH = 0;
	private _scaleX = 1;
	private _scaleY = 1;

	private _texture: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;

	private layer: OffscreenCanvas;
	layerCtx: OffscreenCanvasRenderingContext2D;

	private draw = true;


	private targetWidth: number;
	private zoomAnchor?: Vector2D;
	private minWidth: number = 950;
	private maxWidth: number = 4000;

	get position(): Vector2D { return this.loc }
	set position(v: Vector2D) {
		this.loc = v;
		this._updateBounds();
		this.draw = true;
	}

	get texture(): OffscreenCanvas { this.draw = false; return this._texture }

	get width(): number { return this.cam.width }
	get height(): number { return this.cam.height }

	get stateChanged(): boolean { return this.draw }

	invalidate() { this.draw = true }

	constructor(loc: Vector2D, width: number, height: number) {
		super()
		this.cam = { width, height };
		this.loc = loc;
		this.targetWidth = width;

		this._texture = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.layer = new OffscreenCanvas(this.cam.width, this.cam.height);
		this.ctx = this._texture.getContext('2d')!;
		this.layerCtx = this.layer.getContext('2d')!;

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

	private _getHeight(width: number): number {
		return width / (window.innerWidth / window.innerHeight);
	}

	private _ensureScale(screenW: number, screenH: number) {
		if (screenW !== this.SW || screenH !== this.SH) {
			this.SW = screenW;
			this.SH = screenH;
			this.updateSize(this.cam.width, this._getHeight(this.cam.width))
		}
	}

	handleResize() {
		this._ensureScale(window.innerWidth, window.innerHeight);
		this.targetWidth = this.cam.width;
		this.zoomAnchor = undefined;
	}

	updateSize(width: number, height: number, anchor?: Vector2D) {
		const worldAnchor = anchor ? this.screen2world(anchor) : undefined;
		this.cam.width = width;
		this.cam.height = height;
		this._scaleX = this.SW / width;
		this._scaleY = this.SH / height;
		this.layer.width = width;
		this.layer.height = height;
		this._texture.width = width;
		this._texture.height = height;

		if (anchor && worldAnchor)
			this.loc = { x: worldAnchor.x - anchor.x / this._scaleX, y: worldAnchor.y - anchor.y / this._scaleY }

		this._updateBounds();
		this.draw = true
	}

	zoom(factor: number, anchor: Vector2D) {
		this.targetWidth = Math.min(this.maxWidth, Math.max(this.minWidth, this.targetWidth * factor));
		this.zoomAnchor = anchor;
	}

	updateZoom() {
		if (!this.zoomAnchor) return;
		const diff = this.targetWidth - this.cam.width;
		if (Math.abs(diff) < 0.5) {
			if (this.cam.width !== this.targetWidth)
				this.updateSize(this.targetWidth, this._getHeight(this.targetWidth), this.zoomAnchor);
			this.zoomAnchor = undefined;
			return;
		}
		this.updateSize(this.cam.width + diff * 0.18, this._getHeight(this.cam.width + diff * 0.18), this.zoomAnchor);
	}

	panBy(screenDelta: Vector2D) {
		this.position = {
			x: this.loc.x - screenDelta.x / this._scaleX,
			y: this.loc.y - screenDelta.y / this._scaleY,
		};
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

	world2camera(v: Vector2D): Vector2D {
		return { x: v.x - this.loc.x, y: v.y - this.loc.y };
	}

	clearLayer() {
		this.layerCtx.clearRect(0, 0, this.layer.width, this.layer.height);
	}

	render() {
		this.ctx.clearRect(0, 0, this._texture.width, this._texture.height)
		this.ctx.drawImage(this.layer, 0, 0, this.cam.width, this.cam.height, 0, 0, this.cam.width, this.cam.height);
	}
}
