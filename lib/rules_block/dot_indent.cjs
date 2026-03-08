/**
 * markdown-it block rule for .> indent syntax (CJS build)
 * Container block model (same as blockquote): lazy continuation, empty line closes.
 */

const DOT = 0x2e
const GT = 0x3e
const SPACE = 0x20
const TAB = 0x09

function isSpace (ch) {
  return ch === SPACE || ch === TAB
}

/** Parse .> prefix at line start. Returns { depth, contentStart } or null. */
function parsePrefix (state, line) {
  const pos = state.bMarks[line] + state.tShift[line]
  const max = state.eMarks[line]
  if (pos >= max || state.src.charCodeAt(pos) !== DOT) return null

  let depth = 0
  let p = pos
  while (p < max && state.src.charCodeAt(p) === DOT && depth < 4) {
    depth++
    p++
  }
  if (depth === 0 || p >= max || state.src.charCodeAt(p) !== GT) return null
  p++
  if (p >= max || !isSpace(state.src.charCodeAt(p))) return null
  p++
  while (p < max && isSpace(state.src.charCodeAt(p))) p++

  return { depth, contentStart: p }
}

const REVERSE_BAN = new Set(['blockquote', 'list'])

function dotIndent (state, startLine, endLine, silent) {
  if (REVERSE_BAN.has(state.parentType)) return false

  const pos = state.bMarks[startLine] + state.tShift[startLine]

  if (state.sCount[startLine] - state.blkIndent >= 4) return false

  const first = parsePrefix(state, startLine)
  if (!first) return false

  const maxDepth = state.md.options?.dotIndent?.maxDepth ?? 4
  if (first.depth > maxDepth) return false

  if (silent) return true

  const oldParentType = state.parentType
  state.parentType = 'dot_indent'

  const items = []
  let nextLine = startLine

  while (nextLine < endLine) {
    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
    const lineEnd = state.eMarks[nextLine]

    if (lineStart >= lineEnd) break

    const pref = parsePrefix(state, nextLine)
    if (pref) {
      if (pref.depth > maxDepth) break
      items.push({ line: nextLine, depth: pref.depth, contentStart: pref.contentStart })
    } else {
      if (items.length === 0) break
      items.push({ line: nextLine, depth: null, contentStart: lineStart })
    }
    nextLine++
  }

  const oldBMarks = {}
  const oldTShift = {}
  const oldSCount = {}
  const oldBSCount = {}
  for (const it of items) {
    oldBMarks[it.line] = state.bMarks[it.line]
    oldTShift[it.line] = state.tShift[it.line]
    oldSCount[it.line] = state.sCount[it.line]
    oldBSCount[it.line] = state.bsCount[it.line]
  }

  function processBlock (startIdx, endIdx, depth) {
    let i = startIdx
    while (i < endIdx) {
      const item = items[i]
      if (item.depth === depth) {
        state.bMarks[item.line] = item.contentStart
        state.tShift[item.line] = 0
        state.sCount[item.line] = 0
        state.bsCount[item.line] = 0

        const token_o = state.push('dot_indent_open', 'div', 1)
        token_o.markup = '.'.repeat(depth) + '>'
        token_o.block = true
        token_o.meta = { depth }
        token_o.map = [item.line, item.line]

        let blockEnd = i + 1
        let hadNested = false
        while (blockEnd < endIdx) {
          const next = items[blockEnd]
          if (next.depth === null) {
            state.bMarks[next.line] = next.contentStart
            state.tShift[next.line] = 0
            state.sCount[next.line] = -1
            state.bsCount[next.line] = 0
            blockEnd++
            continue
          }
          if (next.depth === depth) {
            state.bMarks[next.line] = next.contentStart
            state.tShift[next.line] = 0
            state.sCount[next.line] = 0
            state.bsCount[next.line] = 0
            blockEnd++
            continue
          }
          if (next.depth > depth) {
            hadNested = true
            const contentEndLine = next.line
            const oldLineMax = state.lineMax
            state.lineMax = contentEndLine
            state.md.block.tokenize(state, item.line, contentEndLine)
            state.lineMax = oldLineMax
            processBlock(blockEnd, endIdx, next.depth)
            while (blockEnd < endIdx && (items[blockEnd].depth === null || items[blockEnd].depth >= next.depth)) blockEnd++
            const token_c = state.push('dot_indent_close', 'div', -1)
            token_c.markup = '.'.repeat(depth) + '>'
            token_c.block = true
            i = blockEnd
            break
          }
          break
        }

        if (!hadNested) {
          const lastLine = blockEnd < endIdx ? items[blockEnd].line : nextLine
          const oldLineMax = state.lineMax
          state.lineMax = lastLine
          state.md.block.tokenize(state, item.line, lastLine)
          state.lineMax = oldLineMax
          const token_c = state.push('dot_indent_close', 'div', -1)
          token_c.markup = '.'.repeat(depth) + '>'
          token_c.block = true
        }

        i = blockEnd
        continue
      }
      if (item.depth !== null && item.depth > depth) {
        processBlock(i, endIdx, item.depth)
        while (i < endIdx && (items[i].depth === null || items[i].depth >= item.depth)) i++
        continue
      }
      i++
    }
  }

  processBlock(0, items.length, first.depth)

  for (const it of items) {
    state.bMarks[it.line] = oldBMarks[it.line]
    state.tShift[it.line] = oldTShift[it.line]
    state.sCount[it.line] = oldSCount[it.line]
    state.bsCount[it.line] = oldBSCount[it.line]
  }

  state.parentType = oldParentType
  state.line = nextLine
  return true
}

module.exports = dotIndent
