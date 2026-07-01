import { gameObjects } from "./game/init";
import { drawRandomPolygon } from "./game/shape/draw";
import { drawShadow } from "./game/shape/shadow";

const world = document.getElementById('world') as HTMLCanvasElement;
const fog = document.getElementById('fog') as HTMLCanvasElement;
const worldCtx = world.getContext('2d')!;
const fogCtx = fog.getContext('2d')!;
const circleRad = 150;


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
	drawRandomPolygon(worldCtx, {x,y}, points, radius);
}



const { width, height } = fog;
fogCtx.clearRect(0, 0, width, height);

// draw shadow
fogCtx.fillStyle = "rgba(0,0,0,0.85)";
fogCtx.fillRect(0, 0, width, height);

document.addEventListener("mousemove", (e) => {
	const { width, height } = fog;
	fogCtx.clearRect(0, 0, width, height);

	// draw shadow
	fogCtx.fillStyle = "rgba(0,0,0,0.85)";
	fogCtx.fillRect(0, 0, width, height);

	// view area
	fogCtx.globalCompositeOperation = "destination-out";
	fogCtx.beginPath();
	fogCtx.arc(e.clientX, e.clientY, circleRad, 0, Math.PI * 2);
	fogCtx.fill();
	fogCtx.globalCompositeOperation = "source-over";

	for (const polygon of gameObjects) {
		drawShadow(fogCtx, { x: e.clientX, y: e.clientY }, circleRad, polygon.points);
	}
	fogCtx.beginPath();
	fogCtx.fillStyle = "rgba(255,0,0,1)";
	fogCtx.arc(e.clientX, e.clientY, circleRad * 0.05, 0, Math.PI * 2);
	fogCtx.fill();
})
