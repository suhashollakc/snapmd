const SO_QUESTION = /^https?:\/\/stackoverflow\.com\/questions\/(\d+)/;

export function isStackOverflowUrl(url) { return SO_QUESTION.test(url); }

export function parseSOId(url) {
  const m = url.match(SO_QUESTION);
  return m ? m[1] : null;
}

export async function parseStackOverflow(url, fetchFn) {
  const id = parseSOId(url);
  if (!id) throw new Error('Invalid StackOverflow URL: ' + url);

  const qUrl = `https://api.stackexchange.com/2.3/questions/${id}?order=desc&sort=activity&site=stackoverflow&filter=withbody`;
  const aUrl = `https://api.stackexchange.com/2.3/questions/${id}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody`;

  const [qRaw, aRaw] = await Promise.all([fetchFn(qUrl), fetchFn(aUrl)]);
  let qData, aData;
  try { qData = JSON.parse(qRaw); } catch { throw new Error('Failed to parse SO question API'); }
  try { aData = JSON.parse(aRaw); } catch { aData = { items: [] }; }

  const q = qData.items?.[0];
  if (!q) throw new Error('StackOverflow question not found: ' + id);

  const meta = {
    title: q.title || '',
    author: q.owner?.display_name || '',
    date: q.creation_date ? new Date(q.creation_date * 1000).toISOString().split('T')[0] : '',
    url: q.link || url,
    siteName: 'StackOverflow',
    score: q.score ?? 0,
    tags: q.tags || [],
    isAnswered: q.is_answered ?? false,
    description: '',
  };

  const questionBody = htmlToMd(q.body || '');
  const answers = (aData.items || []).slice(0, 10);

  let answersMd = '';
  if (answers.length) {
    answersMd = '\n\n## Answers\n\n';
    for (const a of answers) {
      const accepted = a.is_accepted ? ' ✓' : '';
      const author = a.owner?.display_name || 'Anonymous';
      const score = a.score ?? 0;
      answersMd += `### ${author} (${score} votes${accepted})\n\n`;
      answersMd += htmlToMd(a.body || '') + '\n\n---\n\n';
    }
  }

  return { meta, body: questionBody.trim(), answers: answersMd.trim() };
}

function htmlToMd(html) {
  return (html || '')
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, l, t) => '#'.repeat(+l) + ' ' + t + '\n\n')
    .replace(/<p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, (_, c) => '\n```\n' + decodeEntities(c) + '\n```\n')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<blockquote>(.*?)<\/blockquote>/gis, (_, c) => c.trim().split('\n').map(l => '> ' + l).join('\n') + '\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?(?:ul|ol|div|span)[^>]*>/gi, '')
    .replace(/<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]+src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'");
}
