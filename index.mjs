/**
 * markdown-it plugin for .> indent syntax
 * @see https://github.com/whyjp/markdown-indent-proposal
 */

import dotIndentRule from './lib/rules_block/dot_indent.mjs'

export default function dotIndentPlugin (md, options = {}) {
  const opts = { maxDepth: 4, ...options }
  md.options.dotIndent = opts

  md.block.ruler.before('blockquote', 'dot_indent', dotIndentRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })

  md.renderer.rules.dot_indent_open = function (tokens, idx, _options, _env, self) {
    const token = tokens[idx]
    const depth = token.meta?.depth ?? 1
    token.attrSet('class', `md-indent md-indent-${depth}`)
    token.attrSet('role', 'group')
    token.attrSet('aria-level', String(depth))
    return self.renderToken(tokens, idx, _options)
  }

  md.renderer.rules.dot_indent_close = function (tokens, idx, _options, _env, self) {
    return self.renderToken(tokens, idx, _options)
  }
}
