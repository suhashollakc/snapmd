const REDDIT_POST = /^https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\/r\/([\w]+)\/comments\/([\w]+)/;

export function isRedditUrl(url) { return REDDIT_POST.test(url); }

export function parseRedditUrl(url) {
  const m = url.match(REDDIT_POST);
  return m ? { subreddit: m[1], postId: m[2] } : null;
}

export async function parseReddit(url, fetchFn) {
  const info = parseRedditUrl(url);
  if (!info) throw new Error('Invalid Reddit URL: ' + url);

  const jsonUrl = url.replace(/\?.*$/, '').replace(/\/$/, '') + '.json';
  const raw = await fetchFn(jsonUrl);
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('Failed to parse Reddit JSON'); }

  const post = data[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error('Could not extract Reddit post data');

  const meta = {
    title: post.title || '',
    author: post.author || '',
    date: post.created_utc ? new Date(post.created_utc * 1000).toISOString().split('T')[0] : '',
    url: url,
    siteName: 'Reddit',
    subreddit: info.subreddit,
    score: post.score ?? 0,
    numComments: post.num_comments ?? 0,
    description: '',
  };

  let md = '';
  if (post.selftext) {
    md = post.selftext;
  } else if (post.url && post.url !== url) {
    md = `[External Link](${post.url})`;
  }

  const comments = data[1]?.data?.children || [];
  const topComments = comments
    .filter(c => c.kind === 't1' && c.data?.body)
    .slice(0, 20);

  let commentsMd = '';
  if (topComments.length) {
    commentsMd = '\n\n## Top Comments\n\n';
    for (const c of topComments) {
      const d = c.data;
      const score = d.score ?? 0;
      const author = d.author || '[deleted]';
      const body = d.body.trim();
      commentsMd += `**${author}** (${score} points):\n\n${indent(body)}\n\n---\n\n`;
    }
  }

  return { meta, body: md.trim(), comments: commentsMd.trim() };
}

function indent(text) {
  return text.split('\n').map(l => '> ' + l).join('\n');
}
