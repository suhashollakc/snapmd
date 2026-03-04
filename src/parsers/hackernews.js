const HN_ITEM = /^https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;

export function isHackerNewsUrl(url) { return HN_ITEM.test(url); }

export function parseHNId(url) {
  const m = url.match(HN_ITEM);
  return m ? m[1] : null;
}

export async function parseHackerNews(url, fetchFn) {
  const id = parseHNId(url);
  if (!id) throw new Error('Invalid Hacker News URL: ' + url);

  const raw = await fetchFn(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
  let item;
  try { item = JSON.parse(raw); } catch { throw new Error('Failed to parse HN API response'); }
  if (!item) throw new Error('HN item not found: ' + id);

  const meta = {
    title: item.title || '',
    author: item.by || '',
    date: item.time ? new Date(item.time * 1000).toISOString().split('T')[0] : '',
    url: item.url || url,
    siteName: 'Hacker News',
    score: item.score ?? 0,
    numComments: item.descendants ?? 0,
    description: '',
  };

  let body = '';
  if (item.text) {
    body = htmlToText(item.text);
  } else if (item.url) {
    body = `[${item.title || 'Link'}](${item.url})`;
  }

  const commentsMd = await buildCommentTree(item.kids || [], fetchFn, 0, 15);

  return { meta, body: body.trim(), comments: commentsMd.trim() };
}

async function buildCommentTree(kids, fetchFn, depth, maxComments) {
  if (!kids.length || maxComments <= 0) return '';
  let md = '';
  let count = 0;
  for (const kid of kids) {
    if (count >= maxComments) break;
    try {
      const raw = await fetchFn(`https://hacker-news.firebaseio.com/v0/item/${kid}.json`);
      const c = JSON.parse(raw);
      if (!c || c.deleted || c.dead || !c.text) continue;
      const indent = '  '.repeat(depth);
      const prefix = depth === 0 ? '**' + (c.by || 'anon') + '**' : '*' + (c.by || 'anon') + '*';
      md += `${indent}${prefix}:\n\n${indentText(htmlToText(c.text), indent)}\n\n`;
      count++;
      if (c.kids?.length && depth < 2) {
        md += await buildCommentTree(c.kids, fetchFn, depth + 1, 3);
      }
    } catch { continue; }
  }
  return md;
}

function indentText(text, indent) {
  return text.split('\n').map(l => indent + '> ' + l).join('\n');
}

function htmlToText(html) {
  return (html || '')
    .replace(/<p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<pre><code>(.*?)<\/code><\/pre>/gis, '\n```\n$1\n```\n')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .trim();
}
