import { hud, hudCtx, screenWorld, screenWorldCtx, camera } from "./game/setup";
import { edge, setCameraWidth,} from "./game/init";
import type { Vector2D } from "./game/types";
import { addVectors, multiplyVector, normalizeVector, samePoint, subtractVectors, vectorLerp } from "./game/utils";
import { Player } from "./game/noise";


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

hud.onwheel = (e) => {
	const factor = e.deltaY > 0 ? 1.1 : 0.9;
	setCameraWidth(camera.primary.texture.width * factor);
};

function drawDebug(ctx: CanvasRenderingContext2D, items: Record<string, string | number>, x = 10, y = 10, lineH = 15) {
	ctx.font = "10px sans-serif"
	ctx.fillStyle = "rgb(25,255,255)"
	for (const [label, value] of Object.entries(items)) {
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
	if (moveCam.x !== 0 || moveCam.y !== 0) {
		camera.primary.position = vectorLerp(camera.primary.position, addVectors(camera.primary.position, multiplyVector(moveCam, dt * 3)), 0.05);
	}

	if (walk.length) {
		if (samePoint(Player.position, walk[0], 5)) walk.shift();
		else {
			const dir = normalizeVector(subtractVectors(walk[0], Player.position));
			Player.applyForce(multiplyVector(dir, 0.2), Player.com, dt);
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
		hudCtx.clearRect(0, 0, screenWorld.width, screenWorld.height)
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

