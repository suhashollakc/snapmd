import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isRedditUrl, parseRedditUrl } from '../src/parsers/reddit.js';

describe('Reddit parser', () => {

  describe('isRedditUrl', () => {
    it('matches reddit post URLs', () => {
      assert.ok(isRedditUrl('https://www.reddit.com/r/programming/comments/abc123/some_title'));
      assert.ok(isRedditUrl('https://old.reddit.com/r/javascript/comments/xyz789'));
      assert.ok(isRedditUrl('https://reddit.com/r/node/comments/def456'));
    });
    it('rejects non-post URLs', () => {
      assert.ok(!isRedditUrl('https://reddit.com/r/programming'));
      assert.ok(!isRedditUrl('https://example.com'));
      assert.ok(!isRedditUrl('https://reddit.com'));
    });
  });

  describe('parseRedditUrl', () => {
    it('extracts subreddit and post ID', () => {
      const r = parseRedditUrl('https://www.reddit.com/r/programming/comments/abc123/some_title');
      assert.equal(r.subreddit, 'programming');
      assert.equal(r.postId, 'abc123');
    });
    it('returns null for invalid', () => {
      assert.equal(parseRedditUrl('https://example.com'), null);
    });
  });
});
