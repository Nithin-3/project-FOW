import type { Vector2D } from "../types";
import type { tri } from "./triangle";

type Entry = { node: tri; cost: number; dist: number; visitor: Vector2D };

export class ordQue {
	private queue: Entry[] = [];
	private timeStamp: number;

	constructor(timeStamp: number) {
		this.timeStamp = timeStamp;
	}

	private pri(e: Entry): number {
		return e.cost + e.dist * 1.3;
	}

	insert(node: tri, visitor: Vector2D): void {
		const pri = node.COST + node.DIST * 1.3;
		if (node.timeStamp >= this.timeStamp)
			if (pri >= node.PRIORITY) return;
		node.PRIORITY = pri;

		const e: Entry = { node, cost: node.COST, dist: node.DIST, visitor };
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
			if (e.cost + e.dist * 1.3 === e.node.PRIORITY) return e;
		}
		return undefined;
	}

	get length(): number {
		return this.queue.length;
	}
}
