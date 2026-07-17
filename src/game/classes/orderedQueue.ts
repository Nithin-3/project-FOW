import type { tri } from "./triangle";

type Entry = { node: tri; cost: number; dist: number };

export type Accessors = {
	getCost: (n: tri) => number;
	setCost: (n: tri, v: number) => void;
	getDist: (n: tri) => number;
	setDist: (n: tri, v: number) => void;
	getPri: (n: tri) => number;
	setPri: (n: tri, v: number) => void;
	getTs: (n: tri) => number;
	setTs: (n: tri, v: number) => void;
};

const nodeAcc: Accessors = {
	getCost: n => n.COST,
	setCost: (n, v) => { n.COST = v; },
	getDist: n => n.DIST,
	setDist: (n, v) => { n.DIST = v; },
	getPri: n => n.PRIORITY,
	setPri: (n, v) => { n.PRIORITY = v; },
	getTs: n => n.timeStamp,
	setTs: (n, v) => { n.timeStamp = v; },
};

export class ordQue {
	private queue: Entry[] = [];
	private timeStamp: number;
	private acc: Accessors;

	constructor(timeStamp: number, acc?: Accessors) {
		this.timeStamp = timeStamp;
		this.acc = acc ?? nodeAcc;
	}

	insert(node: tri): void {
		const pri = this.acc.getCost(node) + this.acc.getDist(node) * 1.3;
		if (this.acc.getTs(node) >= this.timeStamp)
			if (pri >= this.acc.getPri(node)) return;
		this.acc.setPri(node, pri);
		let lo = 0, hi = this.queue.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (this.queue[mid].cost + this.queue[mid].dist * 1.3 < pri) lo = mid + 1;
			else hi = mid;
		}
		this.queue.splice(lo, 0, { node, cost: this.acc.getCost(node), dist: this.acc.getDist(node) });
	}

	pop(): Entry | undefined {
		while (this.queue.length) {
			const e = this.queue.shift()!;
			if (e.cost + e.dist * 1.3 === this.acc.getPri(e.node)) return e;
		}
		return undefined;
	}

	get length(): number {
		return this.queue.length;
	}
}
