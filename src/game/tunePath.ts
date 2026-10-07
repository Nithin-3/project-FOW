import { camera } from "./setup";
import type { Vector2D } from "./types";
import { addVectors, cross, dot, multiplyVector, normalizeVector, rotateVector, samePoint, subtractVectors } from "./utils";



export function tuneingPath(source: Vector2D, target: Vector2D, portals: [Vector2D, Vector2D][], offset: number = 0): Vector2D[] {
	if (portals.length === 0)
		return [source, target];
	const path: Vector2D[] = [source];
	let apex = source;
	let leftIdx = 0;
	let rightIdx = 0;

	portals.push([target, target])
	for (let i = 1; i < portals.length; i++) {
		const [pL, pR] = portals[i];
		if (cross(apex, portals[rightIdx][1], pR) <= 0) { // check pR point is left to line apex --- right
			if (samePoint(apex, pR) || cross(apex, portals[leftIdx][0], pR) >= 0) { // check pR is right to apex --- left
				// NOTE: pR located in view area
				rightIdx = i;
			} else {

				const [pL, pR] = portals[leftIdx];



				let perp = multiplyVector(normalizeVector(subtractVectors(path.at(-1)!, pL)), offset)
				perp = { x: pL.x + perp.y, y: pL.y - perp.x };


				const dxy = multiplyVector(normalizeVector(subtractVectors(pR, pL)), offset);
				const edgeOffset = addVectors(pL, dxy);

				camera.primary.debugLine.push({ a: pL, b: edgeOffset, t: performance.now(), color: "red" });
				camera.primary.debugLine.push({ a: pL, b: perp, t: performance.now(), color: "#ffff00" });


				path.push(perp)
				if (cross(pL, perp, edgeOffset) < 0) {
					const u = subtractVectors(perp, pL);
					const w = subtractVectors(edgeOffset, pL);
					const ang = Math.atan2(cross(pL, perp, edgeOffset), dot(u, w));

					let prev = perp;
					for (let l = 1; l * (Math.PI / 2) < Math.abs(ang) - 1e-9; l++) {
						const pt = addVectors(pL, rotateVector(u, Math.sign(ang) * l * (Math.PI / 2)));
						path.push(pt);
						camera.primary.debugLine.push({ a: pL, b: pt, t: performance.now(), color:"ffff00" });
						prev = pt;
					}

					path.push(edgeOffset);
				}
				apex = edgeOffset
				i = leftIdx + 1;
				if (i >= portals.length) break;
				leftIdx = i;
				rightIdx = i;
				continue;
			}
		}
		if (cross(apex, portals[leftIdx][0], pL) >= 0) { // check pL point is right to line apex --- left
			if (samePoint(apex, pL) || cross(apex, portals[rightIdx][1], pL) <= 0) { // check pL is left to apex --- right
				// NOTE: pL located in view area
				leftIdx = i;
			} else {
				const [pL, pR] = portals[rightIdx];


				let perp = multiplyVector(normalizeVector(subtractVectors(path.at(-1)!, pR)), offset)
				perp = { x: pR.x - perp.y, y: pR.y + perp.x };

				const dxy = multiplyVector(normalizeVector(subtractVectors(pL, pR)), offset);
				const edgeOffset = addVectors(pR, dxy);

				camera.primary.debugLine.push({ a: pR, b: edgeOffset, t: performance.now(), color: "green" });
				camera.primary.debugLine.push({ a: pR, b: perp, t: performance.now(), color: "#ff00ff" });

				path.push(perp)
				if (cross(pR, perp, edgeOffset) > 0) {
					const u = subtractVectors(perp, pR);
					const w = subtractVectors(edgeOffset, pR);
					const ang = Math.atan2(cross(pR, perp, edgeOffset), dot(u, w));

					let prev = perp;
					for (let l = 1; l * (Math.PI / 2) < Math.abs(ang) - 1e-9; l++) {
						const pt = addVectors(pR, rotateVector(u, Math.sign(ang) * l * (Math.PI / 2)));
						path.push(pt);
						camera.primary.debugLine.push({ a: pR, b: pt, t: performance.now(), color: "#ff00ff" });
						prev = pt;
					}

					path.push(edgeOffset)
				}
				apex = edgeOffset
				i = rightIdx + 1;
				if (i >= portals.length) break;
				leftIdx = i;
				rightIdx = i;
				continue;
			}
		}

	}
	path.push(target);
	return path;
}
