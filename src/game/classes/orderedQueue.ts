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

	private pri(e: Entry): number {
		return e.cost + e.dist * 1.3;
	}

	insert(node: tri): void {
		const pri = this.acc.getCost(node) + this.acc.getDist(node) * 1.3;
		if (this.acc.getTs(node) >= this.timeStamp)
			if (pri >= this.acc.getPri(node)) return;
		this.acc.setPri(node, pri);

		const e: Entry = { node, cost: this.acc.getCost(node), dist: this.acc.getDist(node) };
		this.queue.push(e);

		let i = this.queue.length - 1;
		while (i > 0) {
			const p = (i - 1) >> 1;
			if (this.pri(this.queue[p]) <= this.pri(e)) break;
			this.queue[i] = this.queue[p];
			i = p;
		}
		this.queue[i] = e;
	}

	pop(): Entry | undefined {
		while (this.queue.length) {
			const e = this.queue[0];
			const last = this.queue.pop()!;
			if (this.queue.length) {
				let i = 0;
				while (true) {
					const left = i * 2 + 1;
					if (left >= this.queue.length) break;
					const right = left + 1;
					let child = left;
					if (right < this.queue.length && this.pri(this.queue[right]) < this.pri(this.queue[left])) child = right;
					if (this.pri(last) <= this.pri(this.queue[child])) break;
					this.queue[i] = this.queue[child];
					i = child;
				}
				this.queue[i] = last;
			}
			if (e.cost + e.dist * 1.3 === this.acc.getPri(e.node)) return e;
		}
		return undefined;
	}

	get length(): number {
		return this.queue.length;
	}
}
