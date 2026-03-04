import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clip, clipHtml } from '../src/index.js';

const FAKE_HTML = '<html><head><title>Example Domain</title><meta property="og:title" content="Example Domain"></head><body><h1>Example Domain</h1><p>This domain is for use in illustrative examples.</p></body></html>';

function mockFetch() {
  return async function fetchUrl() { return FAKE_HTML; };
}

describe('MCP tool handlers (via API)', () => {

  it('clip_url equivalent: clips a URL with options', async () => {
    const result = await clip('https://example.com', {
      frontmatter: true,
      fullPage: false,
      includeImages: true,
      includeLinks: true,
      fetchFn: mockFetch(),
    });
    assert.ok(result.markdown);
    assert.ok(result.markdown.includes('Example Domain'));
    assert.ok(result.meta);
    assert.ok(result.stats);
    assert.ok(result.stats.words > 0);
  });

  it('clip_html equivalent: converts HTML with options', () => {
    const result = clipHtml('<h1>Test</h1><p>Hello world</p>', {
      frontmatter: false,
      baseUrl: 'https://example.com',
    });
    assert.ok(result.markdown.includes('# Test'));
    assert.ok(result.markdown.includes('Hello world'));
  });

  it('batch_clip equivalent: clips multiple URLs', async () => {
    const urls = ['https://example.com'];
    const results = [];
    for (const url of urls) {
      try {
        const result = await clip(url, { frontmatter: true, fetchFn: mockFetch() });
        results.push({ url, markdown: result.markdown, meta: result.meta, stats: result.stats });
      } catch (e) {
        results.push({ url, error: e.message });
      }
    }
    assert.equal(results.length, 1);
    assert.ok(results[0].markdown);
    assert.ok(!results[0].error);
  });

  it('selector option works via API', () => {
    const html = '<div class="sidebar">Nav</div><div class="content"><p>Main content here.</p></div>';
    const result = clipHtml(html, { selector: '.content' });
    assert.ok(result.markdown.includes('Main content'));
    assert.ok(!result.markdown.includes('Nav'));
  });

  it('detects GitHub URLs for routing', async () => {
    const { isGitHubUrl } = await import('../src/parsers/github.js');
    assert.ok(isGitHubUrl('https://github.com/suhashollakc/snapmd'));
  });

  it('detects Reddit URLs for routing', async () => {
    const { isRedditUrl } = await import('../src/parsers/reddit.js');
    assert.ok(isRedditUrl('https://www.reddit.com/r/programming/comments/abc123'));
  });

  it('detects HN URLs for routing', async () => {
    const { isHackerNewsUrl } = await import('../src/parsers/hackernews.js');
    assert.ok(isHackerNewsUrl('https://news.ycombinator.com/item?id=12345'));
  });

  it('detects SO URLs for routing', async () => {
    const { isStackOverflowUrl } = await import('../src/parsers/stackoverflow.js');
    assert.ok(isStackOverflowUrl('https://stackoverflow.com/questions/12345'));
  });
});
