import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const output = path.resolve('data/experiments.json');
const fixture = process.env.EXPERIMENTS_FIXTURE;
const spreadsheetId = process.env.GOOGLE_EXPERIMENTS_SHEET_ID;
const sheetName = process.env.GOOGLE_EXPERIMENTS_SHEET_NAME || 'Experiments';
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
  if (!spreadsheetId) throw new Error('GOOGLE_EXPERIMENTS_SHEET_ID가 필요합니다.');
  const token = await accessToken();
  const range = encodeURIComponent(`'${sheetName}'!A:M`);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Google Sheets API ${response.status}: ${await response.text()}`);
  return response.json();
}

const truthy = (value) => ['true', '1', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
const url = (value) => /^https:\/\//i.test(String(value || '').trim()) ? String(value).trim() : null;

function normalize(raw) {
  const values = raw.values || raw;
  if (!Array.isArray(values) || values.length < 2) return [];
  const headers = values[0].map((value) => String(value).trim());
  const seen = new Set();
  return values.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))).filter((row) => truthy(row.visible)).map((row) => {
    const id = String(row.id || '').trim();
    if (!/^[a-z0-9-]+$/i.test(id) || !row.title || !row.category || seen.has(id)) return null;
    seen.add(id);
    return {
      id,
      title: String(row.title).trim(),
      category: String(row.category).trim().toUpperCase(),
      summary: String(row.summary || '').trim(),
      url: url(row.url),
      sourceUrl: url(row.source_url),
      thumbnailUrl: url(row.thumbnail_url),
      tags: String(row.tags || '').split('|').map((tag) => tag.trim()).filter(Boolean),
      status: String(row.status || 'ACTIVE').trim().toUpperCase(),
      featured: truthy(row.featured),
      sortOrder: Number(row.sort_order) || 999,
      updatedAt: String(row.updated_at || '').trim() || null,
    };
  }).filter(Boolean).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ko'));
}

try {
  const data = normalize(await source());
  if (!data.length) throw new Error('공개 가능한 실험 도구가 0건이므로 기존 파일을 보존합니다.');
  await fs.writeFile(output, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${data.length}개 Small Experiments 도구를 동기화했습니다.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
