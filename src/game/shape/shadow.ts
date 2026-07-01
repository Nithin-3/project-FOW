import { circlePolygonIntersect, lineIntersectPolygon, pointInPolygon, segmentIntersect } from "../tools";
import type { Polygon, Vector2D } from "../types";
import { addVectors, normalizeVector, scaleVector, subtractVectors, vectorLength, vectorLerp } from "../utils";

const EPS = 0.0001;

function samePoint(a: Vector2D, b: Vector2D, eps = 1e-6): boolean {
	return (Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps);
}

function hasLOS(A: Vector2D, B: Vector2D, polygon: Polygon, exclude?: Vector2D): boolean {
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const hit = segmentIntersect(A, B, polygon[j], polygon[i]);
		if (!hit) continue;
		// ignore excluded point (with epsilon tolerance)
		if (exclude && samePoint(hit, exclude, EPS)) continue; // ignore this hit
		// any other hit = blocked LOS
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
export const drawShadow = (ctx: CanvasRenderingContext2D, o: Vector2D, r: number, points: Polygon, fillColor?: string) => {
	const color = fillColor ?? "rgba(0,0,0,0.85)";

	if (points.length < 3) throw Error("invalid polygon");

	const path = new Map<Vector2D, Vector2D>();
	const faceP: Vector2D[] = []
	const facePSet = new Set<string>()
	const shadowL = new Map<Vector2D, Vector2D>();
	const wait: (Vector2D & { A: Vector2D, B: Vector2D })[] = []
	const key = (p: Vector2D) => `${p.x},${p.y}`;
	if (pointInPolygon(o, points)) {
		const interset = circlePolygonIntersect(o, r, points);
		if (interset.length == 0 && distSq(points[1], o) > r * r) {
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
			const dir = subtractVectors(p, o);
			const d = vectorLength(dir);
			if (d < r) {
				faceP.push(p)
				facePSet.add(key(p))
			}
		}
		interset.forEach(p => {

			if (distSq(p.A, o) < r * r) path.set(p, p.A)
			else if (distSq(p.B, o) < r * r) path.set(p, p.B)
			else wait.push(p)
		})
		if (wait.length && wait.length % 2 === 0) {
			for (let i = 0; i < wait.length; i++) {
				for (let j = i + 1; j < wait.length; j++) {
					const a = wait[i], b = wait[j];
					// same edge = same A and B vertices
					if (samePoint(a.A, b.A) && samePoint(a.B, b.B)) {
						// a and b are the two circle crossings of one edge
						path.set({ x: a.x, y: a.y }, { x: b.x, y: b.y });
					}
				}
			}
		}
	} else {
		for (const p of points) {
			const dir = subtractVectors(p, o);
			const d = vectorLength(dir);
			if (d < r) {
				const end = addVectors(o, scaleVector(normalizeVector(dir), r));
				const ray = addVectors(o, scaleVector(normalizeVector(dir), window.innerWidth));	// window.innerWidth is a bios to find a visible point aka max size polygon can have 
				// if polygon width is more then bios ray is cast many for that huge polygon
				if (hasLOS(o, ray, points, p)) {
					path.set(end, p)
					faceP.push(p)
					facePSet.add(key(p))
					continue;
				}


				const nudgedToRay = vectorLerp(p, ray, 0.01);
				const nudgedToO = vectorLerp(p, o, 0.01);

				if (!pointInPolygon(nudgedToRay, points)) {
					const outwardHits: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
					const backwardHits: (Vector2D & { A: Vector2D; B: Vector2D })[] = [];
					for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
						const h1 = segmentIntersect(p, ray, points[j], points[i]);
						if (h1) outwardHits.push({ x: h1.x, y: h1.y, A: points[j], B: points[i] });
						const h2 = segmentIntersect(p, o, points[j], points[i]);
						if (h2) backwardHits.push({ x: h2.x, y: h2.y, A: points[j], B: points[i] });
					}
					const interset: typeof outwardHits = [];
					for (const pt of outwardHits) {
						if (!interset.some(u => Math.abs(u.x - pt.x) < 0.001 && Math.abs(u.y - pt.y) < 0.001)) {
							interset.push(pt);
						}
					}
					sortByDistance(interset, p);
					if (interset.length > 2) {
						const doubleCheck: typeof backwardHits = [];
						for (const pt of backwardHits) {
							if (!doubleCheck.some(u => Math.abs(u.x - pt.x) < 0.001 && Math.abs(u.y - pt.y) < 0.001)) {
								doubleCheck.push(pt);
							}
						}
						if (doubleCheck.length < 2) {
							if (distSq(o, interset[1]) < r * r) {
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
						if (shadowL.has(p)) {
							path.set(p, shadowL.get(p)!);
						}
					}
				}


			}
		}


		for (const cp of circlePolygonIntersect(o, r, points)) {
			if (pointInPolygon(vectorLerp(cp, o, 0.01), points) || lineIntersectPolygon(cp, o, points).length > 1) continue;
			if (distSq(cp.A, o) < r * r) {
				if (shadowL.has(cp.A))
					path.set({ x: cp.x, y: cp.y }, distSq({ x: cp.x, y: cp.y }, shadowL.get(cp.A)!) < distSq({ x: cp.x, y: cp.y }, cp.A) ? shadowL.get(cp.A)! : cp.A);
				else
					path.set({ x: cp.x, y: cp.y }, cp.A);
			} else if (distSq(cp.B, o) < r * r) {
				if (shadowL.has(cp.B))
					path.set({ x: cp.x, y: cp.y }, distSq({ x: cp.x, y: cp.y }, shadowL.get(cp.B)!) < distSq({ x: cp.x, y: cp.y }, cp.B) ? shadowL.get(cp.B)! : cp.B);
				else
					path.set({ x: cp.x, y: cp.y }, cp.B);
			} else {
				wait.push(cp) // if 2 collition on same line
			}
		}


		if (wait.length && wait.length % 2 === 0) {
			for (let i = 0; i < wait.length; i++) {
				for (let j = i + 1; j < wait.length; j++) {
					const a = wait[i], b = wait[j];
					// same edge = same A and B vertices
					if (samePoint(a.A, b.A) && samePoint(a.B, b.B)) {
						// a and b are the two circle crossings of one edge
						path.set({ x: a.x, y: a.y }, { x: b.x, y: b.y });
					}
				}
			}
		}
	}


	// faceP.forEach(e => {
	// 	ctx.beginPath()
	// 	ctx.lineWidth = 1
	// 	ctx.strokeStyle = "rgba(255,0,10,1)";
	// 	ctx.arc(e.x, e.y, 5, 0, Math.PI * 2)
	// 	ctx.closePath()
	// 	ctx.stroke()
	// })

	if (path.size == 1) {
		for (const line of path) {
			const cw = createPath(line, o, r, false);
			const ccw = createPath(line, o, r, true);
			ctx.fillStyle = color;
			ctx.fill(ctx.isPointInPath(cw, o.x, o.y) ? ccw : cw) // draw shadow
		}
		return;
	}

	const pathFin: Vector2D[][] = [];
	const visited = new Set<string>();
	const pathPoints = new Set<string>();

	const pointIndex = new Map(points.map((p, i) => [key(p), i]));

	const getNeighbor = (p: Vector2D, rec: boolean = false): Vector2D | null => {

		if (distSq(o, p) > r * r) return null;
		const k = key(p);
		if (visited.has(k) && rec) return null;
		if (shadowL.has(p) && rec) return null;
		visited.add(k);
		const i = pointIndex.get(k);
		if (i === undefined) return null;

		const p1 = points[(i - 1 + points.length) % points.length];
		const p2 = points[(i + 1) % points.length];
		if (pathPoints.has(key(p1))) return p1;
		if (pathPoints.has(key(p2))) return p2;


		const neib = []
		for (const candidate of [p1, p2].filter(q => !shadowL.has(q) && !visited.has(key(q)))) {
			if (facePSet.has(key(candidate))) {
				facePSet.delete(key(p));
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
		return getNeighbor(p1, true) ?? getNeighbor(p2, true)
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
				for (let t = c - 1; t > -1; t--) {
					if (samePoint(p, pathFin[t][0], 2)) {
						pathFin[t].unshift(e);
						pathPoints.delete(key(p))
						pointIndex.has(key(e)) && pathPoints.add(key(e))
						path.delete(e);
						shadowL.delete(e);
						continue rootLoop;
					}
					if (samePoint(p, pathFin[t][pathFin[t].length - 1], 2)) {
						pathFin[t].push(e);
						pathPoints.delete(key(p))
						pointIndex.has(key(e)) && pathPoints.add(key(e))
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
			pathFin[c].push(e);
			pathFin[c].push(p);
			visited.add(key(p));
			pointIndex.has(key(e)) && pathPoints.add(key(e))
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
		if (shadowL.has(l)) {
			const v = shadowL.get(l)!;
			pathFin[c].push(v);
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
				if (samePoint(l, pathFin[t][L], 0.01)) {
					const removed = pathFin[t].splice(0, L + 1)
					for (const p of removed) pathPoints.delete(key(p));
					pathFin[t].unshift(...pathFin[c])
					pathFin[c] = [];
					continue rootLoop;
				}
				if (samePoint(l, pathFin[t][R], 0.01)) {
					const removed = pathFin[t].splice(R, pathFin[t].length - R);
					for (const p of removed) pathPoints.delete(key(p));
					pathFin[t].push(...[...pathFin[c]].reverse());
					pathFin[c] = [];
					continue rootLoop;
				}

			}

		}

		pointIndex.has(key(l)) && pathPoints.add(key(l))

		c++;
	}


	// faceP.forEach(e => {
	// 	ctx.beginPath()
	// 	ctx.lineWidth = 3
	// 	ctx.strokeStyle = "rgba(0,255,10,1)";
	// 	ctx.arc(e.x, e.y, 5, 0, Math.PI * 2)
	// 	ctx.closePath()
	// 	ctx.stroke()
	// })


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
		console.log("📉");
		const sorted = [...pathPoints]
			.map(s => {
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
		// pre-index pathFin endpoints for O(1) lookup
		const endpointIdx = new Map<string, { t: number; atEnd: boolean }>();
		for (let t = 0; t < pathFin.length; t++) {
			if (pathFin[t].length === 0) continue;
			endpointIdx.set(key(pathFin[t][0]), { t, atEnd: false });
			endpointIdx.set(key(pathFin[t][pathFin[t].length - 1]), { t, atEnd: true });
		}

		for (const chain of pair) {
			const a = chain[0];
			const b = chain[chain.length - 1];

			const aEntry = endpointIdx.get(key(a));
			const bEntry = endpointIdx.get(key(b));
			if (!aEntry || !bEntry) continue;

			const aIdx = aEntry.t, aAtEnd = aEntry.atEnd;
			const bIdx = bEntry.t, bAtStart = !bEntry.atEnd;

			if (aIdx === bIdx) {
				let aPos = -1, bPos = -1;
				const p = pathFin[aIdx];
				for (let i = 0; i < p.length; i++) {
					if (samePoint(a, p[i], 0.01)) aPos = i;
					if (samePoint(b, p[i], 0.01)) bPos = i;
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

	// for (let t = pathFin.length - 1; t > 0; t--) {
	// 	const line = pathFin[t];
	// 	if (line.length < 1) continue;
	// 	const v1 = pointIndex.get(key(line[0]))
	// 	const v2 = pointIndex.get(key(line[line.length - 1]))
	// 	if (v1 === undefined && v2 === undefined) continue;
	// 	if (typeof v1 === "number") {
	// 		let dir: 0 | 1 | -1 = 0;
	// 		for (let i = 1; i < line.length; i++) {
	// 			const nxt = pointIndex.get(key(line[i]));
	// 			if (nxt !== undefined) { dir = ((nxt - v1 + points.length) % points.length) <= points.length / 2 ? -1 : 1; break; }
	// 		}
	//
	// 		dir === 0 && visited.clear()
	// 		let travel = 1
	// 		travelLoop:
	// 		while (points.length > travel) {
	// 			const nxt = dir === 0 ? getNeighbor(line[0]) : points[(v1 + (travel * dir) + points.length) % points.length];
	// 			if (!nxt) break;
	// 			for (let L = 0, R = pathFin[t - 1].length - 1; L <= R; L++, R--) {
	// 				if (samePoint(nxt, pathFin[t - 1][L], 0.01)) {
	// 					pathFin[t - 1].splice(0, L)
	// 					pathFin[t - 1].unshift(...line.reverse())
	// 					pathFin[t] = [];
	// 					break travelLoop;
	// 				}
	// 				if (samePoint(nxt, pathFin[t - 1][R], 0.01)) {
	// 					pathFin[t - 1].splice(R + 1, pathFin[t - 1].length - R - 1);
	// 					pathFin[t - 1].push(...line);
	// 					pathFin[t] = [];
	// 					break travelLoop;
	// 				}
	// 			}
	//
	// 			pathFin[t].unshift(nxt)
	// 			travel++;
	// 		}
	// 	}
	// 	if (pathFin[t].length === 0) continue;
	// 	if (typeof v2 === "number") {
	// 		let dir = 0;
	// 		for (let i = line.length - 2; i >= 0; i--) {
	// 			const nxt = pointIndex.get(key(line[i]));
	// 			if (nxt !== undefined) { dir = ((nxt - v2 + points.length) % points.length) <= points.length / 2 ? -1 : 1; break; }
	// 		}
	//
	// 		dir === 0 && visited.clear()
	// 		let travel = 1
	// 		travelLoop:
	// 		while (points.length > travel) {
	// 			const nxt = dir === 0 ? getNeighbor(line[line.length - 1]) : points[(v2 + (travel * dir) + points.length) % points.length];
	// 			if (!nxt) break;
	// 			for (let L = 0, R = pathFin[t - 1].length - 1; L <= R; L++, R--) {
	// 				if (samePoint(nxt, pathFin[t - 1][L], 0.01)) {
	// 					pathFin[t-1].splice(0, L)
	// 					pathFin[t-1].unshift(...line)
	// 					pathFin[t] = [];
	// 					break travelLoop;
	// 				}
	// 				if (samePoint(nxt, pathFin[t - 1][R], 0.01)) {
	// 					pathFin[t - 1].splice(R + 1, pathFin[t - 1].length - R - 1);
	// 					pathFin[t - 1].push(...line.reverse());
	// 					pathFin[t] = [];
	// 					break travelLoop;
	// 				}
	// 			}
	//
	// 			line.push(nxt)
	// 			travel++;
	// 		}
	// 	}
	//
	// }
	//



	for (let i = 0; i < pathFin.length; i++) {
		const line = pathFin[i];
		if (line.length < 1) continue;
		const cw = createPath(line, o, r, false);
		const ccw = createPath(line, o, r, true);
		// ctx.strokeStyle = `hsl(${(i * 137.5) % 360}, 100%, 50%)`;
		// ctx.lineWidth = (pathFin.length + 1) - i
		ctx.lineWidth = 0;
		ctx.fillStyle = color;
		ctx.fill(ctx.isPointInPath(cw, o.x, o.y) ? ccw : cw) // draw shadow



		// for (let c = 1; c < line.length - 1; c++) {
		//
		// 	ctx.fillStyle = `hsl(${(i + 1 * 137.5) % 360}, 100%, 60%)`;
		// 	ctx.fillText(`${c}:${i}`, line[c].x + 8, line[c].y - 8);
		// }
		//
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
