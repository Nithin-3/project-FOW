import { Camera } from "./classes/camera";
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

// browns[4] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpaperaccess.com%2Ffull%2F3362773.jpg&f=1&nofb=1&ipt=0acb4a50ef620c6dc9e3b28e649175eff8f602ba68ad5ed5cb0411184ffb2e8b") as any;
// browns[5] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimg.freepik.com%2Fpremium-photo%2Fnatural-rock-stone-surface-seamless-texture_900706-4380.jpg&f=1&nofb=1&ipt=e1cb40814f3ab96ed460d45ceff753fb81c3613b7e3aeb6e1c087c8c8e0b81b7") as any;
// browns[3] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.pixabay.com%2Fphoto%2F2021%2F09%2F13%2F10%2F44%2Fseashore-6620965_1280.jpg&f=1&nofb=1&ipt=b292380ccd75e5565be74d5dda5938073243751fab353885739810e05f44472c") as any;
// browns[2] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.texturex.com%2Fwp-content%2Fuploads%2F2018%2F03%2FStone-Texture-wall-large-rock-grey-image.jpg&f=1&nofb=1&ipt=6ae0ecd0a30791d24e9ac10843ec1cb54c5f240f0d5ea364e3dd659dfef38997") as any;

for (let i = 0; i < 500; i++) {
	const x = randomRange(worldSize.v1.x + 200, worldSize.v2.x - 200);
	const y = randomRange(worldSize.v1.y + 200, worldSize.v2.y - 200);
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 50 + Math.random() * 170;
	const zIndex = Math.floor(randomRange(-3, 3))
	staticQuad.insert(drawRandomPolygon({ x, y }, points, radius, zIndex, browns[zIndex + 3] as any));
}

const staticObj = [...staticQuad.getAll()].sort((a, b) => a.zIndex - b.zIndex);
const worldRect: Polygon = [worldSize.v1, { x: worldSize.v1.x, y: worldSize.v2.y }, worldSize.v2, { x: worldSize.v2.x, y: worldSize.v1.y },];
const allDoors: Vector2D[] = staticObj.flatMap(o => o.door ?? []);
triangulate(worldRect, allDoors, triQuad, staticObj.map(o => o.points));

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
		const inside = [...staticQuad.getBB(o.boundingBox())].filter(inner => o.zIndex < inner.zIndex);
		const triangles = triangulate(o.points, allDoors, triQuad, inside.map(inner => inner.points))
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
const Player = new player({ x, y })
movables.push(Player)



ctx.lineWidth = 2;
ctx.strokeStyle = "cyan";
for (const poly of triQuad.getAll()) {
	for (const edge of poly.collitionEdge) {
		ctx.beginPath();
		ctx.moveTo(edge[0].x, edge[0].y);
		ctx.lineTo(edge[1].x, edge[1].y);
		ctx.stroke();

	}

}



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
