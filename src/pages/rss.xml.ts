/**
 * /rss.xml — 네이버 서치어드바이저·피드 리더 제출용 RSS 2.0.
 * 화면의 글 제목과 요약(summary)만 싣는다. 외부 패키지 없이 직접 만든다.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCategory } from '../lib/categories';

const SITE_NAME = '든든지원금';
const SITE_DESCRIPTION =
  '기초연금·노인장기요양보험·노인일자리·국민연금 수령 등 어르신 대상 정부지원 제도를 공식 자료 기반으로 정리해 전달하는 정보 사이트';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://betman0.com');
  const articles = (await getCollection('articles')).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  );
  const lastBuild = articles
    .map((a) => a.data.updatedAt.valueOf())
    .reduce((max, v) => Math.max(max, v), 0);

  const items = articles
    .map((a) => {
      const url = new URL(`/article/${a.id}/`, base).href;
      const category = getCategory(a.data.category)?.name;
      return `    <item>
      <title>${escapeXml(a.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(a.data.summary)}</description>${
        category ? `\n      <category>${escapeXml(category)}</category>` : ''
      }
      <dc:creator>권윤안</dc:creator>
      <pubDate>${a.data.publishedAt.toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${base.href}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko-KR</language>${lastBuild ? `\n    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>` : ''}
    <atom:link href="${new URL('/rss.xml', base).href}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
