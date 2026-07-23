import { ordQue } from "./classes/orderedQueue";
import type { tri } from "./classes/triangle";
import type { Vector2D } from "./types";
import { crossProduct, distSq, subtractVectors } from "./utils";
import { Uid } from "./uid";


function orientEdge(edge: [Vector2D, Vector2D], dir: Vector2D): [Vector2D, Vector2D] {
	const mid = { x: (edge[0].x + edge[1].x) / 2, y: (edge[0].y + edge[1].y) / 2 };
	const v0 = subtractVectors(edge[0], mid);
	const v1 = subtractVectors(edge[1], mid);
	// In y-down: cross < 0 = LEFT, cross > 0 = RIGHT
	if (crossProduct(dir, v0) <= crossProduct(dir, v1))
		return [edge[0], edge[1]];
	else
		return [edge[1], edge[0]];
}

export const dijkstra = async (from: tri, to: tri, source: Vector2D, target: Vector2D): Promise<[Vector2D, Vector2D][]> => {
	const start = performance.now();
	const done = (path: [Vector2D, Vector2D][]): [Vector2D, Vector2D][] => {
		console.log(`A* ${path.length ? 'found' : 'no path'} (${performance.now() - start}ms)`);
		return path;
	};
	if (from === to) return done([]);
	const pathId: number = Uid.next().value!;
	const strictLine = subtractVectors(target, source);

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


	const travel = (entity: typeof fTravel, FROM: "FROM_F" | "FROM_B", EDGE: "EDGE_F" | "EDGE_B", timeStamp: "timeStamp_F" | "timeStamp_B", COST: "COST_F" | "COST_B", DIST: "DIST_F" | "DIST_B", TARGET: Vector2D, SOURCE: Vector2D, que: ordQue) => {
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
			nxt[timeStamp] = pathId;
			nxt[EDGE] = orientEdge(entity.node.neighbors[n].edge, subtractVectors(nxt.center, nxt[FROM].center));
			EDGE === "EDGE_B" && (nxt[EDGE] = [nxt[EDGE][1], nxt[EDGE][0]])
		}

	}

	while (fTravel || bTravel) {
		if (fTravel && fTravel.node.timeStamp_F === fTravel.node.timeStamp_B)
			return done(buildPath(fTravel.node));
		if (bTravel && bTravel.node.timeStamp_F === bTravel.node.timeStamp_B)
			return done(buildPath(bTravel.node));

		if (fTravel) {
			travel(fTravel, "FROM_F", "EDGE_F", "timeStamp_F", "COST_F", "DIST_F", target, source, fQue);
			fTravel = fQue.pop();
		} else {
			console.error("no node to travel forward");
		}

		if (bTravel) {
			travel(bTravel, "FROM_B", "EDGE_B", "timeStamp_B", "COST_B", "DIST_B", source, target, bQue);
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
