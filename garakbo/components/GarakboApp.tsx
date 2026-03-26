'use client'

import { useEffect, useRef } from 'react'

const BEATS = 4, SUBS = 3, CELLS = BEATS * SUBS

const INST = [
  { name: '쇠',  color: '#ff3b30', sounds: ['갱','개','지-','갯','딱','뜨리','깽'] },
  { name: '장구', color: '#007aff', sounds: ['덩','구','궁','따','기','기기','기따'] },
  { name: '북',   color: '#34c759', sounds: ['둥','두','딱'] },
  { name: '징',   color: '#5856d6', sounds: ['징','징-','짓'] },
]

export default function GarakboApp() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    // ── State ──
    let mode      = 'samul'
    let numM      = 4
    let samulData: Record<string, { snd: string }> = {}
    let basicRows = 4
    let basicData: Record<string, { snd: string }> = {}
    let descData:  Record<string, string> = {}
    let showDesc  = false
    let selI = 0, selS = 0, openI = 0
    let popType: string | null = null, popIdx: number | null = null

    // Selection state
    let selAnchor:  { r: number; c: number } | null = null
    let selCurrent: { r: number; c: number } | null = null
    let mouseDownCell: HTMLElement | null = null
    let mouseDownX = 0, mouseDownY = 0
    let didDrag = false, isSelecting = false
    let clipboard2d: string[][] | null = null
    let lastFocusedSamulKey: string | null = null
    let lastFocusedSamulInp: HTMLInputElement | null = null

    // ── DOM refs ──
    const $  = (id: string) => root.querySelector('#' + id) as HTMLElement
    const titleInput   = () => root.querySelector('.title-input')   as HTMLInputElement
    const titleDisplay = () => root.querySelector('.s-title')        as HTMLElement
    const scoreContainer = () => root.querySelector('.score-container') as HTMLElement
    const instList     = () => root.querySelector('.inst-list')      as HTMLElement
    const msrBadge     = () => root.querySelector('.msr-badge')      as HTMLElement
    const sbSel        = () => root.querySelector('.sb-sel')         as HTMLElement
    const selToolbar   = () => root.querySelector('.sel-toolbar')    as HTMLElement
    const handlePopup  = () => root.querySelector('.handle-popup')   as HTMLElement
    const printArea    = () => root.querySelector('#printArea')       as HTMLElement

    // ── Mode switch ──
    function setMode(m: string) {
      mode = m
      ;(root.querySelector('#btnSamul') as HTMLElement).className = 'seg-btn' + (m === 'samul' ? ' on' : '')
      ;(root.querySelector('#btnBasic') as HTMLElement).className = 'seg-btn' + (m === 'basic' ? ' on' : '')
      ;(root.querySelector('.samul-side') as HTMLElement).style.display = m === 'samul' ? 'block' : 'none'
      ;(root.querySelector('.basic-side') as HTMLElement).style.display = m === 'basic'  ? 'block' : 'none'
      closePopup()
      render()
      updateStatus()
    }

    // ── toggleDesc ──
    function toggleDesc() {
      showDesc = !showDesc
      const btn = root.querySelector('.desc-toggle-btn') as HTMLElement
      btn.textContent = showDesc ? '설명 ON' : '설명 OFF'
      btn.className = 'toggle-btn' + (showDesc ? ' on' : '')
      render()
    }

    // ── Sidebar ──
    function buildSidebar() {
      const list = instList()
      list.innerHTML = ''
      INST.forEach((inst, ii) => {
        const wrap = document.createElement('div')
        wrap.className = 'inst-wrap'

        const btn = document.createElement('button')
        btn.className = 'inst-btn' + (selI === ii ? ' active' : '') + (openI === ii ? ' open' : '')
        const nameSpan = document.createElement('span')
        nameSpan.style.color = inst.color
        nameSpan.textContent = inst.name
        const chevSpan = document.createElement('span')
        chevSpan.className = 'chev'
        chevSpan.textContent = '▾'
        btn.appendChild(nameSpan); btn.appendChild(chevSpan)
        btn.onclick = () => {
          openI = openI === ii ? -1 : ii
          selI = ii
          buildSidebar(); updateStatus()
        }
        wrap.appendChild(btn)

        const drop = document.createElement('div')
        drop.className = 'inst-dropdown' + (openI === ii ? ' open' : '')
        inst.sounds.forEach((snd, si) => {
          const sb = document.createElement('button')
          sb.className = 'snd-btn' + (selI === ii && selS === si ? ' sel' : '')
          const dot = document.createElement('span')
          dot.className = 'snd-dot'; dot.style.background = inst.color
          sb.appendChild(dot); sb.appendChild(document.createTextNode(snd))
          sb.onclick = e => {
            e.stopPropagation()
            selI = ii; selS = si
            buildSidebar(); updateStatus()
            if (mode === 'samul') samulFillSound()
          }
          drop.appendChild(sb)
        })
        wrap.appendChild(drop)
        list.appendChild(wrap)
      })
    }

    function updateStatus() {
      msrBadge().textContent = mode === 'samul' ? `마디 ${numM}개` : `행 ${basicRows}개`
      sbSel().textContent = mode === 'samul'
        ? `${INST[selI].name} · ${INST[selI].sounds[selS]}`
        : '셀 클릭 후 직접 입력'
    }

    // ── Render ──
    function render() {
      titleDisplay().textContent = titleInput().value || '가락보'
      if (mode === 'samul') renderSamul(); else renderBasic()
      updateStatus()
    }

    // ── SAMUL render ──
    function renderSamul() {
      const con = scoreContainer(); con.innerHTML = ''
      const tbl = document.createElement('table'); tbl.className = 'g'

      for (let m = 0; m < numM; m++) {
        const tbody = document.createElement('tbody'); tbody.className = 'mb'
        INST.forEach((inst, ii) => {
          const lastInst = ii === INST.length - 1
          const bbClass  = lastInst ? 'bb-block' : 'bb-inst'
          const tr = document.createElement('tr')

          if (ii === 0) {
            const hTd = document.createElement('td'); hTd.className = 'td-handle'; hTd.rowSpan = INST.length
            const hBtn = document.createElement('button'); hBtn.className = 'handle-btn'; hBtn.textContent = '⠿'
            hBtn.onclick = e => openPopup(e as MouseEvent, 'measure', m)
            hTd.appendChild(hBtn); tr.appendChild(hTd)

            const numTd = document.createElement('td'); numTd.className = 'td-msr-num'; numTd.rowSpan = INST.length
            numTd.textContent = String(m + 1); tr.appendChild(numTd)
          }

          const nameTd = document.createElement('td')
          nameTd.className = 'td-inst-name ' + bbClass; nameTd.textContent = inst.name; tr.appendChild(nameTd)

          for (let b = 0; b < BEATS; b++) {
            for (let s = 0; s < SUBS; s++) {
              const ci = b * SUBS + s
              const key = `${m}_${ii}_${ci}`
              const nd = samulData[key]
              const td = document.createElement('td')
              td.className = 'td-note ' + bbClass
              td.style.padding = '0'
              td.dataset.r = String(m * INST.length + ii)
              td.dataset.c = String(ci); td.dataset.mode = 'samul'
              if (s < SUBS - 1) td.classList.add('br-sub')
              else if (b < BEATS - 1) td.classList.add('br-beat')
              else td.classList.add('br-edge')

              const inp = document.createElement('input')
              inp.className = 'cell-input'; inp.type = 'text'; inp.maxLength = 4
              inp.value = nd ? nd.snd : ''
              inp.addEventListener('input', () => {
                const v = inp.value.trim()
                if (v) samulData[key] = { snd: v }; else delete samulData[key]
              })
              inp.addEventListener('focus', () => { lastFocusedSamulKey = key; lastFocusedSamulInp = inp })
              inp.addEventListener('mousedown', e => {
                if (selAnchor !== null || e.shiftKey) { e.preventDefault(); onCellMouseDown(e, td) }
                else { mouseDownCell = td; mouseDownX = e.clientX; mouseDownY = e.clientY; didDrag = false }
              })
              inp.addEventListener('mouseover', e => onCellMouseOver(e, td))
              inp.addEventListener('contextmenu', e => { e.preventDefault(); showContextMenuAt(e as MouseEvent) })
              td.addEventListener('mousedown', e => { if (e.target === inp) return; e.preventDefault(); onCellMouseDown(e, td) })
              td.addEventListener('mouseover', e => onCellMouseOver(e, td))
              td.appendChild(inp); tr.appendChild(td)
            }
          }

          if (showDesc && ii === 0) {
            const dKey = `samul_${m}`
            const dTd = document.createElement('td'); dTd.className = 'td-desc bb-block'; dTd.rowSpan = INST.length
            const dInp = document.createElement('textarea'); dInp.className = 'desc-input'
            dInp.placeholder = '설명 입력…'; dInp.value = descData[dKey] || ''
            const autoResize = () => { dInp.style.height = 'auto'; dInp.style.height = dInp.scrollHeight + 'px' }
            dInp.addEventListener('input', () => { const v = dInp.value; if (v) descData[dKey] = v; else delete descData[dKey]; autoResize() })
            dInp.addEventListener('mousedown', e => e.stopPropagation())
            dTd.appendChild(dInp); tr.appendChild(dTd)
            requestAnimationFrame(autoResize)
          }

          tbody.appendChild(tr)
        })
        tbl.appendChild(tbody)
      }
      con.appendChild(tbl)
      const addWrap = document.createElement('div'); addWrap.className = 'add-row-wrap'
      const addBtn = document.createElement('button'); addBtn.className = 'add-row-btn'; addBtn.textContent = '+ 마디 추가'
      addBtn.onclick = () => { numM++; render(); updateStatus() }
      addWrap.appendChild(addBtn); con.appendChild(addWrap)
    }

    function samulFillSound() {
      if (!lastFocusedSamulInp || !lastFocusedSamulKey) return
      const snd = INST[selI].sounds[selS]
      samulData[lastFocusedSamulKey] = { snd }; lastFocusedSamulInp.value = snd; lastFocusedSamulInp.focus()
    }

    // ── BASIC render ──
    function renderBasic() {
      const con = scoreContainer(); con.innerHTML = ''
      const tbl = document.createElement('table'); tbl.className = 'g'

      for (let r = 0; r < basicRows; r++) {
        const lastRow = r === basicRows - 1
        const bbClass = lastRow ? 'bb-block' : 'bb-inst'
        const tr = document.createElement('tr')

        const hTd = document.createElement('td'); hTd.className = 'td-handle ' + bbClass
        const hBtn = document.createElement('button'); hBtn.className = 'handle-btn'; hBtn.textContent = '⠿'
        hBtn.onclick = e => openPopup(e as MouseEvent, 'row', r)
        hTd.appendChild(hBtn); tr.appendChild(hTd)

        const numTd = document.createElement('td'); numTd.className = 'td-free-num ' + bbClass
        numTd.textContent = String(r + 1); tr.appendChild(numTd)

        for (let b = 0; b < BEATS; b++) {
          for (let s = 0; s < SUBS; s++) {
            const ci = b * SUBS + s; const key = `${r}_${ci}`; const nd = basicData[key]
            const td = document.createElement('td'); td.className = 'td-note ' + bbClass; td.style.padding = '0'
            td.dataset.r = String(r); td.dataset.c = String(ci); td.dataset.mode = 'basic'
            if (s < SUBS - 1) td.classList.add('br-sub')
            else if (b < BEATS - 1) td.classList.add('br-beat')
            else td.classList.add('br-edge')

            const inp = document.createElement('input'); inp.className = 'cell-input'; inp.type = 'text'; inp.maxLength = 4
            inp.value = nd ? nd.snd : ''
            inp.addEventListener('input', () => { const v = inp.value.trim(); if (v) basicData[key] = { snd: v }; else delete basicData[key] })
            inp.addEventListener('mousedown', e => {
              if (selAnchor !== null || e.shiftKey) { e.preventDefault(); onCellMouseDown(e, td) }
              else { mouseDownCell = td; mouseDownX = e.clientX; mouseDownY = e.clientY; didDrag = false }
            })
            inp.addEventListener('mouseover', e => onCellMouseOver(e, td))
            inp.addEventListener('contextmenu', e => { e.preventDefault(); showContextMenuAt(e as MouseEvent) })
            td.addEventListener('mousedown', e => { if (e.target === inp) return; e.preventDefault(); onCellMouseDown(e, td) })
            td.addEventListener('mouseover', e => onCellMouseOver(e, td))
            td.appendChild(inp); tr.appendChild(td)
          }
        }

        if (showDesc) {
          const dKey = `basic_${r}`
          const dTd = document.createElement('td'); dTd.className = 'td-desc ' + bbClass
          const dInp = document.createElement('textarea'); dInp.className = 'desc-input'
          dInp.placeholder = '설명 입력…'; dInp.value = descData[dKey] || ''
          const autoResize = () => { dInp.style.height = 'auto'; dInp.style.height = dInp.scrollHeight + 'px' }
          dInp.addEventListener('input', () => { const v = dInp.value; if (v) descData[dKey] = v; else delete descData[dKey]; autoResize() })
          dInp.addEventListener('mousedown', e => e.stopPropagation())
          dTd.appendChild(dInp); tr.appendChild(dTd)
          requestAnimationFrame(autoResize)
        }

        tbl.appendChild(tr)
      }
      con.appendChild(tbl)
      const addWrap = document.createElement('div'); addWrap.className = 'add-row-wrap'
      const addBtn = document.createElement('button'); addBtn.className = 'add-row-btn'; addBtn.textContent = '+ 행 추가'
      addBtn.onclick = () => { basicRows++; render(); updateStatus() }
      addWrap.appendChild(addBtn); con.appendChild(addWrap)
    }

    // ── Popup ──
    function openPopup(e: MouseEvent, type: string, idx: number) {
      e.stopPropagation(); popType = type; popIdx = idx
      const maxIdx = type === 'measure' ? numM - 1 : basicRows - 1
      ;(handlePopup().querySelector('#pop-up') as HTMLButtonElement).disabled   = idx === 0
      ;(handlePopup().querySelector('#pop-down') as HTMLButtonElement).disabled = idx === maxIdx
      handlePopup().classList.add('show')
      let x = e.clientX + 12, y = e.clientY - 8
      if (x + 140 > window.innerWidth) x = e.clientX - 150
      if (y + 120 > window.innerHeight) y = e.clientY - 110
      handlePopup().style.left = x + 'px'; handlePopup().style.top = y + 'px'
    }
    function closePopup() { handlePopup().classList.remove('show') }

    function handleAction(action: string) {
      closePopup()
      if (action === 'up')     { popType === 'measure' ? swapMeasures(popIdx!, popIdx! - 1) : swapRows(popIdx!, popIdx! - 1) }
      if (action === 'down')   { popType === 'measure' ? swapMeasures(popIdx!, popIdx! + 1) : swapRows(popIdx!, popIdx! + 1) }
      if (action === 'delete') { popType === 'measure' ? deleteMeasure(popIdx!) : deleteRow(popIdx!) }
      render(); updateStatus()
    }

    function swapMeasures(a: number, b: number) {
      if (a < 0 || b < 0 || a >= numM || b >= numM) return
      INST.forEach((_, ii) => {
        for (let c = 0; c < CELLS; c++) {
          const ka = `${a}_${ii}_${c}`, kb = `${b}_${ii}_${c}`
          const tmp = samulData[ka] ? { ...samulData[ka] } : null
          if (samulData[kb]) samulData[ka] = { ...samulData[kb] }; else delete samulData[ka]
          if (tmp) samulData[kb] = tmp; else delete samulData[kb]
        }
      })
      const da = `samul_${a}`, db = `samul_${b}`; const tmpD = descData[da]
      if (descData[db]) descData[da] = descData[db]; else delete descData[da]
      if (tmpD) descData[db] = tmpD; else delete descData[db]
    }
    function deleteMeasure(idx: number) {
      if (numM <= 1) { alert('마지막 마디는 삭제할 수 없습니다.'); return }
      for (let m = idx; m < numM - 1; m++) {
        INST.forEach((_, ii) => {
          for (let c = 0; c < CELLS; c++) {
            const kn = `${m+1}_${ii}_${c}`, kc = `${m}_${ii}_${c}`
            if (samulData[kn]) samulData[kc] = { ...samulData[kn] }; else delete samulData[kc]
          }
        })
        const dn = `samul_${m+1}`, dc = `samul_${m}`
        if (descData[dn]) descData[dc] = descData[dn]; else delete descData[dc]
      }
      const last = numM - 1
      INST.forEach((_, ii) => { for (let c = 0; c < CELLS; c++) delete samulData[`${last}_${ii}_${c}`] })
      delete descData[`samul_${last}`]; numM--
    }
    function swapRows(a: number, b: number) {
      if (a < 0 || b < 0 || a >= basicRows || b >= basicRows) return
      for (let c = 0; c < CELLS; c++) {
        const ka = `${a}_${c}`, kb = `${b}_${c}`
        const tmp = basicData[ka] ? { ...basicData[ka] } : null
        if (basicData[kb]) basicData[ka] = { ...basicData[kb] }; else delete basicData[ka]
        if (tmp) basicData[kb] = tmp; else delete basicData[kb]
      }
      const da = `basic_${a}`, db = `basic_${b}`; const tmpD = descData[da]
      if (descData[db]) descData[da] = descData[db]; else delete descData[da]
      if (tmpD) descData[db] = tmpD; else delete descData[db]
    }
    function deleteRow(idx: number) {
      if (basicRows <= 1) { alert('마지막 행은 삭제할 수 없습니다.'); return }
      for (let r = idx; r < basicRows - 1; r++) {
        for (let c = 0; c < CELLS; c++) {
          const kn = `${r+1}_${c}`, kc = `${r}_${c}`
          if (basicData[kn]) basicData[kc] = { ...basicData[kn] }; else delete basicData[kc]
        }
        const dn = `basic_${r+1}`, dc = `basic_${r}`
        if (descData[dn]) descData[dc] = descData[dn]; else delete descData[dc]
      }
      const last = basicRows - 1
      for (let c = 0; c < CELLS; c++) delete basicData[`${last}_${c}`]
      delete descData[`basic_${last}`]; basicRows--
    }

    // ── Controls ──
    function clearAll() {
      if (!confirm('모든 내용을 초기화할까요?')) return
      samulData = {}; numM = 4; basicData = {}; basicRows = 4; descData = {}
      closePopup(); render(); updateStatus()
    }

    // ── Selection system ──
    function onCellMouseDown(e: MouseEvent, td: HTMLElement) {
      if (e.button !== 0) return
      mouseDownCell = td; mouseDownX = e.clientX; mouseDownY = e.clientY; didDrag = false; isSelecting = false
    }
    function onCellMouseOver(e: MouseEvent, td: HTMLElement) {
      if (!mouseDownCell) return
      const dx = Math.abs(e.clientX - mouseDownX), dy = Math.abs(e.clientY - mouseDownY)
      if (!didDrag && dx < 4 && dy < 4) return
      if (!didDrag) { didDrag = true; isSelecting = true; selAnchor = cellCoord(mouseDownCell) }
      selCurrent = cellCoord(td); paintSelection(); hideSelToolbar()
    }
    function cellCoord(td: HTMLElement) {
      return { r: parseInt(td.dataset.r!), c: parseInt(td.dataset.c!) }
    }
    function getSelRect() {
      if (!selAnchor) return null
      const cur = selCurrent || selAnchor
      return { r0: Math.min(selAnchor.r, cur.r), r1: Math.max(selAnchor.r, cur.r), c0: Math.min(selAnchor.c, cur.c), c1: Math.max(selAnchor.c, cur.c) }
    }
    function getAllNoteTds() { return root.querySelectorAll('.td-note[data-r]') as NodeListOf<HTMLElement> }
    function paintSelection() {
      const rect = getSelRect()
      getAllNoteTds().forEach(td => {
        const r = parseInt(td.dataset.r!), c = parseInt(td.dataset.c!)
        if (rect && r >= rect.r0 && r <= rect.r1 && c >= rect.c0 && c <= rect.c1) td.classList.add('sel-cell')
        else td.classList.remove('sel-cell')
      })
    }
    function clearSelection() { selAnchor = null; selCurrent = null; getAllNoteTds().forEach(td => td.classList.remove('sel-cell')); hideSelToolbar() }
    function hasSelection() { return selAnchor !== null }

    function showSelToolbarAt(x: number, y: number) {
      const tb = selToolbar(); tb.classList.add('show')
      let tx = x + 10, ty = y - 44
      if (tx + 220 > window.innerWidth) tx = window.innerWidth - 230
      if (ty < 4) ty = y + 10
      tb.style.left = tx + 'px'; tb.style.top = ty + 'px'
    }
    function hideSelToolbar() { selToolbar().classList.remove('show') }
    function showContextMenuAt(e: MouseEvent) {
      if (hasSelection()) { showSelToolbarAt(e.clientX, e.clientY); return }
      const td = (e.currentTarget as HTMLElement)?.closest?.('.td-note') as HTMLElement
      if (!td) return
      selAnchor = cellCoord(td); selCurrent = null; paintSelection(); showSelToolbarAt(e.clientX, e.clientY)
    }

    function getCellValue(r: number, c: number) {
      if (mode === 'samul') { const m = Math.floor(r / INST.length), ii = r % INST.length, key = `${m}_${ii}_${c}`; return samulData[key]?.snd || '' }
      else { return basicData[`${r}_${c}`]?.snd || '' }
    }
    function setCellValue(r: number, c: number, val: string) {
      if (mode === 'samul') { const m = Math.floor(r / INST.length), ii = r % INST.length; if (m >= numM) return; const key = `${m}_${ii}_${c}`; if (val) samulData[key] = { snd: val }; else delete samulData[key] }
      else { if (r >= basicRows) return; const key = `${r}_${c}`; if (val) basicData[key] = { snd: val }; else delete basicData[key] }
    }
    function refreshCell(r: number, c: number) {
      const td = root.querySelector(`.td-note[data-r="${r}"][data-c="${c}"]`) as HTMLElement
      if (!td) return; const val = getCellValue(r, c); const inp = td.querySelector('input') as HTMLInputElement
      if (inp) inp.value = val; else td.textContent = val
    }
    function selDelete() {
      const rect = getSelRect(); if (!rect) return
      for (let r = rect.r0; r <= rect.r1; r++) for (let c = rect.c0; c <= rect.c1; c++) { setCellValue(r, c, ''); refreshCell(r, c) }
      hideSelToolbar()
    }
    function selCopy() {
      const rect = getSelRect(); if (!rect) return
      clipboard2d = []
      for (let r = rect.r0; r <= rect.r1; r++) { const row: string[] = []; for (let c = rect.c0; c <= rect.c1; c++) row.push(getCellValue(r, c)); clipboard2d.push(row) }
      navigator.clipboard.writeText(clipboard2d.map(row => row.join('\t')).join('\n')).catch(() => {})
      hideSelToolbar()
      getAllNoteTds().forEach(td => {
        const r = parseInt(td.dataset.r!), c = parseInt(td.dataset.c!)
        if (rect && r >= rect.r0 && r <= rect.r1 && c >= rect.c0 && c <= rect.c1) {
          td.style.outline = '2px solid #0071e3'; setTimeout(() => { td.style.outline = ''; paintSelection() }, 400)
        }
      })
    }
    function selPaste() {
      if (!clipboard2d || !selAnchor) return
      const startR = selAnchor.r, startC = selAnchor.c
      clipboard2d.forEach((row, ri) => row.forEach((val, ci) => { setCellValue(startR + ri, startC + ci, val); refreshCell(startR + ri, startC + ci) }))
      hideSelToolbar()
    }

    // ── PDF Export ──
    const SAMUL_PER_PAGE = 5, BASIC_PER_PAGE = 10
    function exportPDF() {
      const title = titleInput().value || '가락보'
      const pa = printArea(); pa.innerHTML = ''
      if (mode === 'samul') {
        const pages = Math.ceil(numM / SAMUL_PER_PAGE)
        for (let p = 0; p < pages; p++) {
          const pageDiv = document.createElement('div'); pageDiv.className = 'print-page'
          if (p === 0) { const hdg = document.createElement('div'); hdg.className = 'print-page-heading'; hdg.innerHTML = `<div class="pt">${title}</div>`; pageDiv.appendChild(hdg) }
          const tbl = document.createElement('table'); tbl.className = 'gp'
          const start = p * SAMUL_PER_PAGE, end = Math.min(start + SAMUL_PER_PAGE, numM)
          for (let m = start; m < end; m++) {
            INST.forEach((inst, ii) => {
              const lastInst = ii === INST.length - 1, bbClass = lastInst ? 'gp-bb-block' : 'gp-bb-inst'
              const tr = document.createElement('tr')
              if (ii === 0) { const numTd = document.createElement('td'); numTd.className = 'gp-msr-num'; numTd.rowSpan = INST.length; numTd.textContent = String(m + 1); tr.appendChild(numTd) }
              const nameTd = document.createElement('td'); nameTd.className = 'gp-inst-name ' + bbClass; nameTd.textContent = inst.name; tr.appendChild(nameTd)
              for (let b = 0; b < BEATS; b++) for (let s = 0; s < SUBS; s++) {
                const ci = b * SUBS + s, key = `${m}_${ii}_${ci}`, nd = samulData[key]
                const td = document.createElement('td'); td.className = 'gp-note ' + bbClass
                if (s < SUBS-1) td.classList.add('gp-br-sub'); else if (b < BEATS-1) td.classList.add('gp-br-beat'); else td.classList.add('gp-br-edge')
                if (nd) td.textContent = nd.snd; tr.appendChild(td)
              }
              if (showDesc && ii === 0) { const dTd = document.createElement('td'); dTd.className = 'gp-desc gp-bb-block'; dTd.rowSpan = INST.length; dTd.textContent = descData[`samul_${m}`] || ''; tr.appendChild(dTd) }
              tbl.appendChild(tr)
            })
          }
          pageDiv.appendChild(tbl); pa.appendChild(pageDiv)
        }
      } else {
        const pages = Math.ceil(basicRows / BASIC_PER_PAGE)
        for (let p = 0; p < pages; p++) {
          const pageDiv = document.createElement('div'); pageDiv.className = 'print-page'
          if (p === 0) { const hdg = document.createElement('div'); hdg.className = 'print-page-heading'; hdg.innerHTML = `<div class="pt">${title}</div>`; pageDiv.appendChild(hdg) }
          const tbl = document.createElement('table'); tbl.className = 'gp'
          const start = p * BASIC_PER_PAGE, end = Math.min(start + BASIC_PER_PAGE, basicRows)
          for (let r = start; r < end; r++) {
            const lastRow = r === end - 1, bbClass = lastRow ? 'gp-bb-block' : 'gp-bb-inst'
            const tr = document.createElement('tr')
            const numTd = document.createElement('td'); numTd.className = 'gp-free-num ' + bbClass; numTd.textContent = String(r + 1); tr.appendChild(numTd)
            for (let b = 0; b < BEATS; b++) for (let s = 0; s < SUBS; s++) {
              const ci = b * SUBS + s, key = `${r}_${ci}`, nd = basicData[key]
              const td = document.createElement('td'); td.className = 'gp-note ' + bbClass
              if (s < SUBS-1) td.classList.add('gp-br-sub'); else if (b < BEATS-1) td.classList.add('gp-br-beat'); else td.classList.add('gp-br-edge')
              if (nd) td.textContent = nd.snd; tr.appendChild(td)
            }
            if (showDesc) { const dTd = document.createElement('td'); dTd.className = 'gp-desc ' + bbClass; dTd.textContent = descData[`basic_${r}`] || ''; tr.appendChild(dTd) }
            tbl.appendChild(tr)
          }
          pageDiv.appendChild(tbl); pa.appendChild(pageDiv)
        }
      }
      window.print()
    }

    // ── Event wiring ──
    // titlebar buttons
    root.querySelector('#btnSamul')!.addEventListener('click', () => setMode('samul'))
    root.querySelector('#btnBasic')!.addEventListener('click', () => setMode('basic'))
    root.querySelector('.desc-toggle-btn')!.addEventListener('click', toggleDesc)
    root.querySelector('.btn-init')!.addEventListener('click', clearAll)
    root.querySelector('.btn-pdf')!.addEventListener('click', exportPDF)
    root.querySelector('.title-input')!.addEventListener('input', () => render())

    // handle popup buttons
    root.querySelector('#pop-up')!.addEventListener('click', () => handleAction('up'))
    root.querySelector('#pop-down')!.addEventListener('click', () => handleAction('down'))
    root.querySelector('#pop-delete')!.addEventListener('click', () => handleAction('delete'))

    // selection toolbar buttons
    root.querySelector('#sel-copy')!.addEventListener('click', selCopy)
    root.querySelector('#sel-paste')!.addEventListener('click', selPaste)
    root.querySelector('#sel-delete')!.addEventListener('click', selDelete)

    // global mouseup
    const onMouseUp = (e: MouseEvent) => {
      if (didDrag && isSelecting && selAnchor) showSelToolbarAt(e.clientX, e.clientY)
      if (mouseDownCell && !didDrag && hasSelection() && !isSelecting) clearSelection()
      mouseDownCell = null; isSelecting = false
    }
    const onMouseDown = (e: MouseEvent) => {
      const tb = selToolbar(), popup = handlePopup()
      if (!tb.contains(e.target as Node) && !(e.target as HTMLElement).closest?.('.td-note')) clearSelection()
      if (!popup.contains(e.target as Node)) closePopup()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement) === root.querySelector('.title-input')) return
      if ((e.target as HTMLElement).classList.contains('cell-input') && !hasSelection()) return
      if (e.key === 'Escape') { clearSelection(); return }
      if (!hasSelection()) return
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); selDelete() }
      else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); selCopy() }
      else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); selPaste() }
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)

    // ── Init ──
    buildSidebar(); render(); updateStatus()

    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div ref={containerRef} className="page-wrapper" style={{ display: 'contents' }}>
      {/* TITLEBAR */}
      <div className="titlebar">
        <span className="app-name">가락보</span>
        <div className="seg-ctrl">
          <button className="seg-btn on" id="btnSamul">사물</button>
          <button className="seg-btn" id="btnBasic">기본</button>
        </div>
        <button className="toggle-btn desc-toggle-btn">설명 OFF</button>
        <div className="tb-sep" />
        <input className="title-input" type="text" placeholder="제목 입력…" defaultValue="굿거리장단" />
        <div className="tb-sep" />
        <button className="tbtn tbtn-gray btn-init">초기화</button>
        <div className="tb-sep" />
        <button className="tbtn tbtn-blue btn-pdf">PDF 저장</button>
        <span className="msr-badge" />
      </div>

      {/* MAIN */}
      <div className="main-area">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="samul-side">
            <div className="sid-label">악기</div>
            <div className="inst-list" />
          </div>
          <div className="basic-side" style={{ display: 'none' }}>
            <div className="basic-hint">각 칸을 직접 클릭해서<br />텍스트를 입력하세요</div>
          </div>
        </div>

        {/* SCORE */}
        <div className="score-area">
          <div className="score-paper">
            <div className="s-heading">
              <div className="s-title">굿거리장단</div>
            </div>
            <div className="score-container" />
          </div>
          <div id="printArea" />
        </div>
      </div>

      {/* STATUS */}
      <div className="statusbar">
        <span>선택: <span className="sb-sel">쇠 · 갱</span></span>
        <span className="sb-r">3소박 4박 · 우클릭으로 삭제</span>
      </div>

      {/* Selection toolbar */}
      <div className="sel-toolbar">
        <button className="sel-tb-btn" id="sel-copy">📋 복사</button>
        <div className="sel-tb-sep" />
        <button className="sel-tb-btn" id="sel-paste">📌 붙여넣기</button>
        <div className="sel-tb-sep" />
        <button className="sel-tb-btn del" id="sel-delete">✕ 삭제</button>
      </div>

      {/* Handle popup */}
      <div className="handle-popup">
        <button className="pop-btn" id="pop-up">↑ 위로 이동</button>
        <button className="pop-btn" id="pop-down">↓ 아래로 이동</button>
        <div className="pop-hr" />
        <button className="pop-btn del" id="pop-delete">삭제</button>
      </div>
    </div>
  )
}
