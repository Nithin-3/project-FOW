import { cam, hud, hudCtx, staticQuad, world, worldCtx, edge } from "./game/init";
import type { Vector2D } from "./game/types";
import { addVectors, multiplyVector, normalizeVector, subtractVectors, vectorLerp } from "./game/utils";


let moveCam: Vector2D = { x: 0, y: 0 };
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
function drawDebug(ctx: CanvasRenderingContext2D, items: Record<string, string | number>, x = 10, y = 10, lineH = 10) {
	ctx.font = "10px sans-serif"
	ctx.fillStyle = "rgb(25,255,255)"
	for (const [label, value] of Object.entries(items)) {
		ctx.fillText(`${label}: ${value}`, x, y);
		y += lineH;
	}
}

let lasttime = performance.now();


let acc = 0;
let totPolyCam = 0, totpolyLigPnt = 0;
function gameloop() {
	const now = performance.now()
	const dt = now - lasttime
	lasttime = now;
	acc += dt;

	const { width, height } = world;

	if (moveCam.x !== 0 || moveCam.y !== 0) {
		cam.moveCamera(multiplyVector(moveCam, dt));
		worldCtx.clearRect(0, 0, width, height);
		worldCtx.drawImage(cam.texture, 0, 0, width, height)
		staticQuad.drawDebug(worldCtx, ({ v1, v2 }) => {
			return { v1: cam.world2screen(v1), v2: cam.world2screen(v2) }
		})
	}


	// fogCtx.clearRect(0, 0, width, height);
	// fogCtx.fillStyle = "rgba(0,0,0,0.8)";
	// fogCtx.fillRect(0, 0, width, height);
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
	// fogCtx.globalCompositeOperation = "destination-out";
	// fogCtx.drawImage(_visCanvas!, 0, 0);
	// fogCtx.globalCompositeOperation = "source-over";
	//
	if (acc >= 1000) {
		acc = 0;
		hudCtx.clearRect(0, 0, width, height)
		drawDebug(hudCtx, {
			fps: Math.ceil(1000 / dt),
			'visible Polygon': totPolyCam,
			// 'visible lights': localLight.length,
			'lights polygon': totpolyLigPnt,
		})
	}

	requestAnimationFrame(gameloop)
}

gameloop()
