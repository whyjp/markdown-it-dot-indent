/**
 * markdown-it plugin for .> indent syntax (CJS build for VSCode etc.)
 * @see https://github.com/whyjp/markdown-indent-proposal
 */

const dotIndentRule = require('./lib/rules_block/dot_indent.cjs')

function dotIndentPlugin (md, options = {}) {
  const opts = { maxDepth: 4, ...options }
  md.options.dotIndent = opts

  md.block.ruler.before('blockquote', 'dot_indent', dotIndentRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })

  const defaultSoftbreak = md.renderer.rules.softbreak
  md.renderer.rules.softbreak = function (tokens, idx, options, env, self) {
    if (env?.inDotIndent) return '<br>\n'
    return defaultSoftbreak ? defaultSoftbreak(tokens, idx, options, env, self) : '\n'
  }

  md.renderer.rules.dot_indent_open = function (tokens, idx, _options, env, self) {
    if (env) env.inDotIndent = (env.inDotIndent || 0) + 1
    const token = tokens[idx]
    const depth = token.meta?.depth ?? 1
    token.attrSet('class', `md-indent md-indent-${depth}`)
    token.attrSet('role', 'group')
    token.attrSet('aria-level', String(depth))
    return self.renderToken(tokens, idx, _options)
  }

  md.renderer.rules.dot_indent_close = function (tokens, idx, _options, env, self) {
    if (env) env.inDotIndent = Math.max(0, (env.inDotIndent || 0) - 1)
    return self.renderToken(tokens, idx, _options)
  }
}

module.exports = dotIndentPlugin
