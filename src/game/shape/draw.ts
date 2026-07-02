import { gameObjects } from "../init";
import { GameObject, type Vector2D, type Polygon, type Color } from "../types";

export function drawRandomPolygon(ctx: CanvasRenderingContext2D, center: Vector2D, numPoints: number, maxRadius: number, color: Color = "#fff" as Color) {
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

	ctx.beginPath();
	pts.forEach((p, i) => {
		if (i === 0) ctx.moveTo(p.x, p.y);
		else ctx.lineTo(p.x, p.y);
	});
	ctx.closePath();
	ctx.fill();

	gameObjects.push(new GameObject(1, pts, color));
}

