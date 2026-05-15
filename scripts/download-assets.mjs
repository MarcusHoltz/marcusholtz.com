import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
const GOOGLE_FONTS_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function downloadBinary(url, dest) {
  console.log(`  + ${dest.replace(PUBLIC, 'public')}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

// Build-time SSRF guard: only fetch images from known-good GitHub domains.
const ALLOWED_IMAGE_HOSTS = new Set([
  'raw.githubusercontent.com',
  'user-images.githubusercontent.com',
  'camo.githubusercontent.com',
  'github.com',
  'cdn.jsdelivr.net',
]);

function isAllowedImageUrl(url) {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

// Maps a local /public icon path to its jsdelivr CDN source URL.
// Returns null for paths not covered by a known CDN mapping (caller logs a warning and skips).
function cdnUrlFor(localPath) {
  const file = localPath.replace(/^\/images\/icons\/[^/]+\//, '');
  if (localPath.startsWith('/images/icons/materialdesign/'))
    return `https://cdn.jsdelivr.net/gh/Templarian/MaterialDesign/svg/${file}`;
  if (localPath.startsWith('/images/icons/dashboard-icons/'))
    return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${file}`;
  return null;
}

// Downloads a set of Iconify identifiers (e.g. "devicon:react") that are missing from disk.
// Identifiers are resolved to SVGs via the Iconify API. Existing files are never overwritten.
async function downloadIconifyIdentifiers(identifiers, label) {
  const missing = [...identifiers].filter((id) => {
    const [prefix, name] = id.split(':');
    return !existsSync(join(PUBLIC, 'images', 'icons', prefix, `${name}.svg`));
  });
  if (missing.length === 0) return;

  console.log(`Downloading ${missing.length} missing ${label} icon(s) from Iconify...`);
  const results = await Promise.allSettled(
    missing.map((id) => {
      const [prefix, name] = id.split(':');
      const dest = join(PUBLIC, 'images', 'icons', prefix, `${name}.svg`);
      return downloadBinary(`https://api.iconify.design/${prefix}/${name}.svg`, dest);
    })
  );
  for (const r of results) if (r.status === 'rejected') console.warn(`  ! ${r.reason.message}`);
}

// Downloads skill icons defined as Iconify identifiers (e.g. "simple-icons:figma").
// Local paths (starting with "/") are user-managed and skipped.
async function ensureSkillIcons() {
  const skillsPath = join(ROOT, 'src', 'data', 'skills.json');
  if (!existsSync(skillsPath)) return;

  const text = readFileSync(skillsPath, 'utf8');
  const identifiers = new Set();
  for (const [, v] of text.matchAll(/"icon":\s*"([^"]+)"/g))
    if (v.includes(':')) identifiers.add(v);

  await downloadIconifyIdentifiers(identifiers, 'skill');
}

// Downloads project colorIcons. Supports both Iconify identifiers (e.g. "devicon:react")
// and legacy local paths (e.g. "/images/icons/materialdesign/github.svg") in the same field.
async function ensureProjectColorIcons() {
  const projectsPath = join(ROOT, 'src', 'data', 'projects.json');
  if (!existsSync(projectsPath)) return;

  const text = readFileSync(projectsPath, 'utf8');
  const identifiers = new Set();
  const localPaths = new Set();

  for (const [, v] of text.matchAll(/"colorIcon":\s*"([^"]+)"/g)) {
    if (v.includes(':')) identifiers.add(v);
    else if (v.startsWith('/')) localPaths.add(v);
  }

  await downloadIconifyIdentifiers(identifiers, 'project color');

  const missingLocal = [...localPaths].filter((p) => !existsSync(join(PUBLIC, p)));
  if (missingLocal.length === 0) return;

  console.log(`Downloading ${missingLocal.length} missing project icon(s)...`);
  const results = await Promise.allSettled(
    missingLocal.map((p) => {
      const url = cdnUrlFor(p);
      if (!url) {
        console.warn(`  ! no CDN mapping for ${p} — skipping`);
        return Promise.resolve();
      }
      return downloadBinary(url, join(PUBLIC, p));
    })
  );
  for (const r of results) if (r.status === 'rejected') console.warn(`  ! ${r.reason.message}`);
}

// When Google Fonts cannot be reached and no local CSS exists, write a bare @import fallback
// so the site still loads fonts from CDN rather than rendering with the system default.
function writeCdnFallback(cssPath) {
  console.warn('  ! Writing Google Fonts CDN @import fallback to public/fonts/inter.css');
  mkdirSync(dirname(cssPath), { recursive: true });
  writeFileSync(
    cssPath,
    '/* Local font caching failed — using Google Fonts CDN as fallback */\n' +
      `@import url('${GOOGLE_FONTS_URL}');\n`
  );
}

async function ensureFonts() {
  const cssPath = join(PUBLIC, 'fonts', 'inter.css');
  const interDir = join(PUBLIC, 'fonts', 'inter');

  let localFontFiles = [];
  let isCdnFallback = false;
  if (existsSync(cssPath)) {
    const css = readFileSync(cssPath, 'utf8');
    localFontFiles = [
      ...new Set([...css.matchAll(/url\(inter\/([^)]+\.woff2)\)/g)].map((m) => m[1])),
    ];
    isCdnFallback = localFontFiles.length === 0;
  }

  const missingFonts = localFontFiles.filter((f) => !existsSync(join(interDir, f)));

  if (!isCdnFallback && existsSync(cssPath) && missingFonts.length === 0) return;

  let googleCss;
  try {
    console.log('Fetching Inter font from Google Fonts...');
    googleCss = await fetchText(GOOGLE_FONTS_URL, { 'User-Agent': GOOGLE_FONTS_UA });
  } catch (err) {
    console.warn(`  ! Google Fonts unreachable: ${err.message}`);
    if (!existsSync(cssPath)) writeCdnFallback(cssPath);
    return;
  }

  const fontMap = new Map();
  for (const [, url] of googleCss.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/g))
    fontMap.set(url.split('/').pop(), url);

  if (!existsSync(cssPath) || isCdnFallback) {
    console.log('Writing public/fonts/inter.css...');
    const local = googleCss.replace(
      /https:\/\/fonts\.gstatic\.com\/s\/inter\/v\d+\//g,
      'inter/'
    );
    mkdirSync(dirname(cssPath), { recursive: true });
    writeFileSync(cssPath, local);
    localFontFiles = [
      ...new Set([...local.matchAll(/url\(inter\/([^)]+\.woff2)\)/g)].map((m) => m[1])),
    ];
  }

  const toDownload = localFontFiles.filter((f) => !existsSync(join(interDir, f)));
  if (toDownload.length > 0) {
    console.log(`Downloading ${toDownload.length} missing font file(s)...`);
    mkdirSync(interDir, { recursive: true });
    await Promise.allSettled(
      toDownload.map((f) => {
        const url = fontMap.get(f);
        if (!url) {
          console.warn(`  ! no gstatic URL for ${f}`);
          return Promise.resolve();
        }
        return downloadBinary(url, join(interDir, f));
      })
    );
  }

  const stillMissing = localFontFiles.filter((f) => !existsSync(join(interDir, f)));
  if (stillMissing.length > 0) {
    console.warn(`  ! ${stillMissing.length} font file(s) could not be downloaded`);
    writeCdnFallback(cssPath);
  }
}

// ── GitHub project images ─────────────────────────────────────────────────────
// Reads projects.json, finds entries with a githubRepo field whose local
// featuredImage / backgroundImage files are missing, fetches the first
// non-badge image from each repo's README, and saves it to the exact path
// named in projects.json so the static site can serve it locally.

const BADGE_DOMAINS = new Set([
  'shields.io',
  'img.shields.io',
  'badgen.net',
  'badge.fury.io',
  'travis-ci.org',
  'travis-ci.com',
  'app.travis-ci.com',
  'circleci.com',
  'dl.circleci.com',
  'codecov.io',
  'coveralls.io',
  'api.codeclimate.com',
  'codebeat.co',
  'app.codacy.com',
  'bettercodehub.com',
  'sonarcloud.io',
  'snyk.io',
  'app.fossa.com',
  'david-dm.org',
  'wakatime.com',
  'forthebadge.com',
  'isitmaintained.com',
  'visitor-badge.glitch.me',
  'hits.seeyoufarm.com',
  'komarev.com',
  'img.buymeacoffee.com',
  'cdn.buymeacoffee.com',
]);

function isBadgeUrl(url) {
  const urlBase = url.split('?')[0];
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {}
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

function extractImageFromReadme(markdown, repoName, branch, githubUser) {
  const imageRegex = /!\[.*?\]\(([^)]+)\)/g;
  let match;
  while ((match = imageRegex.exec(markdown)) !== null) {
    let url = match[1].trim().split(/\s+/)[0];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (isBadgeUrl(url)) continue;
      url = url
        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
        .replace(/\/blob\//, '/');
      return url;
    }
    const relative = url.startsWith('/') ? url.slice(1) : url;
    const resolved = `https://raw.githubusercontent.com/${githubUser}/${repoName}/${branch}/${relative}`;
    if (isBadgeUrl(resolved)) continue;
    return resolved;
  }
  return null;
}

async function ensureProjectImages() {
  const githubUser = process.env.GITHUB_USER;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubUser) return;

  const dataDir = join(ROOT, 'src', 'data');
  const projectsPath = join(dataDir, 'projects.json');
  if (!existsSync(projectsPath)) return;

  const projectsJson = JSON.parse(readFileSync(projectsPath, 'utf8'));
  const projects = Array.isArray(projectsJson) ? projectsJson : (projectsJson.items ?? []);
  const githubProjects = projects.filter((p) => p.githubRepo);
  if (githubProjects.length === 0) return;

  const cachePath = join(dataDir, 'github-image-cache.json');
  let cache = {};
  try {
    cache = JSON.parse(readFileSync(cachePath, 'utf8'));
  } catch {}

  const authHeaders = {
    'User-Agent': 'astro-portfolio-build',
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
  };

  let repos = [];
  try {
    const res = await fetch(
      `https://api.github.com/users/${githubUser}/repos?per_page=100&sort=updated`,
      { headers: authHeaders }
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    repos = await res.json();
  } catch (err) {
    console.warn(`  ! GitHub API failed (${err.message}) — skipping project image download`);
    return;
  }

  const repoMap = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
  const updatedCache = { ...cache };
  let downloaded = 0;

  for (const project of githubProjects) {
    const repoName = project.githubRepo;
    const repoInfo = repoMap.get(repoName.toLowerCase());
    if (!repoInfo) continue;

    // Unique local /images/projects/ paths for this project that are missing from disk
    const localPaths = [
      ...new Set([project.featuredImage, project.backgroundImage].filter(Boolean)),
    ].filter((p) => p.startsWith('/images/projects/') && !existsSync(join(PUBLIC, p)));

    if (localPaths.length === 0) continue;

    const repoUpdatedAt = repoInfo.updated_at;
    const cached = cache[repoName];
    const cacheHit = cached && cached.repoUpdatedAt === repoUpdatedAt;

    // Reuse the cached remote URL when the repo hasn't changed; otherwise fetch README
    let imageUrl = cacheHit ? cached.image : null;

    if (!imageUrl) {
      try {
        const res = await fetch(`https://api.github.com/repos/${githubUser}/${repoName}/readme`, {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.encoding === 'base64') {
            const md = Buffer.from(data.content, 'base64').toString('utf-8');
            imageUrl = extractImageFromReadme(md, repoName, repoInfo.default_branch, githubUser);
          }
        }
      } catch {}
    }

    if (imageUrl && localPaths.length === 0) {
      const ext = imageUrl.split('?')[0].split('.').pop().toLowerCase() || 'jpg';
      const derived = `/images/projects/${repoName}.${ext}`;
      if (!existsSync(join(PUBLIC, derived))) localPaths.push(derived);
    }

    updatedCache[repoName] = {
      image: imageUrl ?? null,
      localPath: localPaths[0] ?? null,
      repoUpdatedAt,
      fetchedAt: new Date().toISOString(),
    };

    if (!imageUrl) {
      console.warn(`  ! ${repoName}: no image found in README`);
      continue;
    }

    // Download the image once, write it to every missing local path
    let imgData = null;
    for (const localPath of localPaths) {
      const destFile = join(PUBLIC, localPath);
      mkdirSync(dirname(destFile), { recursive: true });
      try {
        if (!imgData) {
          if (!isAllowedImageUrl(imageUrl))
            throw new Error(`blocked: host not in allowlist (${new URL(imageUrl).hostname})`);
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
          imgData = Buffer.from(await imgRes.arrayBuffer());
        }
        writeFileSync(destFile, imgData);
        console.log(`  + public${localPath}`);
        downloaded++;
      } catch (err) {
        console.warn(`  ! ${repoName} → ${localPath}: ${err.message}`);
      }
    }
  }


  try {
    writeFileSync(cachePath, JSON.stringify(updatedCache, null, 2) + '\n');
  } catch {}

  if (downloaded > 0) console.log(`Downloaded ${downloaded} project image(s) from GitHub.`);
}

async function main() {
  await ensureFonts();
  await ensureProjectImages();
  await ensureSkillIcons();
  await ensureProjectColorIcons();
  console.log('Assets ready.');
}

main().catch((err) => {
  console.error('download-assets:', err.message);
  process.exit(1);
});
