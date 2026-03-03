import { parseHTML } from 'linkedom';
import { HtmlToMarkdown } from './converter.js';
import { extractContent, extractMetadata } from './readability.js';
import { generateFrontmatter, computeReadingTime } from './frontmatter.js';
import { isYouTubeUrl, parseYouTube, formatTranscriptParagraphs } from './parsers/youtube.js';

async function defaultFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SnapMD/1.0)', 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' },
    redirect: 'follow', signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} - ${url}`);
  return await res.text();
}

export async function clip(url, options = {}) {
  const o = { frontmatter:true, fullPage:false, includeImages:true, includeLinks:true, linkStyle:'inlined', bulletMarker:'-', fetchFn:defaultFetch, ...options };
  if (isYouTubeUrl(url)) return clipYT(url, o);
  return clipPage(url, o);
}

function wrapHtml(html) {
  const h = html.trim();
  if (/<html[\s>]/i.test(h)) return h;
  if (/<body[\s>]/i.test(h)) return `<html>${h}</html>`;
  return `<html><body>${h}</body></html>`;
}

export function clipHtml(html, options = {}) {
  const o = { frontmatter:false, fullPage:false, includeImages:true, includeLinks:true, linkStyle:'inlined', bulletMarker:'-', baseUrl:'', ...options };
  const { document } = parseHTML(wrapHtml(html));
  const meta = extractMetadata(document, o.baseUrl);
  const root = o.fullPage ? (document.body||document.documentElement) : extractContent(document);
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
  const root = o.fullPage ? (document.body||document.documentElement) : extractContent(document);
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

export { HtmlToMarkdown } from './converter.js';
export { extractContent, extractMetadata } from './readability.js';
export { generateFrontmatter, computeReadingTime } from './frontmatter.js';
