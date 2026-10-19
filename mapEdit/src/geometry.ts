import type { Vector2D } from '../../src/game/types'
import { GameObject } from '../../src/game/classes/GameObject'
import { canvas, box, camera, HIT_R, type Corner } from './state'

export function canvasPoint(e: MouseEvent): Vector2D {
	const r = canvas.getBoundingClientRect()
	return { x: e.clientX - r.left, y: e.clientY - r.top }
}

export function hitHandle(e: MouseEvent): Corner | null {
	const p = canvasPoint(e)
	const s1 = camera.world2screen(box.v1)
	const s2 = camera.world2screen(box.v2)
	if (Math.hypot(p.x - s1.x, p.y - s1.y) <= HIT_R) return 'v1'
	if (Math.hypot(p.x - s2.x, p.y - s2.y) <= HIT_R) return 'v2'
	return null
}

export function pointInBox(p: Vector2D, bb: { v1: Vector2D; v2: Vector2D }) {
	return p.x >= bb.v1.x && p.x <= bb.v2.x && p.y >= bb.v1.y && p.y <= bb.v2.y
}

export function distToSegment(p: Vector2D, a: Vector2D, b: Vector2D) {
	const dx = b.x - a.x
	const dy = b.y - a.y
	const len = dx * dx + dy * dy
	let t = len ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len : 0
	t = Math.max(0, Math.min(1, t))
	return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

export function edgeIndexAt(obj: GameObject, screenP: Vector2D): number | null {
	const pts = obj.points
	for (let i = 0; i < pts.length; i++) {
		const a = camera.world2screen(pts[i])
		const b = camera.world2screen(pts[(i + 1) % pts.length])
		if (distToSegment(screenP, a, b) <= HIT_R) return i
	}
	return null
}

export function vertexIndexAt(obj: GameObject, screenP: Vector2D): number | null {
	const pts = obj.points
	for (let i = 0; i < pts.length; i++) {
		const s = camera.world2screen(pts[i])
		if (Math.hypot(screenP.x - s.x, screenP.y - s.y) <= HIT_R) return i
	}
	return null
}

export function selectedCorners(obj: GameObject): { corner: Vector2D; anchor: Vector2D }[] {
	const b = obj.boundingBox()
	return [
		{ corner: { x: b.v1.x, y: b.v1.y }, anchor: { x: b.v2.x, y: b.v2.y } },
		{ corner: { x: b.v2.x, y: b.v1.y }, anchor: { x: b.v1.x, y: b.v2.y } },
		{ corner: { x: b.v2.x, y: b.v2.y }, anchor: { x: b.v1.x, y: b.v1.y } },
		{ corner: { x: b.v1.x, y: b.v2.y }, anchor: { x: b.v2.x, y: b.v1.y } },
	]
}

export function selectedCornerAt(obj: GameObject, screenP: Vector2D): number | null {
	const cs = selectedCorners(obj)
	for (let i = 0; i < cs.length; i++) {
		const s = camera.world2screen(cs[i].corner)
		if (Math.hypot(screenP.x - s.x, screenP.y - s.y) <= HIT_R) return i
	}
	return null
}

export function selectedMidHandles(obj: GameObject): Vector2D[] {
	const b = obj.boundingBox()
	const cx = (b.v1.x + b.v2.x) / 2
	const cy = (b.v1.y + b.v2.y) / 2
	return [
		{ x: cx, y: b.v1.y },
		{ x: b.v2.x, y: cy },
		{ x: cx, y: b.v2.y },
		{ x: b.v1.x, y: cy },
	]
}

export function selectedMidAt(obj: GameObject, screenP: Vector2D): number | null {
	const hs = selectedMidHandles(obj)
	for (let i = 0; i < hs.length; i++) {
		const s = camera.world2screen(hs[i])
		if (Math.hypot(screenP.x - s.x, screenP.y - s.y) <= HIT_R) return i
	}
	return null
}

export function samePoint(a: Vector2D, b: Vector2D) {
	return a.x === b.x && a.y === b.y
}
