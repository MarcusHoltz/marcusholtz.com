/**
 * Prepend import.meta.env.BASE_URL to a public-folder asset path.
 * Per Astro docs: "all of your static asset imports and URLs should add
 * the base as a prefix. You can access this value via import.meta.env.BASE_URL."
 * https://docs.astro.build/en/reference/configuration-reference/#base
 *
 * BASE_URL ends with a trailing slash (e.g. "/my-repo-name/"); paths from JSON start
 * with "/". Strip the leading slash before concatenating to avoid "//".
 * This mirrors the pattern already used in Layout.astro for favicons.
 *
 * Remote URLs and data URIs are returned unchanged.
 * When BASE_URL is "/" (root deployment) the path is returned unchanged.
 */
/* TEST FEATURE - Astro 6 doesn't guarantee that when BASE_PATH is set without a trailing slash. '/foo' + 'images/...' = '/fooimages/...'.
 * The fix: normalize BASE_URL to always end with / before concatenating.
 */
export function withBase(path: string): string {
  if (!path || /^(https?:\/\/|\/\/|data:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
/*
export function withBase(path: string): string {
  if (!path || /^(https?:\/\/|\/\/|data:)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return base + path.replace(/^\//, '');
}
*/
