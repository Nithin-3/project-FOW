import { Camera } from "./game/camera";
import { gameObjects } from "./game/init";
import { Light } from "./game/light";
import { drawRandomPolygon } from "./game/shape/draw";
import type { Polygon, Vector2D } from "./game/types";
import { multiplyVector } from "./game/utils";

const world = document.getElementById('world') as HTMLCanvasElement;
const fog = document.getElementById('fog') as HTMLCanvasElement;
const worldCtx = world.getContext('2d')!;
const fogCtx = fog.getContext('2d')!;


function resizeCanvas() {
	fog.width = window.innerWidth;
	fog.height = window.innerHeight;
	world.width = window.innerWidth;
	world.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

for (let i = 0; i < 300; i++) {
	const x = Math.random() * world.width + 600;
	const y = Math.random() * world.height + 600;
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 80 + Math.random() * 170;
	drawRandomPolygon({ x, y }, points, radius);
}



const lights: Light[] = [
	new Light({ x: 0, y: 0 }, 150),
	new Light({ x: 200, y: 200, }, 120),
	new Light({ x: 800, y: 500, }, 140),
	new Light({ x: 600, y: 700, }, 100)

];

const cam = new Camera({ TL: { x: 0, y: 0 }, width: 900, height: 600 })
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

let lasttime = performance.now(), accumulator = 0, accumulatorHUD = 0;
const fixdt = 1000 / 60;
const fixdtHUD = 1000 / 5;

function gameloop() {
	const now = performance.now()
	const dt = now - lasttime;
	lasttime = now;
	accumulator += dt;
	accumulatorHUD += dt;

	const { width, height } = world;
	const localPts: { bb: { v1: Vector2D, v2: Vector2D }, localP: Polygon }[] = []
	const localLight: { l: { x: number, y: number, r: number }, poly: Polygon[] }[] = []
	while (accumulator >= fixdt) {
		accumulator -= dt;

		worldCtx.clearRect(0, 0, width, height);
		gameObjects.forEach((G) => {
			if (!cam.isRender(G.boundingBox.v1, G.boundingBox.v2)) return;
			const localP = G.render(worldCtx, cam.world2screen(G.boundingBox.v1, width, height));
			// const loc1 = cam.world2screen(G.boundingBox.v1, width, height)
			// const loc2 = cam.world2screen(G.boundingBox.v2, width, height)
			// worldCtx.beginPath();
			// worldCtx.moveTo(loc1.x, loc1.y);
			// worldCtx.lineTo(loc1.x, loc2.y);
			// worldCtx.lineTo(loc2.x, loc2.y);
			// worldCtx.lineTo(loc2.x, loc1.y);
			// worldCtx.closePath()
			// worldCtx.strokeStyle = "red"
			// worldCtx.stroke()
			localPts.push({ bb: G.boundingBox, localP })
		});

		const camBB = cam.boundingBox();
		const camWorldW = camBB.v2.x - camBB.v1.x;
		const camWorldH = camBB.v2.y - camBB.v1.y;
		const scaleX = width / camWorldW;
		const scaleY = height / camWorldH;
		const scale = scaleX < scaleY ? scaleX : scaleY;

		lights.forEach(v => {
			const box = v.boundingBox()
			if (!cam.isRender(box.v1, box.v2)) return;
			const screenPos = cam.world2screen(v.loc, width, height);
			localLight.push({ l: { x: screenPos.x, y: screenPos.y, r: v.radius * scale }, poly: localPts.filter(o => v.isRender(o.bb.v1, o.bb.v2)).map(o => o.localP) });
		})

		if (moveCam.x !== 0 || moveCam.y !== 0) {
			cam.moveCamera(multiplyVector(moveCam, 1.5 * dt))
		}


		fogCtx.clearRect(0, 0, width, height);
		fogCtx.fillStyle = "rgba(0,0,0,0.8)";
		fogCtx.fillRect(0, 0, width, height);

		const visCanvas = new OffscreenCanvas(width, height);
		const visCtx = visCanvas.getContext('2d')!;
		for (const light of localLight) {
			const tempCanvas = new OffscreenCanvas(width, height);
			const tempCtx = tempCanvas.getContext('2d')!;

			tempCtx.fillStyle = "white";
			tempCtx.beginPath();
			tempCtx.arc(light.l.x, light.l.y, light.l.r, 0, Math.PI * 2);
			tempCtx.fill();

			tempCtx.globalCompositeOperation = "destination-out";
			Light.drawshadow(tempCtx, { x: light.l.x, y: light.l.y }, light.l.r, light.poly, "#fff" as any);
			tempCtx.globalCompositeOperation = "source-over"; visCtx.globalCompositeOperation = "lighter";
			visCtx.drawImage(tempCanvas, 0, 0);
		}
		fogCtx.globalCompositeOperation = "destination-out";
		fogCtx.drawImage(visCanvas, 0, 0);
		fogCtx.globalCompositeOperation = "source-over";
	}

	while (accumulatorHUD >= fixdtHUD) {
		accumulatorHUD -= dt;

		fogCtx.fillStyle = "red"
		fogCtx.fillText(`fps: ${Math.ceil(1000 / dt)}`, 10, 10)
		fogCtx.fillText(`visible Polygon: ${localPts.length}`, 10, 20)
		fogCtx.fillText(`visible Polygon points: ${localPts.reduce((sum, row) => sum + row.localP.length, 0)}`, 10, 30)
		fogCtx.fillText(`visible lights: ${localLight.length}`, 10, 40)

	}
	requestAnimationFrame(gameloop)
}

gameloop()
