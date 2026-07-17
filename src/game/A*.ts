import { ordQue } from "./classes/orderedQueue";
import type { Accessors } from "./classes/orderedQueue";
import type { tri } from "./classes/triangle";
import type { Vector2D } from "./types";
import { distSq } from "./utils";
import { Uid } from "./uid";

type BackState = {
	FROM: tri | null;
	COST: number;
	DIST: number;
	PRIORITY: number;
	timeStamp: number;
};

const backMap = new Map<tri, BackState>();

const getBack = (n: tri): BackState => {
	let s = backMap.get(n);
	if (!s) {
		s = { FROM: null, COST: Infinity, DIST: Infinity, PRIORITY: Infinity, timeStamp: 0 };
		backMap.set(n, s);
	}
	return s;
};

const backAcc: Accessors = {
	getCost: n => getBack(n).COST,
	setCost: (n, v) => { getBack(n).COST = v; },
	getDist: n => getBack(n).DIST,
	setDist: (n, v) => { getBack(n).DIST = v; },
	getPri: n => getBack(n).PRIORITY,
	setPri: (n, v) => { getBack(n).PRIORITY = v; },
	getTs: n => getBack(n).timeStamp,
	setTs: (n, v) => { getBack(n).timeStamp = v; },
};

const perpDistToLine = (t: tri, dx: number, dy: number, len: number, ax: number, ay: number): number => {
	let min = Infinity;
	for (let v = 0; v < 3; v++) {
		const cross = Math.abs(dx * (t.vertex[v].y - ay) - dy * (t.vertex[v].x - ax));
		if (cross < min) min = cross;
	}
	return len ? min / len : 0;
};

export const dijkstra = async (from: tri, to: tri, source: Vector2D, target: Vector2D): Promise<tri[]> => {
	const start = performance.now();
	const done = (path: tri[]): tri[] => {
		console.log(`A* ${path.length ? 'found' : 'no path'} (${performance.now() - start}ms)`);
		return path;
	};
	if (from === to) return done([from]);
	backMap.clear();

	from.COST = 0;
	from.DIST = distSq(from.center, target);
	from.FROM = null;
	from.PRIORITY = Infinity;

	const toBack = getBack(to);
	toBack.COST = 0;
	toBack.DIST = distSq(to.center, source);
	toBack.FROM = null;
	toBack.PRIORITY = Infinity;

	const timeStamp: number = Uid.next().value!;
	from.timeStamp = timeStamp;
	toBack.timeStamp = timeStamp;

	const lineDx = target.x - source.x;
	const lineDy = target.y - source.y;
	const lineLenSq = lineDx * lineDx + lineDy * lineDy;
	const lineLen = Math.sqrt(lineLenSq) || 1;

	const fQue = new ordQue(timeStamp);
	const bQue = new ordQue(timeStamp, backAcc);
	fQue.insert(from);
	bQue.insert(to);

	let fTravel = fQue.pop();
	let bTravel = bQue.pop();

	const track = new Map<tri, tri | null>();

	while (fTravel && bTravel) {
		track.set(bTravel.node, getBack(bTravel.node).FROM);

		if (track.has(fTravel.node)) {
			return done(buildPath(fTravel.node, track));
		}

		for (let n = 0; n < fTravel.node.neighbors.length; n++) {
			const nxt = fTravel.node.neighbors[n]?.neig;
			if (!nxt || nxt === fTravel.node.FROM) continue;
			const newCost = fTravel.cost + fTravel.node.neighbors[n]!.dist * nxt.weight;
			if (nxt.timeStamp >= timeStamp)
				if (newCost >= nxt.COST) continue;
			nxt.COST = newCost;
			nxt.DIST = distSq(nxt.center, target) * (1 + perpDistToLine(nxt, lineDx, lineDy, lineLen, source.x, source.y));
			nxt.FROM = fTravel.node;
			nxt.timeStamp = timeStamp;
			fQue.insert(nxt);
		}
		fTravel = fQue.pop();

		if (bTravel.node.timeStamp >= timeStamp) {
			return done(buildPath(bTravel.node, track));
		}

		const bState = getBack(bTravel.node);
		for (let n = 0; n < bTravel.node.neighbors.length; n++) {
			const nxt = bTravel.node.neighbors[n]?.neig;
			if (!nxt || nxt === bState.FROM) continue;
			const newCost = bState.COST + bTravel.node.neighbors[n]!.dist * nxt.weight;
			const nxtBack = getBack(nxt);
			if (nxtBack.timeStamp >= timeStamp)
				if (newCost >= nxtBack.COST) continue;
			nxtBack.COST = newCost;
			nxtBack.DIST = distSq(nxt.center, source) * (1 + perpDistToLine(nxt, lineDx, lineDy, lineLen, source.x, source.y));
			nxtBack.FROM = bTravel.node;
			nxtBack.timeStamp = timeStamp;
			bQue.insert(nxt);
		}
		bTravel = bQue.pop();
	}

	console.log(`A* no path:
		    from regionId=${from.regionId} neighbors=${from.neighbors.length}
	to   regionId=${to.regionId} neighbors=${to.neighbors.length}
	fQue explored=${fQue.length} bQue explored=${bQue.length}
	track size=${track.size}`);
	return done([]);
};

const buildPath = (meet: tri, track: Map<tri, tri | null>): tri[] => {
	const fPath: tri[] = [];
	let cur: tri | null = meet;
	while (cur) {
		fPath.push(cur);
		cur = cur.FROM;
	}
	fPath.reverse();

	const bPath: tri[] = [];
	cur = track.get(meet) ?? null;
	while (cur) {
		bPath.push(cur);
		cur = track.get(cur) ?? null;
	}

	return [...fPath, ...bPath];
};
