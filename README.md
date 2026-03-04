<p align="center">
  <a href="https://www.npmjs.com/package/snapmd"><img src="https://img.shields.io/npm/v/snapmd" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/snapmd"><img src="https://img.shields.io/npm/dm/snapmd" alt="npm downloads"></a>
  <a href="https://github.com/suhashollakc/snapmd/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/snapmd" alt="license"></a>
  <a href="https://github.com/suhashollakc/snapmd/actions"><img src="https://github.com/suhashollakc/snapmd/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<h1 align="center">SnapMD</h1>
<p align="center"><strong>Clip any webpage as clean, LLM-ready Markdown from your terminal.</strong></p>
<p align="center"><sub>Webpages &middot; YouTube &middot; GitHub &middot; Reddit &middot; Hacker News &middot; StackOverflow</sub></p>

<br>

<p align="center">
  <a href="#install">Install</a> &nbsp;&middot;&nbsp;
  <a href="#cli-usage">CLI</a> &nbsp;&middot;&nbsp;
  <a href="#mcp-server-ai-tool-use">MCP</a> &nbsp;&middot;&nbsp;
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

&nbsp;&nbsp;**Zero bloat** &mdash; Hand-written recursive DOM parser. No Turndown, no Readability.js. Single dependency.<br>
&nbsp;&nbsp;**LLM-ready** &mdash; YAML frontmatter (title, author, date, word count, reading time). Pipe straight to any LLM.<br>
&nbsp;&nbsp;**Smart extraction** &mdash; Built-in readability engine strips nav, ads, sidebars. Or target with `--selector`.<br>
&nbsp;&nbsp;**6 source types** &mdash; Webpages, YouTube (transcripts), GitHub repos, Reddit posts, Hacker News, StackOverflow.<br>
&nbsp;&nbsp;**MCP server** &mdash; Use as an AI tool in Claude, Cursor, Windsurf, ChatGPT, and any MCP-compatible client.<br>
&nbsp;&nbsp;**Batch mode** &mdash; Clip multiple URLs in one command.<br>
&nbsp;&nbsp;**Universal** &mdash; CLI + API + stdin + MCP for every workflow.

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

# Target a specific element
snapmd https://example.com -s ".article-body"

# Batch clip multiple URLs
snapmd https://example.com https://github.com/user/repo

# YouTube video transcript
snapmd https://youtube.com/watch?v=dQw4w9WgXcQ

# GitHub README
snapmd https://github.com/suhashollakc/snapmd

# Reddit post with comments
snapmd https://reddit.com/r/programming/comments/abc123/title

# StackOverflow question + answers
snapmd https://stackoverflow.com/questions/12345/title

# Hacker News thread
snapmd https://news.ycombinator.com/item?id=12345

# JSON output (markdown + metadata + stats)
snapmd https://example.com --json

# Custom HTTP header (e.g. auth)
snapmd https://api.example.com -H "Authorization: Bearer token"

# Pipe to an LLM
snapmd https://example.com -F | llm "summarize this"

# Read HTML from stdin
curl -s https://example.com | snapmd --stdin
```

### All Options

| Flag | Short | Description |
|------|-------|-------------|
| `--output <file>` | `-o` | Save output to file |
| `--selector <css>` | `-s` | Target a specific CSS selector |
| `--header <k:v>` | `-H` | Custom HTTP header (repeatable) |
| `--full` | `-f` | Clip full page (skip readability) |
| `--no-frontmatter` | `-F` | Skip YAML frontmatter |
| `--referenced` | `-r` | Use reference-style links |
| `--json` | `-j` | Output as JSON |
| `--no-images` | | Exclude images |
| `--no-links` | | Exclude hyperlinks |
| `--stdin` | | Read HTML from stdin |
| `--base-url <url>` | | Base URL for relative links (stdin) |
| `--quiet` | `-q` | Suppress status messages |
| `--version` | `-v` | Print version |
| `--help` | `-h` | Show help |

---

## MCP Server (AI Tool Use)

SnapMD includes an MCP (Model Context Protocol) server, so AI assistants like Claude, Cursor, and Windsurf can clip webpages as a tool.

### Setup

Add to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "snapmd": {
      "command": "npx",
      "args": ["-y", "snapmd-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "snapmd": {
      "command": "snapmd-mcp"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `clip_url` | Clip any URL to Markdown (with selector, frontmatter, image/link control) |
| `clip_html` | Convert raw HTML string to Markdown |
| `batch_clip` | Clip multiple URLs at once |

## Programmatic API

```javascript
import { clip, clipHtml } from 'snapmd';

// Clip a URL
const result = await clip('https://example.com/article');
console.log(result.markdown);  // Clean Markdown with frontmatter
console.log(result.meta);      // { title, author, date, url, ... }
console.log(result.stats);     // { words: 1234, readingTime: '5 min read' }

// Clip with a CSS selector
const result2 = await clip('https://example.com', {
  selector: '.post-body',
  frontmatter: false,
});

// Clip with custom headers
const result3 = await clip('https://api.example.com/page', {
  headers: { 'Authorization': 'Bearer token' },
});

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

| Source | What You Get |
|--------|-------------|
| Any webpage | Article content with metadata |
| YouTube | Video metadata + full transcript |
| GitHub | README markdown + repo stats |
| Reddit | Post + top comments |
| Hacker News | Post + comment tree |
| StackOverflow | Question + voted answers |

## Architecture

```
snapmd/
  bin/
    cli.js                CLI entry point
    mcp.js                MCP server for AI tool use
  src/
    index.js              Core engine (fetch, route, convert)
    converter.js          HTML to Markdown (recursive DOM walker)
    readability.js        Content extraction (strips nav/ads/noise)
    frontmatter.js        YAML frontmatter generation
    parsers/
      youtube.js          YouTube metadata + transcript
      github.js           GitHub repo + README
      reddit.js           Reddit post + comments
      hackernews.js       HN thread + comment tree
      stackoverflow.js    SO question + answers
```

Only one runtime dependency: `linkedom` for server-side DOM parsing. Everything else is hand-written.

## Contributing

Contributions welcome! Especially: new source parsers (Twitter/X, PDF), edge case fixes, and performance improvements.

```bash
git clone https://github.com/suhashollakc/snapmd.git
cd snapmd && npm install
npm test                                          # 106 tests
echo '<h1>Test</h1><p>Hello</p>' | node bin/cli.js --stdin
```

## License

MIT &copy; [Suhas Holla](https://github.com/suhashollakc)

<p align="center">
  <sub>If SnapMD saves you time, consider giving it a &#11088; on GitHub</sub>
</p>
