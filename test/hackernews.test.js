import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isHackerNewsUrl, parseHNId } from '../src/parsers/hackernews.js';

describe('Hacker News parser', () => {

  describe('isHackerNewsUrl', () => {
    it('matches HN item URLs', () => {
      assert.ok(isHackerNewsUrl('https://news.ycombinator.com/item?id=12345'));
      assert.ok(isHackerNewsUrl('http://news.ycombinator.com/item?id=99999999'));
    });
    it('rejects non-HN URLs', () => {
      assert.ok(!isHackerNewsUrl('https://example.com'));
      assert.ok(!isHackerNewsUrl('https://news.ycombinator.com'));
      assert.ok(!isHackerNewsUrl('https://news.ycombinator.com/newest'));
    });
  });

  describe('parseHNId', () => {
    it('extracts item ID', () => {
      assert.equal(parseHNId('https://news.ycombinator.com/item?id=12345'), '12345');
    });
    it('returns null for invalid', () => {
      assert.equal(parseHNId('https://example.com'), null);
    });
  });
});
