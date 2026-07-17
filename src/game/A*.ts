import { ordQue } from "./classes/orderedQueue";
import type { Accessors } from "./classes/orderedQueue";
import type { tri } from "./classes/triangle";
import type { Vector2D } from "./types";
import { distSq } from "./utils";

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

export const dijkstra = async (from: tri, to: tri, source: Vector2D, target: Vector2D): Promise<tri[]> => {
	if (from === to) return [from];
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

	const timeStamp = Date.now();
	from.timeStamp = timeStamp;
	toBack.timeStamp = timeStamp;

	const dx = target.x - source.x;
	const dy = target.y - source.y;
	const lineLen = Math.sqrt(dx * dx + dy * dy);

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
			return buildPath(fTravel.node, track);
		}

		for (let n = 0; n < fTravel.node.neighbors.length; n++) {
			const nxt = fTravel.node.neighbors[n]?.neig;
			if (!nxt || nxt === fTravel.node.FROM) continue;
			const newCost = fTravel.cost + fTravel.node.neighbors[n]!.dist * nxt.weight;
			if (nxt.timeStamp >= timeStamp)
				if (newCost >= nxt.COST) continue;
			nxt.COST = newCost;
			const pdx = nxt.center.x - source.x;
		const pdy = nxt.center.y - source.y;
		nxt.DIST = distSq(nxt.center, target) * (1 + Math.abs(dx * pdy - dy * pdx) / lineLen);
			nxt.FROM = fTravel.node;
			nxt.timeStamp = timeStamp;
			fQue.insert(nxt);
		}
		fTravel = fQue.pop();

		if (bTravel.node.timeStamp >= timeStamp) {
			return buildPath(bTravel.node, track);
		}

		for (let n = 0; n < bTravel.node.neighbors.length; n++) {
			const nxt = bTravel.node.neighbors[n]?.neig;
			if (!nxt || nxt === getBack(bTravel.node).FROM) continue;
			const bState = getBack(bTravel.node);
			const newCost = bState.COST + bTravel.node.neighbors[n]!.dist * nxt.weight;
			const nxtBack = getBack(nxt);
			if (nxtBack.timeStamp >= timeStamp)
				if (newCost >= nxtBack.COST) continue;
			nxtBack.COST = newCost;
			const bpdx = nxt.center.x - source.x;
		const bpdy = nxt.center.y - source.y;
		nxtBack.DIST = distSq(nxt.center, source) * (1 + Math.abs(dx * bpdy - dy * bpdx) / lineLen);
			nxtBack.FROM = bTravel.node;
			nxtBack.timeStamp = timeStamp;
			bQue.insert(nxt);
		}
		bTravel = bQue.pop();
	}

	return [];
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
