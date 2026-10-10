import { hud, hudCtx, screenWorld, screenWorldCtx, camera } from "./game/setup";
import { edge } from "./game/init";
import type { Vector2D } from "./game/types";
import { addVectors, multiplyVector, normalizeVector, samePoint, subtractVectors, vectorLerp } from "./game/utils";
import { Player, zoomCamera, updateCameraZoom } from "./game/noise";


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


let walk: Vector2D[] = []

hud.onclick = async (e) => {
	const x = e.offsetX;
	const y = e.offsetY;
	const loc = camera.primary.screen2world({ x, y })
	if (e.ctrlKey) {
		try {
			walk = await Player!.findPath(loc)
		} catch (e) {
			console.log(e);

		}
		if (walk.length < 1) return;


		// const debugLine = camera.primary.debugLine;
		// if (debugLine) {
		// 	let l1 = walk[0];
		// 	for (let w = 1; w < walk.length; w++) {
		// 		const l2 = walk[w];
		// 		debugLine.push({ a: l1, b: l2, t: performance.now() });
		// 		l1 = l2;
		// 	}
		// }

	}
}


const prevCurs: Vector2D & { w: number, h: number } = { x: 0, y: 0, w: 0, h: 0 };

const rad = 6;
const lineWidth = 3

hud.onmousemove = (e) => {
	const x = e.offsetX;
	const y = e.offsetY;
	hudCtx.clearRect(prevCurs.x, prevCurs.y, prevCurs.w, prevCurs.h);
	hudCtx.beginPath();
	hudCtx.arc(x, y, rad, 0, Math.PI * 2);
	prevCurs.x = x - rad - lineWidth / 2 - 1;  // -1 for antialias
	prevCurs.y = y - rad - lineWidth / 2 - 1;
	prevCurs.w = (rad + lineWidth / 2 + 1) * 2;
	prevCurs.h = prevCurs.w;
	hudCtx.strokeStyle = "red";
	hudCtx.lineWidth = lineWidth;
	hudCtx.stroke();
	if (x <= edge || x >= hud.width - edge || y <= edge || y >= hud.height - edge) {
		moveCam = normalizeVector(subtractVectors(
			{ x, y },
			{ x: hud.width / 2, y: hud.height / 2 }
		));
		hudCtx.beginPath();
		hudCtx.arc(x, y, rad, 0, Math.PI * 2);
		hudCtx.strokeStyle = "green";
		hudCtx.stroke();
	} else {
		moveCam = { x: 0, y: 0 };
	}
};

hud.onmouseleave = () => moveCam = { x: 0, y: 0 };

hud.onwheel = (e) => {
	zoomCamera(e.deltaY > 0 ? 1.1 : 0.9, { x: e.offsetX, y: e.offsetY });
};

let prevDebugBox: { x: number; y: number; w: number; h: number } | undefined

function drawDebug(ctx: CanvasRenderingContext2D, items: Record<string, string | number>, x = 10, y = 10, lineH = 15, pad = 4) {
	ctx.font = "10px sans-serif"
	if (prevDebugBox) {
		ctx.clearRect(prevDebugBox.x, prevDebugBox.y, prevDebugBox.w, prevDebugBox.h)
		prevDebugBox = undefined
	}
	const entries = Object.entries(items)
	if (entries.length === 0) return

	const m = ctx.measureText("Mg")
	const ascent = m.actualBoundingBoxAscent || 8
	const descent = m.actualBoundingBoxDescent || 2

	let maxW = 0
	for (const [label, value] of entries)
		maxW = Math.max(maxW, ctx.measureText(`${label}: ${value}`).width)

	const boxX = x - pad
	const boxY = y - ascent - pad
	const boxW = maxW + pad * 2
	const boxH = (entries.length - 1) * lineH + ascent + descent + pad * 2
	prevDebugBox = { x: boxX, y: boxY, w: boxW, h: boxH }

	ctx.fillStyle = "rgb(25,255,255)"
	for (const [label, value] of entries) {
		ctx.fillText(`${label}: ${value}`, x, y);
		y += lineH;
	}
}

let lasttime = performance.now();
const FIXED_DT = 1000 / 60;
let accumulator = 0;

let acc = 0;
let frameCount = 0;
let frameTime = 0;

function update(dt: number) {
	updateCameraZoom();

	if (moveCam.x !== 0 || moveCam.y !== 0) {
		camera.primary.position = vectorLerp(camera.primary.position, addVectors(camera.primary.position, multiplyVector(moveCam, dt * 3)), 0.05);
	}

	if (walk.length) {
		if (samePoint(Player.position, walk[0], 5)) walk.shift();
		else {
			const dir = normalizeVector(subtractVectors(walk[0], Player.position));
			Player.applyForce(dir, Player.com, dt);
			const targetAngle = Math.atan2(-dir.x, dir.y) + Math.PI;
			Player.rotateToward(targetAngle, 5, dt);
		}
	}
}

function render() {
	const { width, height } = screenWorld;
	if (camera.primary.stateChanged) {
		camera.primary.render()
		screenWorldCtx.clearRect(0, 0, width, height);
		screenWorldCtx.drawImage(camera.primary.texture, 0, 0, width, height)
	}
}

function gameloop() {
	const now = performance.now()
	accumulator += Math.min(now - lasttime, 100);
	frameTime = now - lasttime;
	lasttime = now;

	while (accumulator >= FIXED_DT) {
		update(FIXED_DT);
		accumulator -= FIXED_DT;
	}

	render();

	acc += frameTime;
	frameCount++;

	if (acc >= 1000) {
		drawDebug(hudCtx, {
			frameTime: `${(acc / frameCount).toFixed(3)} ms`,
			frameGenerated: frameCount,
		})
		acc = 0;
		frameCount = 0;
	}

	requestAnimationFrame(gameloop)
}

gameloop()

