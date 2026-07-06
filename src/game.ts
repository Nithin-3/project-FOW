import { Camera } from "./game/camera";
import { Light } from "./game/light";
import { Quad } from "./game/QuadTree";
import { drawRandomPolygon } from "./game/shape/draw";
import type { Polygon, Vector2D } from "./game/types";
import { addVectors, multiplyVector, vectorLerp } from "./game/utils";

const world = document.getElementById('world') as HTMLCanvasElement;
const fog = document.getElementById('fog') as HTMLCanvasElement;
const worldCtx = world.getContext('2d')!;
const fogCtx = fog.getContext('2d')!;

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
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const quad = new Quad({ v1: { x: -2000, y: -2000 }, v2: { x: 2000, y: 2000 } }, 100, 100, 10)
const cam = new Camera({ TL: { x: 10, y: -50 }, width: 900, height: 600 })
for (let i = 0; i < 300; i++) {
	const x = Math.random() * world.width * 2.9;
	const y = Math.random() * world.height * 2.9;
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 80 + Math.random() * 170;
	quad.insert(drawRandomPolygon({ x, y }, points, radius));
}



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

let lasttime = performance.now();

function gameloop() {
	const now = performance.now()
	const dt = Math.min(now - lasttime, 50)
	lasttime = now;

	const { width, height } = world;

	if (moveCam.x !== 0 || moveCam.y !== 0) {
		const camS = cam.boundingBox().v1;
		const to = addVectors(camS, multiplyVector(moveCam, 1.5 * dt))
		cam.updateCamera(vectorLerp(camS, to, 0.1))
	}

	const camBB = cam.boundingBox();
	const camWorldW = camBB.v2.x - camBB.v1.x;
	const camWorldH = camBB.v2.y - camBB.v1.y;
	const scaleX = width / camWorldW;
	const scaleY = height / camWorldH;
	const scale = scaleX < scaleY ? scaleX : scaleY;


	const localPts: { bb: { v1: Vector2D, v2: Vector2D }, localP: Polygon }[] = []

	worldCtx.clearRect(0, 0, width, height);
	fogCtx.clearRect(0, 0, width, height);
	fogCtx.fillStyle = "rgba(0,0,0,0.8)";
	fogCtx.fillRect(0, 0, width, height);

	quad.getBB(camBB).forEach(o => {
		o.render(worldCtx, cam.world2screen(o.boundingBox.v1, width, height))
	});

	const localLight: { inst: Light; l: { x: number, y: number, r: number }; poly: Polygon[] }[] = []
	lights.forEach(v => {
		const box = v.boundingBox()
		if (!cam.isRender(box.v1, box.v2)) return;
		const lightView = quad.getBB(box);
		const screenPos = cam.world2screen(v.loc, width, height);
		const visiblePolys: Polygon[] = []
		for (const o of lightView) {
			if (!v.isRender(o.boundingBox.v1, o.boundingBox.v2)) continue;
			const pointLocal = cam.world2screen(o.boundingBox.v1, width, height)
			visiblePolys.push(o.localPoints(pointLocal))
			// NOTE: debug line
			const center = vectorLerp(pointLocal,cam.world2screen(o.boundingBox.v2, width, height),0.5)

			fogCtx.beginPath();
			fogCtx.lineWidth = 3
			fogCtx.moveTo(screenPos.x, screenPos.y);
			fogCtx.lineTo(center.x, center.y);
			fogCtx.strokeStyle = "red"
			fogCtx.stroke()
		}
		// TODO:
		// dont scale radius -> read boundingBox on screen set smallest size or draw elips
		localLight.push({ inst: v, l: { x: screenPos.x, y: screenPos.y, r: v.radius * scale }, poly: visiblePolys });




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

	fogCtx.font = "10px sans-serif"
	fogCtx.fillStyle = "red"
	fogCtx.fillText(`fps: ${Math.ceil(1000 / dt)}`, 10, 10)
	fogCtx.fillText(`visible Polygon: ${localPts.length}`, 10, 20)
	fogCtx.fillText(`visible Polygon points: ${localPts.reduce((sum, row) => sum + row.localP.length, 0)}`, 10, 30)
	fogCtx.fillText(`visible lights: ${localLight.length}`, 10, 40)

	requestAnimationFrame(gameloop)
}

gameloop()
