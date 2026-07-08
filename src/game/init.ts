import { Camera } from "./camera";
import type { GameObject } from "./GameObject";
import { player } from "./player";
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

const worldSize: WorldSize = { v1: { x: -2500, y: -2500 }, v2: { x: 2500, y: 2500 } };
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


export const staticQuad = new Quad<GameObject>({ v1: { x: -2000, y: -2000 }, v2: { x: 2000, y: 2000 } }, 30)
export const cam = new Camera({ TL: { x: -2000, y: -2000 }, width: cameraWidth, height: getHeight(cameraWidth) })
for (let i = 0; i < 600; i++) {
	const x = Math.random() * 3800 - 1900;
	const y = Math.random() * 3800 - 1900;
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 50 + Math.random() * 170;
	staticQuad.insert(drawRandomPolygon({ x, y }, points, radius));
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);


console.log(world);


world.addEventListener("click", (e) => {
	const loc = cam.screen2world({ x: e.clientX, y: e.clientY })
	const pl = new player(loc)
	pl.render(worldCtx, loc, cam.world2screen(pl.boundingBox().v2))

})

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

ctx.lineWidth = 20
ctx.rect(worldSize.v1.x, worldSize.v1.y, info.width, info.height)
ctx.strokeStyle = "#663399"
ctx.stroke()

staticQuad.getAll().forEach(o => o.render(ctx, o.boundingBox().v1, o.boundingBox().v2))
