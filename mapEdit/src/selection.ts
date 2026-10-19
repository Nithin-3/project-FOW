import type { Color, Polygon, Vector2D } from '../../src/game/types'
import { GameObject } from '../../src/game/classes/GameObject'
import { camera, gameObject, box, getSelected, setSelected, notifySelectionChange } from './state'
import { canvasPoint, edgeIndexAt, pointInBox, samePoint } from './geometry'

export function expandBoxTo(obj: GameObject) {
	const bb = obj.boundingBox()
	box.v1.x = Math.min(bb.v1.x, box.v1.x)
	box.v1.y = Math.min(bb.v1.y, box.v1.y)
	box.v2.x = Math.max(bb.v2.x, box.v2.x)
	box.v2.y = Math.max(bb.v2.y, box.v2.y)
}

function reconstruct(points: Polygon, z: number, fill: Color, doors: Vector2D[]) {
	const selected = getSelected()
	if (!selected) return
	const idx = gameObject.indexOf(selected)
	if (idx < 0) return
	let next: GameObject
	try {
		next = new GameObject(z, points, fill, doors.length ? doors : undefined)
	} catch {
		return
	}
	gameObject[idx] = next
	setSelected(next)
	notifySelectionChange()
	camera.invalidate()
}

function replaceSelected(z: number, fill: Color, doors: Vector2D[]) {
	const selected = getSelected()
	if (!selected) return
	reconstruct(selected.points, z, fill, doors)
}

function moveSelected(delta: Vector2D) {
	const selected = getSelected()
	if (!selected) return
	const points = selected.points.map(p => ({ x: p.x + delta.x, y: p.y + delta.y }))
	const doors = selected.door ? selected.door.map(p => ({ x: p.x + delta.x, y: p.y + delta.y })) : []
	reconstruct(points, selected.zIndex, selected.fill as Color, doors)
}

function moveVertex(index: number, pos: Vector2D) {
	const selected = getSelected()
	if (!selected || index < 0 || index >= selected.points.length) return
	const old = selected.points[index]
	const points = selected.points.map((p, i) => i === index ? { x: pos.x, y: pos.y } : { x: p.x, y: p.y })
	const doors = selected.door ? selected.door.map(p => samePoint(p, old) ? { x: pos.x, y: pos.y } : { x: p.x, y: p.y }) : []
	reconstruct(points, selected.zIndex, selected.fill as Color, doors)
}

function scaleSelected(origPoints: Polygon, origDoors: Vector2D[], anchor: Vector2D, origCorner: Vector2D, pos: Vector2D) {
	const selected = getSelected()
	if (!selected) return
	const sx = origCorner.x === anchor.x ? 1 : (pos.x - anchor.x) / (origCorner.x - anchor.x)
	const sy = origCorner.y === anchor.y ? 1 : (pos.y - anchor.y) / (origCorner.y - anchor.y)
	const map = (p: Vector2D) => ({ x: anchor.x + (p.x - anchor.x) * sx, y: anchor.y + (p.y - anchor.y) * sy })
	reconstruct(origPoints.map(map), selected.zIndex, selected.fill as Color, origDoors.map(map))
}

function rotateSelected(origPoints: Polygon, origDoors: Vector2D[], center: Vector2D, ang: number) {
	const selected = getSelected()
	if (!selected) return
	const c = Math.cos(ang)
	const s = Math.sin(ang)
	const map = (p: Vector2D) => {
		const dx = p.x - center.x
		const dy = p.y - center.y
		return { x: center.x + dx * c - dy * s, y: center.y + dx * s + dy * c }
	}
	reconstruct(origPoints.map(map), selected.zIndex, selected.fill as Color, origDoors.map(map))
}

function toggleDoor(obj: GameObject, edge: number) {
	const a = obj.points[edge]
	const b = obj.points[(edge + 1) % obj.points.length]
	const doors = obj.door ? [...obj.door] : []
	let found = -1
	for (let i = 0; i + 1 < doors.length; i += 2) {
		if ((samePoint(doors[i], a) && samePoint(doors[i + 1], b)) || (samePoint(doors[i], b) && samePoint(doors[i + 1], a))) {
			found = i
			break
		}
	}
	if (found >= 0) doors.splice(found, 2)
	else doors.push({ ...a }, { ...b })
	replaceSelected(obj.zIndex, obj.fill as Color, doors)
}

function selectAt(e: MouseEvent) {
	const world = camera.screen2world(canvasPoint(e))
	const prev = getSelected()
	if (prev) {
		const edge = edgeIndexAt(prev, canvasPoint(e))
		if (edge !== null) return toggleDoor(prev, edge)
	}
	let best: GameObject | null = null
	for (const go of gameObject) {
		if (pointInBox(world, go.boundingBox()) && (!best || go.zIndex >= best.zIndex)) best = go
	}
	if (prev && prev !== best) expandBoxTo(prev)
	setSelected(best)
	notifySelectionChange()
	camera.invalidate()
}

function deleteSelected() {
	const selected = getSelected()
	if (!selected) return
	const idx = gameObject.indexOf(selected)
	if (idx >= 0) gameObject.splice(idx, 1)
	setSelected(null)
	notifySelectionChange()
	camera.invalidate()
}

export { replaceSelected, moveSelected, moveVertex, scaleSelected, rotateSelected, toggleDoor, selectAt, deleteSelected }
