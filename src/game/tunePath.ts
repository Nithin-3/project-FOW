import { camera } from "./setup";
import type { Vector2D } from "./types";
import { cross, samePoint, subtractVectors } from "./utils";



export function tuneingPath(source: Vector2D, target: Vector2D, portals: [Vector2D, Vector2D][]): Vector2D[] {
	if (portals.length === 0)
		return [source, target];
	const path: Vector2D[] = [source];
	let apex = source;
	let left = portals[0][0];
	let leftIdx = 0;
	let right = portals[0][1];
	let rightIdx = 0;

	portals.push([target, target])
	for (let i = 1; i < portals.length; i++) {
		const [pL, pR] = portals[i];
		if (cross(apex, right, pR) <= 0) { // check pR point is left to line apex --- right
			if (samePoint(apex, pR) || cross(apex, left, pR) > 0) { // check pR is right to apex --- left
				// NOTE: pR located in view area
				right = pR
				rightIdx = i;
			} else {

				let perp = path.at(-1)!;
				const dxy = subtractVectors(perp, left);
				// 90° perpendicular: (-dy, dx) for ccw rotation of vector (dx,dy)
				perp = { x: left.x + dxy.y, y: left.y - dxy.x };
				camera.primary.debugLine.push({ a: left, b: perp, t: performance.now(), color: "red" });
				camera.primary.debugLine.push({ a: path.at(-1)!, b: perp, t: performance.now(), color: "blue" });
				path.push(left);
				apex = left
				i = leftIdx + 1;
				if (i >= portals.length) break;
				leftIdx = i;
				rightIdx = i;
				[left, right] = portals[i];
				continue;
			}
		}
		if (cross(apex, left, pL) >= 0) { // check pL point is right to line apex --- left
			if (samePoint(apex, pL) || cross(apex, right, pL) < 0) { // check pL is left to apex --- right
				// NOTE: pL located in view area
				left = pL
				leftIdx = i;
			} else {
				let perp = path.at(-1)!;
				const dxy = subtractVectors(perp, right);
				// 90° perpendicular: (dy, -dx) for cw rotation (opposite direction)
				perp = { x: right.x - dxy.y, y: right.y + dxy.x };
				camera.primary.debugLine.push({ a: right, b: perp, t: performance.now(), color: "green" });
				camera.primary.debugLine.push({ a: path.at(-1)!, b: perp, t: performance.now(), color: "blue" });
				path.push(right)
				apex = right
				i = rightIdx + 1;
				if (i >= portals.length) break;
				leftIdx = i;
				rightIdx = i;
				[left, right] = portals[i];
				continue;
			}
		}

	}
	path.push(target);
	return path;
}
