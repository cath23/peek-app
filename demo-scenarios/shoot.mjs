// Park the player on chosen times and screenshot each one — the visual half
// of the measure loop (analyse-film.py is the numeric half).
//
//   node demo-scenarios/shoot.mjs <outdir> [player-url] [t1,t2,...]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2]
const PLAYER = process.argv[3] ?? 'http://localhost:5203/scenario2.html?hud=0'
const TIMES = (process.argv[4] ?? '0,2.2,3.3,4.6,5.7,6.6,7.9,8.6,9.6,10.4,11.5,13.2,14.6')
  .split(',')
  .map(Number)

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()) })

await page.goto(PLAYER, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => !!window.__tl, null, { timeout: 60000 })
await page.waitForTimeout(600)

for (const t of TIMES) {
  await page.evaluate((time) => { window.__tl.pause(time) }, t)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.screenshot({ path: `${OUT}/t${t.toFixed(2).replace('.', '_')}.png` })
  console.log(`shot t=${t}`)
}

await browser.close()
console.log('done')
