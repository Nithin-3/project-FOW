import { ordQue } from "./classes/orderedQueue";
import type { tri } from "./classes/triangle";
import type { Vector2D } from "./types";
import { crossProduct, distSq, subtractVectors } from "./utils";
import { Uid } from "./uid";


export const dijkstra = async (from: tri, to: tri, source: Vector2D, target: Vector2D, debugCtx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, worldToScreen?: (v: Vector2D) => Vector2D): Promise<tri[]> => {
	const start = performance.now();
	const done = (path: tri[]): tri[] => {
		console.log(`A* ${path.length ? 'found' : 'no path'} (${performance.now() - start}ms)`);
		return path;
	};
	if (from === to) return done([from]);
	const pathId: number = Uid.next().value!;
	const strictLine = subtractVectors(source, target);

	from.COST_F = 0;
	from.DIST_F = distSq(from.center, target);
	from.PRIORITY_F = Infinity;
	to.COST_B = 0;
	to.DIST_B = distSq(to.center, source);
	to.PRIORITY_B = Infinity;

	from.timeStamp_F = pathId;
	from.FROM_F = null;
	to.timeStamp_B = pathId;
	to.FROM_B = null;

	const fQue = new ordQue(pathId, true);
	const bQue = new ordQue(pathId, false);
	fQue.insert(from, target);
	bQue.insert(to, source);

	let fTravel = fQue.pop();
	let bTravel = bQue.pop();


	const travel = (entity: typeof fTravel, FROM: "FROM_F" | "FROM_B", timeStamp: "timeStamp_F" | "timeStamp_B", COST: "COST_F" | "COST_B", DIST: "DIST_F" | "DIST_B", TARGET: Vector2D, SOURCE: Vector2D, que: ordQue, debugColor: string) => {
		if (!entity) return;
		if (debugCtx && worldToScreen) {
			const from = entity.node[FROM];
			if (from) {
				const a = worldToScreen(from.center);
				const v = worldToScreen(entity.visitor);
				const b = worldToScreen(entity.node.center);
				debugCtx.beginPath();
				debugCtx.moveTo(a.x, a.y);
				debugCtx.lineTo(b.x, b.y);
				debugCtx.strokeStyle = debugColor;
				debugCtx.lineWidth = 1;
				debugCtx.stroke();
				debugCtx.closePath()

				debugCtx.beginPath()
				debugCtx.arc(v.x, v.y, 3, 0, Math.PI * 2);
				debugCtx.fillStyle = "orange"
				debugCtx.fill()
				debugCtx.closePath()

			}
		}

		for (let n = 0; n < entity.node.neighbors.length; n++) {
			const nxt = entity.node.neighbors[n].neig;
			if (!nxt || nxt == entity.node[FROM]) continue;
			const newCost = entity.cost + entity.node.neighbors[n].dist * nxt.weight;
			if (nxt[timeStamp] === pathId)
				if (newCost >= nxt[COST]) continue;
			nxt[COST] = newCost;
			const line = subtractVectors(entity.visitor, TARGET)
			const candidates = [nxt.vertex[0], nxt.vertex[1], nxt.vertex[2], nxt.center];
			let bestDist = Infinity;
			let bestPoint: Vector2D = nxt.center;
			for (const p of candidates) {
				const d = Math.abs(crossProduct(line, subtractVectors(SOURCE, p)));
				if (d < bestDist) { bestDist = d; bestPoint = p; }
			}
			nxt[DIST] = distSq(bestPoint, TARGET) * (1 + bestDist) * (1 + Math.abs(crossProduct(strictLine, subtractVectors(SOURCE, bestPoint))));
			nxt[FROM] = entity.node;
			nxt[timeStamp] = pathId;
			que.insert(nxt, bestPoint);
		}

	}



	if (debugCtx && worldToScreen) {
		const a = worldToScreen(source);
		const b = worldToScreen(target);
		debugCtx.beginPath();
		debugCtx.moveTo(a.x, a.y);
		debugCtx.lineTo(b.x, b.y);
		debugCtx.strokeStyle = "red";
		debugCtx.lineWidth = 3;
		debugCtx.stroke();

	}
	while (fTravel && bTravel) {
		if (fTravel.node.timeStamp_F === fTravel.node.timeStamp_B) {
			return done(buildPath(fTravel.node));
		}
		if (bTravel.node.timeStamp_F === bTravel.node.timeStamp_B) {
			return done(buildPath(bTravel.node));
		}

		travel(fTravel, "FROM_F", "timeStamp_F", "COST_F", "DIST_F", target, source, fQue, "blue");
		fTravel = fQue.pop();

		travel(bTravel, "FROM_B", "timeStamp_B", "COST_B", "DIST_B", source, target, bQue, "red")
		bTravel = bQue.pop();
	}


	console.log(`A* no path:
	from neighbors=${from.neighbors.length}
	fQue explored=${fQue.length}`);
	return done([]);
};

const buildPath = (meet: tri): tri[] => {
	const fPath: tri[] = [];
	let cur: tri | null = meet;
	while (cur) {
		fPath.push(cur);
		cur = cur.FROM_F;
	}
	fPath.reverse();

	const bPath: tri[] = [];
	cur = meet.FROM_B;
	while (cur) {
		bPath.push(cur);
		cur = cur.FROM_B;
	}

	return [...fPath, ...bPath];
};
