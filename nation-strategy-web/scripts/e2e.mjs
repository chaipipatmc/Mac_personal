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
const SCENES = ['direction', 'plan', 'value', 'priority', 'dependency', 'timeline', 'acceptance', 'decision']

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
  ok('4 decision cards pending', (await page.$$eval('.dcard-status', (e) => e.filter((x) => x.textContent.includes('รอหารือ/อนุมัติ')).length)) === 4)

  // Every candidate starts unselected
  ok('candidates start as รอเลือก', (await page.$$eval('.cand-status', (e) => e.filter((x) => x.textContent === 'รอเลือก').length)) === 4)
  await page.screenshot({ path: `${OUT}/1440-interaction.png` })
  ok('desktop: no console errors', errs.length === 0, errs.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------- deep link + mobile
{
  const { ctx, page, errs } = await newPage({ width: 390, height: 844 }, '#timeline?workstream=R6&milestone=M4', { touch: true })
  await page.waitForTimeout(400)
  ok('deep link opens M4 panel', (await page.textContent('#panel-title'))?.includes('Test Pass'))
  ok('deep link expands R6', (await page.$$('.g-row-task .bar[aria-label^="T18"]')).length === 1)
  await page.screenshot({ path: `${OUT}/390-deeplink-sheet.png` })
  const sheet = await page.$eval('.panel', (e) => { const r = e.getBoundingClientRect(); return { top: r.top, h: r.height, bottom: r.bottom } })
  ok('mobile panel is bottom sheet', sheet.bottom >= 843 && sheet.top > 100, JSON.stringify(sheet))
  await page.click('.panel-close')
  ok('close button works', !(await page.$('.panel')))
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

await browser.close()
server.kill()

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.info && !r.pass ? `  — ${r.info}` : ''}`)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
