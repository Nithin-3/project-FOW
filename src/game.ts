import { Camera } from "./game/camera";
import { Entity } from "./game/Entity";
import { Light } from "./game/light";
import { Quad } from "./game/QuadTree";
import { drawRandomPolygon } from "./game/shape/draw";
import type { Polygon, Vector2D } from "./game/types";
import { addVectors, multiplyVector, subtractVectors, vectorLerp } from "./game/utils";

const world = document.getElementById('world') as HTMLCanvasElement;
const fog = document.getElementById('fog') as HTMLCanvasElement;
const hud = document.getElementById('HUD') as HTMLCanvasElement;
const worldCtx = world.getContext('2d')!;
const fogCtx = fog.getContext('2d')!;
const hudCtx = hud.getContext('2d')!;

let _visCanvas: OffscreenCanvas | null = null;
let _visCtx: OffscreenCanvasRenderingContext2D | null = null;

function _ensureVisCanvas(w: number, h: number) {
	if (!_visCanvas || _visCanvas.width !== w || _visCanvas.height !== h) {
		_visCanvas = new OffscreenCanvas(w, h);
		_visCtx = _visCanvas.getContext('2d')!;
	}
}

const _lightCanvases: OffscreenCanvas[] = [];
const _lightCtxs: OffscreenCanvasRenderingContext2D[] = [];

function _ensureLightCanvases(w: number, h: number, count: number) {
	for (let i = 0; i < count; i++) {
		if (i >= _lightCanvases.length) {
			const c = new OffscreenCanvas(w, h);
			_lightCtxs.push(c.getContext('2d')!);
			_lightCanvases.push(c);
		} else if (_lightCanvases[i].width !== w || _lightCanvases[i].height !== h) {
			_lightCanvases[i].width = w;
			_lightCanvases[i].height = h;
		}
	}
}



function resizeCanvas() {
	fog.width = window.innerWidth;
	fog.height = window.innerHeight;
	world.width = window.innerWidth;
	world.height = window.innerHeight;
	// cam.updateSize(window.innerWidth / 2, window.innerHeight / 2); // TODO: remove it match screen aspect ratio
}

window.addEventListener('resize', resizeCanvas);

const quad = new Quad({ v1: { x: -2000, y: -2000 }, v2: { x: 2000, y: 2000 } }, 100, 100, 10)
const cam = new Camera({ TL: { x: 10, y: -50 }, width: 960, height: 540 })
for (let i = 0; i < 300; i++) {
	const x = Math.random() * window.innerWidth * 2.9;
	const y = Math.random() * window.innerHeight * 2.9;
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 50 + Math.random() * 170;
	quad.insert(drawRandomPolygon({ x, y }, points, radius));
}

resizeCanvas();


const lights: Light[] = [
	new Light({ x: 0, y: 0 }, 150),
	new Light({ x: 200, y: 200, }, 120),
	new Light({ x: 800, y: 500, }, 140),
	new Light({ x: 600, y: 700, }, 100)

];

document.addEventListener("mousemove", (e) => {
	const { width, height } = world;
	const worldP = cam.screen2world({ x: e.clientX, y: e.clientY }, width, height)
	lights[0].update(worldP)
})

const moveCam: Vector2D = { x: 0, y: 0 };
document.addEventListener("keydown", (event) => {
	switch (event.key) {
		case "h":
			moveCam.x = -1;
			break;
		case "j":
			moveCam.y = 1;
			break;
		case "k":
			moveCam.y = -1;
			break;
		case "l":
			moveCam.x = 1;
			break;
	}
});

document.addEventListener("keyup", (event) => {
	switch (event.key) {
		case "h":
			moveCam.x = 0;
			break;
		case "j":
			moveCam.y = 0;
			break;
		case "k":
			moveCam.y = 0;
			break;
		case "l":
			moveCam.x = 0;
			break;
	}
});

function drawDebug(ctx: CanvasRenderingContext2D, items: Record<string, string | number>, x = 10, y = 10, lineH = 10) {
	ctx.font = "10px sans-serif"
	ctx.fillStyle = "rgb(25,255,255)"
	for (const [label, value] of Object.entries(items)) {
		ctx.fillText(`${label}: ${value}`, x, y);
		y += lineH;
	}
}

let lasttime = performance.now();

const { width, height } = world;
// worldCtx.clearRect(0, 0, width, height);
quad.getBB(cam.boundingBox()).forEach(o => {
	const v1 = cam.world2screen(o.boundingBox().v1, width, height)
	const v2 = cam.world2screen(o.boundingBox().v2, width, height)
	Entity.isRender(o.boundingBox(), cam.boundingBox()) && o.render(worldCtx, v1, v2)
});

let acc = 0;
let totPolyCam = 0, totpolycamPnt = 0;
function gameloop() {
	const now = performance.now()
	const dt = now - lasttime
	lasttime = now;
	acc += dt;

	const { width, height } = world;

	fogCtx.clearRect(0, 0, width, height);
	fogCtx.fillStyle = "rgba(0,0,0,0.8)";
	fogCtx.fillRect(0, 0, width, height);
	if (moveCam.x !== 0 || moveCam.y !== 0) {
		totPolyCam = 0;
		totpolycamPnt = 0;
		const camS = cam.boundingBox().v1;
		const to = addVectors(camS, multiplyVector(moveCam, 1.5 * dt))
		cam.updateCamera(vectorLerp(camS, to, 0.1))
		worldCtx.clearRect(0, 0, width, height);
		quad.getBB(cam.boundingBox()).forEach(o => {
			const v1 = cam.world2screen(o.boundingBox().v1, width, height)
			const v2 = cam.world2screen(o.boundingBox().v2, width, height)
			if (Entity.isRender(o.boundingBox(), cam.boundingBox())) {
				totPolyCam++;
				totpolycamPnt += o.render(worldCtx, v1, v2).length


				// NOTE: debug border 
				worldCtx.beginPath()
				worldCtx.lineWidth = 1;
				worldCtx.moveTo(v1.x, v1.y);
				worldCtx.lineTo(v2.x, v1.y);
				worldCtx.lineTo(v2.x, v2.y);
				worldCtx.lineTo(v1.x, v2.y);
				worldCtx.closePath();
				// worldCtx.rect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);
				worldCtx.strokeStyle = o.color
				worldCtx.stroke()
			}
		});
	}


	const localLight: { inst: Light; l: { x: number, y: number, r: number }; poly: Polygon[] }[] = []
	lights.forEach(v => {
		const box = v.boundingBox()
		if (!Entity.isRender(box, cam.boundingBox())) return;
		const lightView = quad.getBB(box);
		const visiblePolys: Polygon[] = []
		const l1 = cam.world2screen(v.boundingBox().v1, width, height)
		const l2 = cam.world2screen(v.boundingBox().v2, width, height)
		const lwidth = (l2.x - l1.x) / 2;
		const lheight = (l2.y - l1.y) / 2;
		const screenPos = { x: l1.x + lwidth, y: l1.y + lheight };
		for (const o of lightView) {
			const v1 = cam.world2screen(o.boundingBox().v1, width, height)
			const v2 = cam.world2screen(o.boundingBox().v2, width, height)
			if (!Entity.isRender({ v1, v2 }, { v1: l1, v2: l2 })) continue;
			visiblePolys.push(o.localPoints(v1, v2))
			// NOTE: debug line
			const center = vectorLerp(v1, v2, 0.5)

			fogCtx.beginPath();
			fogCtx.lineWidth = 1
			fogCtx.moveTo(screenPos.x, screenPos.y);
			fogCtx.lineTo(center.x, center.y);
			fogCtx.strokeStyle = "red"
			fogCtx.stroke()
		}
		// TODO:
		// dont scale radius -> read boundingBox on screen set smallest size or draw elips
		localLight.push({ inst: v, l: { x: l1.x + lwidth, y: l1.y + lheight, r: lheight < lwidth ? lheight : lwidth }, poly: visiblePolys });
		// NOTE: debug border 
		fogCtx.beginPath()
		fogCtx.lineWidth = 1;
		fogCtx.moveTo(l1.x, l1.y);
		fogCtx.lineTo(l2.x, l1.y);
		fogCtx.lineTo(l2.x, l2.y);
		fogCtx.lineTo(l1.x, l2.y);
		fogCtx.closePath();
		// fogrldCtx.rect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);
		fogCtx.strokeStyle = "red"
		fogCtx.stroke()
	})


	_ensureVisCanvas(width, height);
	_visCtx!.clearRect(0, 0, width, height);

	_ensureLightCanvases(width, height, localLight.length);
	for (let i = 0; i < localLight.length; i++) {
		const light = localLight[i];
		const ctx = _lightCtxs[i];
		ctx.clearRect(0, 0, width, height);

		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.arc(light.l.x, light.l.y, light.l.r, 0, Math.PI * 2);
		ctx.fill();

		ctx.globalCompositeOperation = "destination-out";
		Light.drawshadow(ctx, { x: light.l.x, y: light.l.y }, light.l.r, light.poly, "#fff" as any);
		ctx.globalCompositeOperation = "source-over";

		_visCtx!.globalCompositeOperation = "lighter";
		_visCtx!.drawImage(_lightCanvases[i], 0, 0);
	}

	fogCtx.globalCompositeOperation = "destination-out";
	fogCtx.drawImage(_visCanvas!, 0, 0);
	fogCtx.globalCompositeOperation = "source-over";

	if (acc >= 1000) {
		acc = 0;
		hudCtx.clearRect(0, 0, width, height)
		drawDebug(hudCtx, {
			fps: Math.ceil(1000 / dt),
			'visible Polygon': totPolyCam,
			'visible Polygon points': totpolycamPnt,
			'visible lights': localLight.length,
			'lights polygon': localLight.reduce((sum, row) => sum + row.poly.length, 0),
		})
	}

	requestAnimationFrame(gameloop)
}

gameloop()
