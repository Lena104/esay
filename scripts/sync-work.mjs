import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.env.WORK_OUTPUT_DIR || '.');
const projectsOutput = path.join(root, 'data/projects.json');
const detailsOutput = path.join(root, 'data/work-details.json');
const imageDirectory = path.join(root, 'images/work');
const fixture = process.env.WORK_FIXTURE;
const spreadsheetId = process.env.GOOGLE_WORK_SHEET_ID || process.env.GOOGLE_EXPERIMENTS_SHEET_ID;
const b64 = (value) => Buffer.from(value).toString('base64url');

async function accessToken() {
  const account = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  if (!account.client_email || !account.private_key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON이 필요합니다.');
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64(JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }) });
  if (!response.ok) throw new Error(`Google OAuth ${response.status}`);
  return (await response.json()).access_token;
}

async function source() {
  if (fixture) return JSON.parse(await fs.readFile(fixture, 'utf8'));
  if (!spreadsheetId) throw new Error('GOOGLE_EXPERIMENTS_SHEET_ID 또는 GOOGLE_WORK_SHEET_ID가 필요합니다.');
  const token = await accessToken();
  const query = new URLSearchParams();
  query.append('ranges', "'Work'!A:M");
  query.append('ranges', "'Work Details'!A:J");
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${query}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Google Sheets API ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return { work: data.valueRanges?.[0] || {}, details: data.valueRanges?.[1] || {} };
}

const truthy = (value) => ['true', '1', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
const httpsUrl = (value) => /^https:\/\//i.test(String(value || '').trim()) ? String(value).trim() : null;
const localUrl = (value) => /^[a-z0-9-]+\.html(?:\?id=[a-z0-9-]+)?$/i.test(String(value || '').trim()) ? String(value).trim() : null;
const imageUrl = (value) => {
  const safe = httpsUrl(value);
  if (!safe) return null;
  const driveId = safe.match(/drive\.google\.com\/file\/d\/([^/]+)/i)?.[1];
  return driveId ? `https://drive.google.com/uc?export=view&id=${driveId}` : safe;
};
const rows = (raw) => {
  const values = raw?.values || raw;
  if (!Array.isArray(values) || values.length < 2) return [];
  const headers = values[0].map((value) => String(value).trim());
  return values.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
};

function normalizeProjects(raw) {
  const seen = new Set();
  return rows(raw).filter((row) => truthy(row.visible)).map((row) => {
    const id = String(row.id || '').trim().toLowerCase();
    const linkType = String(row.link_type || 'NONE').trim().toUpperCase();
    if (!/^[a-z0-9-]+$/.test(id) || !row.title || !row.category || seen.has(id)) return null;
    seen.add(id);
    let detailUrl = null;
    let external = false;
    if (linkType === 'DETAIL') detailUrl = `work-detail.html?id=${id}`;
    if (linkType === 'CUSTOM') detailUrl = localUrl(row.link_url) || httpsUrl(row.link_url);
    if (linkType === 'EXTERNAL') { detailUrl = httpsUrl(row.link_url); external = Boolean(detailUrl); }
    return {
      id,
      title: String(row.title).trim(),
      category: String(row.category).trim().toUpperCase(),
      summary: String(row.summary || '').trim(),
      status: String(row.status || 'ACTIVE').trim().toUpperCase(),
      technologies: String(row.technologies || '').split('|').map((item) => item.trim()).filter(Boolean),
      thumbnailUrl: imageUrl(row.thumbnail_url),
      linkType,
      detailUrl,
      external,
      featured: truthy(row.featured),
      sortOrder: Number(row.sort_order) || 999,
      updatedAt: String(row.updated_at || '').trim() || null,
    };
  }).filter(Boolean).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ko'));
}

function normalizeDetails(raw, projectIds) {
  const seen = new Set();
  return rows(raw).filter((row) => truthy(row.visible)).map((row) => {
    const projectId = String(row.project_id || '').trim().toLowerCase();
    const sectionId = String(row.section_id || '').trim().toLowerCase();
    const key = `${projectId}/${sectionId}`;
    if (!projectIds.has(projectId) || !/^[a-z0-9-]+$/.test(sectionId) || seen.has(key)) return null;
    seen.add(key);
    return {
      projectId,
      sectionId,
      sectionType: String(row.section_type || 'TEXT').trim().toUpperCase(),
      heading: String(row.heading || '').trim(),
      body: String(row.body || '').trim(),
      imageUrl: imageUrl(row.image_url),
      buttonLabel: String(row.button_label || '').trim(),
      buttonUrl: localUrl(row.button_url) || httpsUrl(row.button_url),
      sortOrder: Number(row.sort_order) || 999,
    };
  }).filter(Boolean).sort((a, b) => a.projectId.localeCompare(b.projectId) || a.sortOrder - b.sortOrder);
}

async function cacheImage(item, field, filenameBase) {
  const remote = item[field];
  if (!remote) return item;
  try {
    const response = await fetch(remote, { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
    const extension = new Map([['image/png','png'],['image/jpeg','jpg'],['image/webp','webp'],['image/gif','gif']]).get(contentType);
    if (!extension) throw new Error(`지원하지 않는 형식: ${contentType || 'unknown'}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error(`잘못된 이미지 크기: ${bytes.length} bytes`);
    await fs.mkdir(imageDirectory, { recursive: true });
    const filename = `${filenameBase}.${extension}`;
    await fs.writeFile(path.join(imageDirectory, filename), bytes);
    return { ...item, [field]: `images/work/${filename}` };
  } catch (error) {
    console.warn(`[${filenameBase}] 이미지를 저장하지 못해 기본 카드로 표시합니다: ${error.message}`);
    return { ...item, [field]: null };
  }
}

try {
  const raw = await source();
  const normalizedProjects = normalizeProjects(raw.work);
  if (!normalizedProjects.length) throw new Error('공개 가능한 WORK 프로젝트가 0건이므로 기존 파일을 보존합니다.');
  const projectIds = new Set(normalizedProjects.map((project) => project.id));
  const normalizedDetails = normalizeDetails(raw.details, projectIds);
  const projects = await Promise.all(normalizedProjects.map((project) => cacheImage(project, 'thumbnailUrl', project.id)));
  const details = await Promise.all(normalizedDetails.map((section) => cacheImage(section, 'imageUrl', `${section.projectId}-${section.sectionId}`)));
  await fs.mkdir(path.dirname(projectsOutput), { recursive: true });
  await fs.writeFile(projectsOutput, `${JSON.stringify(projects, null, 2)}\n`);
  await fs.writeFile(detailsOutput, `${JSON.stringify(details, null, 2)}\n`);
  console.log(`${projects.length}개 WORK 프로젝트와 ${details.length}개 상세 섹션을 동기화했습니다.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
