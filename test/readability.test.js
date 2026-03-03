import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { extractContent, extractMetadata } from '../src/readability.js';

function doc(html) {
  return parseHTML(`<html><head></head><body>${html}</body></html>`).document;
}

describe('extractContent', () => {

  it('prefers <article> element', () => {
    const d = doc('<nav>Nav</nav><article><p>Article content that is long enough to pass the threshold check for readability extraction. Adding more text to make sure we exceed the two hundred character minimum threshold required by the selector check in the readability module.</p></article><footer>Footer</footer>');
    const el = extractContent(d);
    assert.ok(el.textContent.includes('Article content'));
    assert.equal(el.tagName.toLowerCase(), 'article');
  });

  it('prefers [role="main"]', () => {
    const d = doc('<div>Side</div><div role="main"><p>Main content that is definitely long enough to pass the two hundred character threshold check.</p></div>');
    const el = extractContent(d);
    assert.ok(el.textContent.includes('Main content'));
  });

  it('falls back to scoring when no semantic element', () => {
    const long = 'This is a paragraph with enough content. '.repeat(20);
    const d = doc(`<div class="sidebar"><p>Short</p></div><div class="article-body"><p>${long}</p></div>`);
    const el = extractContent(d);
    assert.ok(el.textContent.includes('This is a paragraph'));
  });

  it('returns body for very short content', () => {
    const d = doc('<p>Hi</p>');
    const el = extractContent(d);
    assert.ok(el);
  });
});

describe('extractMetadata', () => {

  it('extracts og:title', () => {
    const { document } = parseHTML('<html><head><meta property="og:title" content="OG Title"></head><body></body></html>');
    const m = extractMetadata(document, 'https://example.com');
    assert.equal(m.title, 'OG Title');
  });

  it('falls back to <title> tag', () => {
    const { document } = parseHTML('<html><head><title>Page Title</title></head><body></body></html>');
    const m = extractMetadata(document, 'https://example.com');
    assert.equal(m.title, 'Page Title');
  });

  it('strips site name suffix from title', () => {
    const { document } = parseHTML('<html><head><title>Article - MySite</title></head><body></body></html>');
    const m = extractMetadata(document, '');
    assert.equal(m.title, 'Article');
  });

  it('extracts description', () => {
    const { document } = parseHTML('<html><head><meta name="description" content="A desc"></head><body></body></html>');
    const m = extractMetadata(document, '');
    assert.equal(m.description, 'A desc');
  });

  it('extracts author', () => {
    const { document } = parseHTML('<html><head><meta name="author" content="Jane"></head><body></body></html>');
    const m = extractMetadata(document, '');
    assert.equal(m.author, 'Jane');
  });

  it('extracts language', () => {
    const { document } = parseHTML('<html lang="en"><head></head><body></body></html>');
    const m = extractMetadata(document, '');
    assert.equal(m.language, 'en');
  });

  it('sets url from parameter', () => {
    const { document } = parseHTML('<html><head></head><body></body></html>');
    const m = extractMetadata(document, 'https://test.com/page');
    assert.equal(m.url, 'https://test.com/page');
  });

  it('extracts from JSON-LD', () => {
    const { document } = parseHTML('<html><head><script type="application/ld+json">{"datePublished":"2025-06-01","author":{"name":"John"}}</script></head><body></body></html>');
    const m = extractMetadata(document, '');
    assert.equal(m.date, '2025-06-01');
    assert.equal(m.author, 'John');
  });
});
