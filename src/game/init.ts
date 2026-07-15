import { Camera } from "./classes/camera";
import { Entity } from "./classes/Entity";
import type { GameObject } from "./classes/GameObject";
import { triangulate } from "./navigationMesh";
import { Quad } from "./classes/QuadTree";
import { drawRandomPolygon } from "./shape/draw";
import type { Polygon, Vector2D } from "./types";
import { key } from "./utils";
import type { tri } from "./classes/triangle";


const fog = document.getElementById('fog') as HTMLCanvasElement;
export const hud = document.getElementById('HUD') as HTMLCanvasElement;
export const world = document.querySelector<HTMLCanvasElement>("#world")!;
export const maskLayer = new OffscreenCanvas(window.innerWidth, window.innerHeight);
export const maskCtx = maskLayer.getContext('2d')!;
export const worldCtx = world.getContext('2d')!;
export const fogCtx = fog.getContext('2d')!;
export const hudCtx = hud.getContext('2d')!;

const cameraWidth = 950

const worldSize = { v1: { x: -4100, y: -4100 }, v2: { x: 2100, y: 2100 } };
const getWorldInfo = (world: any) => ({ width: world.v2.x - world.v1.x, height: world.v2.y - world.v1.y, offsetX: -world.v1.x, offsetY: -world.v1.y, });


const getHeight = (width: number): number => (width / (window.innerWidth / window.innerHeight));

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


for (let i = 0; i < 300; i++) {
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

const doorObj = new Map<string, { isDraw: boolean, o: GameObject, doorTri?: tri[] }>();
const doorTri: { edge: [Vector2D, Vector2D], tri: tri }[] = [];
for (const o of [...staticQuad.getAll()].sort((a, b) => a.zIndex - b.zIndex)) {

	const { v1, v2 } = o.boundingBox()
	o.render(ctx, v1, v2)
	const obj = { isDraw: false, o }
	if (o.door?.length) {
		for (let i = 0; i < o.door.length; i += 2) {

			const a = o.door[i];
			const b = o.door[i + 1];
			doorObj.set(key(a), obj);
			doorObj.set(key(b), obj);



			const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
			const angle = Math.atan2(b.y - a.y, b.x - a.x);
			ctx.save();
			ctx.translate(mid.x, mid.y);
			ctx.rotate(angle);
			ctx.fillStyle = "#FFD700";
			ctx.fillRect(-8, -4, 16, 8);
			ctx.restore();

		}

		const inside = [...staticQuad.getBB(o.boundingBox())].filter(inner => inner !== o && o.zIndex < inner.zIndex && Entity.isRender(inner.boundingBox(), o.boundingBox()));
		const triangles = triangulate(o.points, triQuad, inside.map(inner => inner.points))
		for (let i = 0; i < triangles.length; i++) {
			for (let j = i + 1; j < triangles.length; j++) {
				if (triangles[i].insert(triangles[j]) === undefined) break;
			}
			for (let d = 0; d < o.door.length; d += 2) {
				if (triangles[i].hasEdge(o.door[d], o.door[d + 1])) {
					doorTri.push({ edge: [o.door[d], o.door[d + 1]], tri: triangles[i] });
					break;
				}
			}
		}

	}

	// ctx.beginPath()
	// ctx.lineWidth = 1
	// ctx.rect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);
	// ctx.strokeStyle = o.fill as any
	// ctx.stroke()
}



staticQuad.drawDebug(ctx, ({ v1, v2 }) => ({ v1, v2 }))

ctx.beginPath()
ctx.lineWidth = 20
ctx.rect(worldSize.v1.x, worldSize.v1.y, info.width, info.height)
ctx.strokeStyle = "#663399"
ctx.stroke()

// --- Triangulate the world rect with objects as holes ---
const worldRect: Polygon = [worldSize.v1, { x: worldSize.v1.x, y: worldSize.v2.y }, worldSize.v2, { x: worldSize.v2.x, y: worldSize.v1.y },];

const triangles = triangulate(worldRect, triQuad, [...staticQuad.getAll()].map(o => o.points));


rootLoop:
for (let i = 0; i < triangles.length; i++) {
	for (let j = i + 1; j < triangles.length; j++) {
		if (triangles[i].insert(triangles[j]) === undefined) continue rootLoop;
	}
	for (let d = 0; d < doorTri.length; d++) {
		if (triangles[i].hasEdge(doorTri[d].edge[0], doorTri[d].edge[1])) {
			triangles[i].insert(doorTri[d].tri);
			doorTri.splice(d, 1);
		}
	}
}

ctx.lineWidth = 0.5;
ctx.strokeStyle = "black";
for (const tri of triQuad.getAll()) {
	ctx.beginPath();
	ctx.moveTo(tri.vertex[0].x, tri.vertex[0].y);
	for (let i = 1; i < tri.vertex.length; i++) {
		ctx.lineTo(tri.vertex[i].x, tri.vertex[i].y);
	}
	ctx.closePath();
	ctx.stroke();
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

