import type { tri } from "./triangle";

type Entry = { node: tri; cost: number; dist: number };

export class ordQue {
	private queue: Entry[] = [];

	insert(node: tri): void {
		const pri = node.COST + node.DIST;
		if (pri >= node.PRIORITY) return;
		node.PRIORITY = pri;
		let lo = 0, hi = this.queue.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (this.queue[mid].cost + this.queue[mid].dist < pri) lo = mid + 1;
			else hi = mid;
		}
		this.queue.splice(lo, 0, { node, cost: node.COST, dist: node.DIST });
	}

	pop(): Entry | undefined {
		while (this.queue.length) {
			const e = this.queue.shift()!;
			if (e.cost + e.dist === e.node.PRIORITY) return e;
		}
		return undefined;
	}

	get length(): number {
		return this.queue.length;
	}
}
