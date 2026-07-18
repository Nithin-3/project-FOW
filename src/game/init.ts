import { Camera } from "./classes/camera";
import { Entity } from "./classes/Entity";
import type { GameObject } from "./classes/GameObject";
import { triangulate } from "./navigationMesh";
import { Quad } from "./classes/QuadTree";
import { drawRandomPolygon } from "./shape/draw";
import type { Polygon, Vector2D } from "./types";
import type { tri } from "./classes/triangle";
import { vectorLerp } from "./utils";


const fog = document.getElementById('fog') as HTMLCanvasElement;
export const hud = document.getElementById('HUD') as HTMLCanvasElement;
export const world = document.querySelector<HTMLCanvasElement>("#world")!;
export const maskLayer = new OffscreenCanvas(window.innerWidth, window.innerHeight);
export const maskCtx = maskLayer.getContext('2d')!;
export const worldCtx = world.getContext('2d')!;
export const fogCtx = fog.getContext('2d')!;
export const hudCtx = hud.getContext('2d')!;

let cameraWidth = 1000
export const setCameraWidth = (w: number) => {
	cameraWidth = w;
	cam.updateSize(cameraWidth, getHeight(cameraWidth));
};

const worldSize = { v1: { x: -4100, y: -4100 }, v2: { x: 2100, y: 2100 } };
const getWorldInfo = (world: any) => ({ width: world.v2.x - world.v1.x, height: world.v2.y - world.v1.y, offsetX: -world.v1.x, offsetY: -world.v1.y, });


export const getHeight = (width: number): number => (width / (window.innerWidth / window.innerHeight));

export const staticQuad = new Quad<GameObject>(worldSize, 20)
export const triQuad = new Quad<tri>(worldSize, 50)
export const cam = new Camera({ loc: { x: -2000, y: -2000 }, width: cameraWidth, height: getHeight(cameraWidth) })


const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const browns = [
	"#D2B48C", // Light Brown
	"#C19A6B", // Tan
	"#A67B5B", // Camel Brown
	"#8B5A2B", // Medium Brown
	"#6B4423", // Saddle Brown
	"#3E2723", // Dark Brown
];


for (let i = 0; i < 600; i++) {
	const x = randomRange(worldSize.v1.x, worldSize.v2.x);
	const y = randomRange(worldSize.v1.y, worldSize.v2.y);
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 50 + Math.random() * 170;
	const zIndex = Math.floor(randomRange(-3, 3))
	staticQuad.insert(drawRandomPolygon({ x, y }, points, radius, zIndex, browns[zIndex + 3] as any));
}

type WorldInfo = {
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
};


const info = getWorldInfo(worldSize);

export const staticTexture = new OffscreenCanvas(info.width, info.height) as OffscreenCanvas & { info: WorldInfo };
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

const grass = await loadImage("grass_128x128.png");

const pattern = ctx.createPattern(grass, "repeat");
if (pattern) {
	ctx.fillStyle = pattern;
	ctx.fillRect(0, 0, staticTexture.width, staticTexture.height);
}

ctx.translate(info.offsetX, info.offsetY);

const staticObj = [...staticQuad.getAll()].sort((a, b) => a.zIndex - b.zIndex);
const worldRect: Polygon = [worldSize.v1, { x: worldSize.v1.x, y: worldSize.v2.y }, worldSize.v2, { x: worldSize.v2.x, y: worldSize.v1.y },];

triangulate(worldRect, triQuad, staticObj.map(o => o.points));

for (const o of staticObj) {

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

		const dupDoor = [...o.door]
		const inside = [...staticQuad.getBB(o.boundingBox())].filter(inner => o.zIndex < inner.zIndex && Entity.isRender(inner.boundingBox(), o.boundingBox()));
		const triangles = triangulate(o.points, triQuad, inside.map(inner => inner.points))
		for (let i = 0; i < triangles.length; i++) {
			let candidates: Set<tri> | null = null;
			for (let d = dupDoor.length - 2; d >= 0; d -= 2) {
				if (triangles[i].hasEdge(dupDoor[d], dupDoor[d + 1])) {
					if (!candidates) {
						const { v1, v2 } = triangles[i].boundingBox()
						candidates = triQuad.getBB({ v1: vectorLerp(v1, v2, -0.1), v2: vectorLerp(v2, v1, -0.1) });
					}
					for (const t of candidates) {
						if (t.hasEdge(dupDoor[d], dupDoor[d + 1]) && t !== triangles[i]) {
							if (t.insert(triangles[i], false)) {
								triangles[i].weight = 4
								dupDoor.splice(d, 2);
								break;
							}
						}
					}
				}
			}
		}

		if (dupDoor.length === o.door.length) {
			for (let j = 0; j < triangles.length; j++)
				triQuad.remove(triangles[j])
		}

	}

	// ctx.beginPath()
	// ctx.lineWidth = 1
	// ctx.rect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);
	// ctx.strokeStyle = o.fill as any
	// ctx.stroke()
}



// triQuad.drawDebug(ctx, ({ v1, v2 }) => ({ v1, v2 }))

ctx.beginPath()
ctx.lineWidth = 20
ctx.rect(worldSize.v1.x, worldSize.v1.y, info.width, info.height)
ctx.strokeStyle = "#663399"
ctx.stroke()


const drawArrow = (ctx: OffscreenCanvasRenderingContext2D, from: Vector2D, to: Vector2D, size = 20) => {
	const angle = Math.atan2(to.y - from.y, to.x - from.x);
	ctx.beginPath();
	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(to.x, to.y);
	ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
	ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
	ctx.closePath();
	ctx.stroke();
};

ctx.lineWidth = 5;
ctx.strokeStyle = "#000000";
ctx.fillStyle = "#000000";
for (const tri of triQuad.getAll()) {
	for (let n = 0; n < tri.neighbors.length; n++) {
		drawArrow(ctx, tri.center, tri.neighbors[n].neig.center);
	}
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
	cam.screenSize(window.innerWidth, window.innerHeight)
	cam.updateSize(cameraWidth, getHeight(cameraWidth))
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

