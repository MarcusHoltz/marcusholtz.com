# astro-portfolio-theme

Portfolio template built with Astro. All your content lives in simple JSON files. Edit them, run a build command, and your finished static site lands in `./output/` ready on github pages, gitlab pages, upload anywhere.

---
## Is This Theme For You?

| Feature                | Details                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| **Content management** | Everything configured via JSON files — no CMS, no code changes needed |
| **Project cards**      | Auto-fetches cover images from GitHub READMEs at build time           |
| **Contact form**       | Web3Forms — no backend, just one API key                              |
| **Printable Resume**   | The content in this site is printable as a resume with, ctrl + p      |
| **Hosting**            | 100% static output, deploys to any CDN or VPS for free                |
| **SEO & PWA**          | OG tags, web manifest, all favicon sizes, works offline               |
| **Accessibility**      | Keyboard nav, ARIA labels, skip link, reduced-motion support          |
| **Stack**              | Astro 6, Tailwind CSS 4, TypeScript, GitHub API + RSS                 |
| **Requirements**       | Docker + Docker Compose, or Node 24+ with pnpm 11                     |
| **npm? no worries!**   | Script blocking, age-gated releases (7-day hold), exotic rejection, downgrade detection, and lockfile integrity - an upgrade script included |

---

![Astro Portfolio Theme Official Sweater](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/header/header--astro--portfolio-theme-github-gitlab-pages.jpg "Generate Your Portfolio Now")

[Click to view a preview of the theme](#preview-of-theme)

---

## Quick Start


* * *

### With Docker:

```bash
# Build and output the site to ./output/
docker compose build && docker compose up
```


* * *

### Without Docker:

```bash
pnpm install
pnpm run dev      # dev server at http://localhost:4321
pnpm run build    # builds to ./dist/
```

Set environment variables in a `.env` file in the project root:

```env
SITE_URL=https://www.example.com
GITHUB_USER=your-github-username
GITHUB_TOKEN=ghp_xxxx
```

`.env` is in `.gitignore` — safe for local dev. The Docker secrets path (`secrets/github_token_password.txt`) is used when building with `docker compose`.


* * *

### Deploying to GitHub Pages (easist):

If you have a GitHub account, you can take this site live with the following directions...


* * *

#### 1. Get your own GitHub repository setup

Fork / Clone / Use this template


* * *

#### 2. Name your repository carefully — it controls your URL

The repository name you choose determines where GitHub serves your site, and you can't change it without redeploying.

| Repo name | What you get |
| --------- | ------------ |
| `your-username.github.io` | Site served at **`https://your-username.github.io/`** — clean root URL, no subdirectory |
| Anything else (e.g. `my-portfolio`) | Site served at **`https://your-username.github.io/my-portfolio/`** — the repo name becomes a subdirectory |

**The `.github.io` name is the special one.** GitHub reserves it as your personal Pages site and serves it from the root. Every other repo name becomes a path prefix.

If your site looks broken with missing styles or images after deploying, the most common cause is a mismatch here — the build expected `/` but GitHub is serving it from `/my-portfolio/`. The CI workflow auto-detects this, but double-check that `BASE_PATH` in your repo variables matches reality.

> **Tip:** If you only want one portfolio site and a clean URL, name the repo `your-username.github.io` from the start. You can always rename later, but you'll need to retrigger a deploy.

##### Custom Domains

If you want www.mywebsite.com - Register/Rent that domain, then add a `CNAME` record pointing `www` at `your-username.github.io`. For your top level domain (mywebsite.com), use an **ALIAS** or **A** record (`@`). 

In your repo go to **Settings → Pages → Custom domain**, enter your domain, and save — GitHub will handle the rest.

> **Note:** With a custom domain your site serves from `/`, so set `BASE_PATH` to `/` (or unset it) to avoid broken styles.

* * *

#### 3. Enable Pages in your repo settings

Go to **Settings → Pages → Build and deployment → Source** and switch it from "Deploy from a branch" to **GitHub Actions**. 

Wait for the page to refresh — GitHub's doing something, probably.


* * *

#### 4. Trigger your first deploy

Click **Actions** in the top nav (right under your repo name). In the left sidebar you'll see a workflow called **Deploy to GitHub Pages** — click it.

You'll notice nothing is happening. Look for the **Run workflow** button on the right side of the page, click it, then click the green **Run workflow** button that appears. Yes, there are two clicks.


* * *

#### 5. Watch it go

You'll be redirected to a new screen showing the workflow running in real time. When it finishes:

- **Green checkmark** — your site is live. 

- Click on the **Deploy** job in the workflow run

- **Red X** — you probably skipped step 1. Go back and flip that Pages source to **GitHub Actions**.

- If not, expand the **Complete job** accordion at the bottom of the log. Your URL will be waiting there:

```
Evaluated environment url: https://your-username.github.io/your-repo-name/
```

---

## You Don't Have to Use Every Section

This theme ships with every section enabled — but your site doesn't need all of them. If you don't have client work, skip the Portfolio section. No certifications yet? Remove that section. Running a one-person shop with no service sites to showcase? Cut Services entirely.

To remove a section, open `src/pages/index.astro` and delete the corresponding component from the `<Layout>`. That's it — no JSON to clean up, no broken references, no config flags.

```astro
<!-- Remove or comment out any section you don't need -->
<Layout>
  <Hero />
  <About />
  <Expertise />
  <!-- <Portfolio /> -->   <!-- removed: no client work yet -->
  <Projects />
  <!-- <Certifications /> --> <!-- removed: nothing to list -->
  <Services />
  <Contact />
</Layout>
```

Also remove the corresponding entry from `src/data/menu.json` so the nav link doesn't appear either. Fewer sections = less to fill in, and a tighter site.

---

## Data Files

All content lives in `src/data/`. Edit these JSON files to update any part of the site:

| File | Controls |
| ---- | -------- |
| `personal.json` | Name, bio, contact info, social links, hero role, photo |
| `site.json` | Site title, SEO description, Web3Forms key, nav links, services cards |
| `expertise.json` | Four focus-area cards in the Expertise section |
| `skills.json` | Tech & tool categories — each skill has a single `icon` field; icons are downloaded at build time and served locally |
| `portfolio.json` | Client work carousel (multi-slide projects) |
| `projects.json` | Personal project cards with optional GitHub image fetching |
| `certifications.json` | Credentials and training timeline |
| `menu.json` | Navigation section labels |


---

## Build Checks & Quality Gates

The pipeline runs four automated quality checks on every build. All four are enforced both locally (via pnpm scripts) and inside the Docker build as **dedicated stages** — if any stage fails, Docker halts and the container is never produced. The checks can't be bypassed; they're structural, not advisory.

---

### ESLint — Static Analysis

**Commands:** `pnpm run lint` · `pnpm run lint:fix`  
**Config:** `eslint.config.mjs`

Catches bugs and enforces consistent code patterns before they reach production. Uses ESLint 9's flat config format with `eslint-plugin-astro` for Astro-specific rules and TypeScript parser awareness inside `.astro` files.

| Rule | Level | Why |
| ---- | ----- | --- |
| `astro/no-set-html-directive` | warn | Flags `set:html` usage — valid but must be intentional to avoid XSS |
| `no-console` | warn | Prevents accidental `console.log` left in production code |
| `no-debugger` | error | Ensures `debugger` statements are never shipped |
| `prefer-const` | error | Enforces immutability by default |
| `no-unused-vars` | warn | Surfaces dead code; ignores `_`-prefixed args by convention |

**Docs:** [eslint.org/docs](https://eslint.org/docs/latest/) · [eslint-plugin-astro](https://ota-meshi.github.io/eslint-plugin-astro/)

---

### Astro Check — TypeScript Type Checking

**Command:** `pnpm run typecheck`  
**Config:** `tsconfig.json`

Catches type errors at compile time before they become runtime bugs. Runs `astro check`, which wraps the TypeScript compiler with full awareness of `.astro` component syntax, prop types, and slot types. Configured with `strict` mode and `strictNullChecks` to eliminate the entire class of `null`/`undefined` runtime errors.

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true
  }
}
```

`astro/tsconfigs/strict` enables `strict`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`, and more.

**Docs:** [docs.astro.build — TypeScript](https://docs.astro.build/en/guides/typescript/)

---

### Docker Multi-Stage Build — Enforced Quality Gates

**Config:** `Dockerfile`

The Dockerfile runs lint, format check, and type check as separate build stages before the final Astro build. Each stage must pass before the next runs.

| Stage | What it does |
| ----- | ------------ |
| `deps` | Installs dependencies via `pnpm install --frozen-lockfile` (frozen lockfile — no version drift) |
| `lint` | Runs `pnpm run lint` — must pass |
| `typecheck` | Runs `pnpm run typecheck` |
| `builder` | Runs `pnpm run build` — only reached if all above pass |
| `build-static` *(optional)* | Bakes `dist/` into the image at build time (activate with `--profile serve`) |
| `server` *(optional)* | Nginx Alpine image serving the baked static output (activate with `--profile serve`) |

**Docs:** [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/) · [pnpm install --frozen-lockfile](https://pnpm.io/cli/install#--frozen-lockfile)

---

### Running Checks Manually (Without a Full Build)

Nothing needs to be installed locally. Both checks run against pre-built Docker images — this is the fastest way to get lint or type errors in front of you without triggering the entire build pipeline.

**Step 1 — Build the check images** (first time only, or after source changes):

```bash
docker build --target lint       --progress=plain -t your-app-lint .
docker build --target typecheck  --progress=plain -t your-app-typecheck .
```

> If the source hasn't changed since the last build, Docker uses cached layers and produces no output. That's expected — it means nothing needs to be rebuilt.

**Step 2 — Run the checks:**

```bash
# ESLint — catches code issues and style violations
docker run --rm your-app-lint pnpm run lint

# TypeScript — catches type errors across all .astro and .ts files
docker run --rm your-app-typecheck pnpm run typecheck
```

Each `docker run` command always executes fresh against the built image, regardless of cache. If a check fails, the output tells you exactly which file and line to fix.

> **Tip:** Run lint first — it's faster and catches the most common issues. If lint passes but typecheck fails, the problem is a type mismatch rather than a style or syntax issue.

---

## Step 1 — Configure the Build

Open `docker-compose.yml`. It looks like this:

```yaml
secrets:
  github_token_password:
    file: ./secrets/github_token_password.txt

services:
  astro-portfolio-theme:
    build: .
    container_name: astro-portfolio-theme
    volumes:
      - ./output:/app/dist:z
    environment:
      - SITE_URL=https://www.example.com
      - BASE_PATH=/
      - GITHUB_USER=your-github-username
    secrets:
      - github_token_password
```

Change these values before running anything:

| Variable      | What to set                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| `SITE_URL`    | Your full domain, e.g. `https://yourname.com` — used for `og:url` and canonical links |
| `BASE_PATH`   | `/` unless your site lives in a subdirectory (e.g. `/portfolio/`)                     |
| `GITHUB_USER` | Your GitHub username — enables project image fetching at build time                   |

The GitHub token is handled as a Docker secret so it never appears in `docker inspect`, logs, or your shell history. See [GitHub Integration](#github-integration) below for setup.

---

## Step 2 — Fill In Your Data

All content lives in `src/data/`. Open each file and replace the placeholder values.

---

### `src/data/personal.json` — Your identity

This drives your name, bio, contact info, and every social link across the entire site.

```json
{
  "name": "Your Name Here",
  "title": "Creative Professional",
  "photo": "/images/personal/portrait.png",
  "email": "hello@yourdomain.com",
  "phone": "(000) 000-0000",
  "phoneTel": "+10000000000",
  "location": "City, State",
  "linkedin": "your-linkedin-handle",
  "github": "your-github-handle",
  "instagram": "",
  "twitter": "",
  "blog": "https://yourblog.com",
  "education": "Your Degree, Your University",
  "yearsExperience": "5+",
  "volunteer": "Role, Organization · Year–Year",
  "heroSocialLinks": ["github", "linkedin"],
  "bio": "Short tagline that appears under your name on the hero.",
  "aboutLong": "Full biography shown in the About section."
}
```

- Social fields left empty (`""`) are automatically hidden — no broken links
- `heroSocialLinks` controls which icons appear on the hero. Options: `github`, `linkedin`, `gitlab`, `twitter`, `instagram`, `youtube`, `twitch`, `telegram`, `signal`, `blog`, `reddit`, `hackernews`, `lobsters`, `discogs`, `codepen`, `jsfiddle`, `facebook`
- `photo` is a path relative to `public/` — drop your image at `public/images/personal/portrait.png`
- **Don't want a portrait?** Just delete `public/images/personal/portrait.png` (or don't add one). The build detects whether the file exists and silently skips the portrait element — no broken image, no layout shift, no code changes needed. You can also point `photo` at an external URL (e.g. a GitHub avatar) and it will be used directly without a local file check.

---

### `src/data/site.json` — Global site settings

Controls your site title, SEO, the header links strip, and the Services section cards.

```json
{
  "title": "Your Name | Creative Portfolio",
  "description": "Portfolio of a designer and developer...",
  "tagline": "Designing experiences · Building products · Telling stories",
  "web3formsKey": "YOUR_WEB3FORMS_KEY_HERE",
  "retroTvCount": 21,
  "seoKeywords": ["Creative Portfolio", "Web Designer", "UI/UX Design", "..."],
  "navExternal": [
    {
      "label": "Blog",
      "desc": "Writing on design and process",
      "personalKey": "blog",
      "urlTemplate": "{value}"
    },
    {
      "label": "GitHub",
      "desc": "Open-source work",
      "personalKey": "github",
      "urlTemplate": "https://github.com/{value}"
    },
    {
      "label": "LinkedIn",
      "desc": "Professional profile",
      "personalKey": "linkedin",
      "urlTemplate": "https://linkedin.com/in/{value}"
    },
    {
      "label": "Email",
      "desc": "Project inquiries",
      "personalKey": "email",
      "urlTemplate": "mailto:{value}"
    },
    {
      "label": "Phone",
      "desc": "Available by appointment",
      "personalKey": "phone",
      "urlTemplate": "tel:{value}"
    }
  ]
}
```

- `web3formsKey` — get this free at [web3forms.com](https://web3forms.com). Without it the contact form won't submit.
- `navExternal` entries use values from `personal.json` via `personalKey`. If the matching field is empty, the link is hidden automatically.
- `retroTvCount` — number of retro CRT frames drifting in the hero background. `21` is the default sweet spot.

#### Services Cards

The `serviceSites` array in `site.json` controls the two showcase cards in the Services section — useful for a studio site, a side project, or two separate business entities:

```json
"serviceSites": [
  {
    "badge": "Client Work",
    "badgeColor": "#6366f1",
    "name": "YourStudio.co",
    "url": "https://yourstudio.co",
    "description": "Full-service creative from concept through delivery.",
    "features": ["Brand Identity", "Web Design & Development", "Campaign Creative"],
    "ctaText": "View Studio Work"
  },
  {
    "badge": "Side Project",
    "badgeColor": "#10b981",
    "name": "YourProject.io",
    "url": "https://yourproject.io",
    "description": "A personal project built to scratch an itch.",
    "features": ["Self-Hosted", "Iterating in Public", "Built for Me"],
    "ctaText": "Check It Out"
  }
]
```

---

### `src/data/expertise.json` — What you do

Four cards displayed in the Expertise section. Each card gets an icon, a heading, and a short description.

```json
{
  "items": [
    {
      "key": "sysadmin",
      "icon": "server-stack",
      "title": "Design & Art Direction",
      "description": "Visual identity, layout, typography, and the aesthetic decisions that make people stop and look twice."
    },
    {
      "key": "webdev",
      "icon": "code-bracket-square",
      "title": "Web Design & Development",
      "description": "From wireframe to deployment — building sites and apps that look considered, perform well, and give visitors exactly what they came for."
    },
    {
      "key": "freelance",
      "icon": "user-circle",
      "title": "Creative Freelance",
      "description": "Independent project work in photography, video, 3D, illustration, or wherever the brief leads."
    },
    {
      "key": "leadership",
      "icon": "users",
      "title": "Collaboration & Direction",
      "description": "Working alongside teams, clients, and stakeholders to take a project from idea to shipped."
    }
  ]
}
```

**Item fields:**

- `key` — an identifier string for the card (not used for visual selection — just a label)
- `icon` — a key from `src/lib/icons.ts` (Heroicon SVG paths). Common values: `"server-stack"`, `"code-bracket-square"`, `"user-circle"`, `"users"`, `"cpu-chip"`, `"command-line"`, `"sparkles"`, `"rocket-launch"`, `"light-bulb"`, `"shield-check"`. If the key is missing or unrecognised, the card falls back to the `"sparkles"` icon.
- `iconifyIcon` — optional alternative to `icon`. Accepts an Iconify identifier (e.g. `"devicon:figma"`, `"mdi:server"`). Takes priority over `icon` when set. Browse icons at [icon-sets.iconify.design](https://icon-sets.iconify.design).
- `title` — the card heading
- `description` — the card body text

---

### `src/data/skills.json` — Tech & tools

Skill categories displayed in the Skills section. Each skill has a single `icon` field. Icons are downloaded at build time and served from your own domain — no CDN requests reach visitors' browsers.

```json
{
  "section": {
    "eyebrow": "What I work with",
    "heading": "Technical Arsenal"
  },
  "categories": [
    {
      "title": "Design & Illustration",
      "skills": [
        { "name": "Figma",   "icon": "devicon:figma" },
        { "name": "Blender", "icon": "devicon:blender" }
      ]
    },
    {
      "title": "Web & Frontend",
      "skills": [
        { "name": "TypeScript", "icon": "devicon:typescript" },
        { "name": "React",      "icon": "devicon:react" }
      ]
    }
  ]
}
```

- `section.eyebrow` / `section.heading` — the section label and title. Change these without touching any `.astro` file.
- `icon` — identifies the icon to display. Accepts two formats:

---

#### Format 1 — Iconify identifier (recommended)

```json
{ "name": "Figma", "icon": "devicon:figma" }
```

Write `prefix:name` — the build script downloads the SVG from the Iconify API before the Astro build runs and saves it to `public/images/icons/devicon/figma.svg`. The file is only downloaded if it doesn't already exist, so custom icons you place manually are never overwritten.

Browse every available icon at [icon-sets.iconify.design](https://icon-sets.iconify.design). Useful prefixes:

| Prefix | Color? | Best for | Example |
|--------|--------|----------|---------|
| `simple-icons:` | Monochrome | Tech brand logos — most comprehensive | `simple-icons:docker` |
| `devicon:` | Full color | Dev-specific tech logos | `devicon:figma` |
| `devicon-plain:` | Monochrome | Same as devicon, no color fill | `devicon-plain:figma` |
| `logos:` | Full color | Colored brand logos | `logos:react` |
| `mdi:` | Monochrome | Generic or concept icons | `mdi:server` |
| `skill-icons:` | Full color | Polished dev-skill display | `skill-icons:typescript` |

**Icons are full color by default** because `devicon:` uses official brand colors. To switch to monochrome, change the prefix — the icon name itself stays the same:

```json
{ "name": "Figma",      "icon": "devicon:figma"           }   ← full color (default)
{ "name": "Figma",      "icon": "simple-icons:figma"      }   ← monochrome (white/black)
{ "name": "TypeScript", "icon": "devicon:typescript"      }   ← full color (default)
{ "name": "TypeScript", "icon": "simple-icons:typescript" }   ← monochrome
{ "name": "Docker",     "icon": "devicon:docker"          }   ← full color (default)
{ "name": "Docker",     "icon": "simple-icons:docker"     }   ← monochrome
```

Mix and match per skill — you can use a colored prefix for some and monochrome for others. The icon tile already has a neutral white background so colored icons display correctly in both light and dark themes.

> **Offline builds:** if the build runs without a network connection, any icon not already on disk is skipped with a warning. The build completes — only those icons are missing from the page. Run the build once with a connection to warm the cache; subsequent offline builds use what's already downloaded.

---

#### Format 2 — Local path (for custom icons, including PNG)

```json
{ "name": "My App", "icon": "/images/icons/custom/myapp.png" }
```

Use any path starting with `/`. The file must exist in `public/` before the build runs — the build script does not download local-path icons. This format supports any image type: SVG, PNG, WebP, etc.

Example: place `myapp.png` in `public/images/icons/custom/` and reference it as `/images/icons/custom/myapp.png`. Useful when only a PNG is available for a proprietary or internal tool.

---

Add or remove categories freely — the grid adapts automatically. To add a skill, append a new object with `name` and `icon`. The build downloads any missing Iconify SVGs automatically on the next `pnpm run dev` or `pnpm run build`.

---

### `src/data/portfolio.json` — Client work

These are the big showcase pieces displayed in the Portfolio carousel. Each project supports multiple slides.

```json
[
  {
    "title": "Brand Identity & Visual System",
    "category": "Branding",
    "description": "A complete brand overhaul — logo, typography, color system, and a style guide built to scale.",
    "images": [
      "/images/portfolio/project-1a.jpg",
      "/images/portfolio/project-1b.jpg",
      "/images/portfolio/project-1c.jpg"
    ],
    "slides": ["Brand Overview", "Style Guide Spread", "Product Shot"]
  }
]
```

- Images go in `public/images/portfolio/` — referenced by path from the root
- `slides` are the caption labels shown on each image in the carousel
- Add as many projects as you like; the carousel handles them all

---

### `src/data/projects.json` — Personal projects & experiments

Displayed in the Projects section. The outer object controls which layout the section uses; `items` holds the project list.

---

#### Choosing a layout — this is the most important setting in this file

The `"layout"` key at the top of `projects.json` determines which component renders your Projects section, default is `grid`. The two options look and behave very differently, so pick based on how many projects you have:

| How many projects? | Recommended layout | Why |
| ------------------ | ------------------ | --- |
| **5 or fewer** | `"showcase"` | Each project gets a full-width feature card with a large hero image, thumbnail gallery, and prominent CTA. Works beautifully when every project deserves individual attention — too much whitespace with a long list. |
| **6 or more** | `"grid"` | Compact 3-column card grid with category filter buttons (Featured / All / by category). Scales cleanly to any number of projects and lets visitors self-sort by interest. |

> **Rule of thumb:** fewer projects → `"showcase"` for impact. Many projects → `"grid"` for scannability.

To switch layouts, change **one value** in `projects.json`:

```json
{ "layout": "showcase" }   ← ProjectsShowcase.astro  (≤5 projects, big feature cards)
{ "layout": "grid"     }   ← ProjectsGrid.astro      (6+ projects, filterable card grid)
```

---

**`"showcase"` layout — `ProjectsShowcase.astro`**

Renders each project as a full-width horizontal feature card: large background image on one side, title / description / tags / CTA on the other. A thumbnail strip below the main image lets visitors browse screenshots without leaving the section. Best when you have a small, curated set of projects you want to present with weight.

- `backgroundImage` — the main hero image for the card
- `images` — up to three thumbnails shown below the main image (click to swap)
- No filter buttons — all projects are always visible

**`"grid"` layout — `ProjectsGrid.astro`**

Renders projects as a filterable 3-column card grid. Filter buttons at the top let visitors switch between **Featured**, **All**, and any category you've used. Projects with `"featured": true` appear in the default Featured view. Scales to any number of projects without feeling cluttered.

- `featured` — controls which projects show in the default Featured filter
- `category` — the filter group the project belongs to (e.g. `"web"`, `"design"`, `"devops"`)
- `backgroundImage` — the card cover image in grid mode

---

```json
{
  "layout": "showcase",
  "items": [
    {
      "title": "Photography Workflow App",
      "featured": true,
      "resume": true,
      "company": "Side Project",
      "category": "web",
      "description": "A lightweight local app for managing shoot intake, selects, and client delivery.",
      "tags": ["React", "SQLite", "Node.js"],
      "icon": "eye",
      "link": "https://yourproject.com",
      "githubRepo": "photo-workflow",
      "sliderImage": "/images/projects/web-app.jpg",
      "sliderOrder": 1,
      "backgroundImage": "/images/projects/web-app.jpg",
      "images": [
        "/images/projects/web-app.jpg",
        "/images/projects/web-app-detail.jpg"
      ],
      "colorIcon": "devicon:react"
    }
  ]
}
```

**Item fields:**

- `featured` — set to `true` to include the project in the **Featured** filter (grid layout). The default filter when the Projects section loads. Has no effect in showcase layout.
- `resume` — set to `true` to include the project in the **Notable Projects** section of the printable resume.
- `sliderImage` — path to the image shown in the **hero section carousel**. Projects with a `sliderImage` appear in the hero slider. If `githubRepo` is set and GitHub successfully fetches a README image, that image takes priority — otherwise `sliderImage` is used directly. Omit the field entirely to exclude a project from the carousel.
- `sliderOrder` — integer controlling the project's position in the hero carousel. Lower numbers appear first (`1` before `2`, etc.). Projects without this field sort to the end.
- `backgroundImage` — the card background image used in the showcase layout and as the fallback cover in grid mode.
- `images` — array of image paths for the **showcase layout** thumbnail gallery (click to swap the main image). The first item is also the main image on load. Ignored in grid mode.
- `githubRepo` — the repo name (not the full URL). If set and `GITHUB_USER` is configured, the build reads that repo's README and extracts the first non-badge image to use as the hero slider image. Leave as `""` to rely on `sliderImage` directly.
- `icon` — a Heroicons name used as a fallback icon in the hero badge and showcase placeholder (e.g. `"eye"`, `"cpu-chip"`, `"document-text"`, `"command-line"`)
- `colorIcon` — a colored icon displayed on the project card. Accepts the same two formats as the skills `icon` field:

  **Format 1 — Iconify identifier (recommended):** `"devicon:react"`, `"devicon:docker"`, `"logos:astro"`, etc. The build script downloads the SVG from the Iconify API at build time and serves it locally — no CDN requests reach visitors. Use `devicon:` for full-color tech logos.

  ```json
  "colorIcon": "devicon:react"
  ```

  Browse icons at [icon-sets.iconify.design](https://icon-sets.iconify.design). Useful prefixes for project icons:

  | Prefix | Color? | Best for |
  |--------|--------|----------|
  | `devicon:` | Full color | Tech stack logos — **best default** |
  | `logos:` | Full color | Brand logos with broad coverage |
  | `simple-icons:` | Monochrome | When you want a flat look |
  | `mdi:` | Monochrome | Generic concept icons (no brand logo exists) |

  **Format 2 — Local path:** Place any image in `public/` and reference it directly. Supports SVG, PNG, WebP, etc. The build script does not download local-path icons — you manage the file yourself.

  ```json
  "colorIcon": "/images/icons/custom/myapp.png"
  ```

  Legacy local-path formats still supported (build script auto-downloads if missing):
  - `/images/icons/materialdesign/{name}.svg` — [Templarian/MaterialDesign](https://materialdesignicons.com) on jsdelivr
  - `/images/icons/dashboard-icons/{name}.png` — [homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons) on jsdelivr

- `category` — filter group in grid mode. Common values: `"web"`, `"devops"`, `"infrastructure"`, `"security"`, `"design"` — use any string you like.

> **Hero slider not showing projects?** If the slider appears empty, check two things: (1) each project you want in the slider must have a `sliderImage` path set, and (2) the image file must exist at `public/images/projects/`. If `GITHUB_USER` is set to a real GitHub username and `githubRepo` matches a repo in your account, the build will fetch the README image and use it instead — but `sliderImage` is always the fallback so the slider works even without GitHub access.

---

### `src/data/certifications.json` — Credentials & training

Timeline of your certifications, courses, and in-progress work.

```json
[
  {
    "name": "Google UX Design Certificate",
    "issuer": "Google / Coursera",
    "date": "March 2023",
    "status": "Earned",
    "type": "certification",
    "description": "Seven-course program covering UX research, wireframing, and prototyping.",
    "credentialUrl": "https://coursera.org/verify/..."
  },
  {
    "name": "3D Art for Real-Time Engines",
    "issuer": "Unity Learn / Epic Games",
    "date": "Target: End of Year",
    "status": "In Progress",
    "type": "in-progress",
    "description": "Bridging offline rendering with real-time constraints in Unreal Engine.",
    "credentialUrl": ""
  }
]
```

- `type` controls the badge style: `"certification"` | `"professional-development"` | `"in-progress"`
- `status` is the display label: `"Earned"` | `"Completed"` | `"In Progress"`
- Leave `credentialUrl` as `""` if you don't have a verification link yet

---

### `src/data/menu.json` — Navigation labels

Controls the section labels in the nav bar. You probably won't need to touch this unless you rename sections.

```json
{
  "sections": [
    {
      "label": "About",
      "shortLabel": "About",
      "href": "#about",
      "desc": "Background and approach"
    },
    {
      "label": "Expertise",
      "shortLabel": "Expertise",
      "href": "#expertise",
      "desc": "What I focus on"
    },
    {
      "label": "Portfolio",
      "shortLabel": "Portfolio",
      "href": "#portfolio",
      "desc": "Client work"
    },
    {
      "label": "Projects",
      "shortLabel": "Projects",
      "href": "#projects",
      "desc": "Personal projects"
    },
    {
      "label": "Certifications",
      "shortLabel": "Certs",
      "href": "#certifications",
      "desc": "Training and credentials"
    },
    { "label": "Services", "shortLabel": "Services", "href": "#services", "desc": "Sites I run" },
    { "label": "Contact", "shortLabel": "Contact", "href": "#contact", "desc": "Start a project" }
  ]
}
```

---

## Step 3 — Add Your Images

Drop your images into `public/` before building:

```
public/
└── images/
    ├── personal/
    │   └── portrait.png          ← your portrait (referenced in personal.json → "photo")
    ├── portfolio/
    │   ├── project-1a.jpg        ← referenced in portfolio.json → "images"
    │   ├── project-1b.jpg
    │   └── ...
    └── projects/
        ├── my-project.jpg        ← referenced in projects.json → "featuredImage"
        └── ...
```

If `githubRepo` is set for a project, the build fetches the image automatically and `featuredImage` is ignored for that project.

---

## Step 4 — Build & Deploy

CI/CD workflows for GitHub Pages, GitLab Pages, and Gitea/Forgejo/Codeberg are already included. If you're on one of those platforms, **this is the recommended path** — no Docker required, no manual file copying.

> **Push triggers are currently commented out.** All three workflow files ship with their automatic push-on-`main` triggers disabled so nothing fires unexpectedly while you're getting the repo set up. Each workflow can be run manually from the platform UI right now. When you're ready to enable automatic deploys on every push to `main`, uncomment the trigger block in the relevant file (instructions in each section below).

Pick your method:

- [GitHub Pages (CI/CD — recommended)](#github-pages)
- [GitLab Pages (CI/CD — recommended)](#gitlab-pages)
- [Gitea / Forgejo / Codeberg (CI build — manual deploy)](#gitea--forgejo--codeberg)
- [Self-hosted / VPS (Docker)](#self-hosted--vps)
- [Cloudflare Pages](#cloudflare-pages)
- [Netlify](#netlify)
- [Vercel](#vercel)

---

### GitHub Pages

**1. Enable Pages in your repo**

Go to your repo → **Settings → Pages → Build and deployment** and set Source to **GitHub Actions**.

**2. Set repository variables**

Only one variable is required. Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable      | Required | Value                                                                        |
| ------------- | -------- | ---------------------------------------------------------------------------- |
| `GITHUB_USER` | Yes      | Your GitHub username (for project image fetching)                            |
| `SITE_URL`    | No       | Override the auto-detected URL — e.g. `https://yourcustomdomain.com`         |
| `BASE_PATH`   | No       | Override the auto-detected base path — e.g. `/` after adding a custom domain |

> **`BASE_PATH` and `SITE_URL` are now auto-detected.** The build reads the built-in `GITHUB_REPOSITORY` variable (always set by the GitHub Actions runner, no configuration needed) and derives both values automatically:
>
> - Project repo (e.g. `your-github-username/my-repo-name-here`) → base `'/my-repo-name-here/'`, site `'https://your-github-username.github.io/my-repo-name-here'`
> - User/org repo (e.g. `your-github-username/your-github-username.github.io`) → base `'/'`, site `'https://your-github-username.github.io'`
>
> Only set `SITE_URL` / `BASE_PATH` as repo variables if you need to **override** the auto-detected value, such as when using a custom domain.

> **Why does GitHub serve the site at `/<repo-name>` instead of `/`?**
>
> GitHub Pages infrastructure serves project repositories at `https://<username>.github.io/<repo-name>/` regardless of any settings you configure. To get a root `/` URL you have two options:
>
> **Option A — Rename the repository** to `<username>.github.io`. GitHub serves that repo name at the root. No other changes needed — auto-detection handles the base path.
>
> **Option B — Add a custom domain** (Settings → Pages → Custom domain). GitHub serves the site at the root of that domain. Set `SITE_URL` to `https://yourdomain.com` and `BASE_PATH` to `/` as repo variables, then push to redeploy.

The workflow uses the built-in `GITHUB_TOKEN` automatically — no extra secret needed for GitHub API access.

**3. Trigger the workflow manually**

The push trigger in `.github/workflows/deploy.yml` is currently commented out. To run a build and deploy now:

1. Go to your repo → **Actions** → **Deploy to GitHub Pages**
2. Click **Run workflow** (top-right of the run list) → **Run workflow**

The workflow builds and deploys your site via the official GitHub Pages Action.

**To enable automatic deploys on push to `main`:** open `.github/workflows/deploy.yml` and uncomment the `push: branches: [main]` block. Every future push to `main` will then rebuild and redeploy automatically.

**4. Custom domain & DNS**

In **Settings → Pages → Custom domain**, enter your domain. GitHub provisions HTTPS via Let's Encrypt automatically.

At your DNS provider:

```
# Apex domain — add all four A records
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153

# www subdomain
CNAME    www    yourusername.github.io.
```

Then update `SITE_URL` to `https://yourname.com` and `BASE_PATH` to `/` in your repo variables and push to redeploy.

---

### GitLab Pages

**1. Set CI/CD variables**

Go to your project → **Settings → CI/CD → Variables** and add:

| Variable       | Required | Value                                                                                                                                                |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_USER`  | Yes      | Your GitHub username (for project image fetching)                                                                                                    |
| `GITHUB_TOKEN` | Yes      | A GitHub personal access token — generate one at GitHub → Settings → Developer settings → Personal access tokens (no scopes needed for public repos) |
| `SITE_URL`     | No       | Override the auto-detected URL — e.g. `https://yourcustomdomain.com`                                                                                 |
| `BASE_PATH`    | No       | Override the auto-detected base path — e.g. `/` after adding a custom domain                                                                         |

> **`BASE_PATH` and `SITE_URL` are auto-detected.** The pipeline reads the built-in `CI_PAGES_URL` variable (always set by the GitLab runner) and derives both values automatically — project pages get `/<repo-name>/`, user/group pages get `/`. Only set them as CI/CD variables to override, e.g. when using a custom domain.

**2. Trigger the pipeline manually**

The `only: - main` trigger in `.gitlab-ci.yml` is currently commented out and the `pages` job is set to `when: manual`. To run a build and deploy now:

1. Go to your project → **CI/CD → Pipelines → Run pipeline** → **Run pipeline**
2. Once the pipeline starts, click the **▶ play button** next to the `pages` job to execute it

GitLab Pages requires the build output in a directory called `public/` — the pipeline handles this automatically.

**To enable automatic deploys on push to `main`:** open `.gitlab-ci.yml`, uncomment the `only: - main` block, and remove the `when: manual` line. Every future push to `main` will then rebuild and redeploy automatically.

**3. Custom domain & DNS**

Go to your project → **Deploy → Pages → New Domain** and enter your domain. GitLab can auto-provision a Let's Encrypt cert, or paste your own.

At your DNS provider:

```
# Apex domain — use ALIAS or ANAME if your provider supports it
ALIAS    @      yournamespace.gitlab.io.

# www subdomain
CNAME    www    yournamespace.gitlab.io.
```

Then update `SITE_URL` in your CI/CD variables to your custom domain and push to redeploy.

> **Note:** Not all DNS providers support ALIAS/ANAME for apex domains. If yours doesn't, use `www` only and redirect the apex at your registrar — or switch to Cloudflare, which supports it.

---

### Gitea / Forgejo / Codeberg

Gitea Actions and Forgejo Actions use the same YAML syntax as GitHub Actions. The workflow at `.gitea/workflows/build.yml` is already included — it builds the site and uploads the output as a downloadable artifact. The push trigger is currently commented out; use the manual trigger while you're getting set up (see step 2 below).

> **No built-in Pages.** Generic Gitea and Forgejo instances do not include a static-site hosting service. After the build artifact is ready, download it and deploy it manually (see [Self-Hosted / VPS](#self-hosted--vps) below). Codeberg is the exception — see below.

**Requirements:** your Gitea/Forgejo instance must have an `act_runner` registered. If your admin hasn't set one up, Actions won't run — fall back to the Docker build path.

**1. Set repository variables and secrets**

Go to your repo → **Settings → Actions → Variables / Secrets** and add:

| Name          | Where      | Value                                                                                                                                                       |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`    | Variable   | Your full domain, e.g. `https://yourname.com`                                                                                                               |
| `BASE_PATH`   | Variable   | `/` unless your site lives in a subdirectory                                                                                                                |
| `GITHUB_USER` | Variable   | Your GitHub username (for project image fetching)                                                                                                           |
| `GH_TOKEN`    | **Secret** | A GitHub personal access token — use `GH_TOKEN`, **not** `GITHUB_TOKEN` (that name is reserved for the Gitea/Forgejo instance token and cannot be set here) |

**2. Trigger the workflow manually**

The push trigger in `.gitea/workflows/build.yml` is currently commented out. To run a build now:

1. Go to your repo → **Actions** → **Build**
2. Click **Run workflow** → **Run workflow**

The workflow builds the site and uploads `dist/` as a downloadable artifact. Download it from the Actions run page and deploy it to your server.

**To enable automatic builds on push to `main`:** open `.gitea/workflows/build.yml` and uncomment the `push: branches: [main]` block. Every future push to `main` will then trigger a build automatically.

**Codeberg Pages (codeberg.org only)**

Codeberg has a Pages service that serves static files from the `pages` branch of a repository named `pages` under your account.

1. Create a repo named `pages` in your Codeberg account (if you don't have one).
2. After a successful build, push the `dist/` contents to the `pages` branch of that repo. Example using a local terminal after downloading the artifact:

```bash
# Unzip the downloaded artifact, then:
cd site   # the artifact folder
git init
git remote add origin https://codeberg.org/yourusername/pages.git
git checkout -b pages
git add .
git commit -m "Deploy"
git push --force origin pages
```

Your site will be live at `https://yourusername.codeberg.page` within a few minutes.

> **Custom domain on Codeberg Pages:** create a `.domains` file in the root of your `pages` branch containing your domain on the first line. Point a CNAME record at `codeberg.page.` at your DNS provider.

---

### Self-Hosted / VPS

Use Docker to build locally and copy the output to your server. No CI/CD account required.

**Default workflow — build only (90% of the time)**

```bash
docker compose build && docker compose up
# Finished site lands in ./output/ — rsync it wherever you want
rsync -avz ./output/ user@yourserver.com:/var/www/html/
```

Re-run both commands every time you update content.

**Optional — bake into a lean nginx image (~25 MB) and serve directly**

```bash
docker compose --profile serve build && docker compose --profile serve up -d
# Serves on port 80 — no separate file copy needed
```

Use this when you want Docker itself to serve the site on the production machine instead of copying files to a web root.

---

### Cloudflare Pages

No workflow file needed — Cloudflare Pages builds straight from your Git repo. Every push to `main` triggers a build and deploy automatically.

**1. Create a Cloudflare account**

Go to [cloudflare.com](https://cloudflare.com) → **Sign Up** → confirm your email. The free plan covers everything here.

**2. Connect your repo**

From the Cloudflare dashboard:

1. **Workers & Pages** → **Pages** → **Create a project**
2. **Connect to Git** → authorize Cloudflare to access your GitHub or GitLab account
3. Select your repository → **Begin setup**

**3. Configure build settings**

Cloudflare auto-detects Astro. Confirm these values (or enter them if not pre-filled):

| Setting                | Value           |
| ---------------------- | --------------- |
| Framework preset       | Astro           |
| Build command          | `pnpm run build` |
| Build output directory | `dist`          |
| Root directory         | _(leave blank)_ |

**4. Set environment variables**

Still on the setup screen, open **Environment variables** and add these four — set them for the **Production** environment:

| Variable       | Value                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`     | Your final domain, e.g. `https://yourname.com` — use your `.pages.dev` URL for now if you don't have a domain yet                                    |
| `BASE_PATH`    | `/` (Cloudflare Pages always serves from root)                                                                                                       |
| `GITHUB_USER`  | Your GitHub username (for project image fetching)                                                                                                    |
| `GITHUB_TOKEN` | A GitHub personal access token — generate one at GitHub → Settings → Developer settings → Personal access tokens (no scopes needed for public repos) |

**5. Save and deploy**

Click **Save and Deploy**. Cloudflare builds your site and publishes it at a unique `*.pages.dev` URL — you'll see it on the deployment screen when the build finishes (usually under two minutes).

Visit that URL to confirm everything looks right before adding your custom domain.

**6. Custom domain & DNS**

In your project → **Custom domains** → **Set up a custom domain** → enter your domain (e.g. `yourname.com` or `www.yourname.com`).

_If your domain's nameservers are already on Cloudflare:_ the CNAME record is created automatically. Skip to the update step below.

_If your domain is registered elsewhere:_ add this record at your DNS provider:

```
# www subdomain
CNAME    www    your-project.pages.dev.

# Apex domain — use ALIAS or ANAME if your provider supports it
ALIAS    @      your-project.pages.dev.
```

> **Tip:** Cloudflare offers free DNS hosting with ALIAS support for apex domains. Transfer your nameservers to Cloudflare and both `@` and `www` records work as plain CNAME entries (Cloudflare flattens them automatically).

HTTPS is provisioned automatically via Cloudflare's edge — no Let's Encrypt setup needed.

**7. Update `SITE_URL` and redeploy**

Once your domain resolves correctly, go to your project → **Settings → Environment variables** and update `SITE_URL` to your final domain (e.g. `https://yourname.com`). Then trigger a new deploy from the **Deployments** tab so the canonical URLs and OG tags reflect your real domain.

---

### Netlify

Like Cloudflare Pages, Netlify builds directly from your Git repo — no workflow file needed. Push to `main` and Netlify handles the rest.

**1. Create a Netlify account**

Go to [netlify.com](https://netlify.com) → **Sign up**. You can sign in with GitHub, GitLab, Bitbucket, or email. The free Starter plan covers everything here.

**2. Import your project**

From the Netlify dashboard:

1. **Add new site** → **Import an existing project**
2. Choose your Git provider and authorize Netlify
3. Select your repository

**3. Configure build settings**

Netlify auto-detects Astro. Confirm these values:

| Setting           | Value           |
| ----------------- | --------------- |
| Branch to deploy  | `main`          |
| Build command     | `pnpm run build` |
| Publish directory | `dist`          |

**4. Set environment variables**

Still on the setup screen, open **Environment variables** and add:

| Key            | Value                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`     | Your final domain, e.g. `https://yourname.com` — use your `.netlify.app` URL for now if you don't have a domain yet                                  |
| `BASE_PATH`    | `/`                                                                                                                                                  |
| `GITHUB_USER`  | Your GitHub username (for project image fetching)                                                                                                    |
| `GITHUB_TOKEN` | A GitHub personal access token — generate one at GitHub → Settings → Developer settings → Personal access tokens (no scopes needed for public repos) |

You can also add or edit variables later at **Site configuration → Environment variables**.

**5. Deploy your site**

Click **Deploy [site-name]**. Netlify builds and publishes your site at a randomly named `*.netlify.app` URL — visible on the deploy screen when it finishes (usually under two minutes).

Visit that URL to confirm everything looks right before adding your custom domain.

**6. Custom domain & DNS**

Go to **Domain management** → **Add custom domain** → enter your domain (e.g. `www.yourname.com`).

Add this record at your DNS provider:

```
# www subdomain
CNAME    www    your-site-name.netlify.app.

# Apex domain — use ALIAS or ANAME if your provider supports it
ALIAS    @      your-site-name.netlify.app.
```

> **No ALIAS support at your registrar?** Netlify offers **Netlify DNS** — you delegate your domain's nameservers to Netlify (found under Domain management → Netlify DNS) and both `@` and `www` resolve through their CDN. Alternatively, redirect the apex to `www` at your registrar and handle everything through the `www` CNAME.

Netlify provisions HTTPS automatically via Let's Encrypt once the DNS record propagates. This typically takes a few minutes to an hour.

**7. Update `SITE_URL` and redeploy**

Once your domain resolves, go to **Site configuration → Environment variables**, update `SITE_URL` to your final domain (e.g. `https://yourname.com`), and trigger a redeploy from the **Deploys** tab so canonical URLs and OG tags reflect your real domain.

---

### Vercel

No workflow file needed — Vercel builds straight from your Git repo. Every push to `main` triggers a build and deploy, and every pull request gets a live preview URL automatically.

> **Free tier note:** Vercel's Hobby plan is free for personal, non-commercial use. For a personal portfolio this is perfectly fine — just be aware of the restriction if this site is also a commercial studio or business page.

**1. Create a Vercel account**

Go to [vercel.com](https://vercel.com) → **Sign Up** → choose **Continue with GitHub** (or GitLab / Bitbucket). Authorizing via Git provider means Vercel can import your repos directly — no separate connection step.

**2. Import your project**

From the Vercel dashboard:

1. **Add New** → **Project**
2. Find your repository in the list → **Import**

**3. Configure build settings**

Vercel auto-detects Astro. Confirm these values in the configuration screen:

| Setting          | Value           |
| ---------------- | --------------- |
| Framework preset | Astro           |
| Build command    | `pnpm run build` |
| Output directory | `dist`          |
| Install command  | `pnpm install`   |
| Root directory   | _(leave blank)_ |

**4. Set environment variables**

Still on the setup screen, open **Environment Variables** and add:

| Key            | Value                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`     | Your final domain, e.g. `https://yourname.com` — use your `.vercel.app` URL for now if you don't have a domain yet                                   |
| `BASE_PATH`    | `/` (Vercel always serves from root)                                                                                                                 |
| `GITHUB_USER`  | Your GitHub username (for project image fetching)                                                                                                    |
| `GITHUB_TOKEN` | A GitHub personal access token — generate one at GitHub → Settings → Developer settings → Personal access tokens (no scopes needed for public repos) |

**5. Deploy**

Click **Deploy**. Vercel builds your site and publishes it at a unique `*.vercel.app` URL — shown on the deployment screen when the build finishes (usually under two minutes).

Visit that URL to confirm everything looks right before adding your custom domain.

**6. Custom domain & DNS**

In your project → **Settings → Domains** → enter your domain (e.g. `yourname.com` or `www.yourname.com`) → **Add**.

Vercel will show you the exact records to add. In general:

```
# www subdomain
CNAME    www    cname.vercel-dns.com.

# Apex domain — Vercel provides a stable anycast A record
A        @      76.76.21.21
```

> **Simplest apex setup:** Add both the `A` record above and the `CNAME` for `www`. Vercel automatically redirects one to the other based on which you set as primary in the dashboard.

HTTPS is provisioned automatically via Let's Encrypt once the DNS record propagates — typically a few minutes.

**7. Update `SITE_URL` and redeploy**

Once your domain resolves, go to **Settings → Environment Variables**, update `SITE_URL` to your final domain (e.g. `https://yourname.com`), and trigger a redeploy from the **Deployments** tab so canonical URLs and OG tags reflect your real domain.

---

## GitHub Integration

`src/lib/fetchGitHub.ts` fetches your repos at build time and extracts the first real image from each project's README. Results are cached in `src/data/github-image-cache.json` — it only re-fetches a repo if it has been updated since the last build.

**1.** Create the secrets directory and drop your token in:

```bash
mkdir secrets
echo "ghp_xxxx" > secrets/github_token_password.txt
```

`secrets/` is in `.gitignore` — it will never be committed. `entrypoint.sh` reads it at container startup and exports it as `GITHUB_TOKEN` automatically.

**2.** Set `GITHUB_USER` in `docker-compose.yml` (already in the `environment` block):

```yaml
- GITHUB_USER=your-github-username
```

**3.** In `projects.json`, set `githubRepo` to the repo name for any project you want images pulled from:

```json
{ "githubRepo": "my-cool-project" }
```

- Without a token: 60 unauthenticated GitHub API requests/hour
- With a token: 5,000/hour — generate one at GitHub → Settings → Developer settings → Personal access tokens (no scopes needed for public repos)
- Not using GitHub integration? Leave `githubRepo` as `""` on every project and skip this section

---

## Lib Files

| File | Purpose |
| ---- | ------- |
| `src/lib/fetchGitHub.ts` | Fetches GitHub repos at build time; extracts first README image per project; caches in `github-image-cache.json` |
| `src/lib/fetchBlog.ts` | Parses the blog RSS feed at build time; provides post data to components |
| `src/lib/socialLinks.ts` | Builds the social link array from `personal.json`; filters empty handles; maps Iconify icons |
| `src/lib/icons.ts` | Heroicons SVG path map used for project card fallback icons |

---

## Lib Files

These three utilities run at build time and wire up the dynamic parts of the site.

### `src/lib/fetchGitHub.ts`

Fetches your GitHub repos and extracts cover images from each project's README.

- Caches results to `src/data/github-image-cache.json` — only re-fetches on change
- Reads `README.md` from each repo and finds the first non-badge image
- Converts relative image paths to absolute `raw.githubusercontent.com` URLs
- Gracefully skips private repos or if no token is provided

### `src/lib/socialLinks.ts`

Builds the social link array rendered throughout the site from `personal.json`.

- Supports 17 platforms with Iconify (simple-icons) icon mapping
- Filters out any handles left empty — no broken links
- Default sort order: GitHub → LinkedIn → GitLab → Twitter/X → and more

---

## Supply Chain Security

Between 2025 and 2026, several major npm supply chain attacks compromised packages with hundreds of millions of weekly downloads — including `chalk`, `debug`, `axios`, and a self-spreading worm called Shai-Hulud that swept through over 700 packages. The attack pattern is always the same: an attacker publishes a new version of a real package with a malicious install script baked in. npm runs that script automatically and silently the moment anyone does `npm install`. No warning. No prompt.

This project uses **pnpm 11** with five controls enabled that npm does not have.

---

### What This Project Protects Against

| Threat | How it works | What stops it here |
| --- | --- | --- |
| **Shai-Hulud / credential-theft attacks** | Attacker hijacks a maintainer's npm account and publishes a new version with a `postinstall` script that steals tokens and SSH keys | `strictDepBuilds` — all install scripts are blocked unless explicitly approved; no new script runs without human sign-off |
| **Mini Shai-Hulud / git-dependency injection** | A published-to-registry package hides a malicious GitHub repo in `optionalDependencies`; npm fetches and executes it transparently | `blockExoticSubdeps` — transitive dependencies may not resolve from `git://`, tarball URLs, or GitHub shorthand; only the registry is allowed |
| **Same-day poisoned releases** | Attacker publishes a malicious version and it gets pulled in by `npm install` within minutes of publication — long before any scanner detects it | `minimumReleaseAge: 10080` — pnpm refuses to resolve any version published less than 7 days ago; every known major attack was detected within hours, well inside this window |
| **Axios / credential-downgrade attacks** | Attacker takes over a maintainer account, re-publishes with a different OIDC identity (e.g. a different CI issuer or email), then waits for the package to propagate | `trustPolicy: no-downgrade` — pnpm fails the install if a package's provenance publisher has changed since the last resolved version |
| **PackageGate / lockfile tampering** | Some package managers record git/tarball dependencies without integrity hashes, allowing a server to silently serve different code on each install | `pnpm-lock.yaml` — every package has an integrity hash; `--frozen-lockfile` in Docker aborts if the lockfile would need to change |

---

### What Is Always On

These run automatically on every `pnpm install` — including every Docker build. You do not need to do anything to activate them.

**`strictDepBuilds`** — No dependency may run `preinstall`, `install`, `postinstall`, or `prepare` unless it is listed in `allowBuilds` inside `pnpm-workspace.yaml`. New packages that need a build script cause the install to fail with a clear error listing the package name.

**`blockExoticSubdeps`** — Any transitive dependency that tries to resolve from a `git://` URL, a direct tarball, or a GitHub shorthand (`user/repo`) is rejected at resolution time. Your direct dependencies (in `package.json`) may still use these sources.

**`minimumReleaseAge: 10080`** — pnpm skips any package version published less than 7 days ago. If the version you want was just published, pnpm prints which version was blocked and when it becomes available.

**`trustPolicy: no-downgrade`** — If a package previously published with OIDC provenance attestation now lacks it (which happens when an attacker takes over an account and re-publishes with a different identity), pnpm fails the install.

**`verifyDepsBeforeRun`** — Before every `pnpm run` or `pnpm exec`, pnpm confirms that `node_modules` matches the lockfile. Scripts can't run against a tampered or stale dependency tree.

---

### Weekly Maintenance — Running the Update Script

Run `update-pinned-packages.sh` once a week to pull in the latest versions of all direct dependencies. Pick the flag that matches what you want to do with `node_modules` afterward:

```bash
# Update the lockfile only — no node_modules written to disk (fastest, recommended for review)
./update-pinned-packages.sh --lock-only

# Update, install, and remove node_modules when done
./update-pinned-packages.sh --discard

# Update and keep node_modules on the host
./update-pinned-packages.sh --install
```

The script runs these checks in order and stops if any fails:

1. **pnpm update** — resolves the latest versions; `minimumReleaseAge` and `blockExoticSubdeps` apply automatically during resolution
2. **Age report** — prints the publish date of every resolved package and warns (in yellow) if any is under 7 days old
3. **pnpm audit** — fails the run if any high or critical CVE is present in the resolved tree
4. **README timestamp** — writes a `<!-- packages-last-updated: YYYY-MM-DD -->` marker to `README.md` so you always know when the tree was last reviewed

If the run finishes green, commit `pnpm-lock.yaml` and `package.json`.

---

### When a New Package Blocks the Install

If you add a dependency that runs a build script (most commonly native addons like `sharp`, or binary packages like `esbuild`), `pnpm install` will fail with:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: some-package@1.2.3
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

**What to do:**

1. Look up what the package's build script actually does — check its `package.json` on npm or its GitHub page. The script should download a platform binary or compile a native addon. If it does anything else, do not approve it.
2. Run `pnpm approve-builds` to open the interactive review UI.
3. Add the package to `allowBuilds` in `pnpm-workspace.yaml` with a short comment explaining what it does and today's date.

```yaml
allowBuilds:
  your-new-package: true  # downloads platform binary for X. Reviewed YYYY-MM-DD.
```

Never set `dangerouslyAllowAllBuilds: true` — that disables all script blocking and reverts to npm's behavior.

---

### When a Security Patch Is Blocked by the Age Hold

If `pnpm audit` finds a CVE and the patched version was published less than 7 days ago, pnpm will block it with:

```
[ERR_PNPM_NO_MATURE_MATCHING_VERSION] Version x.y.z (released N hours ago) of package-name
does not meet the minimumReleaseAge constraint
```

This is intentional — new releases are held to avoid same-day attacks. For a confirmed security fix you need immediately, add the specific version to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - "package-name@x.y.z"  # patches GHSA-xxxx-xxxx-xxxx. Published YYYY-MM-DD. Remove after 7 days.
```

Remove the entry the next day once the version ages past the hold window and re-run the update script.

---

### When a Transitive CVE Has No Upstream Fix Yet

If `pnpm audit` reports a vulnerability in a transitive dependency (a package you didn't install directly) and the package that pulls it in hasn't released a fix yet, you can force a patched version using an override in `pnpm-workspace.yaml`:

```yaml
overrides:
  vulnerable-package: ">=fixed.version"
```

This pins all instances of that package in the tree to a version that meets the constraint, regardless of what the upstream package requests. Run `pnpm install --lockfile-only` after adding the override to regenerate the lockfile.

If the fix genuinely doesn't exist yet and the vulnerability is not exploitable in this project's context, you can add the advisory ID to `auditConfig.ignoreGhsas` — but write a comment explaining why:

```yaml
auditConfig:
  ignoreGhsas:
    - GHSA-xxxx-xxxx-xxxx  # DoS in package-name; only triggered by attacker-controlled input
                            # which can't reach this static build. Re-check monthly.
```

---

### Files Involved

| File | What it does |
| --- | --- |
| `pnpm-workspace.yaml` | All five security controls live here — edit this file to approve builds, add overrides, exempt versions from the age hold, or ignore advisories |
| `pnpm-lock.yaml` | The frozen dependency tree with integrity hashes for every package — commit every change to this file |
| `update-pinned-packages.sh` | Weekly update script — runs the update, age report, and audit in sequence |
| `Dockerfile` | Runs `pnpm install --frozen-lockfile` at build time — fails if the lockfile is out of sync |

---

## OWASP ASVS Compliance

This is a statically generated site with no server-side processing, no user accounts, no database, and no dynamic request handling. The [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/www-project-application-security-verification-standard/) is the industry reference for web application security requirements.

**Level 1 — Partial** (opportunistic security baseline)

Controls that require a backend, authentication system, or session management are not applicable. The applicable controls are addressed as follows:

| Control | Category | Status | Notes |
| ------- | -------- | ------ | ----- |
| V2.1 | Authentication | N/A | No user accounts or login |
| V3.1 | Session Management | N/A | No sessions — stateless static output |
| V4.1 | Access Control | N/A | All content is public by design |
| V5.1 | Input Validation | ✅ | No user-supplied parameters reach any query or command |
| V5.3 | Output Encoding | ✅ | Astro's template engine auto-escapes HTML by default; `set:html` usage is flagged by ESLint (`astro/no-set-html-directive`) |
| V7.1 | Error Handling | ✅ | No server-side error pages or stack traces exposed to users |
| V9.1 | Communication Security | ⚠ | HTTPS enforcement is at the web server / CDN layer — not Astro's responsibility for static output. All documented deployment targets (GitHub Pages, GitLab Pages, Cloudflare, Netlify, Vercel) enforce TLS by default. Self-hosted deployments must configure this at the web server. |
| V14.4 | HTTP Security Headers | ⚠ | Security headers must be set at the CDN / web server level, not in static output. See recommended headers below. |

**Reference:** [OWASP ASVS on GitHub](https://github.com/OWASP/ASVS) · [OWASP ASVS Project Page](https://owasp.org/www-project-application-security-verification-standard/)

---

## Preview of Theme

![Astro Portfolio Theme Official Hero Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-1-hero.png "Imagine your name here on your own website")


![Astro Portfolio Theme Official About Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-2-about.png "When People Ask About You, now they know")


![Astro Portfolio Theme Official Exp Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-3-exp.png "Put your top experience level here")


![Astro Portfolio Theme Official Portfolio Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-4-portfolio.png "Showcase your work, art, portfolio")


![Astro Portfolio Theme Official Projects Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-5-projects.png "What Projects Do You Want To Pull Images On GitHub From")


![Astro Portfolio Theme Official Certifications Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-6-certifications.png "Formal or Informal Training - List it here")


![Astro Portfolio Theme Official Links Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-7-links.png "Do you have more than one link - great, there's a place for TWO")


![Astro Portfolio Theme Official Links Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-8-contact.png "Contact Me")


![Astro Portfolio Theme Official Footer Section](https://raw.githubusercontent.com/MarcusHoltz/marcusholtz.github.io/refs/heads/main/assets/img/posts/astro-portfolio-theme-9-footer.png "Footer, incase you forgot this wasnt instagram")

