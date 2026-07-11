import { Camera } from "./camera";
import type { GameObject } from "./GameObject";
import { Quad } from "./QuadTree";
import { drawRandomPolygon } from "./shape/draw";
import { pointInPolygon, segmentIntersect, polygonCenter, lineIntersec } from "./tools";
import type { Polygon, Vector2D } from "./types";
import { cross } from "./utils";


const fog = document.getElementById('fog') as HTMLCanvasElement;
export const hud = document.getElementById('HUD') as HTMLCanvasElement;
export const world = document.querySelector<HTMLCanvasElement>("#world")!;
export const maskLayer = new OffscreenCanvas(window.innerWidth, window.innerHeight);
export const maskCtx = maskLayer.getContext('2d')!;
export const worldCtx = world.getContext('2d')!;
export const fogCtx = fog.getContext('2d')!;
export const hudCtx = hud.getContext('2d')!;

const cameraWidth = 950
type WorldSize = {
	v1: { x: number; y: number };
	v2: { x: number; y: number };
};

const worldSize: WorldSize = { v1: { x: -4100, y: -4100 }, v2: { x: 2100, y: 2100 } };
function getWorldInfo(world: WorldSize) {
	return {
		width: world.v2.x - world.v1.x,
		height: world.v2.y - world.v1.y,
		offsetX: -world.v1.x,
		offsetY: -world.v1.y,
	};
}


function getHeight(width: number): number {
	const aspectRatio = window.innerWidth / window.innerHeight;
	return width / aspectRatio;
}

export let edge: number = 0;
function resizeCanvas() {
	hud.width = window.innerWidth;
	hud.height = window.innerHeight;
	fog.width = window.innerWidth;
	fog.height = window.innerHeight;
	world.width = window.innerWidth;
	world.height = window.innerHeight;
	maskLayer.width = window.innerWidth;
	maskLayer.height = window.innerHeight;
	edge = Math.min(window.innerWidth, window.innerHeight) * 0.1
	cam.worldSize(window.innerWidth, window.innerHeight)
}


export const staticQuad = new Quad<GameObject>(worldSize, 20)
export const cam = new Camera({ TL: { x: -2000, y: -2000 }, width: cameraWidth, height: getHeight(cameraWidth) })
function random(min: number, max: number) {
	return Math.random() * (max - min) + min;
}
const browns = [
	"#D2B48C", // Light Brown
	"#C19A6B", // Tan
	"#A67B5B", // Camel Brown
	"#8B5A2B", // Medium Brown
	"#6B4423", // Saddle Brown
	"#3E2723", // Dark Brown
];
for (let i = 0; i < 300; i++) {
	const x = random(worldSize.v1.x, worldSize.v2.x);
	const y = random(worldSize.v1.y, worldSize.v2.y);
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 50 + Math.random() * 170;
	const zIndex = Math.floor(random(-3, 3))
	staticQuad.insert(drawRandomPolygon({ x, y }, points, radius, zIndex, browns[zIndex + 3] as any));
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

type WorldInfo = {
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
};

type StaticTexture = OffscreenCanvas & {
	info: WorldInfo;
};

const info = getWorldInfo(worldSize);

export const staticTexture = new OffscreenCanvas(
	info.width,
	info.height
) as StaticTexture;

staticTexture.info = info;

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

const ctx = staticTexture.getContext("2d")!;

const grass = await loadImage("sand_128x128.png");

const pattern = ctx.createPattern(grass, "repeat");
if (pattern) {
	ctx.fillStyle = pattern;
	ctx.fillRect(0, 0, staticTexture.width, staticTexture.height);
}

ctx.translate(info.offsetX, info.offsetY);

for (const o of [...staticQuad.getAll()].sort((a, b) => a.zIndex - b.zIndex)) {

	const { v1, v2 } = o.boundingBox()
	o.render(ctx, v1, v2)

	if (o.door?.length) {
		for (let i = 0; i < o.door.length; i += 2) {

			const a = o.door[i];
			const b = o.door[i + 1];
			const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
			const angle = Math.atan2(b.y - a.y, b.x - a.x);
			ctx.save();
			ctx.translate(mid.x, mid.y);
			ctx.rotate(angle);
			ctx.fillStyle = "#FFD700";
			ctx.fillRect(-8, -4, 16, 8);
			ctx.restore();

		}
	}

	// ctx.beginPath()
	// ctx.lineWidth = 1
	// ctx.rect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);
	// ctx.strokeStyle = o.fill as any
	// ctx.stroke()
}

staticQuad.drawDebug(ctx, ({ v1, v2 }) => {
	return { v1, v2 }
})

ctx.beginPath()
ctx.lineWidth = 20
ctx.rect(worldSize.v1.x, worldSize.v1.y, info.width, info.height)
ctx.strokeStyle = "#663399"
ctx.stroke()


// find freeSpace
//

let freeSpace: Polygon[] = [[worldSize.v1, { x: worldSize.v1.x, y: worldSize.v2.y }, worldSize.v2, { x: worldSize.v2.x, y: worldSize.v1.y }]]

function splitPolygon(poly: Polygon, a: Vector2D, b: Vector2D): Polygon[] {
	const left: Polygon = [];
	const right: Polygon = [];
	for (let i = 0; i < poly.length; i++) {
		const curr = poly[i];
		const next = poly[(i + 1) % poly.length];
		const s1 = cross(a, b, curr);
		const s2 = cross(a, b, next);

		if (s1 >= 0) left.push(curr);
		if (s1 <= 0) right.push(curr);

		if ((s1 > 0 && s2 < 0) || (s1 < 0 && s2 > 0)) {
			const p = lineIntersec(curr, next, a, b);
			if (p) { left.push(p); right.push(p); }
		}
	}
	const result: Polygon[] = [];
	if (left.length > 2) result.push(left);
	if (right.length > 2) result.push(right);
	return result;
}

function polygonsIntersect(a: Polygon, b: Polygon): boolean {
	for (const p of a) if (pointInPolygon(p, b)) return true;
	for (const p of b) if (pointInPolygon(p, a)) return true;
	for (let i = 0; i < a.length; i++) {
		const a1 = a[i], a2 = a[(i + 1) % a.length];
		for (let j = 0; j < b.length; j++) {
			if (segmentIntersect(a1, a2, b[j], b[(j + 1) % b.length])) return true;
		}
	}
	return false;
}

const objects = staticQuad.getAll();

// Partition free space by each object's edge lines, keep pieces outside each object
for (const o of objects) {
	const pts = o.points;
	const newFree: Polygon[] = [];

	for (const fs of freeSpace) {
		if (!polygonsIntersect(fs, pts)) {
			newFree.push(fs);
			continue;
		}

		let pieces: Polygon[] = [fs];

		for (let i = 0; i < pts.length; i++) {
			const a = pts[i];
			const b = pts[(i + 1) % pts.length];
			const next: Polygon[] = [];
			for (const piece of pieces) {
				if (piece.length < 3) continue;
				const split = splitPolygon(piece, a, b);
				next.push(...split);
			}
			pieces = next;
			if (pieces.length === 0) break;
		}

		for (const piece of pieces) {
			if (piece.length < 3) continue;
			const center = polygonCenter(piece);
			if (center && !pointInPolygon(center, pts)) {
				newFree.push(piece);
			}
		}
	}

	freeSpace = newFree;
}

ctx.lineWidth = 1
for (let t = 0; t < freeSpace.length; t++) {
	ctx.beginPath()
	ctx.moveTo(freeSpace[t][0].x, freeSpace[t][0].y);
	for (let p = 1; p < freeSpace[t].length; p++)
		ctx.lineTo(freeSpace[t][p].x, freeSpace[t][p].y);
	ctx.closePath()
	ctx.strokeStyle = "red"
	ctx.stroke()
}




