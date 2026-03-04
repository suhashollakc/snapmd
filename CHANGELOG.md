# Changelog

## [1.1.0] - 2026-03-04

### Added
- **MCP Server** — `snapmd-mcp` binary for AI tool use in Claude, Cursor, Windsurf, ChatGPT, and any MCP-compatible client. Three tools: `clip_url`, `clip_html`, `batch_clip`.
- **GitHub parser** — Clip any GitHub repo to get the README markdown + repo metadata (stars, forks, language, license, topics).
- **Reddit parser** — Clip Reddit post URLs to get the post content + top 20 comments.
- **Hacker News parser** — Clip HN thread URLs to get the post + nested comment tree.
- **StackOverflow parser** — Clip SO question URLs to get the question + top voted answers with code blocks.
- **`--selector` / `-s`** — Target a specific CSS selector on any page (e.g. `snapmd url -s ".article-body"`).
- **`--header` / `-H`** — Custom HTTP headers (repeatable). Useful for authenticated pages.
- **Batch mode** — Pass multiple URLs as positional args to clip them all in one command.
- **106 automated tests** covering converter, API, frontmatter, readability, and all new parsers.
- **GitHub Actions CI** workflow for automated testing on push/PR.

### Fixed
- Duplicate title heading when page already contains an h1 (fixed in v1.0.1, carried forward).
- Version string in CLI now matches `package.json`.

## [1.0.1] - 2026-03-03

### Fixed
- GitHub URLs updated to correct username (`suhashollakc`).
- Duplicate `keywords`, `author`, `license` fields in `package.json` removed.

## [1.0.0] - 2026-03-03

### Added
- Initial release.
- CLI tool: `snapmd <url>` clips any webpage to clean Markdown.
- YouTube parser with transcript extraction.
- YAML frontmatter with title, author, date, word count, reading time.
- Built-in readability engine for smart content extraction.
- Hand-written HTML-to-Markdown converter (headings, bold, italic, links, images, lists, tables, code blocks, blockquotes, and more).
- Programmatic API: `clip(url)` and `clipHtml(html)`.
- Options: `--json`, `--output`, `--no-frontmatter`, `--full`, `--referenced`, `--no-images`, `--no-links`, `--stdin`, `--quiet`.
- Single runtime dependency: `linkedom`.
