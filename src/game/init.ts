import { Camera } from "./camera";
import type { GameObject } from "./GameObject";
import { Quad } from "./QuadTree";
import { drawRandomPolygon } from "./shape/draw";


const fog = document.getElementById('fog') as HTMLCanvasElement;
export const hud = document.getElementById('HUD') as HTMLCanvasElement;
export const world = document.querySelector<HTMLCanvasElement>("#world")!;
export const worldCtx = world.getContext('2d')!;
export const fogCtx = fog.getContext('2d')!;
export const hudCtx = hud.getContext('2d')!;

const cameraWidth = 950
type WorldSize = {
	v1: { x: number; y: number };
	v2: { x: number; y: number };
};

const worldSize: WorldSize = { v1: { x: -2100, y: -2100 }, v2: { x: 2100, y: 2100 } };
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
	edge = Math.min(window.innerWidth, window.innerHeight) * 0.1
	cam.worldSize(window.innerWidth, window.innerHeight)
}


export const staticQuad = new Quad<GameObject>(worldSize, 20)
export const cam = new Camera({ TL: { x: -2000, y: -2000 }, width: cameraWidth, height: getHeight(cameraWidth) })
function random(min: number, max: number) {
	return Math.random() * (max - min) + min;
}
for (let i = 0; i < 300; i++) {
	const x = random(worldSize.v1.x, worldSize.v2.x);
	const y = random(worldSize.v1.y, worldSize.v2.y);
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 50 + Math.random() * 170;
	staticQuad.insert(drawRandomPolygon({ x, y }, points, radius));
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

const ctx = staticTexture.getContext("2d")!;
ctx.translate(info.offsetX, info.offsetY);

for (const o of staticQuad.getAll()) {

	const { v1, v2 } = o.boundingBox()
	o.render(ctx, v1, v2)

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

