const UNLIKELY = /combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|pagination|pager|popup|social|share|related|newsletter|cookie|consent|modal|overlay|banner/i;
const LIKELY = /article|body|content|entry|main|page|post|text|blog|story|hentry|prose/i;
const SELECTORS = ['article','[role="main"]','main','.post-content','.article-content','.article-body','.entry-content','.post-body','.markdown-body','.prose'];

export function extractContent(doc) {
  for (const s of SELECTORS) { try { const el=doc.querySelector(s); if(el&&tlen(el)>200) return el; } catch{} }
  return score(doc);
}

function score(doc) {
  const body = doc.body || doc.documentElement;
  if (!body) return null;
  const cands = new Map();
  for (const p of (body.querySelectorAll('p,pre,td,blockquote')||[])) {
    const par=p.parentElement, gp=par?.parentElement;
    if(!par) continue;
    const tl=tlen(p); if(tl<25) continue;
    if(!cands.has(par)) cands.set(par, {score:init(par),el:par});
    if(gp&&!cands.has(gp)) cands.set(gp, {score:init(gp),el:gp});
    let cs = 1 + Math.min(Math.floor(tl/100),3) + Math.min((p.textContent||'').split(',').length-1,3);
    cands.get(par).score += cs;
    if(gp&&cands.has(gp)) cands.get(gp).score += cs/2;
  }
  let best=null, bs=0;
  for (const [,c] of cands) { c.score *= (1-ld(c.el)); if(c.score>bs){bs=c.score;best=c.el;} }
  return (!best||tlen(best)<200) ? body : best;
}

function init(el) {
  let s=0; const t=(el.tagName||'').toLowerCase(), cn=el.className||'', id=el.id||'';
  if(t==='article')s+=15; else if(t==='main')s+=10; else if(t==='section'||t==='div')s+=5;
  if(LIKELY.test(cn)||LIKELY.test(id))s+=25;
  if(UNLIKELY.test(cn)||UNLIKELY.test(id))s-=25;
  return s;
}

function tlen(el) { return (el.textContent||'').trim().length; }
function ld(el) { const tl=tlen(el); if(!tl)return 1; let ll=0; for(const a of(el.querySelectorAll?.('a')||[]))ll+=tlen(a); return ll/tl; }

export function extractMetadata(doc, url) {
  const m = {title:'',description:'',author:'',date:'',siteName:'',url:url||'',language:'',image:''};
  m.title = gm(doc,'og:title')||gm(doc,'twitter:title')||doc.querySelector?.('title')?.textContent?.trim()||'';
  m.title = m.title.replace(/\s*[|\-\u2013\u2014]\s*[^|\-\u2013\u2014]+$/,'').trim();
  m.description = gm(doc,'og:description')||gm(doc,'description')||'';
  m.author = gm(doc,'author')||gm(doc,'article:author')||jld(doc,'author')||'';
  m.date = gm(doc,'article:published_time')||gm(doc,'date')||jld(doc,'datePublished')||'';
  m.siteName = gm(doc,'og:site_name')||'';
  m.language = doc.documentElement?.getAttribute?.('lang')||'';
  m.image = gm(doc,'og:image')||gm(doc,'twitter:image')||'';
  return m;
}

function gm(doc,name) {
  for(const a of ['property','name','itemprop']) {
    try{const el=doc.querySelector(`meta[${a}="${name}"]`); if(el){const c=el.getAttribute('content'); if(c)return c.trim();}}catch{}
  }
  return '';
}

function jld(doc,field) {
  try { for(const s of doc.querySelectorAll('script[type="application/ld+json"]')) { const d=JSON.parse(s.textContent); if(d[field]) return typeof d[field]==='object'&&d[field].name?d[field].name:String(d[field]); } } catch{}
  return '';
}
