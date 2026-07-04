import { circlePolygonIntersect, lineIntersectPolygon, pointInPolygon, segmentIntersect } from "../tools";
import type { Polygon, Vector2D } from "../types";
import { subtractVectors, vectorLerp } from "../utils";

const EPS = 0.0001;

function samePoint(a: Vector2D, b: Vector2D, eps = 1e-6): boolean {
	return (Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps);
}

function hasLOS(A: Vector2D, B: Vector2D, polygon: Polygon, exclude?: Vector2D): boolean {
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const hit = segmentIntersect(A, B, polygon[j], polygon[i]);
		if (!hit) continue;
		if (exclude && samePoint(hit, exclude, EPS)) continue;
		return false;
	}
	return true;
}

function sortByDistance<T extends Vector2D>(points: T[], p: Vector2D): T[] {
	return points.sort((a, b) => {
		const da = (a.x - p.x) ** 2 + (a.y - p.y) ** 2;
		const db = (b.x - p.x) ** 2 + (b.y - p.y) ** 2;
		return da - db;
	});
}

function distSq(a: Vector2D, b: Vector2D): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

function createPath(line: Vector2D[], o: Vector2D, r: number, counterclockwise: boolean) {
	const path = new Path2D();

	path.moveTo(line[0].x, line[0].y);

	for (let i = 1; i < line.length; i++) {
		path.lineTo(line[i].x, line[i].y);
	}

	const a1 = Math.atan2(line[line.length - 1].y - o.y, line[line.length - 1].x - o.x);
	const a2 = Math.atan2(line[0].y - o.y, line[0].x - o.x);
	path.arc(o.x, o.y, r, a1, a2, counterclockwise);
	path.closePath();

	return path;
}
export const drawShadow = (ctx: OffscreenCanvasRenderingContext2D, o: Vector2D, r: number, points: Polygon, fillColor?: string) => {
	const color = fillColor ?? "rgba(0,0,0,0.85)";

	if (points.length < 3) throw Error("invalid polygon");

	const rSq = r * r;
	const path = new Map<Vector2D, Vector2D>();
	const faceP: Vector2D[] = []
	const facePSet = new Set<string>()
	const shadowL = new Map<Vector2D, Vector2D>();
	const wait: (Vector2D & { A: Vector2D, B: Vector2D })[] = []
	const key = (p: Vector2D) => `${p.x},${p.y}`;
	if (pointInPolygon(o, points)) {
		const interset = circlePolygonIntersect(o, r, points);
		if (interset.length == 0 && distSq(points[1], o) > rSq) {
			return;
		}
		if (interset.length == 0) {
			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.arc(o.x, o.y, r, 0, Math.PI * 2);

			let mv = true;
			for (const p of points) {
				if (mv) {
					mv = !mv;
					ctx.moveTo(p.x, p.y);
					continue;
				}
				ctx.lineTo(p.x, p.y);
			}
			ctx.closePath();
			ctx.fill("evenodd");
			return;
		}

		for (const p of points) {
			const dx = p.x - o.x, dy = p.y - o.y;
			if (dx * dx + dy * dy < rSq) {
				faceP.push(p)
				facePSet.add(key(p))
			}
		}
		interset.forEach(p => {

			if (distSq(p.A, o) < rSq) path.set(p, p.A)
			else if (distSq(p.B, o) < rSq) path.set(p, p.B)
			else wait.push(p)
		})
		if (wait.length && wait.length % 2 === 0) {
			const edgeMap = new Map<string, Vector2D & { A: Vector2D, B: Vector2D }>();
			for (const pt of wait) {
				const qa = `${Math.round(pt.A.x * 1000)},${Math.round(pt.A.y * 1000)}`;
				const qb = `${Math.round(pt.B.x * 1000)},${Math.round(pt.B.y * 1000)}`;
				const ek = qa < qb ? `${qa}|${qb}` : `${qb}|${qa}`;
				const prev = edgeMap.get(ek);
				if (prev) {
					path.set({ x: prev.x, y: prev.y }, { x: pt.x, y: pt.y });
					edgeMap.delete(ek);
				} else {
					edgeMap.set(ek, pt);
				}
			}
		}
	} else {
		const edges: { a: Vector2D; b: Vector2D }[] = [];
		for (let i = 0; i < points.length; i++)
			edges.push({ a: points[i], b: points[(i + 1) % points.length] });

		let los = 0;
		for (const p of points) {
			const dx = p.x - o.x, dy = p.y - o.y;
			const d = Math.sqrt(dx * dx + dy * dy);
			if (d > 0 && d < r) {
				const nx = dx / d, ny = dy / d;
				const end = { x: o.x + nx * r, y: o.y + ny * r };
				const ray = { x: o.x + nx * window.innerWidth, y: o.y + ny * window.innerWidth };

				if (hasLOS(o, ray, points, p)) {
					path.set(end, p)
					faceP.push(p)
					facePSet.add(key(p))
					los++;
					continue;
				}


				const nudgedToRay = vectorLerp(p, ray, 0.01);
				const nudgedToO = vectorLerp(p, o, 0.01);

				if (!pointInPolygon(nudgedToRay, points)) {
					const outwardHits: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
					const backwardHits: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
					const px = p.x, py = p.y;
					const rayX = ray.x, rayY = ray.y;
					const ox = o.x, oy = o.y;
					for (const { a: c, b: d } of edges) {
						const sx = d.x - c.x, sy = d.y - c.y;
						const cax = c.x - px, cay = c.y - py;

						const rx1 = rayX - px, ry1 = rayY - py;
						const denom1 = rx1 * sy - ry1 * sx;
						if (denom1 !== 0) {
							const t1 = (cax * sy - cay * sx) / denom1;
							const u1 = (cax * ry1 - cay * rx1) / denom1;
							if (t1 >= 0 && t1 <= 1 && u1 >= 0 && u1 <= 1)
								outwardHits.push({ x: px + rx1 * t1, y: py + ry1 * t1, A: c, B: d });
						}

						const rx2 = ox - px, ry2 = oy - py;
						const denom2 = rx2 * sy - ry2 * sx;
						if (denom2 !== 0) {
							const t2 = (cax * sy - cay * sx) / denom2;
							const u2 = (cax * ry2 - cay * rx2) / denom2;
							if (t2 >= 0 && t2 <= 1 && u2 >= 0 && u2 <= 1)
								backwardHits.push({ x: px + rx2 * t2, y: py + ry2 * t2, A: c, B: d });
						}
					}
					const interset: typeof outwardHits = [];
					const dedupSet = new Set<string>();
					for (const pt of outwardHits) {
						const qk = `${Math.round(pt.x * 1000)},${Math.round(pt.y * 1000)}`;
						if (dedupSet.has(qk)) continue;
						dedupSet.add(qk);
						interset.push(pt);
					}
					sortByDistance(interset, p);
					if (interset.length > 2) {
						const doubleCheck: typeof backwardHits = [];
						const dedupSet2 = new Set<string>();
						for (const pt of backwardHits) {
							const qk = `${Math.round(pt.x * 1000)},${Math.round(pt.y * 1000)}`;
							if (dedupSet2.has(qk)) continue;
							dedupSet2.add(qk);
							doubleCheck.push(pt);
						}
						if (doubleCheck.length < 2) {
							if (distSq(o, interset[1]) < rSq) {
								path.set(interset[1], p)
								if (facePSet.has(key(interset[1].A))) {
									path.set(interset[1].A, interset[1]);
								} else if (facePSet.has(key(interset[1].B))) {
									path.set(interset[1].B, interset[1]);
								}
								shadowL.set(interset[1].A, interset[1]);
								shadowL.set(interset[1].B, interset[1]);
							} else {
								path.set(end, p);
							}
						}
						faceP.push(p)
						facePSet.add(key(p))
						continue;
					}
				}

				if (!pointInPolygon(nudgedToO, points)) {
					const intersections = lineIntersectPolygon(nudgedToO, o, points);
					if (intersections.length == 0) {
						faceP.push(p)
						facePSet.add(key(p))
						const slp = shadowL.get(p);
						if (slp) {
							path.set(p, slp);
						}
					}
				}


			}
		}


		if (los < 2)
			for (const cp of circlePolygonIntersect(o, r, points)) {
				const lerpCp = vectorLerp(cp, o, 0.01);
				// ctx.beginPath()
				// ctx.moveTo(o.x, o.y);
				// ctx.lineTo(cp.x, cp.y);
				// ctx.strokeStyle = 'red';
				// ctx.stroke()
				if (pointInPolygon(lerpCp, points) || lineIntersectPolygon(cp, o, points).length > 1) continue;
				if (distSq(cp.A, o) < rSq) {
					const vA = shadowL.get(cp.A);
					if (vA)
						path.set({ x: cp.x, y: cp.y }, distSq(cp, vA) < distSq(cp, cp.A) ? vA : cp.A);
					else
						path.set({ x: cp.x, y: cp.y }, cp.A);
				} else if (distSq(cp.B, o) < rSq) {
					const vB = shadowL.get(cp.B);
					if (vB)
						path.set({ x: cp.x, y: cp.y }, distSq(cp, vB) < distSq(cp, cp.B) ? vB : cp.B);
					else
						path.set({ x: cp.x, y: cp.y }, cp.B);
				} else {
					wait.push(cp)
				}
			}


		if (wait.length && wait.length % 2 === 0) {
			const edgeMap = new Map<string, Vector2D & { A: Vector2D, B: Vector2D }>();
			for (const pt of wait) {
				const qa = `${Math.round(pt.A.x * 1000)},${Math.round(pt.A.y * 1000)}`;
				const qb = `${Math.round(pt.B.x * 1000)},${Math.round(pt.B.y * 1000)}`;
				const ek = qa < qb ? `${qa}|${qb}` : `${qb}|${qa}`;
				const prev = edgeMap.get(ek);
				if (prev) {
					path.set({ x: prev.x, y: prev.y }, { x: pt.x, y: pt.y });
					edgeMap.delete(ek);
				} else {
					edgeMap.set(ek, pt);
				}
			}
		}
	}


	if (path.size == 1) {
		for (const line of path) {
			const cw = createPath(line, o, r, false);
			const ccw = createPath(line, o, r, true);
			ctx.fillStyle = color;
			ctx.fill(ctx.isPointInPath(cw, o.x, o.y) ? ccw : cw)
			if (fillColor) {
				ctx.lineWidth = 1.5;
				ctx.stroke(ctx.isPointInPath(cw, o.x, o.y) ? ccw : cw);
			}
		}
		return;
	}

	const pathFin: Vector2D[][] = [];
	const visited = new Set<string>();
	const pathPoints = new Set<string>();

	const pointIndex = new Map(points.map((p, i) => [key(p), i]));

	const getNeighbor = (p: Vector2D, rec: boolean = false): Vector2D | null => {

		if (distSq(o, p) > rSq) return null;
		const k = key(p);
		if (visited.has(k) && rec) return null;
		if (shadowL.has(p) && rec) return null;
		visited.add(k);
		const i = pointIndex.get(k);
		if (i === undefined) return null;

		const p1 = points[(i - 1 + points.length) % points.length];
		const p2 = points[(i + 1) % points.length];
		const k1 = key(p1);
		const k2 = key(p2);
		if (pathPoints.has(k1)) return p1;
		if (pathPoints.has(k2)) return p2;

		const neib = []
		const candidates: Vector2D[] = [];
		if (!shadowL.has(p1) && !visited.has(k1)) candidates.push(p1);
		if (!shadowL.has(p2) && !visited.has(k2)) candidates.push(p2);
		for (const candidate of candidates) {
			if (facePSet.has(key(candidate))) {
				facePSet.delete(k);
				neib.push(candidate)
			}
		}


		if (neib.length == 1) return neib[0]
		else if (neib.length !== 0) {
			const mid = vectorLerp(neib[0], neib[1], 0.5);
			const line = subtractVectors(mid, p);
			const sideO = line.x * (o.y - p.y) - line.y * (o.x - p.x);
			const sideN0 = line.x * (neib[0].y - p.y) - line.y * (neib[0].x - p.x);
			return (sideO * sideN0 >= 0) ? neib[0] : neib[1];
		}
		return null;
	};




	let c = 0;
	rootLoop:
	while (true) {
		if (pathFin[c] === null || pathFin[c] === undefined) {
			if (c > 0) {
				const available = path.entries().next().value;
				if (!available) {
					break;
				}
				const [e, p] = available;
				const ek0 = key(e);
				const pk0 = key(p);
				for (let t = c - 1; t > -1; t--) {
					if (samePoint(p, pathFin[t][0])) {
						pathFin[t].unshift(e);
						pathPoints.delete(pk0)
						if (pointIndex.has(ek0)) pathPoints.add(ek0)
						path.delete(e);
						shadowL.delete(e);
						continue rootLoop;
					}
					if (samePoint(p, pathFin[t][pathFin[t].length - 1])) {
						pathFin[t].push(e);
						pathPoints.delete(pk0)
						if (pointIndex.has(ek0)) pathPoints.add(ek0)
						path.delete(e);
						shadowL.delete(e);
						continue rootLoop;
					}
				}
			}
			pathFin[c] = [];
		}
		const l = pathFin[c].at(-1);
		if (l === undefined) {
			const available = path.entries().next().value;
			if (!available) {
				break;
			}
			const [e, p] = available;
			const ek1 = key(e);
			const pk1 = key(p);
			pathFin[c].push(e);
			pathFin[c].push(p);
			visited.add(pk1);
			if (pointIndex.has(ek1)) pathPoints.add(ek1)
			path.delete(e);
			shadowL.delete(e);
			continue;
		}

		if (path.has(l)) {
			const v = path.get(l)!;
			pathFin[c].push(v);
			path.delete(l);
			continue;
		}
		const sv = shadowL.get(l);
		if (sv) {
			pathFin[c].push(sv);
			shadowL.delete(l);
			continue;
		}
		const lastP = getNeighbor(l);
		if (lastP) {
			pathFin[c].push(lastP);
			continue;
		}

		for (let t = c - 1; t >= 0; t--) {
			for (let L = 0, R = pathFin[t].length - 1; L <= R; L++, R--) {
				if (samePoint(l, pathFin[t][L])) {
					const removed = pathFin[t].splice(0, L + 1)
					for (const p of removed) pathPoints.delete(key(p));
					pathFin[t].unshift(...pathFin[c])
					pathFin[c] = [];
					continue rootLoop;
				}
				if (samePoint(l, pathFin[t][R])) {
					const removed = pathFin[t].splice(R, pathFin[t].length - R);
					for (const p of removed) pathPoints.delete(key(p));
					pathFin[t].push(...[...pathFin[c]].reverse());
					pathFin[c] = [];
					continue rootLoop;
				}

			}

		}

		const lk = key(l);
		if (pointIndex.has(lk)) pathPoints.add(lk)

		c++;
	}


	if (!fillColor) {
		pathPoints.forEach(S => {
			const e = S.split(',').map(v => Number(v))

			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "rgba(79, 198, 167,1)";

			const s = 10;

			ctx.moveTo(e[0] - s, e[1] - s);
			ctx.lineTo(e[0] + s, e[1] + s);

			ctx.moveTo(e[0] - s, e[1] + s);
			ctx.lineTo(e[0] + s, e[1] - s);

			ctx.stroke();
		})
	}

	if (pathPoints.size && pathPoints.size % 2 === 0) {
		const sorted = [...pathPoints].map(s => {
			const [x, y] = s.split(',').map(Number);
			return { v: { x, y }, idx: pointIndex.get(s)! };
		})
			.sort((a, b) => a.idx - b.idx);
		let maxGap = -1, splitAt = 0;
		const n = sorted.length;
		for (let i = 0; i < n; i++) {
			const gap = (sorted[(i + 1) % n].idx - sorted[i].idx + points.length) % points.length;
			if (gap > maxGap) { maxGap = gap; splitAt = i; }
		}
		const pair: Vector2D[][] = [];
		for (let k = 0; k < n; k += 2) {
			const ai = (splitAt + 1 + k) % n;
			const bi = (splitAt + 1 + k + 1) % n;
			const a = sorted[ai].v;
			const b = sorted[bi].v;
			const chain: Vector2D[] = [a];
			let i = (sorted[ai].idx + 1) % points.length;
			const endIdx = sorted[bi].idx;
			while (i !== endIdx) {
				chain.push({ x: points[i].x, y: points[i].y });
				i = (i + 1) % points.length;
			}
			chain.push(b);
			pair.push(chain);
		}
		const endpointIdx = new Map<string, { t: number; atEnd: boolean }>();
		for (let t = 0; t < pathFin.length; t++) {
			if (pathFin[t].length === 0) continue;
			endpointIdx.set(key(pathFin[t][0]), { t, atEnd: false });
			endpointIdx.set(key(pathFin[t][pathFin[t].length - 1]), { t, atEnd: true });
		}

		for (const chain of pair) {
			const a = chain[0];
			const b = chain[chain.length - 1];
			const aKey = key(a);
			const bKey = key(b);

			const aEntry = endpointIdx.get(aKey);
			const bEntry = endpointIdx.get(bKey);
			if (!aEntry || !bEntry) continue;

			const aIdx = aEntry.t, aAtEnd = aEntry.atEnd;
			const bIdx = bEntry.t, bAtStart = !bEntry.atEnd;

			if (aIdx === bIdx) {
				let aPos = -1, bPos = -1;
				const p = pathFin[aIdx];
				for (let i = 0; i < p.length; i++) {
					if (samePoint(a, p[i])) aPos = i;
					if (samePoint(b, p[i])) bPos = i;
				}
				if (aPos === -1 || bPos === -1) continue;
				const lo = Math.min(aPos, bPos);
				const hi = Math.max(aPos, bPos);
				p.splice(lo + 1, hi - lo - 1, ...chain.slice(1, -1));
			} else {
				if (!aAtEnd) pathFin[aIdx].reverse();
				if (!bAtStart) pathFin[bIdx].reverse();

				pathFin[aIdx].pop();
				pathFin[bIdx].shift();
				pathFin[aIdx].push(...chain, ...pathFin[bIdx]);
				pathFin[bIdx] = [];
			}
		}

	}




	for (let i = 0; i < pathFin.length; i++) {
		const line = pathFin[i];
		if (line.length < 1) continue;
		const cw = createPath(line, o, r, false);
		const ccw = createPath(line, o, r, true);
		ctx.lineWidth = 0;
		ctx.fillStyle = color;
		ctx.fill(ctx.isPointInPath(cw, o.x, o.y) ? ccw : cw)
		if (fillColor) {
			ctx.lineWidth = 1.5;
			ctx.stroke(ctx.isPointInPath(cw, o.x, o.y) ? ccw : cw);
		}


		if (!fillColor) {
			ctx.beginPath()
			ctx.lineWidth = 3
			ctx.strokeStyle = "rgba(255,255,255,1)";
			ctx.arc(pathFin[i][pathFin[i].length - 1].x, pathFin[i][pathFin[i].length - 1].y, 10, 0, Math.PI * 2)
			ctx.closePath()
			ctx.stroke()

			ctx.beginPath()
			ctx.lineWidth = 3
			ctx.strokeStyle = "rgba(0,255,255,1)";
			ctx.arc(pathFin[i][0].x, pathFin[i][0].y, 5, 0, Math.PI * 2)
			ctx.closePath()
			ctx.stroke()
		}
	}

}
