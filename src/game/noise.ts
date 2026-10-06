import { player } from "./classes/player";
import { browns, movables, randomRange, staticQuad, worldSize } from "./setup";
import { drawRandomPolygon } from "./shape/draw";
import type { Vector2D } from "./types";
import { distSq } from "./utils";



type circle = { c: Vector2D, r2: number, r: number };

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
const rand = mulberry32(1337);


const totalCell = 100;
const GAP = 50;
const GRID_N = Math.ceil(Math.sqrt(totalCell));
const margin = 200;
const x0 = worldSize.v1.x + margin, x1 = worldSize.v2.x - margin;
const y0 = worldSize.v1.y + margin, y1 = worldSize.v2.y - margin;
const cw = (x1 - x0) / GRID_N, ch = (y1 - y0) / GRID_N;

let placed = 0;
for (let gy = 0; gy < GRID_N && placed < totalCell; gy++) {
	for (let gx = 0; gx < GRID_N && placed < totalCell; gx++) {
		const x = x0 + (gx + 0.35 + rand() * 0.3) * cw;
		const y = y0 + (gy + 0.35 + rand() * 0.3) * ch;
		placed++;
		const left2 = (x - worldSize.v1.x) ** 2;
		const right2 = (worldSize.v2.x - x) ** 2;
		const top2 = (y - worldSize.v1.y) ** 2;
		const bottom2 = (worldSize.v2.y - y) ** 2;
		const dist = XC.map(c => {
			const d = Math.sqrt(distSq(c.c, { x, y }));
			return d - c.r - GAP >= 0 ? (d - c.r - GAP) ** 2 : -1;
		})
		const rad2 = Math.max(0, Math.min(left2, right2, top2, bottom2, ...dist))
		const rad = Math.sqrt(rad2);
		if(rad < 60) continue;
		XC.push({ c: { x, y }, r2: rad2, r: rad });
		avoidBox.push({ v1: { x: x - rad, y: y - rad }, v2: { x: x + rad, y: y + rad } })


	const points = 3 + Math.floor(Math.random() * 14);
	const zIndex = Math.floor(randomRange(-3, 3))
	staticQuad.insert(drawRandomPolygon({ x, y }, points, rad, zIndex, browns[zIndex + 3] as any));
	}
}


const spawn = (() => {
	for (let i = 0; i < 500; i++) {
		const x = x0 + rand() * (x1 - x0);
		const y = y0 + rand() * (y1 - y0);
		if (XC.every(c => distSq(c.c, { x, y }) >= c.r2)) return { x, y };
	}
	for (let x = x0; x <= x1; x += 100)
		for (let y = y0; y <= y1; y += 100)
			if (XC.every(c => distSq(c.c, { x, y }) >= c.r2)) return { x, y };
	return { x: x0, y: y0 };
})();
const Player = new player(spawn)
movables.push(Player)
export {Player}
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
