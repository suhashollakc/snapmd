#!/usr/bin/env node
import { clip, clipHtml } from '../src/index.js';
import { writeFileSync } from 'node:fs';

const C={r:'\x1b[0m',b:'\x1b[1m',d:'\x1b[2m',g:'\x1b[32m',c:'\x1b[36m',y:'\x1b[33m',e:'\x1b[31m',gr:'\x1b[90m'};
const tty=process.stdout.isTTY;
const co=(c,t)=>tty?c+t+C.r:t;

const args=process.argv.slice(2); const flags={}; const pos=[];
for(let i=0;i<args.length;i++){const a=args[i];
  if(a==='--help'||a==='-h')flags.help=true;
  else if(a==='--version'||a==='-v')flags.version=true;
  else if(a==='--no-frontmatter'||a==='-F')flags.noFm=true;
  else if(a==='--full'||a==='-f')flags.full=true;
  else if(a==='--no-images')flags.noImg=true;
  else if(a==='--no-links')flags.noLinks=true;
  else if(a==='--referenced'||a==='-r')flags.ref=true;
  else if(a==='--json'||a==='-j')flags.json=true;
  else if(a==='--stdin')flags.stdin=true;
  else if(a==='--quiet'||a==='-q')flags.quiet=true;
  else if((a==='-o'||a==='--output')&&i+1<args.length)flags.output=args[++i];
  else if(a==='--base-url'&&i+1<args.length)flags.baseUrl=args[++i];
  else if(!a.startsWith('-'))pos.push(a);
  else{process.stderr.write('\n  '+co(C.e,'Error')+': Unknown flag: '+a+'\n\n');process.exit(1);}
}

if(flags.version){console.log('snapmd v1.0.0');process.exit(0);}

if(flags.help||(!flags.stdin&&pos.length===0)){
  console.log(`
  ${co(C.b+C.c,'snapmd')} ${co(C.d,'-- clip any webpage as clean, LLM-ready Markdown')}

  ${co(C.b,'USAGE')}
    ${co(C.c,'snapmd')} <url>                          Clip URL to stdout
    ${co(C.c,'snapmd')} <url> ${co(C.y,'-o')} article.md            Save to file
    ${co(C.c,'snapmd')} <url> ${co(C.y,'--json')}                    Output as JSON
    cat page.html | ${co(C.c,'snapmd')} ${co(C.y,'--stdin')}        Read HTML from stdin

  ${co(C.b,'OPTIONS')}
    ${co(C.y,'-o, --output')} <file>     Save output to file
    ${co(C.y,'-f, --full')}              Clip full page (skip readability)
    ${co(C.y,'-F, --no-frontmatter')}    Skip YAML frontmatter
    ${co(C.y,'-r, --referenced')}        Use reference-style links
    ${co(C.y,'-j, --json')}              Output as JSON
    ${co(C.y,'--no-images')}             Exclude images
    ${co(C.y,'--no-links')}              Exclude hyperlinks
    ${co(C.y,'--stdin')}                 Read HTML from stdin
    ${co(C.y,'--base-url')} <url>        Base URL for relative links (--stdin)
    ${co(C.y,'-q, --quiet')}             Suppress status messages
    ${co(C.y,'-v, --version')}           Print version
    ${co(C.y,'-h, --help')}              Show this help

  ${co(C.b,'SOURCES')}
    ${co(C.g,'*')} Any webpage    ${co(C.g,'*')} YouTube transcripts
    ${co(C.d,'o')} GitHub READMEs (soon)  ${co(C.d,'o')} Twitter/X (soon)  ${co(C.d,'o')} PDFs (soon)

  ${co(C.b,'EXAMPLES')}
    ${co(C.gr,'# Clip a blog post')}
    snapmd https://example.com/blog/post

    ${co(C.gr,'# Save to file')}
    snapmd https://en.wikipedia.org/wiki/Markdown -o md.md

    ${co(C.gr,'# Pipe to an LLM')}
    snapmd https://example.com | llm "summarize this"

  ${co(C.d,'https://github.com/suhashollakc/snapmd')}
`);
  process.exit(flags.help?0:1);
}

async function main(){
  const t0=Date.now();
  try{
    let result;
    const opts={frontmatter:!flags.noFm,fullPage:!!flags.full,includeImages:!flags.noImg,includeLinks:!flags.noLinks,linkStyle:flags.ref?'referenced':'inlined'};
    if(flags.stdin){
      const html=await new Promise(r=>{let d='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>{d+=c});process.stdin.on('end',()=>r(d));setTimeout(()=>r(d),5000);});
      if(!html.trim()){process.stderr.write('\n  '+co(C.e,'Error')+': No input from stdin\n\n');process.exit(1);}
      result=clipHtml(html,{...opts,baseUrl:flags.baseUrl||''});
    } else {
      const url=pos[0];
      try{new URL(url)}catch{process.stderr.write('\n  '+co(C.e,'Error')+': Invalid URL: '+url+'\n\n');process.exit(1);}
      if(!flags.quiet&&tty)process.stderr.write(co(C.d,'  Clipping '+url+'...\n'));
      result=await clip(url,opts);
    }
    const el=Date.now()-t0;
    if(flags.json){
      const out=JSON.stringify({markdown:result.markdown,meta:result.meta,stats:result.stats,elapsed_ms:el},null,2);
      if(flags.output){writeFileSync(flags.output,out);info('Saved JSON to '+flags.output,el,result.stats);}
      else process.stdout.write(out+'\n');
    } else if(flags.output){
      writeFileSync(flags.output,result.markdown);
      info('Saved to '+flags.output,el,result.stats);
    } else {
      process.stdout.write(result.markdown+'\n');
      if(tty&&!flags.quiet) process.stderr.write('\n'+co(C.d,'  '+co(C.g,'ok')+' '+result.stats.words+' words | '+result.stats.readingTime+' | '+el+'ms\n'));
    }
  }catch(e){process.stderr.write('\n  '+co(C.e,'Error')+': '+e.message+'\n\n');if(process.env.DEBUG)console.error(e.stack);process.exit(1);}
}
function info(m,ms,s){if(!flags.quiet)process.stderr.write('\n  '+co(C.g,'ok')+' '+m+'\n'+co(C.d,'  '+s.words+' words | '+s.readingTime+' | '+ms+'ms\n\n'));}

await main();
