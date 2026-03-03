const YT = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
export function isYouTubeUrl(url) { return YT.test(url); }
export function extractYouTubeId(url) { const m=url.match(YT); return m?m[1]:null; }

export async function parseYouTube(url, fetchFn) {
  const id = extractYouTubeId(url);
  if (!id) throw new Error('Invalid YouTube URL: '+url);
  const pu = 'https://www.youtube.com/watch?v='+id;
  const html = await fetchFn(pu);
  const meta = xmeta(html, id, pu);
  const transcript = await xtranscript(html, fetchFn);
  return { meta, transcript };
}

function xmeta(h, vid, url) {
  const g = re => { const m=h.match(re); return m?de(m[1]):''; };
  const meta = { title:'', author:'', date:'', description:'', url, siteName:'YouTube', duration:'', thumbnail:'https://img.youtube.com/vi/'+vid+'/maxresdefault.jpg' };
  meta.title = g(/<meta\s+name="title"\s+content="([^"]*?)"/) || g(/<meta\s+property="og:title"\s+content="([^"]*?)"/);
  meta.author = g(/"ownerChannelName"\s*:\s*"([^"]*?)"/);
  meta.date = g(/<meta\s+itemprop="datePublished"\s+content="([^"]*?)"/);
  meta.description = g(/<meta\s+name="description"\s+content="([^"]*?)"/);
  const dur = h.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
  if(dur) { const s=+dur[1]; meta.duration=fmtD(s); }
  return meta;
}

async function xtranscript(h, fetchFn) {
  try {
    const m=h.match(/"captionTracks"\s*:\s*(\[.*?\])/s); if(!m)return null;
    const tracks=JSON.parse(m[1]); if(!tracks.length)return null;
    const t=tracks.find(t=>t.languageCode==='en')||tracks[0]; if(!t?.baseUrl)return null;
    const xml=await fetchFn(t.baseUrl); return pxml(xml);
  } catch { return null; }
}

function pxml(xml) {
  const segs=[], re=/<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>(.*?)<\/text>/gs;
  let m; while((m=re.exec(xml))!==null) { const t=de(m[3].replace(/<[^>]+>/g,'').trim()); if(t)segs.push({start:+m[1],duration:+m[2],text:t}); }
  return segs.length?segs:null;
}

function de(s) { return (s||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&#x27;|&apos;/g,"'"); }
function fmtD(s) { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`; }
function fmtT(s) { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60); return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`; }

export function formatTranscript(segs) { return segs?.length ? segs.map(s=>`[${fmtT(s.start)}] ${s.text}`).join('\n') : ''; }

export function formatTranscriptParagraphs(segs) {
  if(!segs?.length) return '';
  const p=[]; let c=[], ps=0;
  for(const s of segs) { if(!c.length)ps=s.start; c.push(s.text); if(s.start-ps>=30&&c.length>=2){p.push(`**[${fmtT(ps)}]** ${c.join(' ')}`);c=[];} }
  if(c.length) p.push(`**[${fmtT(ps)}]** ${c.join(' ')}`);
  return p.join('\n\n');
}
