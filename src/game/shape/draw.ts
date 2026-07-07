import { GameObject} from "../GameObject";
import type { Color, Polygon, Vector2D } from "../types";

export function drawRandomPolygon(center: Vector2D, numPoints: number, maxRadius: number, color: Color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}` as Color) {
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

	return new GameObject(1, pts, color)
}

