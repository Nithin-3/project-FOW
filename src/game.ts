import { cam, hud, hudCtx, world, worldCtx, edge, fogCtx, maskCtx, maskLayer, triQuad } from "./game/init";
import { player } from "./game/classes/player";
import type { Vector2D } from "./game/types";
import { multiplyVector, normalizeVector, subtractVectors, } from "./game/utils";
import { pointInPolygon } from "./game/tools";
import type { tri } from "./game/classes/triangle";
import { dijkstra } from "./game/A*";


let moveCam: Vector2D = { x: 0, y: 0 };
// let movePl: Vector2D = { x: 0, y: 0 };
document.addEventListener("keydown", (event) => {
	switch (event.key) {
		case "h":
			break;
		case "j":
			break;
		case "k":
			break;
		case "l":
			break;
	}
});

document.addEventListener("keyup", (event) => {
	switch (event.key) {
		case "h":
			break;
		case "j":
			break;
		case "k":
			break;
		case "l":
			break;
	}
});


const pl = new player({ x: 0, y: 0 })
const findPath: [tri | null, tri | null] = [null, null]
let pathSource: Vector2D = { x: 0, y: 0 };
let pathTarget: Vector2D = { x: 0, y: 0 };
hud.onclick = async (e) => {
	const x = e.offsetX;
	const y = e.offsetY;
	const loc = cam.screen2world({ x, y })
	pl.loc = loc
	const v1 = cam.world2screen(pl.boundingBox().v1)
	const v2 = cam.world2screen(pl.boundingBox().v2)
	pl.render(worldCtx, v1, v2)

	fogCtx.clearRect(0, 0, world.width, world.height);
	maskCtx.globalCompositeOperation = "lighter";
	maskCtx.drawImage(pl.shadow.texture, 0, 0);

	triQuad.getLeafQuad(loc).forEach(v => {
		if (pointInPolygon(loc, v.vertex)) {
			if (e.ctrlKey) {
				if (!findPath[0]) {
					findPath[0] = v;
					pathSource = loc;
				} else {
					findPath[1] = v;
					pathTarget = loc;
				}
			}

			const drawTri = (t: typeof v) => {
				const a = cam.world2screen(t.vertex[0]);
				const b = cam.world2screen(t.vertex[1]);
				const c = cam.world2screen(t.vertex[2]);
				worldCtx.beginPath();
				worldCtx.moveTo(a.x, a.y);
				worldCtx.lineTo(b.x, b.y);
				worldCtx.lineTo(c.x, c.y);
				worldCtx.closePath();
				worldCtx.strokeStyle = "purple";
				worldCtx.lineWidth = 2;
				worldCtx.stroke();
			};
			drawTri(v);
			v.neighbors.forEach(ne => ne && drawTri(ne.neig));
		}
	})

	if (e.ctrlKey && findPath[0] && findPath[1]) {
		if (findPath[0] !== findPath[1]) {
			const path = await dijkstra(findPath[0], findPath[1], pathSource, pathTarget);
			path.forEach(t => {
				const a = cam.world2screen(t.vertex[0]);
				const b = cam.world2screen(t.vertex[1]);
				const c = cam.world2screen(t.vertex[2]);
				worldCtx.beginPath();
				worldCtx.moveTo(a.x, a.y);
				worldCtx.lineTo(b.x, b.y);
				worldCtx.lineTo(c.x, c.y);
				worldCtx.closePath();
				worldCtx.fillStyle = "rgba(255,255,0,0.3)";
				worldCtx.fill();
				worldCtx.strokeStyle = "yellow";
				worldCtx.lineWidth = 2;
				worldCtx.stroke();
			});
		}
		findPath[0] = null;
		findPath[1] = null;
	}
}

hud.onmousemove = (e) => {
	const x = e.offsetX;
	const y = e.offsetY;

	hudCtx.beginPath();
	hudCtx.arc(x, y, 3, 0, Math.PI * 2);
	hudCtx.strokeStyle = "red";
	hudCtx.lineWidth = 3;
	hudCtx.stroke();


	if (x <= edge || x >= hud.width - edge || y <= edge || y >= hud.height - edge) {
		moveCam = normalizeVector(subtractVectors(
			{ x, y },
			{ x: hud.width / 2, y: hud.height / 2 }
		));

		hudCtx.beginPath();
		hudCtx.arc(x, y, 6, 0, Math.PI * 2);
		hudCtx.fillStyle = "green";
		hudCtx.fill();
	} else {
		moveCam = { x: 0, y: 0 };
	}
};

hud.onmouseleave = () => moveCam = { x: 0, y: 0 };

function drawDebug(ctx: CanvasRenderingContext2D, items: Record<string, string | number>, x = 10, y = 10, lineH = 15) {
	ctx.font = "10px sans-serif"
	ctx.fillStyle = "rgb(25,255,255)"
	for (const [label, value] of Object.entries(items)) {
		ctx.fillText(`${label}: ${value}`, x, y);
		y += lineH;
	}
}

let lasttime = performance.now();


let acc = 0;
let frameCount = 0;
function gameloop() {
	const now = performance.now()
	const dt = now - lasttime
	lasttime = now;
	acc += dt;
	frameCount++;

	const { width, height } = world;

	if (moveCam.x !== 0 || moveCam.y !== 0) {
		cam.moveCamera(multiplyVector(moveCam, dt * 3));
		worldCtx.clearRect(0, 0, width, height);
		fogCtx.clearRect(0, 0, world.width, world.height);
		maskCtx.clearRect(0, 0, world.width, world.height);
		// fogCtx.fillStyle = "rgba(0,0,0,0.8)";
		// fogCtx.fillRect(0, 0, width, height);
		worldCtx.drawImage(cam.texture, 0, 0, width, height)
	}


	// fogCtx.clearRect(0, 0, width, height);
	// fogCtx.fillStyle = "rgba(0,0,0,0.8)";
	// fogCtx.fillRect(0, 0, width, height);
	// fogCtx.globalCompositeOperation = "destination-out";
	// fogCtx.drawImage(maskLayer, 0, 0);
	// fogCtx.globalCompositeOperation = "source-over";

	// const localLight: { inst: Light; l: { x: number, y: number, r: number }; poly: Polygon[] }[] = []
	// lights.forEach(v => {
	// 	const box = v.boundingBox()
	// 	if (!Entity.isRender(box, cam.boundingBox())) return;
	// 	const lightView = quad.getBB(box);
	// 	const visiblePolys: Polygon[] = []
	// 	const l1 = cam.world2screen(v.boundingBox().v1)
	// 	const l2 = cam.world2screen(v.boundingBox().v2)
	// 	const lwidth = (l2.x - l1.x) / 2;
	// 	const lheight = (l2.y - l1.y) / 2;
	// 	const screenPos = { x: l1.x + lwidth, y: l1.y + lheight };
	// 	for (const o of lightView) {
	// 		const v1 = cam.world2screen(o.boundingBox().v1)
	// 		const v2 = cam.world2screen(o.boundingBox().v2)
	// 		if (!Entity.isRender({ v1, v2 }, { v1: l1, v2: l2 })) continue;
	// 		const localPoints = o.localPoints(v1, v2)
	// 		visiblePolys.push(localPoints)
	// 		totpolyLigPnt += localPoints.length
	// 		// NOTE: debug line
	// 		const center = vectorLerp(v1, v2, 0.5)
	//
	// 		fogCtx.beginPath();
	// 		fogCtx.lineWidth = 1
	// 		fogCtx.moveTo(screenPos.x, screenPos.y);
	// 		fogCtx.lineTo(center.x, center.y);
	// 		fogCtx.strokeStyle = "red"
	// 		fogCtx.stroke()
	// 	}
	// 	localLight.push({ inst: v, l: { x: l1.x + lwidth, y: l1.y + lheight, r: lheight < lwidth ? lheight : lwidth }, poly: visiblePolys });
	// 	// NOTE: debug border 
	// 	fogCtx.beginPath()
	// 	fogCtx.lineWidth = 1;
	// 	fogCtx.rect(l1.x, l1.y, l2.x - l1.x, l2.y - l1.y);
	// 	fogCtx.strokeStyle = "red"
	// 	fogCtx.stroke()
	// })
	//
	//
	// _ensureVisCanvas(width, height);
	// _visCtx!.clearRect(0, 0, width, height);
	//
	// _ensureLightCanvases(width, height, localLight.length);
	// for (let i = 0; i < localLight.length; i++) {
	// 	const light = localLight[i];
	// 	const ctx = _lightCtxs[i];
	// 	ctx.clearRect(0, 0, width, height);
	//
	// 	ctx.fillStyle = "white";
	// 	ctx.beginPath();
	// 	ctx.arc(light.l.x, light.l.y, light.l.r, 0, Math.PI * 2);
	// 	ctx.fill();
	//
	// 	ctx.globalCompositeOperation = "destination-out";
	// 	Light.drawshadow(ctx, { x: light.l.x, y: light.l.y }, light.l.r, light.poly, "#fff" as any);
	// 	ctx.globalCompositeOperation = "source-over";
	//
	// 	_visCtx!.globalCompositeOperation = "lighter";
	// 	_visCtx!.drawImage(_lightCanvases[i], 0, 0);
	// }
	//
	//
	if (acc >= 1000) {
		const avg = frameCount;
		frameCount = 0;
		acc = 0;
		hudCtx.clearRect(0, 0, width, height)
		drawDebug(hudCtx, {
			fps: Math.ceil(1000 / dt),
			frameTime: `${dt} ms`,
			frameGenerated: avg,
		})
	}

	requestAnimationFrame(gameloop)
}

gameloop()
