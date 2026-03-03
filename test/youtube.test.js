import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isYouTubeUrl, extractYouTubeId, formatTranscript, formatTranscriptParagraphs } from '../src/parsers/youtube.js';

describe('YouTube parser', () => {

  describe('isYouTubeUrl', () => {
    it('matches youtube.com/watch', () => assert.ok(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')));
    it('matches youtu.be', () => assert.ok(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')));
    it('matches youtube.com/embed', () => assert.ok(isYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')));
    it('matches youtube.com/shorts', () => assert.ok(isYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')));
    it('rejects non-youtube URLs', () => assert.ok(!isYouTubeUrl('https://example.com')));
    it('rejects partial matches', () => assert.ok(!isYouTubeUrl('https://notyoutube.com/watch?v=abc')));
  });

  describe('extractYouTubeId', () => {
    it('extracts from watch URL', () => assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ'));
    it('extracts from short URL', () => assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ'));
    it('returns null for invalid', () => assert.equal(extractYouTubeId('https://example.com'), null));
  });

  describe('formatTranscript', () => {
    it('formats segments with timestamps', () => {
      const segs = [
        { start: 0, duration: 5, text: 'Hello' },
        { start: 5, duration: 5, text: 'World' },
      ];
      const r = formatTranscript(segs);
      assert.ok(r.includes('[0:00] Hello'));
      assert.ok(r.includes('[0:05] World'));
    });
    it('handles empty segments', () => {
      assert.equal(formatTranscript([]), '');
      assert.equal(formatTranscript(null), '');
    });
  });

  describe('formatTranscriptParagraphs', () => {
    it('groups segments into paragraphs', () => {
      const segs = [
        { start: 0, duration: 5, text: 'Hello' },
        { start: 5, duration: 5, text: 'world' },
        { start: 60, duration: 5, text: 'New paragraph' },
      ];
      const r = formatTranscriptParagraphs(segs);
      assert.ok(r.includes('**[0:00]**'));
      assert.ok(r.includes('Hello world'));
      assert.ok(r.includes('New paragraph'));
    });
    it('handles empty', () => {
      assert.equal(formatTranscriptParagraphs([]), '');
      assert.equal(formatTranscriptParagraphs(null), '');
    });
  });
});
