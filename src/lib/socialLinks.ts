interface PersonalData {
  [key: string]: string | string[];
}

interface SocialConfig {
  label: string;
  urlTemplate: string;
  icon: string;
}

// {v} in urlTemplate is replaced with the raw handle value from personal.json at call time.
const SOCIAL_CONFIG: Record<string, SocialConfig> = {
  github: { label: 'GitHub', urlTemplate: 'https://github.com/{v}', icon: 'simple-icons:github' },
  linkedin: {
    label: 'LinkedIn',
    urlTemplate: 'https://linkedin.com/in/{v}',
    icon: 'simple-icons:linkedin',
  },
  gitlab: { label: 'GitLab', urlTemplate: 'https://gitlab.com/{v}', icon: 'simple-icons:gitlab' },
  twitter: { label: 'X (Twitter)', urlTemplate: 'https://x.com/{v}', icon: 'simple-icons:x' },
  instagram: {
    label: 'Instagram',
    urlTemplate: 'https://instagram.com/{v}',
    icon: 'simple-icons:instagram',
  },
  youtube: {
    label: 'YouTube',
    urlTemplate: 'https://youtube.com/@{v}',
    icon: 'simple-icons:youtube',
  },
  twitch: { label: 'Twitch', urlTemplate: 'https://twitch.tv/{v}', icon: 'simple-icons:twitch' },
  telegram: { label: 'Telegram', urlTemplate: 'https://t.me/{v}', icon: 'simple-icons:telegram' },
  signal: { label: 'Signal', urlTemplate: 'https://signal.me/#p/{v}', icon: 'simple-icons:signal' },
  blog: { label: 'Blog', urlTemplate: '{v}', icon: 'simple-icons:rss' },
  reddit: { label: 'Reddit', urlTemplate: 'https://reddit.com/u/{v}', icon: 'simple-icons:reddit' },
  hackernews: {
    label: 'Hacker News',
    urlTemplate: 'https://news.ycombinator.com/user?id={v}',
    icon: 'simple-icons:ycombinator',
  },
  lobsters: {
    label: 'Lobsters',
    urlTemplate: 'https://lobste.rs/u/{v}',
    icon: 'simple-icons:lobsters',
  },
  discogs: {
    label: 'Discogs',
    urlTemplate: 'https://www.discogs.com/user/{v}',
    icon: 'simple-icons:discogs',
  },
  codepen: {
    label: 'CodePen',
    urlTemplate: 'https://codepen.io/{v}',
    icon: 'simple-icons:codepen',
  },
  jsfiddle: {
    label: 'JSFiddle',
    urlTemplate: 'https://jsfiddle.net/{v}',
    icon: 'simple-icons:jsfiddle',
  },
  facebook: {
    label: 'Facebook',
    urlTemplate: 'https://facebook.com/{v}',
    icon: 'simple-icons:facebook',
  },
};

// Controls the render order when no filterKeys argument is given.
// Add new platform keys here to make them appear; order determines visual sequence.
const DISPLAY_ORDER = [
  'github',
  'linkedin',
  'gitlab',
  'twitter',
  'instagram',
  'youtube',
  'twitch',
  'telegram',
  'signal',
  'blog',
  'reddit',
  'hackernews',
  'lobsters',
  'discogs',
  'codepen',
  'jsfiddle',
  'facebook',
];

export interface SocialLink {
  key: string;
  label: string;
  url: string;
  icon: string;
}

// filterKeys lets callers request a subset in a specific order (e.g. heroSocialLinks in personal.json).
// When omitted, all configured platforms in DISPLAY_ORDER that have a value in personal.json are returned.
export function getSocialLinks(personal: PersonalData, filterKeys?: string[]): SocialLink[] {
  const order = filterKeys ?? DISPLAY_ORDER;
  return order
    .filter((key) => {
      const val = personal[key];
      return typeof val === 'string' && val.trim() !== '' && SOCIAL_CONFIG[key];
    })
    .map((key) => {
      const config = SOCIAL_CONFIG[key];
      const handle = personal[key] as string;
      return {
        key,
        label: config.label,
        url: config.urlTemplate.replace('{v}', handle),
        icon: config.icon,
      };
    });
}
