<p align="center">
  <h1 align="center">SnapMD</h1>
  <p align="center"><strong>Clip any webpage as clean, LLM-ready Markdown from your terminal.</strong></p>
  <p align="center">Articles &middot; YouTube transcripts &middot; Docs &middot; Blogs &middot; Wikis</p>
</p>

---

**SnapMD** converts any webpage into clean, structured Markdown &mdash; optimized for LLMs, note-taking apps (Obsidian, Notion, Logseq), and knowledge bases. One command. Zero config.

```bash
npx snapmd https://en.wikipedia.org/wiki/Markdown
```

## Why SnapMD?

You paste from the web into your notes or AI tools 30+ times a day. Every time: broken formatting, lost links, garbage HTML.

SnapMD is different:

- **Zero bloat** &mdash; Hand-written DOM parser. No Turndown, no Readability.js.
- **LLM-ready** &mdash; YAML frontmatter with title, author, date, word count, reading time. Pipe directly to any LLM.
- **Smart extraction** &mdash; Built-in readability engine strips nav, ads, sidebars.
- **YouTube support** &mdash; Extracts video metadata + full transcript.
- **Universal** &mdash; CLI + API + stdin for pipelines.

## Install

```bash
# Use directly (no install needed)
npx snapmd https://example.com

# Or install globally
npm install -g snapmd

# Or add to your project
npm install snapmd
```

Requires Node.js 18+.

## CLI Usage

```bash
# Clip a webpage to stdout
snapmd https://example.com/blog/post

# Save to file
snapmd https://example.com -o article.md

# YouTube transcript
snapmd https://youtube.com/watch?v=dQw4w9WgXcQ

# Output as JSON (markdown + metadata + stats)
snapmd https://example.com --json

# Skip frontmatter
snapmd https://example.com -F

# Pipe to an LLM
snapmd https://example.com | llm "summarize this"

# Read HTML from stdin
curl -s https://example.com | snapmd --stdin
```

## Programmatic API

```javascript
import { clip, clipHtml } from 'snapmd';

// Clip a URL
const result = await clip('https://example.com/article');
console.log(result.markdown);  // Clean Markdown with frontmatter
console.log(result.meta);      // { title, author, date, url, ... }
console.log(result.stats);     // { words: 1234, readingTime: '5 min read' }

// Convert raw HTML
const { markdown } = clipHtml('<h1>Hello</h1><p>World</p>', {
  frontmatter: true,
  baseUrl: 'https://example.com',
});
```

## Output Format

```markdown
---
title: "How Markdown Changed Writing"
source: "https://example.com/blog/markdown"
author: "Jane Smith"
date: 2025-12-01
word_count: 1847
reading_time: "8 min read"
clipped_at: 2026-03-03T10:30:00.000Z
tool: snapmd
---

# How Markdown Changed Writing

The first paragraph of the article...
```

## What It Converts

Headings (h1-h6), bold, italic, strikethrough, links with URL resolution, images, ordered and unordered lists (nested), blockquotes, code blocks with language detection, GFM tables, checkboxes, details/summary, figures, and more.

## Supported Sources

| Source | Status |
|--------|--------|
| Any webpage | Done |
| YouTube videos | Done |
| GitHub READMEs | Coming soon |
| Twitter/X threads | Coming soon |
| PDFs | Coming soon |

## Architecture

```
snapmd/
  bin/cli.js              CLI entry point
  src/
    index.js              Core engine (fetch, parse, extract, convert)
    converter.js          HTML to Markdown (recursive DOM walker)
    readability.js        Content extraction (strips nav/ads/noise)
    frontmatter.js        YAML frontmatter generation
    parsers/
      youtube.js          YouTube metadata + transcript
```

Only one runtime dependency: `linkedom` for server-side DOM parsing. Everything else is hand-written.

## Contributing

Contributions welcome! Especially: new source parsers (GitHub, Twitter, Reddit, PDF), edge case fixes, and performance improvements.

```bash
git clone https://github.com/suhashollakc/snapmd.git
cd snapmd && npm install
echo '<h1>Test</h1><p>Hello</p>' | node bin/cli.js --stdin
```

## License

MIT &copy; [Suhas Holla](https://github.com/suhashollakc)
