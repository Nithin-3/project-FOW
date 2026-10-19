import type { Vector2D, Color } from '../../src/game/types'
import { GameObject } from '../../src/game/classes/GameObject'
import {
	canvas, box, camera, gameObject, getMode, getDragging, setDragging,
	getDragIndex, setDragIndex, getDraft, setDraft, setCursor, getSelected,
	setRotCenter, setRotCursor, getRotCenter,
} from './state'
import { canvasPoint, hitHandle, pointInBox, edgeIndexAt, vertexIndexAt, selectedCorners, selectedCornerAt, selectedMidAt } from './geometry'
import { selectAt, toggleDoor, moveSelected, moveVertex, scaleSelected, rotateSelected, expandBoxTo } from './selection'
import { colorInput, zInput } from './ui'

let lastX = 0
let lastY = 0
let lastWorld = { x: 0, y: 0 }
let scaleAnchor: Vector2D = { x: 0, y: 0 }
let scaleCorner: Vector2D = { x: 0, y: 0 }
let dragPoints: Vector2D[] = []
let dragDoors: Vector2D[] = []
let rotateCenter: Vector2D = { x: 0, y: 0 }
let rotateStart = 0

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	camera.handleResize()
})

canvas.addEventListener('wheel', (e) => {
	e.preventDefault()
	camera.zoom(e.deltaY > 0 ? 1.1 : 0.9, { x: e.offsetX, y: e.offsetY })
}, { passive: false })

canvas.addEventListener('mousedown', (e) => {
	if (e.shiftKey) {
		setDragging('pan')
	}
	else if (getMode() === 'select' && e.button === 0) {
		const selected = getSelected()
		const p = canvasPoint(e)
		const ci = selected ? selectedCornerAt(selected, p) : null
		const mi = ci === null && selected ? selectedMidAt(selected, p) : null
		const h = ci === null && mi === null ? hitHandle(e) : null
		if (ci !== null && selected) {
			const info = selectedCorners(selected)[ci]
			scaleAnchor = info.anchor
			scaleCorner = info.corner
			dragPoints = selected.points.map(pt => ({ ...pt }))
			dragDoors = selected.door ? selected.door.map(pt => ({ ...pt })) : []
			setDragging('scale')
			setDragIndex(ci)
		}
		else if (mi !== null && selected) {
			const b = selected.boundingBox()
			rotateCenter = { x: (b.v1.x + b.v2.x) / 2, y: (b.v1.y + b.v2.y) / 2 }
			const w = camera.screen2world(p)
			rotateStart = Math.atan2(w.y - rotateCenter.y, w.x - rotateCenter.x)
			dragPoints = selected.points.map(pt => ({ ...pt }))
			dragDoors = selected.door ? selected.door.map(pt => ({ ...pt })) : []
			setRotCenter({ x: rotateCenter.x, y: rotateCenter.y })
			setRotCursor(w)
			setDragging('rotate')
		}
		else if (h) setDragging(h)
		else if (selected) {
			const vi = vertexIndexAt(selected, p)
			const ei = vi === null ? edgeIndexAt(selected, p) : null
			if (vi !== null) { setDragging('vertex'); setDragIndex(vi) }
			else if (ei !== null) { setDragging(null); toggleDoor(selected, ei) }
			else if (pointInBox(camera.screen2world(p), selected.boundingBox())) {
				setDragging('move')
				lastWorld = camera.screen2world(p)
			}
			else { setDragging(null); selectAt(e) }
		}
		else { setDragging(null); selectAt(e) }
	}
	else setDragging(null)
	lastX = e.clientX
	lastY = e.clientY
})

window.addEventListener('mousemove', (e) => {
	const dragging = getDragging()
	if (dragging === 'v1' || dragging === 'v2') {
		box[dragging] = camera.screen2world(canvasPoint(e))
		camera.invalidate()
		canvas.style.cursor = 'default'
		return
	}
	if (dragging === 'pan') {
		camera.panBy({ x: e.clientX - lastX, y: e.clientY - lastY })
		lastX = e.clientX
		lastY = e.clientY
		canvas.style.cursor = 'grabbing'
		return
	}
	if (dragging === 'vertex') {
		moveVertex(getDragIndex(), camera.screen2world(canvasPoint(e)))
		canvas.style.cursor = 'move'
		return
	}
	if (dragging === 'scale') {
		scaleSelected(dragPoints, dragDoors, scaleAnchor, scaleCorner, camera.screen2world(canvasPoint(e)))
		canvas.style.cursor = resizeCursor(getDragIndex())
		return
	}
	if (dragging === 'rotate') {
		const w = camera.screen2world(canvasPoint(e))
		setRotCursor(w)
		const ang = Math.atan2(w.y - rotateCenter.y, w.x - rotateCenter.x)
		rotateSelected(dragPoints, dragDoors, rotateCenter, ang - rotateStart)
		canvas.style.cursor = 'grabbing'
		return
	}
	if (dragging === 'move') {
		const w = camera.screen2world(canvasPoint(e))
		moveSelected({ x: w.x - lastWorld.x, y: w.y - lastWorld.y })
		lastWorld = w
		canvas.style.cursor = 'move'
		return
	}
	const mode = getMode()
	if (mode === 'draw') {
		setCursor(camera.screen2world(canvasPoint(e)))
		camera.invalidate()
	}
	if (e.shiftKey) { canvas.style.cursor = 'grab'; return }
	if (mode === 'select') {
		const selected = getSelected()
		if (selected) {
			const ci = selectedCornerAt(selected, canvasPoint(e))
			if (ci !== null) { canvas.style.cursor = resizeCursor(ci); return }
			if (selectedMidAt(selected, canvasPoint(e)) !== null) { canvas.style.cursor = 'grabbing'; return }
		}
		if (hitHandle(e)) { canvas.style.cursor = 'grab'; return }
		if (selected) {
			if (vertexIndexAt(selected, canvasPoint(e)) !== null) { canvas.style.cursor = 'move'; return }
			if (edgeIndexAt(selected, canvasPoint(e)) !== null) { canvas.style.cursor = 'pointer'; return }
			if (pointInBox(camera.screen2world(canvasPoint(e)), selected.boundingBox())) { canvas.style.cursor = 'move'; return }
		}
		const world = camera.screen2world(canvasPoint(e))
		canvas.style.cursor = gameObject.some(go => pointInBox(world, go.boundingBox())) ? 'pointer' : 'default'
		return
	}
	canvas.style.cursor = 'default'
})

function resizeCursor(corner: number): string {
	return corner === 0 || corner === 2 ? 'nwse-resize' : 'nesw-resize'
}

canvas.addEventListener('click', (e) => {
	if (getMode() !== 'draw' || e.button !== 0 || e.shiftKey) return
	getDraft().push(camera.screen2world(canvasPoint(e)))
	camera.invalidate()
})

canvas.addEventListener('contextmenu', (e) => {
	if (getMode() !== 'draw') return
	e.preventDefault()
	if (e.shiftKey) return
	const draft = getDraft()
	if (draft.length) {
		draft.pop()
		camera.invalidate()
	}
})

window.addEventListener('keydown', (e) => {
	if (getMode() !== 'draw') return
	switch (e.key) {
		case 'c':
		case 'C': {
			const draft = getDraft()
			if (draft.length >= 3) {
				const xs = draft.map(p => p.x)
				const ys = draft.map(p => p.y)
				const w = Math.max(...xs) - Math.min(...xs)
				const h = Math.max(...ys) - Math.min(...ys)
				if (w > 0 && h > 0) {
					const obj = new GameObject(Number(zInput.value) || 0, [...draft], colorInput.value as Color)
					gameObject.push(obj)
					expandBoxTo(obj)
				}
				setDraft([])
				camera.invalidate()
			}
			break
		}
		case 'Delete':
			setDraft([])
			camera.invalidate()
			break
		case 'Backspace': {
			const draft = getDraft()
			if (draft.length) {
				draft.pop()
				camera.invalidate()
			}
			break
		}
	}
})

window.addEventListener('mouseup', () => {
	if (getRotCenter()) {
		setRotCenter(null)
		camera.invalidate()
	}
	setDragging(null)
	canvas.style.cursor = 'default'
})
