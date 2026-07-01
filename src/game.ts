import { gameObjects } from "./game/init";
import { drawRandomPolygon } from "./game/shape/draw";
import { drawShadow } from "./game/shape/shadow";

const world = document.getElementById('world') as HTMLCanvasElement;
const fog = document.getElementById('fog') as HTMLCanvasElement;
const worldCtx = world.getContext('2d')!;
const fogCtx = fog.getContext('2d')!;

interface Light { x: number; y: number; r: number; }

function resizeCanvas() {
	fog.width = window.innerWidth;
	fog.height = window.innerHeight;
	world.width = window.innerWidth;
	world.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

worldCtx.fillStyle = '#fff';
for (let i = 0; i < 5; i++) {
	const x = Math.random() * world.width;
	const y = Math.random() * world.height;
	const points = 3 + Math.floor(Math.random() * 14);
	const radius = 80 + Math.random() * 170;
	drawRandomPolygon(worldCtx, { x, y }, points, radius);
}

const { width, height } = fog;
fogCtx.clearRect(0, 0, width, height);

fogCtx.fillStyle = "rgba(0,0,0,0.85)";
fogCtx.fillRect(0, 0, width, height);

document.addEventListener("mousemove", (e) => {
	const { width, height } = fog;

	const lights: Light[] = [
		{ x: e.clientX, y: e.clientY, r: 150 },
		{ x: 200, y: 200, r: 120 },
		{ x: 800, y: 500, r: 140 },
		{ x: 600, y: 700, r: 100 },

	];

	fogCtx.clearRect(0, 0, width, height);

	// Step 1: dark overlay
	fogCtx.fillStyle = "rgba(0,0,0,0.85)";
	fogCtx.fillRect(0, 0, width, height);

	// Step 2: accumulate visible regions from all lights
	const visCanvas = new OffscreenCanvas(width, height);
	const visCtx = visCanvas.getContext('2d')!;

	for (const light of lights) {
		const tempCanvas = new OffscreenCanvas(width, height);
		const tempCtx = tempCanvas.getContext('2d')!;

		tempCtx.fillStyle = "white";
		tempCtx.beginPath();
		tempCtx.arc(light.x, light.y, light.r, 0, Math.PI * 2);
		tempCtx.fill();

		tempCtx.globalCompositeOperation = "destination-out";
		for (const polygon of gameObjects) {
			drawShadow(tempCtx as any, { x: light.x, y: light.y }, light.r, polygon.points, "white");
		}
		tempCtx.globalCompositeOperation = "source-over";

		visCtx.globalCompositeOperation = "lighter";
		visCtx.drawImage(tempCanvas, 0, 0);
	}

	// Step 3: cut visible union from fog
	fogCtx.globalCompositeOperation = "destination-out";
	fogCtx.drawImage(visCanvas, 0, 0);
	fogCtx.globalCompositeOperation = "source-over";

	// Draw light indicators
	for (const light of lights) {
		fogCtx.beginPath();
		fogCtx.arc(light.x, light.y, 5, 0, Math.PI * 2);
		fogCtx.fillStyle = "rgba(255,0,0,1)";
		fogCtx.fill();
	}
})
