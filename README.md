# markdown-it-dot-indent

[markdown-it](https://github.com/markdown-it/markdown-it) plugin for `.>` indent syntax — a container block for semantic indentation.

Part of the [Markdown Indent Proposal](https://github.com/whyjp/markdown-indent-proposal).

## Install

```bash
npm install markdown-it-dot-indent
```

## Usage

```javascript
import MarkdownIt from 'markdown-it'
import dotIndent from 'markdown-it-dot-indent'

const md = new MarkdownIt().use(dotIndent)

const src = `.> first line
lazy continuation
no prefix needed

..> nested depth 2`

console.log(md.render(src))
```

## Syntax

| Source | Rendered |
|-------|----------|
| `.> text` | Indent depth 1 |
| `..> text` | Indent depth 2 |
| `...> text` | Indent depth 3 |
| `....> text` | Indent depth 4 |

- **Dot count = depth.** Same container-block model as `>` (blockquote).
- **Lazy continuation** — lines without prefix stay inside until an empty line.
- **Empty line** closes the container.

## Options

```javascript
md.use(dotIndent, { maxDepth: 4 })  // default: 4
```

## Output

```html
<div class="md-indent md-indent-1" role="group" aria-level="1">
<p>content</p>
</div>
```

### Default CSS

```css
.md-indent {
  padding-left: 1.5em;
  border-left: 2px solid #e0e0e0;
}
```

## License

MIT
