import { ordQue } from "./classes/orderedQueue";
import type { tri } from "./classes/triangle";
import type { Vector2D } from "./types";
import { crossProduct, distSq, subtractVectors } from "./utils";
import { Uid } from "./uid";


export const dijkstra = async (from: tri, to: tri, source: Vector2D, target: Vector2D,
	debugCtx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, worldToScreen?: (v: Vector2D) => Vector2D
): Promise<[Vector2D, Vector2D][]> => {
	const start = performance.now();
	const done = (path: [Vector2D, Vector2D][]): [Vector2D, Vector2D][] => {
		console.log(`A* ${path.length ? 'found' : 'no path'} (${performance.now() - start}ms)`);
		return path;
	};
	if (from === to) return done([]);
	const pathId: number = Uid.next().value!;
	const strictLine = subtractVectors(source, target);

	from.COST_F = 0;
	from.DIST_F = distSq(from.center, target);
	from.PRIORITY_F = Infinity;
	from.EDGE_F = null;
	from.EDGE_B = null;
	to.COST_B = 0;
	to.DIST_B = distSq(to.center, source);
	to.PRIORITY_B = Infinity;
	to.EDGE_F = null;
	to.EDGE_B = null;

	from.timeStamp_F = pathId;
	from.FROM_F = null;
	to.timeStamp_B = pathId;
	to.FROM_B = null;

	const fQue = new ordQue(pathId, true);
	const bQue = new ordQue(pathId, false);
	fQue.insert(from, from.COST_F, from.DIST_F, target);
	bQue.insert(to, to.COST_B, to.DIST_B, source);

	let fTravel = fQue.pop();
	let bTravel = bQue.pop();


	const travel = (entity: typeof fTravel, FROM: "FROM_F" | "FROM_B", EDGE: "EDGE_F" | "EDGE_B", timeStamp: "timeStamp_F" | "timeStamp_B", COST: "COST_F" | "COST_B", DIST: "DIST_F" | "DIST_B", TARGET: Vector2D, SOURCE: Vector2D, que: ordQue, debugColor: string) => {
		if (!entity) return;

		for (let n = 0; n < entity.node.neighbors.length; n++) {
			const nxt = entity.node.neighbors[n].neig;
			if (!nxt || nxt == entity.node[FROM]) continue;
			const newCost = entity.node[COST] + entity.node.neighbors[n].dist * nxt.weight;
			if (nxt[timeStamp] === pathId)
				if (newCost >= nxt[COST]) continue;
			const line = subtractVectors(entity.visitor, TARGET)
			const candidates = [...nxt.vertex, nxt.center];
			let bestDist = Infinity;
			let bestPoint: Vector2D = nxt.center;
			for (const p of candidates) {
				const d = Math.abs(crossProduct(strictLine, subtractVectors(SOURCE, p)));
				if (d < bestDist) { bestDist = d; bestPoint = p; }
			}
			const newDist = distSq(bestPoint, TARGET) * (1 + bestDist) * (1 + Math.abs(crossProduct(line, subtractVectors(SOURCE, bestPoint))));
			if (!que.insert(nxt, newCost, newDist, bestPoint)) continue;
			nxt[COST] = newCost;
			nxt[DIST] = newDist;
			nxt[FROM] = entity.node;
			nxt[EDGE] = entity.node.neighbors[n].edge;
			nxt[timeStamp] = pathId;


			if (debugCtx && worldToScreen) {
				const a = worldToScreen(entity.node.center);
				const v = worldToScreen(entity.visitor);
				const b = worldToScreen(nxt.center);
				debugCtx.beginPath();
				debugCtx.moveTo(a.x, a.y);
				debugCtx.lineTo(b.x, b.y);
				debugCtx.strokeStyle = debugColor;
				debugCtx.lineWidth = 3;
				debugCtx.stroke();
				debugCtx.closePath()

				debugCtx.beginPath()
				debugCtx.arc(v.x, v.y, 5, 0, Math.PI * 2);
				debugCtx.fillStyle = "#e11eb4"
				debugCtx.fill()
				debugCtx.closePath()

			}


		}

	}



	if (debugCtx && worldToScreen) {
		const a = worldToScreen(source);
		const b = worldToScreen(target);
		debugCtx.beginPath();
		debugCtx.moveTo(a.x, a.y);
		debugCtx.lineTo(b.x, b.y);
		debugCtx.strokeStyle = "#800080";
		debugCtx.lineWidth = 3;
		debugCtx.stroke();

	}
	while (fTravel || bTravel) {
		if (fTravel && fTravel.node.timeStamp_F === fTravel.node.timeStamp_B)
			return done(buildPath(fTravel.node));
		if (bTravel && bTravel.node.timeStamp_F === bTravel.node.timeStamp_B)
			return done(buildPath(bTravel.node));

		if (fTravel) {
			travel(fTravel, "FROM_F", "EDGE_F", "timeStamp_F", "COST_F", "DIST_F", target, source, fQue, "blue");
			fTravel = fQue.pop();
		} else {
			console.error("no node to travel forward");
		}

		if (bTravel) {
			travel(bTravel, "FROM_B", "EDGE_B", "timeStamp_B", "COST_B", "DIST_B", source, target, bQue, "red");
			bTravel = bQue.pop();
		} else {
			console.error("no node to travel backward");
		}

	}


	console.error(`A* no path:
	from neighbors=${from.neighbors.length}
	to neighbors=${to.neighbors.length}`);
	return done([]);
};

const buildPath = (meet: tri): [Vector2D, Vector2D][] => {
	const pathF: [Vector2D, Vector2D][] = [];
	const pathB: [Vector2D, Vector2D][] = [];

	let curF: tri | null = meet;
	let curB: tri | null = meet;
	while (curF?.EDGE_F || curB?.EDGE_B) {
		if (curF?.EDGE_F) {
			pathF.push(curF.EDGE_F);
			curF = curF.FROM_F;
		}
		if (curB?.EDGE_B) {
			pathB.push(curB.EDGE_B);
			curB = curB.FROM_B;
		}
	}
	pathF.reverse();

	return [...pathF, ...pathB];
};
