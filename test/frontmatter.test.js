import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateFrontmatter, computeReadingTime } from '../src/frontmatter.js';

describe('generateFrontmatter', () => {

  it('generates valid YAML frontmatter', () => {
    const meta = { title: 'Test', url: 'https://example.com', author: 'Jane', date: '2025-01-01', siteName: 'Blog', language: 'en', description: 'A desc' };
    const fm = generateFrontmatter(meta, { wordCount: 500, readingTime: '3 min read' });
    assert.ok(fm.startsWith('---'));
    assert.ok(fm.endsWith('---'));
    assert.ok(fm.includes('title: "Test"'));
    assert.ok(fm.includes('source: "https://example.com"'));
    assert.ok(fm.includes('author: "Jane"'));
    assert.ok(fm.includes('date: 2025-01-01'));
    assert.ok(fm.includes('word_count: 500'));
    assert.ok(fm.includes('reading_time: "3 min read"'));
    assert.ok(fm.includes('tool: snapmd'));
    assert.ok(fm.includes('clipped_at:'));
  });

  it('omits empty fields', () => {
    const meta = { title: '', url: '', author: '', date: '', siteName: '', language: '', description: '' };
    const fm = generateFrontmatter(meta, {});
    assert.ok(!fm.includes('title:'));
    assert.ok(!fm.includes('author:'));
    assert.ok(fm.includes('tool: snapmd'));
  });

  it('escapes quotes in title', () => {
    const meta = { title: 'He said "hello"', url: '' };
    const fm = generateFrontmatter(meta, {});
    assert.ok(fm.includes('He said \\"hello\\"'));
  });

  it('truncates long descriptions', () => {
    const meta = { description: 'x'.repeat(300), url: '' };
    const fm = generateFrontmatter(meta, {});
    // description is sliced to 200 chars
    assert.ok(!fm.includes('x'.repeat(201)));
  });
});

describe('computeReadingTime', () => {

  it('returns words and reading time', () => {
    const r = computeReadingTime('one two three four five');
    assert.equal(r.words, 5);
    assert.equal(r.minutes, 1);
    assert.equal(r.display, '1 min read');
  });

  it('calculates minutes for longer text', () => {
    const text = Array(500).fill('word').join(' ');
    const r = computeReadingTime(text);
    assert.equal(r.words, 500);
    assert.equal(r.minutes, Math.ceil(500 / 238));
  });

  it('handles empty text', () => {
    const r = computeReadingTime('');
    assert.equal(r.words, 0);
    assert.equal(r.minutes, 1);
  });
});
