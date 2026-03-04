import { parseHTML } from 'linkedom';
import { HtmlToMarkdown } from './converter.js';
import { extractContent, extractMetadata } from './readability.js';
import { generateFrontmatter, computeReadingTime } from './frontmatter.js';
import { isYouTubeUrl, parseYouTube, formatTranscriptParagraphs } from './parsers/youtube.js';
import { isGitHubUrl, parseGitHub } from './parsers/github.js';
import { isRedditUrl, parseReddit } from './parsers/reddit.js';
import { isHackerNewsUrl, parseHackerNews } from './parsers/hackernews.js';
import { isStackOverflowUrl, parseStackOverflow } from './parsers/stackoverflow.js';

const DEFAULT_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; SnapMD/1.0)', 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' };

function makeFetch(customHeaders = {}) {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  return async function fetchUrl(url) {
    const res = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} - ${url}`);
    return await res.text();
  };
}

export async function clip(url, options = {}) {
  const o = { frontmatter:true, fullPage:false, includeImages:true, includeLinks:true, linkStyle:'inlined', bulletMarker:'-', selector:'', headers:{}, fetchFn:null, ...options };
  if (!o.fetchFn) o.fetchFn = makeFetch(o.headers);
  if (isYouTubeUrl(url)) return clipYT(url, o);
  if (isGitHubUrl(url)) return clipGH(url, o);
  if (isRedditUrl(url)) return clipReddit(url, o);
  if (isHackerNewsUrl(url)) return clipHN(url, o);
  if (isStackOverflowUrl(url)) return clipSO(url, o);
  return clipPage(url, o);
}

function wrapHtml(html) {
  const h = html.trim();
  if (/<html[\s>]/i.test(h)) return h;
  if (/<body[\s>]/i.test(h)) return `<html>${h}</html>`;
  return `<html><body>${h}</body></html>`;
}

export function clipHtml(html, options = {}) {
  const o = { frontmatter:false, fullPage:false, includeImages:true, includeLinks:true, linkStyle:'inlined', bulletMarker:'-', baseUrl:'', selector:'', ...options };
  const { document } = parseHTML(wrapHtml(html));
  const meta = extractMetadata(document, o.baseUrl);
  let root;
  if (o.selector) {
    root = document.querySelector(o.selector);
    if (!root) root = o.fullPage ? (document.body||document.documentElement) : extractContent(document);
  } else {
    root = o.fullPage ? (document.body||document.documentElement) : extractContent(document);
  }
  const conv = new HtmlToMarkdown({ images:o.includeImages, links:o.includeLinks, linkStyle:o.linkStyle, bullet:o.bulletMarker, baseUrl:o.baseUrl });
  let md = conv.convert(root);
  const { words, display } = computeReadingTime(md);
  if (o.frontmatter) md = generateFrontmatter(meta, {wordCount:words,readingTime:display})+'\n\n'+md;
  return { markdown:md, meta, stats:{words,readingTime:display} };
}

async function clipPage(url, o) {
  const html = await o.fetchFn(url);
  const { document } = parseHTML(html);
  const meta = extractMetadata(document, url);
  let root;
  if (o.selector) {
    root = document.querySelector(o.selector);
    if (!root) root = o.fullPage ? (document.body||document.documentElement) : extractContent(document);
  } else {
    root = o.fullPage ? (document.body||document.documentElement) : extractContent(document);
  }
  const conv = new HtmlToMarkdown({ images:o.includeImages, links:o.includeLinks, linkStyle:o.linkStyle, bullet:o.bulletMarker, baseUrl:url });
  let body = conv.convert(root);
  const { words, display } = computeReadingTime(body);
  let md = '';
  if (o.frontmatter) md += generateFrontmatter(meta, {wordCount:words,readingTime:display})+'\n\n';
  const hasH1 = /^#\s/m.test(body);
  if (meta.title && !hasH1) md += `# ${meta.title}\n\n`;
  md += body;
  return { markdown:md.trim(), meta, stats:{words,readingTime:display} };
}

async function clipYT(url, o) {
  const { meta, transcript } = await parseYouTube(url, o.fetchFn);
  let md = '';
  if (o.frontmatter) md += generateFrontmatter(meta, {})+'\n\n';
  md += `# ${meta.title||'YouTube Video'}\n\n`;
  if(meta.author) md += `**Channel:** ${meta.author}\n`;
  if(meta.date) md += `**Published:** ${meta.date}\n`;
  if(meta.duration) md += `**Duration:** ${meta.duration}\n`;
  md += `**URL:** ${meta.url}\n`;
  if(meta.description) md += `\n> ${meta.description}\n`;
  if(transcript) md += '\n## Transcript\n\n' + formatTranscriptParagraphs(transcript);
  else md += '\n*No transcript available.*\n';
  const { words, display } = computeReadingTime(md);
  return { markdown:md.trim(), meta, stats:{words,readingTime:display} };
}

async function clipGH(url, o) {
  const { meta, markdown: ghMd } = await parseGitHub(url, o.fetchFn);
  let md = '';
  if (o.frontmatter) {
    const { words, display } = computeReadingTime(ghMd);
    md += generateFrontmatter(meta, {wordCount:words,readingTime:display})+'\n\n';
  }
  md += ghMd;
  const { words, display } = computeReadingTime(md);
  return { markdown:md.trim(), meta, stats:{words,readingTime:display} };
}

async function clipReddit(url, o) {
  const { meta, body, comments } = await parseReddit(url, o.fetchFn);
  let md = '';
  if (o.frontmatter) md += generateFrontmatter(meta, {})+'\n\n';
  md += `# ${meta.title}\n\n`;
  md += `**r/${meta.subreddit}** · ${meta.score} points · ${meta.numComments} comments · by u/${meta.author}\n\n`;
  if (body) md += body + '\n';
  if (comments) md += '\n' + comments;
  const { words, display } = computeReadingTime(md);
  return { markdown:md.trim(), meta, stats:{words,readingTime:display} };
}

async function clipHN(url, o) {
  const { meta, body, comments } = await parseHackerNews(url, o.fetchFn);
  let md = '';
  if (o.frontmatter) md += generateFrontmatter(meta, {})+'\n\n';
  md += `# ${meta.title}\n\n`;
  md += `**Hacker News** · ${meta.score} points · ${meta.numComments} comments · by ${meta.author}\n\n`;
  if (body) md += body + '\n';
  if (comments) md += '\n## Comments\n\n' + comments;
  const { words, display } = computeReadingTime(md);
  return { markdown:md.trim(), meta, stats:{words,readingTime:display} };
}

async function clipSO(url, o) {
  const { meta, body, answers } = await parseStackOverflow(url, o.fetchFn);
  let md = '';
  if (o.frontmatter) md += generateFrontmatter(meta, {})+'\n\n';
  md += `# ${meta.title}\n\n`;
  const tags = meta.tags?.length ? meta.tags.map(t => '`' + t + '`').join(' ') : '';
  md += `**StackOverflow** · ${meta.score} votes${tags ? ' · ' + tags : ''}\n\n`;
  md += '## Question\n\n' + body + '\n';
  if (answers) md += '\n' + answers;
  const { words, display } = computeReadingTime(md);
  return { markdown:md.trim(), meta, stats:{words,readingTime:display} };
}

export { HtmlToMarkdown } from './converter.js';
export { extractContent, extractMetadata } from './readability.js';
export { generateFrontmatter, computeReadingTime } from './frontmatter.js';
