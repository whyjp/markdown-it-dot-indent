/**
 * 배포 전 검증 스크립트 — PRD 스펙 대비 동작 확인
 */
import MarkdownIt from 'markdown-it'
import dotIndent from '../index.mjs'

const md = new MarkdownIt().use(dotIndent)
let passed = 0
let failed = 0

function ok (name, cond, detail = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`)
  }
}

console.log('\n=== RULE 1–7: 기본 동작 ===')
ok('단일 .>', md.render('.> hello').includes('md-indent-1'))
ok('lazy continuation', (() => { const h = md.render('.> a\nb\nc'); return h.includes('a') && h.includes('b') && h.includes('c') && h.includes('<br>') })())
const emptyLineOut = md.render('.> a\n\nb')
ok('빈 줄 종료 (b는 indent 밖)', emptyLineOut.includes('md-indent') && emptyLineOut.includes('b</p>'))
ok('중첩 ..> ...>', md.render('.> a\n..> b\n...> c').includes('md-indent-2') && md.render('.> a\n..> b\n...> c').includes('md-indent-3'))
const sameDepth = md.render('.> a\n.> b\n.> c')
ok('동일 depth 여러 줄 → 하나의 container', sameDepth.match(/md-indent-1/g).length === 1 && sameDepth.includes('a') && sameDepth.includes('b') && sameDepth.includes('c'))

console.log('\n=== RULE 1–7: 기본 동작 (계속) ===')
const out = md.render('.> a\n..> b\n...> c')
ok('중첩 구조', out.includes('<p>a</p>') && out.includes('<p>b</p>') && out.includes('<p>c</p>'))

console.log('\n=== RULE 4: > 뒤 공백 필수 ===')
ok('.> 뒤 공백 없음 → 미매칭', !md.render('.>no space').includes('md-indent-1'))
ok('.> 뒤 공백 있음 → 매칭', md.render('.> with space').includes('md-indent-1'))

console.log('\n=== RULE 8: 인라인 마크다운 ===')
const inline = md.render('.> **bold** *italic* `code`')
ok('bold', inline.includes('<strong>'))
ok('italic', inline.includes('<em>'))
ok('inline code', inline.includes('<code>'))

console.log('\n=== RULE 8: 정방향 합성 (blockquote, list) ===')
const comp = md.render('.> outer\n..> > quoted inside')
ok('.> 안에 blockquote', comp.includes('blockquote'))

const list = md.render('.> - item 1\n.> - item 2')
ok('.> 안에 list', list.includes('<ul>') || list.includes('<li>'))

console.log('\n=== RULE 10: 역방향 금지 ===')
ok('blockquote 안 .> → blockquote로 처리', !md.render('> .> in quote').includes('md-indent'))
ok('list 안 .> → list로 처리', !md.render('- .> in list').includes('md-indent'))

console.log('\n=== RULE 3: maxDepth ===')
const md2 = new MarkdownIt().use(dotIndent, { maxDepth: 2 })
ok('....> (depth 4) maxDepth 2 → 미매칭', !md2.render('....> too deep').includes('md-indent'))

console.log('\n=== markdown-it 기본 규칙과 충돌 없음 ===')
const mixed = md.render('# Heading\n\n.> indent\n\n> blockquote\n\n- list')
ok('heading + blockquote + list 혼합', mixed.includes('md-indent') && mixed.includes('blockquote') && mixed.includes('<ul>'))

console.log('\n=== 결과 ===')
console.log(`${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
