import type { Color } from '../../src/game/types'
import {
	canvas, camera, getMode, getSelected, setModeValue, setDraft, setCursor, setSelected,
	setDragging, setDragIndex, onSelectionChange, type Mode,
} from './state'
import { replaceSelected, deleteSelected, expandBoxTo } from './selection'

const ui = document.createElement('div')
ui.style.cssText = 'position:fixed;left:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;z-index:10;'

const buttons = {} as Record<Mode, HTMLButtonElement>

const drawPanel = document.createElement('div')
drawPanel.style.cssText = 'display:none;flex-direction:column;gap:4px;margin-top:6px;font:11px sans-serif;color:#aaa;'

const colorInput = document.createElement('input')
colorInput.type = 'color'
colorInput.value = '#4ea1ff'
colorInput.style.cssText = 'width:64px;height:24px;padding:0;border:none;background:none;cursor:pointer;'

const zInput = document.createElement('input')
zInput.type = 'number'
zInput.value = '0'
zInput.step = '1'
zInput.style.cssText = 'width:64px;padding:4px;border:none;border-radius:4px;background:#333;color:#fff;font:11px sans-serif;'

drawPanel.append(colorInput, zInput)

const selectPanel = document.createElement('div')
selectPanel.style.cssText = 'display:none;flex-direction:column;gap:4px;margin-top:6px;font:11px sans-serif;color:#aaa;'

const selColor = document.createElement('input')
selColor.type = 'color'
selColor.style.cssText = colorInput.style.cssText

const selZ = document.createElement('input')
selZ.type = 'number'
selZ.step = '1'
selZ.style.cssText = zInput.style.cssText

const delBtn = document.createElement('button')
delBtn.textContent = 'delete'
delBtn.style.cssText = 'width:64px;padding:6px 0;border:none;border-radius:4px;color:#fff;background:#a33;cursor:pointer;font:12px sans-serif;'

selectPanel.append(selColor, selZ, delBtn)

function syncPanel() {
	const selected = getSelected()
	if (selected) {
		selColor.value = selected.fill as string
		selZ.value = String(selected.zIndex)
	}
	selectPanel.style.display = selected && getMode() === 'select' ? 'flex' : 'none'
}

function setMode(m: Mode) {
	const prev = getMode()
	if (prev === 'draw' && m !== 'draw') setDraft([])
	if (prev === 'select' && m !== 'select') {
		const selected = getSelected()
		if (selected) expandBoxTo(selected)
		setSelected(null)
	}
	setModeValue(m)
	setDragging(null)
	setDragIndex(-1)
	setCursor({ x: 0, y: 0 })
	canvas.style.cursor = 'default'
	camera.invalidate()
	drawPanel.style.display = m === 'draw' ? 'flex' : 'none'
	syncPanel()
	for (const k of Object.keys(buttons) as Mode[])
		buttons[k].style.background = k === m ? '#4ea1ff' : '#333'
}

;(['select', 'draw'] as Mode[]).forEach((m) => {
	const b = document.createElement('button')
	b.textContent = m
	b.style.cssText = 'width:64px;padding:6px 0;border:none;border-radius:4px;color:#fff;background:#333;cursor:pointer;font:12px sans-serif;text-transform:capitalize;'
	b.onclick = () => setMode(m)
	buttons[m] = b
	ui.appendChild(b)
})

ui.appendChild(drawPanel)
ui.appendChild(selectPanel)
document.body.appendChild(ui)

selColor.addEventListener('input', () => {
	const selected = getSelected()
	if (selected) replaceSelected(selected.zIndex, selColor.value as Color, selected.door ? [...selected.door] : [])
})

selZ.addEventListener('input', () => {
	const selected = getSelected()
	const z = Number(selZ.value)
	if (selected && Number.isFinite(z)) replaceSelected(z, selected.fill as Color, selected.door ? [...selected.door] : [])
})

delBtn.onclick = () => deleteSelected()

onSelectionChange(syncPanel)

setMode('select')

export { setMode, syncPanel, colorInput, zInput, selColor, selZ, delBtn }
