import type { Camera } from "./classes/camera";
import type { GameObject } from "./classes/GameObject";
import { Quad } from "./classes/QuadTree";
import type { tri } from "./classes/triangle";

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
	"#6B4423", // Saddle Brown
	"#8B5A2B", // Medium Brown
	"#A67B5B", // Camel Brown
	"#C19A6B", // Tan
	"#3E2723", // Dark Brown
];

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}
browns[0] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.redd.it%2Fowliuw7zgmk91.jpg&f=1&nofb=1&ipt=06d98b99f9fb9098bf797009c38e6b86ee4be422d3324deb0b231d6154c5a67b&ipo=images") as any

browns[1] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.ytimg.com%2Fvi%2F8VuaG2ev_bc%2Fmaxresdefault.jpg&f=1&nofb=1&ipt=765fe2794b3d58c1341ba287a3dc3099011c8902a0a7f795d7b0c3512131bdd4&ipo=images") as any

browns[2] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%2Fid%2FOIP.TlzG2qzcipNAIh2tUu3pXQHaMY%3Fr%3D0%26pid%3DApi&f=1&ipt=d74186c8fa18b96b54af07ed2ad4cb48112395996de2bacb3627f5ccc250a8db&ipo=images") as any

browns[4] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2Fb8%2F05%2F60%2Fb8056021393ba4a081240e7a0db82f45.jpg&f=1&nofb=1&ipt=39d3c3495d44e378a3bd496175053f92fd2c19a9e85dd1801989c8b53ea703f8&ipo=images") as any
browns[5] = await loadImage("https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fvignette.wikia.nocookie.net%2Fben10%2Fimages%2Fa%2Fab%2FWay_Big_OS.png%2Frevision%2Flatest%3Fcb%3D20131107055119&f=1&nofb=1&ipt=8c346857f3ea7122c5bbc7b6e0c2ec47a5d4d8697bc08d0fc86633ee9ca05420&ipo=images") as any

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const staticQuad = new Quad<GameObject>(worldSize, 20)
const triQuad = new Quad<tri>(worldSize, 60)


const camera: Record<string, Camera> = {}
const movables: GameObject[] = []

export { hud, screenWorld, screenWorldCtx, hudCtx, worldSize, info, browns, randomRange, camera, movables, staticQuad, triQuad };
export type { WorldInfo };
