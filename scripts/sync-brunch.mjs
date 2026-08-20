import fs from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('data/notes.json');
const fixture = process.env.BRUNCH_FIXTURE;
const magazineNo = process.env.BRUNCH_MAGAZINE_NO || '316789';
const authorHandle = process.env.BRUNCH_AUTHOR_HANDLE || 'mheeyoon';
const magazineUrl = process.env.BRUNCH_MAGAZINE_URL || 'https://brunch.co.kr/magazine/trying';

async function source() {
  if (fixture) return JSON.parse(await fs.readFile(fixture, 'utf8'));
  const firstUrl = `https://api.brunch.co.kr/v2/magazine/${magazineNo}/articles`;
  const articles = [];
  const visited = new Set();
  let nextUrl = firstUrl;

  while (nextUrl) {
    if (visited.has(nextUrl)) throw new Error('Brunch API 페이지 순환을 감지했습니다.');
    visited.add(nextUrl);
    const response = await fetch(nextUrl, {
      headers: { accept: 'application/json', referer: magazineUrl, 'user-agent': 'ESAY content sync' },
    });
    if (!response.ok) throw new Error(`Brunch API ${response.status}`);
    const page = await response.json();
    articles.push(...(page?.data?.list || page?.list || []));
    const next = page?.data?.nextUrl || page?.nextUrl;
    nextUrl = next ? new URL(next, firstUrl).href : null;
  }

  return { data: { list: articles } };
}

function normalize(raw) {
  const list = raw?.data?.list || raw?.list || [];
  const seen = new Set();
  return list
    .map((entry) => entry.article || entry)
    .filter((article) => {
      if (!article?.no || !article?.title || !article?.publishTime || seen.has(article.no)) return false;
      seen.add(article.no);
      return true;
    })
    .sort((a, b) => Number(b.publishTime) - Number(a.publishTime))
    .map((article, index) => ({
      id: `brunch-${article.no}`,
      title: article.title,
      slug: `brunch-${article.no}`,
      date: new Date(Number(article.publishTime)).toISOString().slice(0, 10),
      category: 'BRUNCH',
      tags: [],
      summary: article.subTitle || 'Brunch 매거진 「써보는 중」에 기록한 글입니다.',
      thumbnail: article.articleImageForHome?.replace(/^http:/, 'https:') || null,
      bodySource: 'brunch',
      videoUrl: null,
      externalUrl: `https://brunch.co.kr/@${authorHandle}/${article.no}`,
      featured: index === 0,
    }));
}

try {
  const data = normalize(await source());
  if (!data.length) throw new Error('정상 항목이 0건이므로 기존 파일을 보존합니다.');
  await fs.writeFile(output, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${data.length}개 Brunch 노트를 동기화했습니다.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
