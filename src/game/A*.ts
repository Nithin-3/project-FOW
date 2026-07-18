import { ordQue } from "./classes/orderedQueue";
// import type { Accessors } from "./classes/orderedQueue";
import type { tri } from "./classes/triangle";
import type { Vector2D } from "./types";
import { crossProduct, distSq, subtractVectors } from "./utils";
import { Uid } from "./uid";

// type BackState = {
// 	FROM: tri | null;
// 	COST: number;
// 	DIST: number;
// 	PRIORITY: number;
// 	timeStamp: number;
// };

// const backMap = new Map<tri, BackState>();

// const getBack = (n: tri): BackState => {
// 	let s = backMap.get(n);
// 	if (!s) {
// 		s = { FROM: null, COST: Infinity, DIST: Infinity, PRIORITY: Infinity, timeStamp: 0 };
// 		backMap.set(n, s);
// 	}
// 	return s;
// };

// const backAcc: Accessors = {
// 	getCost: n => getBack(n).COST,
// 	setCost: (n, v) => { getBack(n).COST = v; },
// 	getDist: n => getBack(n).DIST,
// 	setDist: (n, v) => { getBack(n).DIST = v; },
// 	getPri: n => getBack(n).PRIORITY,
// 	setPri: (n, v) => { getBack(n).PRIORITY = v; },
// 	getTs: n => getBack(n).timeStamp,
// 	setTs: (n, v) => { getBack(n).timeStamp = v; },
// };

export const dijkstra = async (from: tri, to: tri, source: Vector2D, target: Vector2D, debugCtx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, worldToScreen?: (v: Vector2D) => Vector2D): Promise<tri[]> => {
	const start = performance.now();
	const done = (path: tri[]): tri[] => {
		console.log(`A* ${path.length ? 'found' : 'no path'} (${performance.now() - start}ms)`);
		return path;
	};
	if (from === to) return done([from]);
	// backMap.clear();

	from.COST = 0;
	from.DIST = distSq(from.center, target);
	from.FROM = null;
	from.PRIORITY = Infinity;

	const timeStamp: number = Uid.next().value!;
	from.timeStamp = timeStamp;

	let line = subtractVectors(source, target);

	const fQue = new ordQue(timeStamp);
	fQue.insert(from,target);

	let fTravel = fQue.pop();

	if (debugCtx && worldToScreen) {
		const a = worldToScreen(source);
		const b = worldToScreen(target);
		debugCtx.beginPath();
		debugCtx.moveTo(a.x, a.y);
		debugCtx.lineTo(b.x, b.y);
		debugCtx.strokeStyle = "green";
		debugCtx.lineWidth = 3;
		debugCtx.stroke();

	}
	while (fTravel) {
		if (fTravel.node === to) {
			return done(buildPath(fTravel.node));
		}

		if (debugCtx && worldToScreen) {
			const from = fTravel.node.FROM;
			if (from) {
				const a = worldToScreen(from.center);
				const v = worldToScreen(fTravel.visitor);
				const b = worldToScreen(fTravel.node.center);
				debugCtx.beginPath();
				debugCtx.moveTo(a.x, a.y);
				debugCtx.lineTo(b.x, b.y);
				debugCtx.strokeStyle = "blue";
				debugCtx.lineWidth = 1;
				debugCtx.stroke();
				debugCtx.closePath()

				debugCtx.beginPath()
				debugCtx.arc(v.x,v.y,3,0,Math.PI*2);
				debugCtx.fillStyle = "red"
				debugCtx.fill()
				debugCtx.closePath()

			}
		}

		for (let n = 0; n < fTravel.node.neighbors.length; n++) {
			const nxt = fTravel.node.neighbors[n]?.neig;
			if (!nxt || nxt === fTravel.node.FROM) continue;
			const newCost = fTravel.cost + fTravel.node.neighbors[n]!.dist * nxt.weight;
			if (nxt.timeStamp >= timeStamp)
				if (newCost >= nxt.COST) continue;
			nxt.COST = newCost;

			line = subtractVectors(fTravel.visitor,target)
			const candidates = [nxt.vertex[0], nxt.vertex[1], nxt.vertex[2], nxt.center];
			let bestDist = Infinity;
			let bestPoint: Vector2D = nxt.center;
			for (const p of candidates) {
				const d = Math.abs(crossProduct(line, subtractVectors(source, p)));
				if (d < bestDist) { bestDist = d; bestPoint = p; }
			}
			nxt.DIST = distSq(bestPoint, target) * (1 + bestDist);

			nxt.FROM = fTravel.node;
			nxt.timeStamp = timeStamp;
			fQue.insert(nxt,bestPoint);
		}
		fTravel = fQue.pop();
	}


	console.log(`A* no path:
	from neighbors=${from.neighbors.length}
	fQue explored=${fQue.length}`);
	return done([]);
};

const buildPath = (to: tri): tri[] => {
	const path: tri[] = [];
	let cur: tri | null = to;
	while (cur) {
		path.push(cur);
		cur = cur.FROM;
	}
	path.reverse();
	return path;
};
