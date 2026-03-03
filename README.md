<p align="center">
  <img src="https://img.shields.io/npm/v/snapmd?style=flat-square&color=blue&label=npm" alt="npm version">
  <img src="https://img.shields.io/npm/dm/snapmd?style=flat-square&color=green&label=downloads" alt="npm downloads">
  <img src="https://img.shields.io/github/stars/suhashollakc/snapmd?style=flat-square&color=yellow" alt="GitHub stars">
  <img src="https://img.shields.io/github/license/suhashollakc/snapmd?style=flat-square" alt="license">
  <img src="https://img.shields.io/node/v/snapmd?style=flat-square&color=brightgreen" alt="node version">
</p>

<h1 align="center">SnapMD</h1>
<p align="center"><strong>Clip any webpage as clean, LLM-ready Markdown from your terminal.</strong></p>
<p align="center"><sub>Articles &middot; YouTube transcripts &middot; Docs &middot; Blogs &middot; Wikis &middot; Any URL</sub></p>

<br>

<p align="center">
  <a href="#install">Install</a> &nbsp;&middot;&nbsp;
  <a href="#cli-usage">CLI</a> &nbsp;&middot;&nbsp;
  <a href="#programmatic-api">API</a> &nbsp;&middot;&nbsp;
  <a href="#supported-sources">Sources</a> &nbsp;&middot;&nbsp;
  <a href="#contributing">Contributing</a>
</p>

---

```bash
npx snapmd https://en.wikipedia.org/wiki/Markdown -o article.md
```

**SnapMD** fetches any webpage and converts it to clean, structured Markdown &mdash; with YAML frontmatter, smart content extraction, and zero config. Built for piping into LLMs, pasting into Obsidian/Notion/Logseq, or building knowledge bases.

### Why SnapMD?

Every day you copy from the web into your notes or AI tools. Every time: broken formatting, lost links, garbage HTML. Existing tools are bloated or abandoned.

SnapMD is different:

&nbsp;&nbsp;**Zero bloat** &mdash; Hand-written recursive DOM parser. No Turndown, no Readability.js, no heavy deps.<br>
&nbsp;&nbsp;**LLM-ready** &mdash; YAML frontmatter (title, author, date, word count, reading time). Pipe straight to any LLM.<br>
&nbsp;&nbsp;**Smart extraction** &mdash; Built-in readability engine strips nav, ads, sidebars. Gets the article, not the noise.<br>
&nbsp;&nbsp;**YouTube** &mdash; Extracts video metadata + full transcript as formatted Markdown.<br>
&nbsp;&nbsp;**Universal** &mdash; CLI for your terminal, programmatic API for your apps, stdin for pipelines.

---

## Install

```bash
# Try instantly (no install)
npx snapmd https://example.com

# Install globally
npm install -g snapmd

# Add to your project
npm install snapmd
```

> Requires Node.js 18+

---

## CLI Usage

```bash
# Clip a webpage to stdout
snapmd https://example.com/blog/post

# Save to file
snapmd https://example.com -o article.md

# YouTube video transcript
snapmd https://youtube.com/watch?v=dQw4w9WgXcQ

# JSON output (markdown + metadata + stats)
snapmd https://example.com --json

# Skip YAML frontmatter
snapmd https://example.com -F

# Full page (skip readability extraction)
snapmd https://example.com --full

# Reference-style links
snapmd https://example.com -r

# Pipe HTML from stdin
curl -s https://example.com | snapmd --stdin

# Pipe directly to an LLM
snapmd https://example.com -F | llm "summarize this article in 3 bullets"
```

### All Options

| Flag | Short | Description |
|------|-------|-------------|
| `--output <file>` | `-o` | Save to file |
| `--full` | `-f` | Full page (skip readability) |
| `--no-frontmatter` | `-F` | Skip YAML frontmatter |
| `--referenced` | `-r` | Reference-style links |
| `--json` | `-j` | JSON output |
| `--no-images` | | Exclude images |
| `--no-links` | | Exclude hyperlinks |
| `--stdin` | | Read HTML from stdin |
| `--base-url <url>` | | Base URL for relative links |
| `--quiet` | `-q` | Suppress status messages |

---

## Output

SnapMD produces clean Markdown with optional YAML frontmatter:

```markdown
---
title: "How Markdown Changed Writing"
source: "https://example.com/blog/markdown"
author: "Jane Smith"
date: 2025-12-01
site: "Example Blog"
word_count: 1847
reading_time: "8 min read"
clipped_at: 2026-03-03T10:30:00.000Z
tool: snapmd
---

# How Markdown Changed Writing

The first paragraph of the article...

## Section heading

Content with **bold**, *italic*, and [links](https://example.com)...
```

### Converts

Headings (h1&ndash;h6) &middot; **Bold** / *Italic* / ~~Strikethrough~~ &middot; Links with URL resolution &middot; Images &middot; Ordered & unordered lists (nested) &middot; Blockquotes &middot; Code blocks with language detection &middot; GFM tables &middot; Checkboxes &middot; `<details>` / `<summary>` &middot; Figures with captions &middot; Superscript / subscript &middot; Highlights

---

## Programmatic API

```javascript
import { clip, clipHtml } from 'snapmd';

// Clip a URL
const result = await clip('https://example.com/article');

result.markdown   // Clean Markdown string with frontmatter
result.meta       // { title, author, date, url, siteName, ... }
result.stats      // { words: 1847, readingTime: '8 min read' }

// Convert raw HTML string
const { markdown } = clipHtml('<h1>Hello</h1><p>World</p>', {
  frontmatter: true,
  baseUrl: 'https://example.com',
});

// All options
const result = await clip(url, {
  frontmatter: true,       // Include YAML frontmatter
  fullPage: false,         // Skip readability, clip everything
  includeImages: true,     // Include images in output
  includeLinks: true,      // Include hyperlinks
  linkStyle: 'inlined',   // 'inlined' or 'referenced'
});
```

---

## Supported Sources

| Source | Status | Notes |
|--------|--------|-------|
| Any webpage | &#x2705; | Articles, docs, blogs, wikis, any URL |
| YouTube | &#x2705; | Metadata + full transcript |
| GitHub READMEs | &#x1F6A7; | Coming soon |
| Twitter/X threads | &#x1F6A7; | Coming soon |
| PDFs | &#x1F6A7; | Coming soon |
| Reddit threads | &#x1F6A7; | Coming soon |

---

## Architecture

```
snapmd/
  bin/cli.js              CLI entry point with ANSI output
  src/
    index.js              Core engine (fetch > parse > extract > convert)
    converter.js          HTML > Markdown (recursive DOM walker, ~150 lines)
    readability.js        Content extraction (scoring algorithm)
    frontmatter.js        YAML frontmatter generation
    parsers/
      youtube.js          YouTube metadata + transcript extraction
```

**One runtime dependency:** [`linkedom`](https://github.com/WebReflection/linkedom) for server-side DOM parsing. Everything else is hand-written from scratch.

---

## Contributing

Contributions welcome! High-impact areas:

- **New source parsers** &mdash; GitHub, Twitter/X, Reddit, HN, PDFs, Substack
- **Edge cases** &mdash; malformed HTML, exotic table layouts, deeply nested lists
- **Performance** &mdash; benchmarking, streaming for large pages
- **Tests** &mdash; expanding coverage

```bash
git clone https://github.com/suhashollakc/snapmd.git
cd snapmd && npm install
echo '<h1>Test</h1><p>Hello world</p>' | node bin/cli.js --stdin
```

---

<p align="center">
  <sub>MIT &copy; <a href="https://github.com/suhashollakc">Suhas Holla</a></sub><br>
  <sub>If SnapMD saves you time, consider giving it a &#11088; on GitHub</sub>
</p>
