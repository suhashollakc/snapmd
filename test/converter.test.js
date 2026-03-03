import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HtmlToMarkdown } from '../src/converter.js';
import { parseHTML } from 'linkedom';

function md(html, opts = {}) {
  const { document } = parseHTML(`<html><body>${html}</body></html>`);
  const conv = new HtmlToMarkdown(opts);
  return conv.convert(document.body);
}

describe('HtmlToMarkdown', () => {

  describe('headings', () => {
    it('converts h1-h6', () => {
      assert.equal(md('<h1>One</h1>'), '# One');
      assert.equal(md('<h2>Two</h2>'), '## Two');
      assert.equal(md('<h3>Three</h3>'), '### Three');
      assert.equal(md('<h6>Six</h6>'), '###### Six');
    });
    it('skips empty headings', () => {
      assert.equal(md('<h1></h1>'), '');
    });
  });

  describe('inline formatting', () => {
    it('bold', () => assert.equal(md('<strong>bold</strong>'), '**bold**'));
    it('italic', () => assert.equal(md('<em>italic</em>'), '*italic*'));
    it('strikethrough', () => assert.equal(md('<del>removed</del>'), '~~removed~~'));
    it('inline code', () => assert.equal(md('<code>x</code>'), '`x`'));
    it('inline code with backticks', () => {
      assert.equal(md('<code>a`b</code>'), '``a`b``');
    });
    it('nested bold+italic', () => {
      assert.equal(md('<strong><em>both</em></strong>'), '***both***');
    });
  });

  describe('paragraphs and breaks', () => {
    it('paragraphs', () => {
      assert.equal(md('<p>Hello</p><p>World</p>'), 'Hello\n\nWorld');
    });
    it('line breaks', () => {
      assert.ok(md('<p>line1<br>line2</p>').includes('line1'));
    });
    it('horizontal rule', () => {
      assert.ok(md('<hr>').includes('---'));
    });
  });

  describe('links', () => {
    it('inline links', () => {
      assert.equal(md('<a href="https://x.com">click</a>'), '[click](https://x.com)');
    });
    it('links with title', () => {
      assert.equal(md('<a href="https://x.com" title="tip">click</a>'), '[click](https://x.com "tip")');
    });
    it('skips javascript links', () => {
      assert.equal(md('<a href="javascript:void(0)">click</a>'), 'click');
    });
    it('skips anchor links', () => {
      assert.equal(md('<a href="#section">click</a>'), 'click');
    });
    it('reference-style links', () => {
      const r = md('<a href="https://a.com">A</a> and <a href="https://b.com">B</a>', { linkStyle: 'referenced' });
      assert.ok(r.includes('[A][1]'));
      assert.ok(r.includes('[B][2]'));
      assert.ok(r.includes('[1]: https://a.com'));
      assert.ok(r.includes('[2]: https://b.com'));
    });
    it('strips links with --no-links', () => {
      assert.equal(md('<a href="https://x.com">click</a>', { links: false }), 'click');
    });
  });

  describe('images', () => {
    it('renders images', () => {
      assert.equal(md('<img src="https://img.com/a.jpg" alt="photo">'), '![photo](https://img.com/a.jpg)');
    });
    it('strips images with --no-images', () => {
      assert.equal(md('<img src="https://img.com/a.jpg" alt="photo">', { images: false }), '');
    });
  });

  describe('lists', () => {
    it('unordered list', () => {
      const r = md('<ul><li>A</li><li>B</li></ul>');
      assert.ok(r.includes('- A'));
      assert.ok(r.includes('- B'));
    });
    it('ordered list', () => {
      const r = md('<ol><li>First</li><li>Second</li></ol>');
      assert.ok(r.includes('1. First'));
      assert.ok(r.includes('2. Second'));
    });
    it('ordered list with start attribute', () => {
      const r = md('<ol start="5"><li>Five</li><li>Six</li></ol>');
      assert.ok(r.includes('5. Five'));
      assert.ok(r.includes('6. Six'));
    });
    it('nested list', () => {
      const r = md('<ul><li>A<ul><li>A1</li></ul></li></ul>');
      assert.ok(r.includes('- A'));
      assert.ok(r.includes('- A1'));
    });
    it('checkbox list', () => {
      const r = md('<ul><li><input type="checkbox" checked> Done</li><li><input type="checkbox"> Todo</li></ul>');
      assert.ok(r.includes('[x]'));
      assert.ok(r.includes('[ ]'));
    });
  });

  describe('blockquotes', () => {
    it('blockquote', () => {
      const r = md('<blockquote><p>Quote here</p></blockquote>');
      assert.ok(r.includes('> Quote here'));
    });
  });

  describe('code blocks', () => {
    it('fenced code block', () => {
      const r = md('<pre><code>const x = 1;</code></pre>');
      assert.ok(r.includes('```'));
      assert.ok(r.includes('const x = 1;'));
    });
    it('detects language from class', () => {
      const r = md('<pre><code class="language-python">print("hi")</code></pre>');
      assert.ok(r.includes('```python'));
    });
  });

  describe('tables', () => {
    it('simple table', () => {
      const r = md('<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>');
      assert.ok(r.includes('| A | B |'));
      assert.ok(r.includes('| --- | --- |'));
      assert.ok(r.includes('| 1 | 2 |'));
    });
  });

  describe('skip elements', () => {
    it('skips script tags', () => {
      assert.equal(md('<p>Hello</p><script>alert(1)</script>'), 'Hello');
    });
    it('skips style tags', () => {
      assert.equal(md('<p>Hello</p><style>.x{}</style>'), 'Hello');
    });
    it('skips hidden elements', () => {
      assert.equal(md('<p>Visible</p><p style="display:none">Hidden</p>'), 'Visible');
    });
    it('skips aria-hidden', () => {
      assert.equal(md('<p>Visible</p><p aria-hidden="true">Hidden</p>'), 'Visible');
    });
  });

  describe('special elements', () => {
    it('figure with figcaption', () => {
      const r = md('<figure><img src="https://img.com/a.jpg" alt="photo"><figcaption>A caption</figcaption></figure>');
      assert.ok(r.includes('![photo](https://img.com/a.jpg)'));
      assert.ok(r.includes('*A caption*'));
    });
    it('details/summary', () => {
      const r = md('<details><summary>Click me</summary><p>Content</p></details>');
      assert.ok(r.includes('<details>'));
      assert.ok(r.includes('<summary>Click me</summary>'));
      assert.ok(r.includes('Content'));
    });
    it('mark highlight', () => {
      assert.equal(md('<mark>highlighted</mark>'), '==highlighted==');
    });
    it('superscript', () => {
      assert.equal(md('<sup>2</sup>'), '^2^');
    });
    it('subscript', () => {
      assert.equal(md('<sub>2</sub>'), '~2~');
    });
  });

  describe('URL resolution', () => {
    it('resolves relative URLs', () => {
      const r = md('<a href="/page">link</a>', { baseUrl: 'https://example.com' });
      assert.equal(r, '[link](https://example.com/page)');
    });
    it('preserves absolute URLs', () => {
      const r = md('<a href="https://other.com/page">link</a>', { baseUrl: 'https://example.com' });
      assert.equal(r, '[link](https://other.com/page)');
    });
  });
});
