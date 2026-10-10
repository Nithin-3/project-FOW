import { Camera } from "./classes/camera";
import { player } from "./classes/player";
import { browns, camera, movables, staticQuad, worldSize } from "./setup";
import { drawRandomPolygon } from "./shape/draw";
import type { Vector2D } from "./types";
import { distSq } from "./utils";



type circle = { c: Vector2D, r: number };

const XC: circle[] = [];
const avoidBox: { v1: Vector2D, v2: Vector2D }[] = [];

function mulberry32(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function getDet(a: number, b: number, c: number) {
	let h = 2166136261
	h = Math.imul(h ^ Math.fround(a * 100000), 16777619);
	h = Math.imul(h ^ Math.fround(b * 100000), 16777619);
	h = Math.imul(h ^ Math.fround(c * 100000), 16777619);

	// final mix so low and high bits are well scrambled
	h ^= h >>> 15;
	h = Math.imul(h, 2246822507);
	h ^= h >>> 13;
	h >>>= 0;

	// second, different hash value derived from h
	let g = Math.imul(h ^ 0x9E3779B1, 2654435761);
	g ^= g >>> 16;
	g >>>= 0;

	return {
		points: 3 + (h % 18),   // 3 to 20  (18 values)
		bonus: -3 + (g % 6),    // -3 to 3  (6 values)
	};
}


const rand = mulberry32(1337);


const totalCircle = 100;
const GAP = 30;
const MAX_RADIUS = Infinity;
const GRID_N = Math.ceil(Math.sqrt(totalCircle));
const margin = 200;
const x0 = worldSize.v1.x + margin, x1 = worldSize.v2.x - margin;
const y0 = worldSize.v1.y + margin, y1 = worldSize.v2.y - margin;
const cw = (x1 - x0) / GRID_N, ch = (y1 - y0) / GRID_N;

let placed = 0;
for (let gy = 0; gy < GRID_N && placed < totalCircle; gy++) {
	for (let gx = 0; gx < GRID_N && placed < totalCircle; gx++) {
		const x = x0 + (gx + 0.35 + rand() * 0.3) * cw;
		const y = y0 + (gy + 0.35 + rand() * 0.3) * ch;
		placed++;
		const left = (x - worldSize.v1.x);
		const right = (worldSize.v2.x - x);
		const top = (y - worldSize.v1.y);
		const bottom = (worldSize.v2.y - y);
		const dist = XC.map(c => {
			const d = Math.sqrt(distSq(c.c, { x, y }));
			return d - c.r - GAP >= 0 ? (d - c.r - GAP) : -1;
		})
		const rad = Math.max(0, Math.min(MAX_RADIUS, left, right, top, bottom, ...dist))
		if (rad < 60) continue;
		XC.push({ c: { x, y }, r: rad });
		avoidBox.push({ v1: { x: x - rad, y: y - rad }, v2: { x: x + rad, y: y + rad } })


		const det = getDet(Math.floor(x), Math.floor(y), Math.floor(rad));
		staticQuad.insert(drawRandomPolygon({ x, y }, det.points, rad, det.bonus, browns[det.bonus + 3] as any));
	}
}


const spawn = (() => {
	for (let i = 0; i < 500; i++) {
		const x = x0 + rand() * (x1 - x0);
		const y = y0 + rand() * (y1 - y0);
		if (XC.every(c => distSq(c.c, { x, y }) >= c.r ** 2)) return { x, y };
	}
	for (let x = x0; x <= x1; x += 100)
		for (let y = y0; y <= y1; y += 100)
			if (XC.every(c => distSq(c.c, { x, y }) >= c.r ** 2)) return { x, y };
	return { x: x0, y: y0 };
})();
const Player = new player(spawn)
movables.push(Player) // update movables before camera

let cameraWidth = 950
let targetWidth = 950
let zoomAnchor: Vector2D | undefined
const getHeight = (width: number): number => (width / (window.innerWidth / window.innerHeight));

const clampWidth = (w: number) => Math.min(1500, Math.max(950, w));

const zoomCamera = (factor: number, anchor: Vector2D) => {
	targetWidth = clampWidth(targetWidth * factor);
	zoomAnchor = anchor;
};

const updateCameraZoom = () => {
	if (!zoomAnchor) return;
	const diff = targetWidth - cameraWidth;
	if (Math.abs(diff) < 0.5) {
		if (cameraWidth !== targetWidth) {
			cameraWidth = targetWidth;
			camera.primary.updateSize(cameraWidth, getHeight(cameraWidth), zoomAnchor);
		}
		zoomAnchor = undefined;
		return;
	}
	cameraWidth += diff * 0.18;
	camera.primary.updateSize(cameraWidth, getHeight(cameraWidth), zoomAnchor);
};

camera['primary'] = new Camera({ x: spawn.x - cameraWidth / 2, y: spawn.y - getHeight(cameraWidth) / 2 }, cameraWidth, getHeight(cameraWidth))


export { Player, zoomCamera, updateCameraZoom }

// debug
export function draw(ctx: OffscreenCanvasRenderingContext2D) {
	ctx.save();
	ctx.lineWidth = 2;
	ctx.strokeStyle = "#ffffff";
	for (const { c, r } of XC) {
		ctx.beginPath();
		ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.restore();
}
