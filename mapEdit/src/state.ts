import type { Polygon, Vector2D } from '../../src/game/types'
import { GameObject } from '../../src/game/classes/GameObject'
import { Camera } from './camera'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.display = 'block'
document.body.style.margin = '0'
document.body.innerHTML = ''
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')!

const box = { v1: { x: -100, y: -50 }, v2: { x: 100, y: 300 } }
const gameObject: GameObject[] = []

const camera = new Camera( { x: (box.v1.x + box.v2.x) / 2 - canvas.width / 2, y: (box.v1.y + box.v2.y) / 2 - canvas.height / 2 }, canvas.width, canvas.height)

const HANDLE_R = 6
const HIT_R = 10

export type Mode = 'select' | 'draw'
export type Corner = 'v1' | 'v2'
export type Drag = Corner | 'pan' | 'move' | 'vertex' | 'scale' | 'rotate' | null

let draft: Polygon = []
let cursor: Vector2D = { x: 0, y: 0 }
let selected: GameObject | null = null
let mode: Mode = 'select'
let dragging: Drag = null
let dragIndex = -1
let rotCenter: Vector2D | null = null
let rotCursor: Vector2D = { x: 0, y: 0 }

const selectionSubs: (() => void)[] = []

function getDraft() { return draft }
function setDraft(v: Polygon) { draft = v }

function getCursor() { return cursor }
function setCursor(v: Vector2D) { cursor = v }

function getSelected() { return selected }
function setSelected(v: GameObject | null) { selected = v }

function getMode() { return mode }
function setModeValue(v: Mode) { mode = v }

function getDragging() { return dragging }
function setDragging(v: Drag) { dragging = v }

function getDragIndex() { return dragIndex }
function setDragIndex(v: number) { dragIndex = v }

function getRotCenter() { return rotCenter }
function setRotCenter(v: Vector2D | null) { rotCenter = v }

function getRotCursor() { return rotCursor }
function setRotCursor(v: Vector2D) { rotCursor = v }

function onSelectionChange(fn: () => void) { selectionSubs.push(fn) }
function notifySelectionChange() { for (const fn of selectionSubs) fn() }

export {
	canvas, ctx, box, gameObject, camera, HANDLE_R, HIT_R,
	getDraft, setDraft, getCursor, setCursor, getSelected, setSelected,
	getMode, setModeValue, getDragging, setDragging, getDragIndex, setDragIndex,
	getRotCenter, setRotCenter, getRotCursor, setRotCursor,
	onSelectionChange, notifySelectionChange,
}
