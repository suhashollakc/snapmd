export function generateFrontmatter(meta, opts={}) {
  const f = [];
  if(meta.title) f.push(`title: "${esc(meta.title)}"`);
  if(meta.url) f.push(`source: "${esc(meta.url)}"`);
  if(meta.author) f.push(`author: "${esc(meta.author)}"`);
  if(meta.date) f.push(`date: ${meta.date}`);
  if(meta.siteName) f.push(`site: "${esc(meta.siteName)}"`);
  if(meta.language) f.push(`language: ${meta.language}`);
  if(meta.description) f.push(`description: "${esc(meta.description.slice(0,200))}"`);
  if(meta.duration) f.push(`duration: "${meta.duration}"`);
  if(opts.wordCount) f.push(`word_count: ${opts.wordCount}`);
  if(opts.readingTime) f.push(`reading_time: "${opts.readingTime}"`);
  f.push(`clipped_at: ${new Date().toISOString()}`);
  f.push(`tool: snapmd`);
  return `---\n${f.join('\n')}\n---`;
}

export function computeReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 238));
  return { words, minutes, display: `${minutes} min read` };
}

function esc(s) { return s.replace(/"/g, '\\"').replace(/\n/g, ' '); }
