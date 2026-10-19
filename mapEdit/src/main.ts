import { canvas, ctx, box, gameObject, camera, HANDLE_R, getDraft, getCursor, getSelected, getRotCenter, getRotCursor } from './setup'

function update() {
	camera.updateZoom()

	if (camera.stateChanged) {
		camera.clearLayer()

		for (const go of [...gameObject].sort((a, b) => a.zIndex - b.zIndex)) {
			const bb = go.boundingBox()
			const o = camera.world2camera(bb.v1)
			const e = camera.world2camera(bb.v2)
			go.render(camera.layerCtx, o, e)

			camera.layerCtx.setLineDash([4, 4])
			camera.layerCtx.strokeStyle = '#00ff9d'
			camera.layerCtx.lineWidth = 1
			camera.layerCtx.strokeRect(o.x, o.y, e.x - o.x, e.y - o.y)
			camera.layerCtx.setLineDash([])
		}

		const v1 = camera.world2camera(box.v1)
		const v2 = camera.world2camera(box.v2)
		const x = Math.min(v1.x, v2.x)
		const y = Math.min(v1.y, v2.y)
		const w = Math.abs(v2.x - v1.x)
		const h = Math.abs(v2.y - v1.y)

		const wv1 = { x: Math.min(box.v1.x, box.v2.x), y: Math.min(box.v1.y, box.v2.y) }
		const wv2 = { x: Math.max(box.v1.x, box.v2.x), y: Math.max(box.v1.y, box.v2.y) }
		const grid = 30
		camera.layerCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
		camera.layerCtx.lineWidth = 1
		camera.layerCtx.beginPath()
		for (let i = Math.ceil(wv1.x / grid); i * grid <= wv2.x; i++) {
			const a = camera.world2camera({ x: i * grid, y: wv1.y })
			const b = camera.world2camera({ x: i * grid, y: wv2.y })
			camera.layerCtx.moveTo(a.x, a.y)
			camera.layerCtx.lineTo(b.x, b.y)
		}
		for (let j = Math.ceil(wv1.y / grid); j * grid <= wv2.y; j++) {
			const a = camera.world2camera({ x: wv1.x, y: j * grid })
			const b = camera.world2camera({ x: wv2.x, y: j * grid })
			camera.layerCtx.moveTo(a.x, a.y)
			camera.layerCtx.lineTo(b.x, b.y)
		}
		camera.layerCtx.stroke()

		camera.layerCtx.strokeStyle = '#fff'
		camera.layerCtx.lineWidth = 2
		camera.layerCtx.strokeRect(x, y, w, h)

		camera.layerCtx.fillStyle = '#4ea1ff'
		for (const p of [v1, v2]) {
			camera.layerCtx.fillRect(p.x - HANDLE_R, p.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2)
		}

		camera.render()
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.drawImage(camera.texture, 0, 0, canvas.width, canvas.height)

		const s1 = camera.world2screen(box.v1)
		const s2 = camera.world2screen(box.v2)
		ctx.font = '12px sans-serif'
		ctx.fillStyle = '#4ea1ff'
		ctx.textBaseline = 'bottom'
		ctx.fillText(`${Math.round(box.v1.x)}, ${Math.round(box.v1.y)}`, s1.x + HANDLE_R + 4, s1.y - HANDLE_R - 2)
		ctx.textBaseline = 'top'
		ctx.fillText(`${Math.round(box.v2.x)}, ${Math.round(box.v2.y)}`, s2.x + HANDLE_R + 4, s2.y + HANDLE_R + 2)

		const draft = getDraft()
		if (draft.length) {
			const pts = draft.map(p => camera.world2screen(p))
			ctx.strokeStyle = '#4ea1ff'
			ctx.lineWidth = 2
			ctx.beginPath()
			ctx.moveTo(pts[0].x, pts[0].y)
			for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
			ctx.stroke()

			ctx.setLineDash([5, 5])
			const c = camera.world2screen(getCursor())
			const last = pts[pts.length - 1]
			ctx.beginPath()
			ctx.moveTo(last.x, last.y)
			ctx.lineTo(c.x, c.y)
			ctx.stroke()
			ctx.setLineDash([])

			ctx.fillStyle = '#4ea1ff'
			for (const p of pts) ctx.fillRect(p.x - 3, p.y - 3, 6, 6)
		}

		const sel = getSelected()
		if (sel) {
			const pts = sel.points.map(p => camera.world2screen(p))
			ctx.strokeStyle = '#ffcc00'
			ctx.lineWidth = 2
			ctx.beginPath()
			ctx.moveTo(pts[0].x, pts[0].y)
			for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
			ctx.closePath()
			ctx.stroke()

			const bounds = sel.boundingBox()
			const b1 = camera.world2screen(bounds.v1)
			const b2 = camera.world2screen(bounds.v2)
			ctx.strokeStyle = '#fff'
			ctx.lineWidth = 1
			ctx.strokeRect(b1.x, b1.y, b2.x - b1.x, b2.y - b1.y)

			ctx.fillStyle = '#4ea1ff'
			ctx.strokeStyle = '#fff'
			for (const c of [
				{ x: b1.x, y: b1.y }, { x: b2.x, y: b1.y },
				{ x: b2.x, y: b2.y }, { x: b1.x, y: b2.y },
			]) {
				ctx.fillRect(c.x - HANDLE_R, c.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2)
				ctx.strokeRect(c.x - HANDLE_R, c.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2)
			}

			const mcx = (b1.x + b2.x) / 2
			const mcy = (b1.y + b2.y) / 2
			for (const c of [
				{ x: mcx, y: b1.y }, { x: b2.x, y: mcy },
				{ x: mcx, y: b2.y }, { x: b1.x, y: mcy },
			]) {
				ctx.beginPath()
				ctx.arc(c.x, c.y, HANDLE_R, 0, Math.PI * 2)
				ctx.fill()
				ctx.stroke()
			}

			ctx.fillStyle = '#ffcc00'
			for (const p of pts) ctx.fillRect(p.x - 3, p.y - 3, 6, 6)

			const rc = getRotCenter()
			if (rc) {
				const c = camera.world2screen(rc)
				const m = camera.world2screen(getRotCursor())
				ctx.setLineDash([5, 5])
				ctx.strokeStyle = '#4ea1ff'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(c.x, c.y)
				ctx.lineTo(m.x, m.y)
				ctx.stroke()
				ctx.setLineDash([])
				ctx.fillStyle = '#4ea1ff'
				ctx.beginPath()
				ctx.arc(c.x, c.y, 3, 0, Math.PI * 2)
				ctx.fill()
			}
		}
	}

	requestAnimationFrame(update)
}

update()
