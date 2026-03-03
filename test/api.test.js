import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clipHtml } from '../src/index.js';

describe('clipHtml API', () => {

  it('returns markdown, meta, and stats', () => {
    const r = clipHtml('<h1>Title</h1><p>Hello world content here.</p>');
    assert.ok(r.markdown);
    assert.ok(r.meta);
    assert.ok(r.stats);
    assert.equal(typeof r.stats.words, 'number');
    assert.equal(typeof r.stats.readingTime, 'string');
  });

  it('includes frontmatter when enabled', () => {
    const r = clipHtml('<h1>Title</h1><p>Content</p>', { frontmatter: true, baseUrl: 'https://test.com' });
    assert.ok(r.markdown.startsWith('---'));
    assert.ok(r.markdown.includes('tool: snapmd'));
    assert.ok(r.markdown.includes('clipped_at:'));
  });

  it('excludes frontmatter when disabled', () => {
    const r = clipHtml('<h1>Title</h1><p>Content</p>', { frontmatter: false });
    assert.ok(!r.markdown.startsWith('---'));
  });

  it('extracts metadata from meta tags', () => {
    const html = `<html>
      <head>
        <title>My Page</title>
        <meta property="og:title" content="OG Title">
        <meta name="description" content="A description">
        <meta name="author" content="John Doe">
      </head>
      <body><p>Content</p></body>
    </html>`;
    const r = clipHtml(html, { baseUrl: 'https://example.com' });
    assert.equal(r.meta.title, 'OG Title');
    assert.equal(r.meta.description, 'A description');
    assert.equal(r.meta.author, 'John Doe');
  });

  it('respects includeImages option', () => {
    const html = '<p>Text <img src="https://img.com/a.jpg" alt="photo"> more</p>';
    const with_ = clipHtml(html, { includeImages: true });
    const without = clipHtml(html, { includeImages: false });
    assert.ok(with_.markdown.includes('![photo]'));
    assert.ok(!without.markdown.includes('![photo]'));
  });

  it('respects includeLinks option', () => {
    const html = '<p>Visit <a href="https://x.com">here</a></p>';
    const with_ = clipHtml(html, { includeLinks: true });
    const without = clipHtml(html, { includeLinks: false });
    assert.ok(with_.markdown.includes('[here](https://x.com)'));
    assert.ok(!without.markdown.includes('[here]'));
    assert.ok(without.markdown.includes('here'));
  });

  it('supports reference-style links', () => {
    const html = '<p><a href="https://a.com">A</a> <a href="https://b.com">B</a></p>';
    const r = clipHtml(html, { linkStyle: 'referenced' });
    assert.ok(r.markdown.includes('[A][1]'));
    assert.ok(r.markdown.includes('[1]: https://a.com'));
  });

  it('handles complex nested HTML', () => {
    const html = `
      <article>
        <h1>Article</h1>
        <p>Intro with <strong>bold</strong> and <em>italic</em>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2
            <ol><li>Sub A</li><li>Sub B</li></ol>
          </li>
        </ul>
        <blockquote><p>A quote</p></blockquote>
        <pre><code class="language-js">const x = 1;</code></pre>
        <table>
          <thead><tr><th>Col1</th><th>Col2</th></tr></thead>
          <tbody><tr><td>val1</td><td>val2</td></tr></tbody>
        </table>
      </article>
    `;
    const r = clipHtml(html);
    assert.ok(r.markdown.includes('# Article'));
    assert.ok(r.markdown.includes('**bold**'));
    assert.ok(r.markdown.includes('*italic*'));
    assert.ok(r.markdown.includes('- Item 1'));
    assert.ok(r.markdown.includes('> A quote'));
    assert.ok(r.markdown.includes('```js'));
    assert.ok(r.markdown.includes('| Col1 | Col2 |'));
  });

  it('handles empty HTML gracefully', () => {
    const r = clipHtml('');
    assert.ok(r.markdown !== undefined);
    assert.ok(r.stats.words >= 0);
  });
});
