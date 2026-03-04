#!/usr/bin/env node
import { clip, clipHtml } from '../src/index.js';

const TOOLS = [
  {
    name: 'clip_url',
    description: 'Clip a webpage URL and convert it to clean, structured Markdown. Supports any webpage, YouTube (with transcripts), GitHub repos, Reddit posts, Hacker News, and StackOverflow. Returns markdown with optional YAML frontmatter containing title, author, date, word count, and reading time.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to clip (webpage, YouTube, GitHub, Reddit, HN, StackOverflow)' },
        frontmatter: { type: 'boolean', description: 'Include YAML frontmatter with metadata (default: true)', default: true },
        selector: { type: 'string', description: 'CSS selector to target specific content on the page', default: '' },
        full_page: { type: 'boolean', description: 'Clip full page instead of using readability extraction', default: false },
        include_images: { type: 'boolean', description: 'Include images in output', default: true },
        include_links: { type: 'boolean', description: 'Include hyperlinks in output', default: true },
      },
      required: ['url'],
    },
  },
  {
    name: 'clip_html',
    description: 'Convert raw HTML string to clean Markdown. Useful when you already have HTML content and want to convert it.',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'Raw HTML string to convert' },
        base_url: { type: 'string', description: 'Base URL for resolving relative links', default: '' },
        frontmatter: { type: 'boolean', description: 'Include YAML frontmatter', default: false },
        selector: { type: 'string', description: 'CSS selector to target specific content', default: '' },
      },
      required: ['html'],
    },
  },
  {
    name: 'batch_clip',
    description: 'Clip multiple URLs at once and return all results. Useful for research, comparison, or bulk content extraction.',
    inputSchema: {
      type: 'object',
      properties: {
        urls: { type: 'array', items: { type: 'string' }, description: 'Array of URLs to clip' },
        frontmatter: { type: 'boolean', description: 'Include YAML frontmatter', default: true },
      },
      required: ['urls'],
    },
  },
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'clip_url': {
      const result = await clip(args.url, {
        frontmatter: args.frontmatter !== false,
        fullPage: args.full_page || false,
        includeImages: args.include_images !== false,
        includeLinks: args.include_links !== false,
        selector: args.selector || '',
      });
      return { content: [{ type: 'text', text: result.markdown }] };
    }
    case 'clip_html': {
      const result = clipHtml(args.html, {
        frontmatter: args.frontmatter || false,
        baseUrl: args.base_url || '',
        selector: args.selector || '',
      });
      return { content: [{ type: 'text', text: result.markdown }] };
    }
    case 'batch_clip': {
      const results = [];
      for (const url of (args.urls || [])) {
        try {
          const result = await clip(url, { frontmatter: args.frontmatter !== false });
          results.push({ url, markdown: result.markdown, meta: result.meta, stats: result.stats });
        } catch (e) {
          results.push({ url, error: e.message });
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// --- MCP JSON-RPC stdio transport ---

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  while (true) {
    const headerEnd = buf.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const header = buf.slice(0, headerEnd);
    const clMatch = header.match(/Content-Length:\s*(\d+)/i);
    if (!clMatch) { buf = buf.slice(headerEnd + 4); continue; }
    const len = parseInt(clMatch[1], 10);
    const bodyStart = headerEnd + 4;
    if (buf.length < bodyStart + len) break;
    const body = buf.slice(bodyStart, bodyStart + len);
    buf = buf.slice(bodyStart + len);
    try {
      const msg = JSON.parse(body);
      handleMessage(msg);
    } catch (e) {
      sendError(null, -32700, 'Parse error: ' + e.message);
    }
  }
});

function send(obj) {
  const body = JSON.stringify(obj);
  const msg = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
  process.stdout.write(msg);
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      sendResult(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'snapmd', version: '1.1.0' },
      });
      break;

    case 'notifications/initialized':
      break;

    case 'tools/list':
      sendResult(id, { tools: TOOLS });
      break;

    case 'tools/call': {
      const { name, arguments: args } = params || {};
      try {
        const result = await handleToolCall(name, args || {});
        sendResult(id, result);
      } catch (e) {
        sendResult(id, {
          content: [{ type: 'text', text: `Error: ${e.message}` }],
          isError: true,
        });
      }
      break;
    }

    default:
      if (id !== undefined) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
      break;
  }
}

process.stderr.write('snapmd MCP server started\n');
