import fs from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('data/notes.json');
const seriesFile = path.resolve('data/note-series.json');
const fixture = process.env.BRUNCH_FIXTURE;

const articleUrl = (authorHandle, articleNo) =>
  `https://brunch.co.kr/@${authorHandle}/${articleNo}`;

async function fetchText(url, accept = 'text/html') {
  const response = await fetch(url, {
    headers: { accept, referer: url, 'user-agent': 'ESAY content sync' },
  });
  if (!response.ok) throw new Error(`Brunch ${response.status}: ${url}`);
  return response.text();
}

async function fetchMagazine(series) {
  const firstUrl = `https://api.brunch.co.kr/v2/magazine/${series.magazineNo}/articles`;
  const articles = [];
  const visited = new Set();
  let nextUrl = firstUrl;

  while (nextUrl) {
    if (visited.has(nextUrl)) throw new Error('Brunch API 페이지 순환을 감지했습니다.');
    visited.add(nextUrl);
    const response = await fetch(nextUrl, {
      headers: {
        accept: 'application/json',
        referer: series.externalUrl,
        'user-agent': 'ESAY content sync',
      },
    });
    if (!response.ok) throw new Error(`Brunch API ${response.status}: ${series.id}`);
    const page = await response.json();
    articles.push(...(page?.data?.list || page?.list || []));
    const next = page?.data?.nextUrl || page?.nextUrl;
    nextUrl = next ? new URL(next, firstUrl).href : null;
  }

  return articles.map((entry) => entry.article || entry);
}

async function fetchBrunchbook(series) {
  const html = await fetchText(series.externalUrl);
  const encoded = html.match(/id=["']__BDFC__["'][^>]*>([^<]+)</i)?.[1]?.trim();
  if (!encoded) throw new Error(`Brunchbook 공개 데이터를 찾을 수 없습니다: ${series.id}`);
  const page = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  const profileId = page?.brunchbook?.masterProfileId || series.authorHandle;

  return (page?.brunchbookArticleList || [])
    .filter((article) => article.articleNo && !article.isArticlePlanned && article.publishTime)
    .map((article) => ({
      ...article,
      no: article.articleNo,
      profileId,
      articleImageForHome: article.thumbnail,
    }));
}

function toDate(article) {
  if (typeof article.publishTime === 'number') {
    return new Date(article.publishTime).toISOString().slice(0, 10);
  }
  if (typeof article.publishTimestamp === 'number') {
    return new Date(article.publishTimestamp).toISOString().slice(0, 10);
  }
  return String(article.publishTime).slice(0, 10);
}

function normalize(series, articles) {
  const seen = new Set();
  return articles
    .filter((article) => {
      if (!article?.no || !article?.title || !article?.publishTime || seen.has(article.no)) return false;
      seen.add(article.no);
      return true;
    })
    .sort((a, b) => String(b.publishTime).localeCompare(String(a.publishTime)))
    .map((article, index) => ({
      id: `brunch-${article.no}`,
      title: article.title,
      slug: `brunch-${article.no}`,
      date: toDate(article),
      category: 'BRUNCH',
      seriesId: series.id,
      tags: [],
      summary: article.subTitle || `Brunch ${series.label === 'BRUNCH BOOK' ? '브런치북' : '매거진'} 「${series.title}」에 기록한 글입니다.`,
      thumbnail: article.articleImageForHome?.replace(/^http:/, 'https:') || null,
      bodySource: 'brunch',
      videoUrl: null,
      externalUrl: articleUrl(article.profileId || series.authorHandle, article.no),
      featured: Boolean(series.featured && index === 0),
    }));
}

async function sourceSeries(series) {
  if (series.sourceType === 'brunchbook') return fetchBrunchbook(series);
  if (series.sourceType === 'magazine') return fetchMagazine(series);
  return [];
}

try {
  if (fixture) {
    const raw = JSON.parse(await fs.readFile(fixture, 'utf8'));
    const fallbackSeries = { id: 'trying', title: '써보는 중', label: 'BRUNCH MAGAZINE', authorHandle: 'mheeyoon' };
    const articles = (raw?.data?.list || raw?.list || []).map((entry) => entry.article || entry);
    const data = normalize(fallbackSeries, articles);
    if (!data.length) throw new Error('정상 항목이 0건이므로 기존 파일을 보존합니다.');
    await fs.writeFile(output, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`${data.length}개 Brunch 노트를 동기화했습니다.`);
  } else {
    const allSeries = JSON.parse(await fs.readFile(seriesFile, 'utf8'));
    const enabledSeries = allSeries.filter((series) => series.sourceType);
    const notes = [];

    for (const series of enabledSeries) {
      const articles = await sourceSeries(series);
      const normalized = normalize(series, articles);
      if (!normalized.length) throw new Error(`${series.title}의 공개 글이 0건이므로 기존 파일을 보존합니다.`);
      notes.push(...normalized);
      console.log(`${series.title}: ${normalized.length}개`);
    }

    notes.sort((a, b) => b.date.localeCompare(a.date));
    await fs.writeFile(output, `${JSON.stringify(notes, null, 2)}\n`);
    console.log(`총 ${notes.length}개 Brunch 노트를 동기화했습니다.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
