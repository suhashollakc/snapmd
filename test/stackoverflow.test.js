import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isStackOverflowUrl, parseSOId } from '../src/parsers/stackoverflow.js';

describe('StackOverflow parser', () => {

  describe('isStackOverflowUrl', () => {
    it('matches SO question URLs', () => {
      assert.ok(isStackOverflowUrl('https://stackoverflow.com/questions/12345/some-title'));
      assert.ok(isStackOverflowUrl('https://stackoverflow.com/questions/67890'));
    });
    it('rejects non-SO URLs', () => {
      assert.ok(!isStackOverflowUrl('https://example.com'));
      assert.ok(!isStackOverflowUrl('https://stackoverflow.com/users/12345'));
      assert.ok(!isStackOverflowUrl('https://stackexchange.com/questions/12345'));
    });
  });

  describe('parseSOId', () => {
    it('extracts question ID', () => {
      assert.equal(parseSOId('https://stackoverflow.com/questions/12345/some-title'), '12345');
    });
    it('returns null for invalid', () => {
      assert.equal(parseSOId('https://example.com'), null);
    });
  });
});
