// End-to-end smoke test: builds must exist (`npm run build`).
// Usage: node scripts/e2e.mjs  → screenshots in ./screenshots
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 4179
const BASE = `http://localhost:${PORT}/`
const OUT = 'screenshots'
mkdirSync(OUT, { recursive: true })

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) resolve() })
  server.on('exit', () => reject(new Error('preview server exited')))
  setTimeout(() => reject(new Error('preview server timeout')), 20000)
})

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' })
const results = []
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond, info }); }
const SCENES = ['direction', 'plan', 'connected-organization', 'nation-id', 'value', 'priority', 'dependency', 'timeline', 'acceptance', 'decision']

async function newPage(viewport, hash = '', opts = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: !!opts.touch, isMobile: !!opts.touch, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto(BASE + hash)
  await page.waitForSelector('#timeline .g-row')
  return { ctx, page, errs }
}

const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

async function chipOverlap(page) {
  const boxes = await page.$$eval('.ms-chip', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }))
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlaps(boxes[i], boxes[j])) return `M${i}/M${j}`
  return null
}

// ---------------------------------------------------------------- responsive
for (const [label, vp, touch] of [['390', { width: 390, height: 844 }, true], ['768', { width: 768, height: 1024 }, true], ['1440', { width: 1440, height: 900 }, false]]) {
  const { ctx, page, errs } = await newPage(vp, '', { touch })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  ok(`${label}: no horizontal page overflow`, overflow <= 0, `overflow=${overflow}px`)
  for (const s of SCENES) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), s)
    await page.waitForTimeout(120)
    const el = await page.$(`#${s}`)
    await el.screenshot({ path: `${OUT}/${label}-${SCENES.indexOf(s) + 1}-${s}.png` })
  }
  // Thai text clipped? Look for elements whose content overflows vertically with hidden overflow.
  const clipped = await page.$$eval('h2, h3, button, p, span', (els) => els.filter((e) => {
    const cs = getComputedStyle(e)
    return (cs.overflow === 'hidden' || cs.overflowY === 'hidden') && e.scrollHeight > e.clientHeight + 2
  }).map((e) => e.className || e.tagName).slice(0, 5))
  ok(`${label}: no vertically clipped text`, clipped.length === 0, clipped.join(','))
  for (const z of ['Overview', 'Month', 'Week']) {
    await page.click(`.gantt-toolbar .seg:text-is("${z}")`)
    await page.waitForTimeout(50)
    const bad = await chipOverlap(page)
    ok(`${label}: milestone chips do not overlap (${z})`, !bad, bad ?? '')
  }
  const tiny = await page.$$eval('button', (els) => els.filter((e) => {
    const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === 'hidden') return false
    return r.height < 24 && !e.classList.contains('bar')
  }).map((e) => e.textContent.trim().slice(0, 20)).slice(0, 5))
  ok(`${label}: no tiny buttons (<24px)`, tiny.length === 0, tiny.join(' | '))
  ok(`${label}: no console errors`, errs.length === 0, errs.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------- desktop interactions
{
  const { ctx, page, errs } = await newPage({ width: 1440, height: 900 })
  // nav → hash
  await page.click('.topnav a:text("Timeline")')
  await page.waitForTimeout(300)
  ok('nav click sets #timeline', page.url().endsWith('#timeline'), page.url())

  // Expand 21 work packages
  await page.click('.gantt-toolbar .seg:text("Expand 21 Tasks")')
  ok('expand shows 21 work packages', (await page.$$('.g-row-task')).length === 21)

  // Bar geometry follows real dates (overview zoom)
  const geo = await page.evaluate(() => {
    const t01 = document.querySelector('.g-row-task .bar[aria-label^="T01"]').getBoundingClientRect()
    const t03 = document.querySelector('.g-row-task .bar[aria-label^="T03"]').getBoundingClientRect()
    const m0 = document.querySelectorAll('.ms-diamond')[0].getBoundingClientRect()
    const m1 = document.querySelectorAll('.ms-diamond')[1].getBoundingClientRect()
    const m7 = document.querySelectorAll('.ms-diamond')[7].getBoundingClientRect()
    return { t01, t03, m0, m1, m7 }
  })
  const ppd = geo.t01.width / 16 // 24 Sep – 9 Oct inclusive = 16 days
  ok('T03 width matches 67 days', Math.abs(geo.t03.width - 67 * ppd) < 1.5, `${geo.t03.width} vs ${67 * ppd}`)
  ok('M0→M1 exactly one day apart', Math.abs((geo.m1.x - geo.m0.x) - ppd) < 0.6, `${geo.m1.x - geo.m0.x} vs ${ppd}`)
  ok('M7 sits at end of T03 (31 Dec)', Math.abs((geo.m7.x + geo.m7.width / 2) - (geo.t03.x + geo.t03.width - ppd / 2)) < 1.5)

  // Select T18 → highlight predecessors, panel, hash
  await page.click('.g-row-task .bar[aria-label^="T18"]')
  await page.waitForSelector('.panel')
  ok('panel opens for T18', (await page.textContent('#panel-title')).includes('Government Wave 1'))
  ok('hash reflects task', page.url().includes('#timeline?task=T18'), page.url())
  const lit = await page.$$eval('.g-row-task .bar.is-lit', (els) => els.map((e) => e.getAttribute('aria-label').slice(0, 3)))
  ok('T18 highlights T17 predecessor', lit.includes('T17'), lit.join(','))
  ok('Government does not wait for Audience (T15/T14 not lit)', !lit.includes('T15') && !lit.includes('T14'), lit.join(','))
  const panelOrder = await page.$$eval('.drow dt', (els) => els.map((e) => e.textContent))
  ok('panel field order', panelOrder.join('|') === 'What|Why|Owner|Timing|Before Start|Deliverable / Done|Unlocks|TBC', panelOrder.join('|'))
  ok('edges drawn only for selection', (await page.$$('.edge-hard')).length >= 1 && (await page.$$('.edge-hard')).length <= 4)
  // Esc closes and returns focus
  await page.keyboard.press('Escape')
  await page.waitForTimeout(50)
  ok('Esc closes panel', !(await page.$('.panel')))
  ok('focus returns to bar', await page.evaluate(() => document.activeElement?.getAttribute('aria-label')?.startsWith('T18')))

  // T21 Local does not depend on AI gates
  await page.click('.g-row-task .bar[aria-label^="T21"]')
  const lit21 = await page.$$eval('.ms-chip.is-lit', (els) => els.map((e) => e.textContent.slice(0, 2)))
  ok('Local T21 not tied to M4/M5', !lit21.includes('M4') && !lit21.includes('M5'), lit21.join(','))
  await page.keyboard.press('Escape')

  // Hover tooltip
  await page.hover('.g-row-task .bar[aria-label^="T09"]')
  await page.waitForTimeout(50)
  const tip = await page.$('.tooltip')
  ok('hover shows tooltip', !!tip)
  if (tip) ok('tooltip ≤ 4 lines', (await tip.$$('div')).length <= 4)
  await page.mouse.move(5, 5)
  ok('6 Nov minimum-data marker shown in T09', (await page.textContent('.marker-flag'))?.includes('6 พ.ย.'))

  // Keyboard access: focus bar + Enter
  await page.focus('.g-row-task .bar[aria-label^="T05"]')
  await page.keyboard.press('Enter')
  ok('keyboard Enter opens panel', (await page.textContent('#panel-title'))?.includes('Workflow Design'))
  await page.keyboard.press('Escape')

  // Filter keeps cross-workstream predecessors reachable
  await page.selectOption('.tb-filters select >> nth=0', 'R6')
  ok('filter R6 shows only R6 rows', (await page.$$('.g-row-ws')).length === 1)
  await page.selectOption('.tb-filters select >> nth=0', 'all')
  await page.selectOption('.tb-filters select >> nth=2', 'C2')
  ok('candidate filter C2 → T18 only', (await page.$$('.g-row-task')).length === 1)
  await page.click('.seg:text("Clear Filters")')

  // Candidate bars hatched & labelled
  ok('candidate bars carry "รอเลือกที่ M2"', (await page.$$eval('.bar-cand', (els) => els.filter((e) => e.getAttribute('aria-label').includes('เลือกที่ M2')).length)) >= 4)
  ok('no green status colours', await page.evaluate(() => ![...document.querySelectorAll('*')].some((e) => { const c = getComputedStyle(e).backgroundColor; const m = c.match(/rgb\((\d+), (\d+), (\d+)/); return m && +m[2] > 150 && +m[2] > +m[1] + 60 && +m[2] > +m[3] + 40 })))

  // Plan scene → "ดูใน Timeline" → Back/Forward
  await page.click('.topnav a:text("Workstreams")')
  await page.waitForTimeout(300)
  await page.click('button[aria-label="ดู R6 ใน Timeline"]')
  await page.waitForTimeout(400)
  ok('ดูใน Timeline → #timeline?workstream=R6', page.url().includes('#timeline?workstream=R6'), page.url())
  ok('R6 row selected in Gantt', !!(await page.$('.g-row-ws.row-selected')))
  ok('R6 expanded', (await page.$$('.g-row-task .bar[aria-label^="T16"]')).length === 1)
  await page.goBack()
  await page.waitForTimeout(400)
  ok('Back returns to #plan', page.url().endsWith('#plan'), page.url())
  await page.goForward()
  await page.waitForTimeout(400)
  ok('Forward returns to timeline selection', page.url().includes('workstream=R6') && !!(await page.$('.panel')), page.url())

  // Dependency map highlight
  await page.keyboard.press('Escape')
  await page.click('.topnav a:text("Dependency")')
  await page.waitForTimeout(300)
  await page.click('.dep-node:has-text("Data Rights")')
  const cls = await page.$$eval('.dep-item', (els) => els.map((e) => e.className))
  ok('dependency: one selected, prev+next highlighted, rest dimmed', cls.filter((c) => c.includes('is-selected')).length === 1 && cls.filter((c) => c.includes('is-prev')).length === 1 && cls.filter((c) => c.includes('is-next')).length === 1 && cls.filter((c) => c.includes('is-dim')).length > 5)
  ok('dependency panel offers ดูใน Timeline', !!(await page.$('.panel-foot .btn')))
  await page.click('.panel-foot .btn')
  await page.waitForTimeout(400)
  ok('dependency → Timeline T08', page.url().includes('task=T08'), page.url())
  await page.keyboard.press('Escape')

  // Arrow keys step scenes
  await page.click('.topnav a:text("Acceptance")')
  await page.waitForTimeout(300)
  await page.evaluate(() => document.activeElement.blur())
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(400)
  ok('ArrowRight → next scene', page.url().endsWith('#decision'), page.url())

  // Decision cards: no fake approve button
  ok('no approve button', !(await page.$$eval('button', (els) => els.some((e) => !e.classList.contains('dep-node') && /^\s*(อนุมัติ|approve)/i.test(e.textContent)))))
  ok('6 decision cards pending', (await page.$$eval('.dcard-status', (e) => e.filter((x) => x.textContent.includes('รอหารือ/อนุมัติ')).length)) === 6)
  ok('stepper shows /10', (await page.textContent('.stepper-count')).endsWith('/10'))

  // Focus tiers (26 Sep): R6 + R5 first, R7 tracked separately
  ok('4 focus tiers', (await page.$$('.tier')).length === 4)
  ok('tier 1 = R6 6A + R5', (await page.textContent('.tier-0')).includes('6A Government') && (await page.textContent('.tier-0')).includes('R5'))
  await page.click('.tier-item:has-text("6B Sales")')
  ok('6B opens R6 track drawer', (await page.textContent('#panel-title')).includes('Sales Intelligence') && (await page.textContent('.panel')).includes('TBC'))
  await page.keyboard.press('Escape')

  // Workstreams: 6 focus + R7 collapsible, owners on cards
  await page.click('.topnav a:text("Workstreams")')
  await page.waitForTimeout(300)
  ok('6 focus cards on the map', (await page.$$('#plan .smap-top .ws-node, #plan .layer-base .ws-node')).length === 6)
  ok('owner names on cards', (await page.textContent('#plan')).includes('พี่อู๊ด') && (await page.textContent('#plan')).includes('คุณฉาย (Shine)'))
  ok('no คุณชาย / คุณสิงห์ / โอเวอร์เมท', !/คุณชาย|คุณสิงห์|โอเวอร์เมท/.test(await page.textContent('body')))
  await page.click('.side-toggle')
  ok('R7 shown after expanding', (await page.$$('.side-nodes .ws-node')).length === 1)
  await page.click('.owners-btn')
  ok('owners board lists 7 workstreams', (await page.$$('.of-row')).length === 7)
  ok('owners board read-only in Present', (await page.$$('.of-input')).length === 0)
  await page.keyboard.press('Escape')

  // Connected Organization + Nation ID scenes
  await page.click('.topnav a:text("Connected Org")')
  await page.waitForTimeout(300)
  ok('#connected-organization hash', page.url().endsWith('#connected-organization'), page.url())
  await page.click('.kg-btn')
  ok('Knowledge Graph drawer notes permission', (await page.$$('.kgraph li')).length === 8 && (await page.textContent('.kgraph')).includes('สิทธิ'))
  await page.keyboard.press('Escape')
  await page.click('.cx-hub')
  ok('Data Hub details open', (await page.textContent('#panel-title')).includes('Data Hub') && (await page.textContent('.panel')).includes('Organization ID'))
  await page.keyboard.press('Escape')
  await page.click('.topnav a:text("Nation ID")')
  await page.waitForTimeout(300)
  ok('#nation-id hash', page.url().endsWith('#nation-id'), page.url())
  await page.click('.story-bar .seg:has-text("Start")')
  await page.click('.story-bar .seg:has-text("Next")')
  ok('story step 2 lights Identity box + shows sample code', (await page.textContent('.vl-box.is-lit')).includes('Identity') && (await page.textContent('.story-code')).includes('PER-'))
  await page.check('.anon-toggle input')
  ok('anonymous toggle changes story', (await page.textContent('.story-line')).includes('ไม่ Login') && !!(await page.$('.idmap-core.is-anon')))
  await page.click('.nid-more .mini-btn:has-text("Flow LINE")')
  ok('LINE flow drawer shows verified + anonymous lanes', !!(await page.$('.lf-ok')) && !!(await page.$('.lf-anon')))
  await page.keyboard.press('Escape')
  await page.click('.vl-box:has-text("Interest")')
  ok('Interest box shows cautions + 3 buckets', (await page.textContent('.panel')).includes('ไม่อนุมาน') && (await page.$$('.bucket')).length === 3)
  await page.keyboard.press('Escape')
  ok('Nation ID map: 4 domains, 12 IDs', (await page.$$('.iddom')).length === 4 && (await page.$$('.idchip')).length === 12)
  await page.click('.iddom-business')
  ok('Business domain lists Organization + Customer Account', (await page.textContent('.panel')).includes('Customer Account ID') && (await page.textContent('.panel')).includes('ความสัมพันธ์'))
  await page.keyboard.press('Escape')
  await page.click('.phase1')
  ok('Phase 1 = 6 IDs, marked as proposal', (await page.$$('.p1-step')).length === 6 && (await page.textContent('.panel .badges')).includes('Proposal'))
  await page.keyboard.press('Escape')
  await page.click('.nid-more .mini-btn:has-text("Master vs Alias")')
  ok('Master vs Alias drawer', !!(await page.$('.alias-master')) && (await page.$$('.alias-list li')).length === 5)
  await page.keyboard.press('Escape')
  await page.click('.nid-more .mini-btn:has-text("หลัก 3 ข้อ")')
  ok('3 principles + 5 concepts', (await page.$$('.idp-list li')).length === 3 && (await page.$$('.concept')).length === 5)
  await page.keyboard.press('Escape')
  ok('no real client name in examples', !/Toyota/i.test(await page.textContent('body')))

  // Timeline: checkpoints + date check
  await page.click('.topnav a:text("Timeline")')
  await page.waitForTimeout(300)
  ok('6 proposed checkpoints, 2 with windows', (await page.$$('.cp-chip')).length === 6 && (await page.$$('.cp-chip.has-window')).length === 2)
  ok('CP bands drawn', (await page.$$('.cp-band')).length === 2)
  ok('baseline dates have no issues', (await page.textContent('.issue-chip')).includes('ไม่ขัดกัน'))
  await page.click('.g-name:has-text("R6")')
  ok('Gantt row owner visible', (await page.textContent('.g-row-ws:has-text("R6") .g-owner')).includes('Shine'))
  await page.keyboard.press('Escape')
  await page.click('.ms-chip[aria-label^="M4"]')
  ok('milestone shows acceptance conditions', (await page.textContent('.drow-deliverable')).includes('ผลทดสอบ') && !(await page.textContent('.panel')).includes('ไม่มีงานก่อนหน้าบังคับ'))
  await page.keyboard.press('Escape')
  // Export to PDF: one page per scene, view restored afterwards
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.pdf-btn')])
  const pdfPath = `${OUT}/export.pdf`
  await dl.saveAs(pdfPath)
  const pdf = (await import('node:fs')).readFileSync(pdfPath).toString('latin1')
  ok('PDF export: valid file with 10 pages', pdf.startsWith('%PDF-1.4') && /\/Count 10 /.test(pdf) && pdf.trimEnd().endsWith('%%EOF'))
  ok('PDF export restores the page', !(await page.evaluate(() => document.body.classList.contains('pdf-export'))))
  await page.screenshot({ path: `${OUT}/1440-interaction.png` })
  ok('desktop: no console errors', errs.length === 0, errs.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------- deep link + mobile
{
  const { ctx, page, errs } = await newPage({ width: 390, height: 844 }, '#timeline?workstream=R6&milestone=M4', { touch: true })
  await page.waitForTimeout(400)
  ok('deep link opens M4 panel', (await page.textContent('#panel-title'))?.includes('Test Pass'))
  ok('mobile: filters folded into ตัวเลือก', !(await page.isVisible('.tb-filters')) && await page.isVisible('.tb-opts'))
  ok('deep link expands R6', (await page.$$('.g-row-task .bar[aria-label^="T18"]')).length === 1)
  await page.screenshot({ path: `${OUT}/390-deeplink-sheet.png` })
  const sheet = await page.$eval('.panel', (e) => { const r = e.getBoundingClientRect(); return { top: r.top, h: r.height, bottom: r.bottom } })
  ok('mobile panel is bottom sheet', sheet.bottom >= 843 && sheet.top > 100, JSON.stringify(sheet))
  await page.click('.panel-close')
  ok('close button works', !(await page.$('.panel')))
  await page.click('.m-tabs [role=tab]:text("Milestones")')
  ok('mobile: Milestones tab hides Gantt', await page.isVisible('.ms-list') && !(await page.isVisible('.gantt-layout')))
  await page.click('.m-tabs [role=tab]:text("Gantt")')
  ok('mobile: Gantt tab back', await page.isVisible('.gantt-layout'))
  // Sticky label column inside gantt scroll
  await page.$eval('.gantt-scroll', (e) => { e.scrollLeft = 400 })
  await page.waitForTimeout(50)
  const lab = await page.$eval('.g-row-ws .g-label', (e) => e.getBoundingClientRect().x)
  const box = await page.$eval('.gantt-scroll', (e) => e.getBoundingClientRect().x)
  ok('gantt label column stays sticky on scroll', Math.abs(lab - box) < 3, `${lab} vs ${box}`)
  await page.screenshot({ path: `${OUT}/390-gantt-scrolled.png` })
  // Tap flow on mobile
  await page.evaluate(() => document.getElementById('direction').scrollIntoView())
  await page.tap('.outcome-2')
  ok('tap outcome opens sheet', (await page.textContent('#panel-title'))?.includes('Connected Data'))
  await page.tap('.panel-backdrop', { position: { x: 20, y: 20 } })
  ok('tap backdrop closes sheet', !(await page.$('.panel')))
  // bottom nav menu
  await page.tap('.bn-current')
  await page.tap('.bottom-menu button:text("Decision")')
  await page.waitForTimeout(300)
  ok('bottom nav jumps to scene', page.url().endsWith('#decision'), page.url())
  ok('mobile: no console errors', errs.length === 0, errs.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------- editing + persistence (local mode)
{
  const { ctx, page, errs } = await newPage({ width: 1440, height: 900 }, '#timeline')
  await page.waitForTimeout(300)
  await page.click('.seg-edit')
  await page.click('.gantt-toolbar .seg:text("Expand 21 Tasks")')
  const bar = page.locator('.g-row-task .bar[aria-label^="T05"]')
  const before = await bar.getAttribute('aria-label')
  await bar.scrollIntoViewIfNeeded()
  const box = await bar.boundingBox()
  const ppd = (await page.locator('.g-row-task .bar[aria-label^="T01"]').boundingBox()).width / 16
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + ppd * 3.1, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const after = await bar.getAttribute('aria-label')
  ok('drag moves T05 by 3 days', before.includes('12–23 ต.ค.') && after.includes('15–26 ต.ค.'), `${before} → ${after}`)
  ok('drag does not open the panel', !(await page.$('.panel')))
  ok('moved bar flags conflict with successor', (await page.getAttribute('.g-row-task .bar[aria-label^="T06"]', 'aria-label')).includes('เริ่มก่อน T05'))
  // resize end grip
  await page.locator('.g-row-task .bar[aria-label^="T13"]').scrollIntoViewIfNeeded()
  const b2 = await page.locator('.g-row-task .bar[aria-label^="T13"]').boundingBox()
  await page.mouse.move(b2.x + b2.width - 4, b2.y + b2.height / 2)
  await page.mouse.down()
  await page.mouse.move(b2.x + b2.width - 4 + ppd * 2.1, b2.y + b2.height / 2, { steps: 6 })
  await page.mouse.up()
  ok('end grip extends T13 by 2 days', (await page.getAttribute('.g-row-task .bar[aria-label^="T13"]', 'aria-label')).includes('24 ก.ย. – 11 ต.ค.'))
  // milestone drag
  await page.locator('.ms-chip[aria-label^="M4"]').scrollIntoViewIfNeeded()
  const chip = await page.locator('.ms-chip[aria-label^="M4"]').boundingBox()
  await page.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2)
  await page.mouse.down()
  await page.mouse.move(chip.x + chip.width / 2 + ppd * 7.1, chip.y + chip.height / 2, { steps: 6 })
  await page.mouse.up()
  ok('drag moves M4 by a week', (await page.getAttribute('.ms-chip[aria-label^="M4"]', 'aria-label')).includes('20 พ.ย.'))
  // text edit via panel
  await page.click('.g-row-task .g-name:has-text("T02")')
  await page.fill('#ef-T02-title', 'Roles / JD / KPI (Rev)')
  await page.press('#ef-T02-title', 'Enter')
  ok('title edit shows on the chart', (await page.textContent('.g-row-task:has(.g-id:text-is("T02")) .g-title')).includes('(Rev)'))
  await page.keyboard.press('Escape')
  // undo last change
  await page.click('.seg:text("↶ Undo")')
  ok('undo reverts title', !(await page.textContent('.g-row-task:has(.g-id:text-is("T02")) .g-title')).includes('(Rev)'))
  // add task
  await page.click('.g-add[aria-label="เพิ่ม Task ใน R4"]')
  ok('add task creates N1', !!(await page.$('.g-row-task .bar[aria-label^="N1"]')))
  await page.keyboard.press('Escape')
  // wording edit on a scene headline + a panel field
  await page.click('#timeline-h .editable')
  await page.fill('#te-input', 'Timeline Q4 2026')
  await page.keyboard.press('Enter')
  ok('headline wording edited', (await page.textContent('#timeline-h')).includes('Timeline Q4 2026'))
  ok('date check warns after edits', (await page.textContent('.issue-chip')).includes('ตรวจวันที่'))
  await page.click('.issue-chip')
  const issuesText = await page.textContent('.issues')
  ok('issues list headline mismatch + drag conflict (not auto-fixed)', issuesText.includes('Timeline Q4 2026') && issuesText.includes('T06') && (await page.getAttribute('.g-row-task .bar[aria-label^="T05"]', 'aria-label')).includes('15–26 ต.ค.'))
  await page.keyboard.press('Escape')
  // Owners board: assign owner / support / 6A in Edit mode
  await page.click('.edit-dock .seg:has-text("Owners")')
  await page.fill('input[aria-label="R2 owner"]', 'Mac + พี่เส็ง / IT + คุณทดสอบ')
  await page.press('input[aria-label="R2 owner"]', 'Enter')
  await page.fill('input[aria-label="6A Government Agent owner"]', 'ทีม Government (ชื่อทดสอบ)')
  await page.press('input[aria-label="6A Government Agent owner"]', 'Enter')
  await page.click('.of-row:has-text("R6") .of-more')
  await page.fill('input[aria-label="T18 owner"]', 'คุณทดสอบ T18')
  await page.press('input[aria-label="T18 owner"]', 'Enter')
  ok('owners board edits R2 owner', (await page.textContent('.g-row-ws:has-text("R2") .g-owner')).includes('คุณทดสอบ'))
  await page.keyboard.press('Escape')
  await page.click('.edit-dock .seg:has-text("Backup")')
  await page.click('.backup .btn:has-text("Export")')
  const exported = await page.inputValue('.backup-text')
  ok('export includes documentId + owner edits', exported.includes('nation-strategy-to-execution') && exported.includes('คุณทดสอบ') && exported.includes('ชื่อทดสอบ'))
  await page.fill('.backup-text', '{"documentId":"other-doc","edits":{}}')
  await page.click('.backup .btn:has-text("Import")')
  ok('import rejects other document', (await page.textContent('.backup')).includes('เอกสารอื่น'))
  await page.keyboard.press('Escape')
  await page.click('.g-row-task .bar[aria-label^="T18"]')
  await page.click('.drow-why .editable')
  await page.fill('#te-input', 'เหตุผลที่แก้เอง')
  await page.keyboard.press('Control+Enter')
  ok('panel field wording edited', (await page.textContent('.drow-why dd')).includes('เหตุผลที่แก้เอง'))
  await page.fill('#ef-T18-owner', 'คุณรุ (ยืนยันแล้ว)')
  await page.press('#ef-T18-owner', 'Enter')
  ok('task owner edited', (await page.textContent('.drow-owner dd')).includes('คุณรุ (ยืนยันแล้ว)'))
  await page.keyboard.press('Escape')
  // zoom in / out, resize, maximize
  const w0 = (await page.locator('.g-inner').boundingBox()).width
  await page.click('.seg-icon[aria-label="Zoom in"]')
  await page.waitForTimeout(80)
  const w1 = (await page.locator('.g-inner').boundingBox()).width
  ok('zoom in widens the chart', w1 > w0 * 1.3, `${w0} → ${w1}`)
  await page.click('.seg-icon[aria-label="Zoom out"]')
  await page.click('.seg-icon[aria-label="Zoom out"]')
  ok('zoom out narrows the chart', (await page.locator('.g-inner').boundingBox()).width < w1)
  await page.locator('.g-resize').scrollIntoViewIfNeeded()
  const h0 = (await page.locator('.gantt-scroll').boundingBox()).height
  const rh = await page.locator('.g-resize').boundingBox()
  await page.mouse.move(rh.x + rh.width / 2, rh.y + rh.height / 2)
  await page.mouse.down()
  await page.mouse.move(rh.x + rh.width / 2, rh.y + rh.height / 2 - 150, { steps: 5 })
  await page.mouse.up()
  const h1 = (await page.locator('.gantt-scroll').boundingBox()).height
  ok('resize handle changes chart height', Math.abs(h1 - (h0 - 150)) < 6, `${h0} → ${h1}`)
  await page.click('.seg:text("⤢ Maximize")')
  const mx = await page.locator('.gantt.is-max').boundingBox()
  ok('maximize fills the window', !!mx && mx.width >= 1400 && mx.height > 700)
  await page.click('.seg:text("⤡ Exit full view")')
  await page.waitForTimeout(600)
  ok('save chip says saved', /Saved/.test(await page.textContent('.save-chip')))
  // reload: edits persist
  await page.reload()
  await page.waitForSelector('#timeline .g-row')
  await page.click('.gantt-toolbar .seg:text("Expand 22 Tasks")')
  ok('after reload T05 keeps new dates', (await page.getAttribute('.g-row-task .bar[aria-label^="T05"]', 'aria-label')).includes('15–26 ต.ค.'))
  ok('after reload M4 keeps new date', (await page.getAttribute('.ms-chip[aria-label^="M4"]', 'aria-label')).includes('20 พ.ย.'))
  ok('after reload added task kept', !!(await page.$('.g-row-task .bar[aria-label^="N1"]')))
  ok('after reload headline wording kept', (await page.textContent('#timeline-h')).includes('Timeline Q4 2026'))
  ok('present mode shows no edit affordances', !(await page.$('.editable')) && !(await page.$('.edit-dock')))
  // reset all
  await page.click('.seg-edit')
  await page.click('.seg:text("Reset all")')
  await page.click('.confirm .seg.danger')
  ok('reset all restores baseline', (await page.getAttribute('.g-row-task .bar[aria-label^="T05"]', 'aria-label')).includes('12–23 ต.ค.') && !(await page.$('.g-row-task .bar[aria-label^="N1"]')) && (await page.textContent('#timeline-h')).includes('Timeline ก.ย.'))
  await page.screenshot({ path: `${OUT}/1440-edit.png` })
  ok('edit: no console errors', errs.length === 0, errs.join(' | '))
  await ctx.close()
}

await browser.close()
server.kill()

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.info && !r.pass ? `  — ${r.info}` : ''}`)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
