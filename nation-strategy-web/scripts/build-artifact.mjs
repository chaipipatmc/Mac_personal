// Builds the claude.ai artifact page from dist/: one file with the CSS and JS
// inlined under the ids the in-page editor reads when it republishes itself.
// Usage: npm run build && node scripts/build-artifact.mjs <out.html>
import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv[2] ?? 'dist/artifact.html'
const html = readFileSync('dist/index.html', 'utf8')
const js = readFileSync('dist/' + html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1], 'utf8').replace(/<\/script/gi, '<\\/script')
const css = readFileSync('dist/' + html.match(/href="\.\/(assets\/[^"]+\.css)"/)[1], 'utf8')
writeFileSync(out, `<title>NATION Strategy to Execution</title>
<meta name="robots" content="noindex, nofollow">
<style id="app-css">${css}</style>
<div id="root"></div>
<script type="application/json" id="plan-edits">{}</script>
<script type="module" id="app-js">${js}</script>
`)
console.log(`wrote ${out}`)
