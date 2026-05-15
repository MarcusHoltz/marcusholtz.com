import { mkdir, readFile, writeFile } from 'node:fs/promises';

const GITHUB_USER = process.env.GITHUB_USER ?? '';

interface CacheEntry {
  image: string | null;
  /** Relative public path where the image is stored locally, e.g. /images/projects/my-repo.png */
  localPath: string | null;
  repoUpdatedAt: string;
  fetchedAt: string;
}

type Cache = Record<string, CacheEntry>;

interface GitHubRepo {
  name: string;
  updated_at: string;
  default_branch: string;
}

interface GitHubReadme {
  content: string;
  encoding: string;
}

// Path resolved relative to this module file, not the CWD, so it works regardless of how the build is invoked.
const cachePath = new URL('../data/github-image-cache.json', import.meta.url);

async function loadCache(): Promise<Cache> {
  try {
    const raw = await readFile(cachePath, 'utf-8');
    return JSON.parse(raw) as Cache;
  } catch {
    return {};
  }
}

// Unauthenticated GitHub API requests are limited to 60/hr per IP.
// GITHUB_TOKEN raises that to 5 000/hr and avoids rate-limit failures in CI.
function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return token
    ? { Authorization: `Bearer ${token}`, 'User-Agent': 'astro-portfolio-build' }
    : { 'User-Agent': 'astro-portfolio-build' };
}

async function fetchAllRepos(): Promise<GitHubRepo[]> {
  const url = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GitHub repos API ${res.status}`);
  return res.json() as Promise<GitHubRepo[]>;
}

const BADGE_DOMAINS = new Set([
  // Hosted shield/badge services
  'shields.io',
  'img.shields.io',
  'badgen.net',
  'badge.fury.io',
  // CI/CD
  'travis-ci.org',
  'travis-ci.com',
  'app.travis-ci.com',
  'circleci.com',
  'dl.circleci.com',
  // Coverage
  'codecov.io',
  'coveralls.io',
  // Code quality / security
  'api.codeclimate.com',
  'codebeat.co',
  'app.codacy.com',
  'bettercodehub.com',
  'sonarcloud.io',
  'snyk.io',
  'app.fossa.com',
  // Dependency status
  'david-dm.org',
  // Activity / misc counters and buttons
  'wakatime.com',
  'forthebadge.com',
  'isitmaintained.com',
  'visitor-badge.glitch.me',
  'hits.seeyoufarm.com',
  'komarev.com',
  'img.buymeacoffee.com',
  'cdn.buymeacoffee.com',
]);

// CI badges (shields.io, GitHub Actions, etc.) are tiny SVGs — not useful as project preview images.
function isBadgeUrl(url: string): boolean {
  const urlBase = url.split('?')[0];
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = '';
  }
  return (
    BADGE_DOMAINS.has(hostname) ||
    urlBase.includes('badge.svg') ||
    urlBase.includes('/badge/') ||
    urlBase.includes('/badges/') ||
    url.includes('/actions/workflows/') ||
    url.includes('project_badges/') ||
    url.includes('/project/badge/') ||
    (url.includes('github.com/') && urlBase.endsWith('.svg')) ||
    (url.includes('raw.githubusercontent.com/') && urlBase.endsWith('.svg'))
  );
}

function extractImageFromReadme(markdown: string, repoName: string, branch: string): string | null {
  const imageRegex = /!\[.*?\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(markdown)) !== null) {
    let url = match[1].trim().split(/\s+/)[0];

    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (isBadgeUrl(url)) continue;
      // GitHub blob viewer URLs cannot be used as <img> src.
      // Rewrite to raw.githubusercontent.com so browsers can fetch the actual file bytes.
      url = url
        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
        .replace(/\/blob\//, '/');
      return url;
    }

    const relative = url.startsWith('/') ? url.slice(1) : url;
    const resolved = `https://raw.githubusercontent.com/${GITHUB_USER}/${repoName}/${branch}/${relative}`;
    if (isBadgeUrl(resolved)) continue;
    return resolved;
  }

  return null;
}

async function fetchReadmeImage(repoName: string, branch: string): Promise<string | null> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/readme`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return null;

    const data = (await res.json()) as GitHubReadme;
    if (data.encoding !== 'base64') return null;

    const markdown = Buffer.from(data.content, 'base64').toString('utf-8');
    return extractImageFromReadme(markdown, repoName, branch);
  } catch {
    return null;
  }
}

/** Stable public path for a project image derived from the repo name + URL extension. */
function localPathFor(repoName: string, imageUrl: string): string {
  const ext = imageUrl.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  return `/images/projects/${repoName}.${ext}`;
}

export interface ProjectEntry {
  title: string;
  company: string;
  category: string;
  description: string;
  tags: string[];
  icon: string;
  featuredImage?: string;
  sliderImage?: string;
  sliderOrder?: number;
  backgroundImage?: string;
  link: string;
  colorIcon?: string;
  githubRepo?: string;
}

// Singleton promise: Astro evaluates Hero.astro and Projects.astro in the same build pass.
// Both call augmentProjectsWithImages — memoizing here avoids duplicate GitHub API calls
// and a race condition where two parallel writes could corrupt the on-disk cache.
let _buildResult: Promise<ProjectEntry[]> | null = null;

export async function augmentProjectsWithImages(projects: ProjectEntry[]): Promise<ProjectEntry[]> {
  if (_buildResult) return _buildResult;
  _buildResult = _doAugment(projects);
  return _buildResult;
}

async function _doAugment(projects: ProjectEntry[]): Promise<ProjectEntry[]> {
  const githubProjects = projects.filter((p) => p.githubRepo);
  if (githubProjects.length === 0) return projects;
  if (!GITHUB_USER) return projects;

  let repos: GitHubRepo[] = [];
  let cache = await loadCache();
  const updatedCache: Cache = { ...cache };

  try {
    repos = await fetchAllRepos();
  } catch (err) {
    console.warn('[fetchGitHub] Could not fetch repo list:', (err as Error).message);
    return applyCache(projects, cache);
  }

  const repoMap = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

  for (const project of githubProjects) {
    const repoName = project.githubRepo!;
    const repoKey = repoName.toLowerCase();
    const repoInfo = repoMap.get(repoKey);

    if (!repoInfo) {
      continue;
    }

    const cached = cache[repoName];
    const repoUpdatedAt = repoInfo.updated_at;

    // GitHub's updated_at timestamp advances on every push.
    // If it matches the cached value the README has not changed, so skip the extra API call.
    if (cached && cached.repoUpdatedAt === repoUpdatedAt) {
      updatedCache[repoName] = cached;
      continue;
    }

    const image = await fetchReadmeImage(repoName, repoInfo.default_branch);
    // Prefer the path already declared in projects.json so the cache entry
    // matches where download-assets.mjs actually saves the file.
    const declaredPath = project.featuredImage ?? project.backgroundImage ?? null;
    updatedCache[repoName] = {
      image,
      localPath: declaredPath ?? (image ? localPathFor(repoName, image) : null),
      repoUpdatedAt,
      fetchedAt: new Date().toISOString(),
    };
  }

  try {
    await mkdir(new URL('.', cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(updatedCache, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.warn('[fetchGitHub] Could not write cache:', (err as Error).message);
  }

  return applyCache(projects, updatedCache);
}

function applyCache(projects: ProjectEntry[], cache: Cache): ProjectEntry[] {
  return projects.map((project) => {
    if (!project.githubRepo) return project;

    const entry = cache[project.githubRepo];
    if (!entry?.image) return project;

    // Prefer the locally downloaded copy; fall back to the remote URL if the
    // download step hasn't run yet (e.g. during a dev-server cold start).
    const imagePath = entry.localPath ?? entry.image;
    return {
      ...project,
      featuredImage: project.featuredImage ?? project.backgroundImage ?? imagePath,
      backgroundImage: project.backgroundImage ?? imagePath,
    };
  });
}
