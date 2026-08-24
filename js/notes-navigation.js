import { loadData } from './data-loader.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const seriesList = (await loadData('note-series.json', []))
  .slice()
  .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
const requestedId = new URLSearchParams(location.search).get('series');
const current = seriesList.find((series) => series.id === requestedId) || seriesList[0];

if (current) {
  const siteNav = document.querySelector('.sidebar nav');
  const notesLink = siteNav?.querySelector('a[href="notes.html"]');
  if (notesLink) {
    notesLink.setAttribute('aria-current', 'location');
    const context = document.createElement('div');
    context.className = 'notes-context-list';
    context.setAttribute('aria-label', 'NOTES 연재');
    context.innerHTML = `<a class="notes-context-all" href="notes.html">← 전체 NOTES</a>${seriesList.map((series) => `<a href="${esc(series.detailUrl)}"${series.id === current.id ? ' aria-current="page"' : ''}>${esc(series.title)}</a>`).join('')}`;
    notesLink.insertAdjacentElement('afterend', context);
  }

  const index = seriesList.findIndex((series) => series.id === current.id);
  const previous = seriesList[index - 1];
  const next = seriesList[index + 1];
  const mobile = document.createElement('nav');
  mobile.className = 'notes-mobile-context';
  mobile.setAttribute('aria-label', 'NOTES 상세 탐색');
  mobile.innerHTML = `<a href="notes.html">← NOTES 전체</a><span>${esc(current.title)}</span><div>${previous ? `<a href="${esc(previous.detailUrl)}" aria-label="이전 연재: ${esc(previous.title)}">←</a>` : '<i></i>'}${next ? `<a href="${esc(next.detailUrl)}" aria-label="다음 연재: ${esc(next.title)}">→</a>` : '<i></i>'}</div>`;
  document.querySelector('main')?.prepend(mobile);
}
