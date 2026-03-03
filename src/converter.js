const SKIP = new Set(['script','style','noscript','template','svg','math','iframe','object','embed']);

function collapse(s) { return s.replace(/[\s\n\r]+/g, ' '); }
function norm(s) { return s.replace(/\r\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/[ \t]+$/gm,'').trim(); }

function detectLang(el) {
  const all = [...(el.classList||[]), ...(el.parentElement?.classList||[])];
  for (const c of all) { const m = c.match(/^(?:language-|lang-|hljs-)(.+)$/); if (m) return m[1]; }
  return '';
}

export class HtmlToMarkdown {
  constructor(opts={}) {
    this.o = { bullet:'-', linkStyle:'inlined', images:true, links:true, baseUrl:'', ...opts };
    this._refs = []; this._ld = 0;
  }

  convert(root) {
    this._refs = []; this._ld = 0;
    let out = norm(this._node(root));
    if (this._refs.length) {
      out += '\n\n';
      this._refs.forEach((r,i) => { out += `[${i+1}]: ${r.href}${r.title ? ` "${r.title}"` : ''}\n`; });
    }
    return out;
  }

  _node(n) {
    if (n.nodeType === 3) { return this._inPre(n) ? (n.textContent||'') : collapse(n.textContent||''); }
    if (n.nodeType !== 1) return '';
    const t = (n.tagName||'').toLowerCase();
    if (!t || SKIP.has(t)) return '';
    const st = n.getAttribute?.('style')||'';
    if (/display\s*:\s*none/i.test(st) || /visibility\s*:\s*hidden/i.test(st)) return '';
    if (n.getAttribute?.('aria-hidden') === 'true') return '';

    switch(t) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const c = this._kids(n).trim(); return c ? `\n\n${'#'.repeat(+t[1])} ${c}\n\n` : '';
      }
      case 'p': { const c = this._kids(n).trim(); return c ? `\n\n${c}\n\n` : ''; }
      case 'br': return '  \n';
      case 'hr': return '\n\n---\n\n';
      case 'strong': case 'b': return this._wrap(n,'**');
      case 'em': case 'i': return this._wrap(n,'*');
      case 'del': case 's': case 'strike': return this._wrap(n,'~~');
      case 'code': {
        if (n.parentElement?.tagName?.toLowerCase()==='pre') return n.textContent||'';
        const tx = n.textContent||''; if (!tx) return '';
        let bt = '`'; while(tx.includes(bt)) bt += '`';
        const sp = tx.startsWith('`')||tx.endsWith('`');
        return sp ? `${bt} ${tx} ${bt}` : `${bt}${tx}${bt}`;
      }
      case 'pre': {
        const ce = n.querySelector?.('code')||n;
        const lang = detectLang(ce);
        let code = (ce.textContent||'').replace(/\n$/,'');
        let fence = '```'; while(code.includes(fence)) fence+='`';
        return `\n\n${fence}${lang}\n${code}\n${fence}\n\n`;
      }
      case 'a': {
        if (!this.o.links) return this._kids(n).trim();
        const href = n.getAttribute?.('href')||'';
        const title = n.getAttribute?.('title')||'';
        const c = this._kids(n).trim();
        if (!c && !href) return '';
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return c;
        const fh = this._url(href);
        if (this.o.linkStyle==='referenced') {
          const i=this._refs.length+1; this._refs.push({href:fh,title});
          return `[${c||fh}][${i}]`;
        }
        return `[${c||fh}](${fh}${title?` "${title}"`:''})`;
      }
      case 'img': {
        if (!this.o.images) return '';
        const src=n.getAttribute?.('src')||'', alt=n.getAttribute?.('alt')||'';
        return src ? `![${alt}](${this._url(src)})` : '';
      }
      case 'ul': return this._list(n,false);
      case 'ol': return this._list(n,true);
      case 'li': return this._liContent(n);
      case 'blockquote': {
        const c=this._kids(n).trim();
        return c ? '\n\n'+c.split('\n').map(l=>'> '+l).join('\n')+'\n\n' : '';
      }
      case 'table': return this._table(n);
      case 'details': {
        const sum = n.querySelector?.('summary');
        const st = sum ? this._kids(sum).trim() : 'Details';
        const parts=[]; for(const c of (n.childNodes||[])) if(c!==sum) parts.push(this._node(c));
        return `\n\n<details>\n<summary>${st}</summary>\n\n${parts.join('').trim()}\n\n</details>\n\n`;
      }
      case 'figure': {
        const img=n.querySelector?.('img'), cap=n.querySelector?.('figcaption');
        let r=''; if(img) r+=this._node(img); if(cap){const t=this._kids(cap).trim(); if(t) r+=`\n*${t}*`;}
        return r ? `\n\n${r}\n\n` : '';
      }
      case 'mark': return `==${this._kids(n).trim()}==`;
      case 'sup': return `^${this._kids(n).trim()}^`;
      case 'sub': return `~${this._kids(n).trim()}~`;
      case 'input': return n.getAttribute?.('type')==='checkbox' ? (n.hasAttribute?.('checked')?'[x] ':'[ ] ') : '';
      default: return this._kids(n);
    }
  }

  _wrap(n,d) { const c=this._kids(n).trim(); return c ? `${d}${c}${d}` : ''; }

  _list(n, ord) {
    this._ld++;
    const items=[]; let idx=parseInt(n.getAttribute?.('start')||'1',10);
    for(const ch of (n.children||[])) {
      if((ch.tagName||'').toLowerCase()==='li') {
        const c=this._node(ch); if(c.trim()) {
          const pfx = ord ? `${idx}. ` : `${this.o.bullet} `;
          const ind = '   ';
          const lines = c.trim().split('\n');
          items.push(lines.map((l,j)=>j===0?pfx+l:ind+l).join('\n'));
          idx++;
        }
      }
    }
    this._ld--;
    const r=items.join('\n');
    return this._ld===0 ? `\n\n${r}\n\n` : `\n${r}`;
  }

  _liContent(n) { const p=[]; for(const c of(n.childNodes||[])) p.push(this._node(c)); return p.join('').trim(); }

  _table(n) {
    const hRows=[], bRows=[];
    const thead=n.querySelector?.('thead'), tbody=n.querySelector?.('tbody');
    if(thead) for(const tr of (thead.querySelectorAll?.('tr')||[])) hRows.push(this._trow(tr));
    const bs=tbody||n;
    for(const tr of (bs.querySelectorAll?.('tr')||[])) {
      if(!thead || tr.parentElement?.tagName?.toLowerCase()!=='thead') bRows.push(this._trow(tr));
    }
    if(!hRows.length && bRows.length) hRows.push(bRows.shift());
    if(!hRows.length && !bRows.length) return '';
    const cc=Math.max(...hRows.map(r=>r.length),...bRows.map(r=>r.length),0);
    if(!cc) return '';
    const pad=r=>{while(r.length<cc)r.push('');return r;};
    const lines=[];
    lines.push('| '+pad(hRows[0]||Array(cc).fill('')).join(' | ')+' |');
    lines.push('| '+Array(cc).fill('---').join(' | ')+' |');
    for(const r of bRows) lines.push('| '+pad(r).join(' | ')+' |');
    return '\n\n'+lines.join('\n')+'\n\n';
  }

  _trow(tr) { const c=[]; for(const td of (tr.querySelectorAll?.('th,td')||[])) c.push(this._kids(td).trim().replace(/\n/g,' ')); return c; }
  _kids(n) { let r=''; for(const c of (n.childNodes||[])) r+=this._node(c); return r; }
  _inPre(n) { let c=n.parentElement; while(c){if((c.tagName||'').toLowerCase()==='pre')return true;c=c.parentElement;} return false; }
  _url(u) { if(!u||u.startsWith('http')||u.startsWith('data:'))return u; if(this.o.baseUrl){try{return new URL(u,this.o.baseUrl).href}catch{}} return u; }
}
