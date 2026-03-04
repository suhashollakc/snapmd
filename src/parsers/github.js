const GH_REPO = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/;
const GH_README = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:blob|tree)\/([\w.-]+))?\/?(README(?:\.md)?)?$/i;

export function isGitHubUrl(url) {
  return /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i.test(url);
}

export function parseGitHubUrl(url) {
  const u = new URL(url);
  const parts = u.pathname.replace(/^\//, '').split('/');
  if (parts.length < 2) return null;
  const owner = parts[0], repo = parts[1];
  let branch = '', path = '';
  if (parts[2] === 'blob' || parts[2] === 'tree') {
    branch = parts[3] || '';
    path = parts.slice(4).join('/');
  } else if (parts.length > 2) {
    path = parts.slice(2).join('/');
  }
  return { owner, repo, branch, path };
}

export async function parseGitHub(url, fetchFn) {
  const info = parseGitHubUrl(url);
  if (!info) throw new Error('Invalid GitHub URL: ' + url);

  const { owner, repo, branch, path } = info;
  const isRepoRoot = !path || /^readme(\.md)?$/i.test(path);

  const repoMeta = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}`, fetchFn);
  const meta = {
    title: repoMeta.full_name || `${owner}/${repo}`,
    description: repoMeta.description || '',
    author: owner,
    date: repoMeta.created_at || '',
    url,
    siteName: 'GitHub',
    language: repoMeta.language || '',
    stars: repoMeta.stargazers_count ?? 0,
    forks: repoMeta.forks_count ?? 0,
    license: repoMeta.license?.spdx_id || '',
    topics: repoMeta.topics || [],
  };

  let markdown = '';

  if (isRepoRoot) {
    const ref = branch || repoMeta.default_branch || 'main';
    const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/README.md`;
    try {
      markdown = await fetchFn(readmeUrl);
    } catch {
      try {
        const readmeUrl2 = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/readme.md`;
        markdown = await fetchFn(readmeUrl2);
      } catch {
        markdown = `# ${meta.title}\n\n${meta.description || 'No README found.'}`;
      }
    }
  } else {
    const ref = branch || repoMeta.default_branch || 'main';
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
    markdown = await fetchFn(rawUrl);
  }

  return { meta, markdown: markdown.trim() };
}

async function fetchJSON(url, fetchFn) {
  const text = await fetchFn(url);
  try { return JSON.parse(text); } catch { return {}; }
}
