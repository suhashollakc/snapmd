import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isGitHubUrl, parseGitHubUrl } from '../src/parsers/github.js';

describe('GitHub parser', () => {

  describe('isGitHubUrl', () => {
    it('matches repo URLs', () => {
      assert.ok(isGitHubUrl('https://github.com/user/repo'));
      assert.ok(isGitHubUrl('https://github.com/user/repo/'));
      assert.ok(isGitHubUrl('https://github.com/user/repo/blob/main/README.md'));
    });
    it('rejects non-github URLs', () => {
      assert.ok(!isGitHubUrl('https://example.com'));
      assert.ok(!isGitHubUrl('https://gitlab.com/user/repo'));
    });
  });

  describe('parseGitHubUrl', () => {
    it('parses repo root', () => {
      const r = parseGitHubUrl('https://github.com/user/repo');
      assert.equal(r.owner, 'user');
      assert.equal(r.repo, 'repo');
      assert.equal(r.branch, '');
      assert.equal(r.path, '');
    });
    it('parses blob path', () => {
      const r = parseGitHubUrl('https://github.com/user/repo/blob/main/src/index.js');
      assert.equal(r.owner, 'user');
      assert.equal(r.repo, 'repo');
      assert.equal(r.branch, 'main');
      assert.equal(r.path, 'src/index.js');
    });
    it('parses tree path', () => {
      const r = parseGitHubUrl('https://github.com/user/repo/tree/dev');
      assert.equal(r.owner, 'user');
      assert.equal(r.repo, 'repo');
      assert.equal(r.branch, 'dev');
    });
    it('handles dotted names', () => {
      const r = parseGitHubUrl('https://github.com/my-org/my.repo');
      assert.equal(r.owner, 'my-org');
      assert.equal(r.repo, 'my.repo');
    });
  });
});
