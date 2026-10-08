import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.join(projectRoot, 'src', 'content', 'articles');

/**
 * 사이트맵 lastmod 계산용 — 글 frontmatter 의 updatedAt(없으면 publishedAt)을 읽는다.
 * astro.config 단계에서는 astro:content 를 쓸 수 없어서 frontmatter 를 직접 읽는다.
 */
function readArticleDates() {
  const articles = [];
  for (const file of readdirSync(articlesDir)) {
    if (!file.endsWith('.md')) continue;
    const text = readFileSync(path.join(articlesDir, file), 'utf-8');
    const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const updatedAt = front.match(/^updatedAt:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
    const publishedAt = front.match(/^publishedAt:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
    const category = front.match(/^category:\s*["']?([\w-]+)/m)?.[1];
    const date = updatedAt ?? publishedAt;
    if (date) articles.push({ slug: file.replace(/\.md$/, ''), category, date });
  }
  return articles;
}

/** 페이지 소스의 마지막 git 커밋 날짜. git 이 없는 빌드 환경(Cloudflare 등)에서는 undefined */
function gitDate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : undefined;
  } catch {
    return undefined;
  }
}

const articleDates = readArticleDates();
const latest = (items) => items.map((a) => a.date).sort().pop();

/** URL 경로 -> lastmod (모르면 지어내지 않고 생략) */
function lastmodFor(pathname) {
  const article = pathname.match(/^\/article\/([^/]+)\/?$/);
  if (article) return articleDates.find((a) => a.slug === article[1])?.date;
  const category = pathname.match(/^\/category\/([^/]+)\/?$/);
  if (category) return latest(articleDates.filter((a) => a.category === category[1]));
  if (pathname === '/') return latest(articleDates);
  const page = pathname.match(/^\/([\w-]+)\/?$/);
  if (page) return gitDate(`src/pages/${page[1]}.astro`);
  return undefined;
}

export default defineConfig({
  site: 'https://betman0.com',
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        const lastmod = lastmodFor(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
