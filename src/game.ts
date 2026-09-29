import { hud, hudCtx, screenWorld, screenWorldCtx, camera } from "./game/setup";
import { edge, setCameraWidth, Player } from "./game/init";
import type { Vector2D } from "./game/types";
import { addVectors, closestPointOnSegment, distSq, dot, multiplyVector, normalizeVector, subtractVectors, vectorLerp } from "./game/utils";
import { moveAlongLine } from "./game/tools";


let moveCam: Vector2D = { x: 0, y: 0 };
let debugForceDir: Vector2D = { x: 0, y: 0 };
let debugForceMag = 0;
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
			// walk = roundCorners(walk);
		} catch (e) {
			console.log(e);

		}
		if (walk.length < 1) return;
		screenWorldCtx.beginPath();
		const a = camera.primary.world2screen(walk[0]);
		screenWorldCtx.moveTo(a.x, a.y);
		for (let w = 1; w < walk.length; w++) {
			const a = camera.primary.world2screen(walk[w]);
			screenWorldCtx.lineTo(a.x, a.y);
		}
		screenWorldCtx.strokeStyle = "#ffffff";
		screenWorldCtx.lineWidth = 2;
		screenWorldCtx.stroke();
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

const WALK_FORCE = 0.3;        // steering force magnitude
const WALK_TURN_SPEED = 5;     // how fast the body rotates toward its heading
const WALK_ARRIVE = 12;        // distance to a waypoint that counts as reached
const WALK_LOOKAHEAD = 45;      // small lookahead along current segment (door-safe)

function update(dt: number) {
	if (moveCam.x !== 0 || moveCam.y !== 0) {
		camera.primary.position = vectorLerp(camera.primary.position, addVectors(camera.primary.position, multiplyVector(moveCam, dt * 3)), 0.05);
	}

	if (walk.length) {
		const pos = Player.position;

		// Advance every waypoint we've reached or passed. Consuming in a loop
		// (rather than one per frame) means no 1-frame pause at each waypoint.
		while (walk.length) {
			const g = walk[0], nx = walk[1];
			if (distSq(pos, g) <= WALK_ARRIVE * WALK_ARRIVE) { walk.shift(); continue; }
			if (nx) {
				const leg = normalizeVector(subtractVectors(nx, g));
				// Passed = beyond g along the leg AND nearer nx than g; the second
				// condition stops a double-back corner from shifting too early.
				if (dot(subtractVectors(pos, g), leg) > 0 && distSq(pos, nx) < distSq(pos, g)) {
					walk.shift(); continue;
				}
			}
			break;
		}
		if (!walk.length) return;

		const goal = walk[0], next = walk[1];
		let dir: Vector2D;
		if (next) {
			// Project onto current segment, then advance a small lookahead along it.
			// This pulls the player toward the line, corrects cross-track error,
			// and rounds the corner at the doorway just enough to be smooth
			// without cutting into the wall/doorframe.
			const cp = closestPointOnSegment(pos, goal, next);
			const target = moveAlongLine(cp, next, WALK_LOOKAHEAD);
			dir = normalizeVector(subtractVectors(target, pos));
			if (dir.x === 0 && dir.y === 0) return;
		} else {
			// Last waypoint: aim straight at it
			dir = normalizeVector(subtractVectors(goal, pos));
			if (dir.x === 0 && dir.y === 0) return;
		}

		// If a wall blocked the last step and we're steering into it, slide
		// along the wall instead of pressing into it (force magnitude and
		// physics are unchanged; only the steering direction bends).
		const bn = Player.blockedNormal;
		if (bn && dot(dir, bn) < 0) {
			const into = dot(dir, bn);
			const tx = dir.x - bn.x * into;
			const ty = dir.y - bn.y * into;
			if (tx * tx + ty * ty > 1e-6) {
				dir = normalizeVector({ x: tx, y: ty });
			} else {
				// steering points straight into the wall: slide along it toward the goal
				const gx = goal.x - pos.x;
				const gy = goal.y - pos.y;
				let ttx = -bn.y, tty = bn.x;
				if (ttx * gx + tty * gy < 0) { ttx = -ttx; tty = -tty; }
				dir = { x: ttx, y: tty };
			}
		}

		debugForceDir = dir;
		debugForceMag = WALK_FORCE;
		Player.applyForce(multiplyVector(dir, WALK_FORCE), Player.com, dt);
		const targetAngle = Math.atan2(-dir.x, dir.y) + Math.PI;
		Player.rotateToward(targetAngle, WALK_TURN_SPEED, dt);
	}
}

function render() {
	const { width, height } = screenWorld;
	if (camera.primary.stateChanged) {
		camera.primary.render()
		screenWorldCtx.clearRect(0, 0, width, height);
		screenWorldCtx.drawImage(camera.primary.texture, 0, 0, width, height)
	}

	// Debug: force vector
	if (debugForceMag > 0) {
		const pos = Player.position;
		const fx = pos.x + debugForceDir.x * debugForceMag * 50;
		const fy = pos.y + debugForceDir.y * debugForceMag * 50;
		const a = camera.primary.world2screen(pos);
		const b = camera.primary.world2screen({ x: fx, y: fy });
		screenWorldCtx.beginPath();
		screenWorldCtx.moveTo(a.x, a.y);
		screenWorldCtx.lineTo(b.x, b.y);
		screenWorldCtx.strokeStyle = "#ffff00";
		screenWorldCtx.lineWidth = 2;
		screenWorldCtx.stroke();
	}

	// Debug: next 5 walk points
	if (walk.length > 0) {
		screenWorldCtx.beginPath();
		const start = camera.primary.world2screen(walk[0]);
		screenWorldCtx.moveTo(start.x, start.y);
		for (let i = 1; i < Math.min(5, walk.length); i++) {
			const p = camera.primary.world2screen(walk[i]);
			screenWorldCtx.lineTo(p.x, p.y);
		}
		screenWorldCtx.strokeStyle = "#00ffff";
		screenWorldCtx.lineWidth = 2;
		screenWorldCtx.stroke();
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

