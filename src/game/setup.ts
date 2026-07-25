import type { Camera } from "./classes/camera";
import type { GameObject } from "./classes/GameObject";

const hud = document.getElementById('HUD') as HTMLCanvasElement;
const screenWorld = document.querySelector<HTMLCanvasElement>("#world")!;
const screenWorldCtx = screenWorld.getContext('2d')!;
const hudCtx = hud.getContext('2d')!;

const worldSize = { v1: { x: -4100, y: -4100 }, v2: { x: 2100, y: 2100 } };

type WorldInfo = {
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
};
const getWorldInfo = (world: any): WorldInfo => ({ width: world.v2.x - world.v1.x, height: world.v2.y - world.v1.y, offsetX: -world.v1.x, offsetY: -world.v1.y, });

const info = getWorldInfo(worldSize);

const browns = [
	"#D2B48C", // Light Brown
	"#C19A6B", // Tan
	"#A67B5B", // Camel Brown
	"#8B5A2B", // Medium Brown
	"#6B4423", // Saddle Brown
	"#3E2723", // Dark Brown
];

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;


const camera: Record<string, Camera> = {}
const movables: GameObject[] = []

export { hud, screenWorld, screenWorldCtx, hudCtx, worldSize, info, browns, randomRange, camera, movables };
export type { WorldInfo };
