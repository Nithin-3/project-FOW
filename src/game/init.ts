import { Camera } from "./classes/camera";
import { Entity } from "./classes/Entity";
import { player } from "./classes/player";
import { Quad } from "./classes/QuadTree";
import { triangulate } from "./navigationMesh";
import { drawRandomPolygon } from "./shape/draw";
import { vectorLerp } from "./utils";
import { hud, screenWorld, worldSize, info, browns, randomRange, camera, movables } from "./setup";
import type { Polygon, Vector2D } from "./types";
import type { GameObject } from "./classes/GameObject";
import type { tri } from "./classes/triangle";

let cameraWidth = 950

const staticTexture = new OffscreenCanvas(info.width, info.height) as OffscreenCanvas & { info: typeof info };
staticTexture.info = info;
const ctx = staticTexture.getContext("2d")!;

const staticQuad = new Quad<GameObject>(worldSize, 20)
const triQuad = new Quad<tri>(worldSize, 50)

for (let i = 0; i < 400; i++) {
	const x = randomRange(worldSize.v1.x + 200, worldSize.v2.x - 200);
	const y = randomRange(worldSize.v1.y + 200, worldSize.v2.y - 200);
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 50 + Math.random() * 170;
	const zIndex = Math.floor(randomRange(-3, 3))
	staticQuad.insert(drawRandomPolygon({ x, y }, points, radius, zIndex, browns[zIndex + 3] as any));
}

const staticObj = [...staticQuad.getAll()].sort((a, b) => a.zIndex - b.zIndex);
const worldRect: Polygon = [worldSize.v1, { x: worldSize.v1.x, y: worldSize.v2.y }, worldSize.v2, { x: worldSize.v2.x, y: worldSize.v1.y },];

triangulate(worldRect, triQuad, staticObj.map(o => o.points));

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

const grass = await loadImage("grass_128x128.png");
const pattern = ctx.createPattern(grass, "repeat");
if (pattern) {
	ctx.fillStyle = pattern;
	ctx.fillRect(0, 0, staticTexture.width, staticTexture.height);
}
ctx.translate(info.offsetX, info.offsetY);


for (const o of staticObj) {
	const { v1, v2 } = o.boundingBox()
	o.render(ctx, v1, v2)
	if (o.door?.length) {
		for (let i = 0; i < o.door.length; i += 2) {
			const a = o.door[i];
			const b = o.door[i + 1];
			ctx.strokeStyle = "#FFD700";
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();

		}
		const dupDoor = [...o.door]
		const inside = [...staticQuad.getBB(o.boundingBox())].filter(inner => o.zIndex < inner.zIndex && Entity.isRender(inner.boundingBox(), o.boundingBox()));
		const triangles = triangulate(o.points, triQuad, inside.map(inner => inner.points))
		for (let i = 0; i < triangles.length; i++) {
			let candidates: Set<tri> | null = null;
			for (let d = dupDoor.length - 2; d >= 0; d -= 2) {
				if (triangles[i].hasEdge(dupDoor[d], dupDoor[d + 1])) {
					if (!candidates) { const { v1, v2 } = triangles[i].boundingBox(); candidates = triQuad.getBB({ v1: vectorLerp(v1, v2, -0.1), v2: vectorLerp(v2, v1, -0.1) }); }
					for (const t of candidates) {
						if (t.hasEdge(dupDoor[d], dupDoor[d + 1]) && t !== triangles[i]) {
							if (t.insert(triangles[i])) { dupDoor.splice(d, 2); break; }
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
}

ctx.beginPath()
ctx.lineWidth = 20
ctx.rect(worldSize.v1.x, worldSize.v1.y, info.width, info.height)
ctx.strokeStyle = "#663399"
ctx.stroke()

const getHeight = (width: number): number => (width / (window.innerWidth / window.innerHeight));

camera['primary'] = new Camera({ x: -2000, y: -2000 }, cameraWidth, getHeight(cameraWidth))

const x = randomRange(worldSize.v1.x + 1000, worldSize.v2.x - 1000);
const y = randomRange(worldSize.v1.y + 1000, worldSize.v2.y - 1000);
const Player = new player({x,y} )
movables.push(Player)


// const drawArrow = (ctx: OffscreenCanvasRenderingContext2D, from: Vector2D, to: Vector2D, size = 5) => {
// 	const angle = Math.atan2(to.y - from.y, to.x - from.x);
// 	ctx.beginPath();
// 	ctx.moveTo(from.x, from.y);
// 	ctx.lineTo(to.x, to.y);
// 	ctx.stroke();
// 	ctx.beginPath();
// 	ctx.moveTo(to.x, to.y);
// 	ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
// 	ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
// 	ctx.closePath();
// 	ctx.fill();
// };
//
// ctx.lineWidth = 1;
// ctx.strokeStyle = "cyan";
// ctx.fillStyle = "rgba(255, 127, 255,0.3)";
// for (const poly of triQuad.getAll()) {
// 	ctx.beginPath();
// 	ctx.moveTo(poly.vertex[0].x, poly.vertex[0].y);
// 	for (let i = 1; i < poly.vertex.length; i++)
// 		ctx.lineTo(poly.vertex[i].x, poly.vertex[i].y);
// 	ctx.closePath();
// 	ctx.fill();
// 	ctx.stroke()
// }
//
// ctx.lineWidth = 1;
// ctx.strokeStyle = "#000000";
// ctx.fillStyle = "#000000";
// for (const tri of triQuad.getAll()) {
// 	for (let n = 0; n < tri.neighbors.length; n++) {
// 		drawArrow(ctx, vectorLerp(tri.neighbors[n].edge[0], tri.neighbors[n].edge[1], 0.5), tri.neighbors[n].neig.center);
// 	}
// }
//
//

let edge: number = 0;
function resizeCanvas() {
	hud.width = window.innerWidth;
	hud.height = window.innerHeight;
	screenWorld.width = window.innerWidth;
	screenWorld.height = window.innerHeight;
	edge = Math.min(window.innerWidth, window.innerHeight) * 0.1
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const setCameraWidth = (w: number) => {
	cameraWidth = Math.min(1500, Math.max(950, w));
	camera.primary.updateSize(cameraWidth, getHeight(cameraWidth));
};
export { staticQuad, triQuad, staticTexture, edge, Player, setCameraWidth, getHeight };
