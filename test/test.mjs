import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import MarkdownIt from 'markdown-it'
import dotIndent from '../index.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const md = new MarkdownIt().use(dotIndent)

function loadFixture (name) {
  const path = join(__dirname, 'fixtures', `${name}.txt`)
  return readFileSync(path, 'utf8')
}

function parseFixture (text) {
  const blocks = text.split(/^\.\s*$/m).map(s => s.trim()).filter(Boolean)
  const cases = []
  for (let i = 0; i < blocks.length; i += 2) {
    const input = blocks[i]
    const expected = blocks[i + 1] ?? ''
    if (input) cases.push({ input, expected })
  }
  return cases
}

function runFixture (name) {
  const text = loadFixture(name)
  const cases = parseFixture(text)
  let passed = 0
  let failed = 0
  for (const { input, expected } of cases) {
    const result = md.render(input).trim()
    const ok = result === expected
    if (ok) {
      passed++
    } else {
      failed++
      console.error(`\n[FAIL] ${name}`)
      console.error('Input:\n', input)
      console.error('Expected:\n', expected)
      console.error('Got:\n', result)
    }
  }
  return { passed, failed }
}

const fixtures = ['basic', 'lazy', 'nesting']
let totalPassed = 0
let totalFailed = 0

for (const name of fixtures) {
  const { passed, failed } = runFixture(name)
  totalPassed += passed
  totalFailed += failed
}

console.log(`\n${totalPassed} passed, ${totalFailed} failed`)
process.exit(totalFailed > 0 ? 1 : 0)
