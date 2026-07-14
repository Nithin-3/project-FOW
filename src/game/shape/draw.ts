import { GameObject } from "../classes/GameObject";
import type { Color, Polygon, Vector2D } from "../types";

export function drawRandomPolygon(center: Vector2D, numPoints: number, maxRadius: number, zIndex: number, color: Color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}` as Color) {
	const angleStep = (Math.PI * 2) / numPoints;
	const pts: Polygon = [];

	for (let i = 0; i < numPoints; i++) {
		const angle = i * angleStep + (Math.random() - 0.5) * 0.6;
		const radius = maxRadius * (0.4 + Math.random() * 0.6);
		pts.push({
			x: center.x + radius * Math.cos(angle),
			y: center.y + radius * Math.sin(angle)
		});
	}

	const doorCount = Math.floor(Math.random() * Math.min(4, Math.floor(pts.length / 2)));
	const doors: Vector2D[] = [];
	if (doorCount > 0) {
		const step = Math.max(2, Math.floor(pts.length / doorCount));
		let idx = Math.floor(Math.random() * pts.length);
		for (let i = 0; i < doorCount; i++) {
			const next = (idx + 1) % pts.length;
			doors.push(pts[idx], pts[next]);
			idx = (idx + step) % pts.length;
		}
	}
	return new GameObject(zIndex, pts, color, doors.length ? doors : undefined)
}

