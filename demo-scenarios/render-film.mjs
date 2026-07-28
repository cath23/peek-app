// Renders the scenario offline: seeks the timeline frame by frame and shoots
// each one. Deterministic — no dropped frames, exact 30fps — which is the point
// of building the film as a seekable timeline in the first place.
//
//   node .render-film.mjs <outdir> [fps] [seconds]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2]
const FPS = Number(process.argv[3] ?? 30)
const DUR = process.argv[4] ? Number(process.argv[4]) : null

mkdirSync(`${OUT}/frames`, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  headless: true,
})
// Viewport = the stage exactly, so the stage renders at scale 1 and every
// screenshot is pixel-exact 1440×1024.
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

const PLAYER = process.env.PLAYER ?? 'http://localhost:5202/?hud=0'
await page.goto(PLAYER, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => !!window.__tl, null, { timeout: 60000 })
// Let the embedded apps finish painting before frame 0.
await page.waitForTimeout(1200)

const duration = DUR ?? (await page.evaluate(() => window.__tl.duration()))
const total = Math.round(duration * FPS)
console.log(`rendering ${total} frames @ ${FPS}fps (${duration.toFixed(2)}s)`)

const t0 = Date.now()
for (let i = 0; i < total; i++) {
  await page.evaluate((t) => {
    window.__tl.pause(t)
  }, i / FPS)
  // Two frames: the ticker renders the state, then the browser paints it.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  )
  await page.screenshot({ path: `${OUT}/frames/f${String(i + 1).padStart(4, '0')}.png` })
  if ((i + 1) % 50 === 0) {
    const rate = (i + 1) / ((Date.now() - t0) / 1000)
    console.log(`  ${i + 1}/${total}  (${rate.toFixed(1)} frames/s)`)
  }
}

await browser.close()
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
