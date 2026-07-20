import type { Vector2D } from "../types";
import type { tri } from "./triangle";

type Entry = { node: tri; cost: number; dist: number; visitor: Vector2D };

export class ordQue {
	private queue: Entry[] = [];
	private timeStamp: number;
	private forward: boolean;


	constructor(timeStamp: number, forward: boolean) {
		this.timeStamp = timeStamp;
		this.forward = forward;
	}

	private pri(e: Entry): number {
		return e.cost + e.dist;
	}

	insert(node: tri, visitor: Vector2D): void {
		const cost = this.forward ? node.COST_F : node.COST_B;
		const dist = this.forward ? node.DIST_F : node.DIST_B;
		const pri = cost + dist;
		const ts = this.forward ? node.timeStamp_F : node.timeStamp_B;
		if (ts === this.timeStamp) {
			const curPri = this.forward ? node.PRIORITY_F : node.PRIORITY_B;
			if (pri >= curPri) return;
		}
		if (this.forward) node.PRIORITY_F = pri; else node.PRIORITY_B = pri;

		const e: Entry = { node, cost, dist, visitor };
		this.queue.push(e);
		this.queue.sort((a, b) => this.pri(a) - this.pri(b))
	}

	pop(): Entry | undefined {
		return this.queue.shift();
	}
}
