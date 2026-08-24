import { loadData, fallback } from './data-loader.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const normalize = (value) => { const url = new URL(value, location.href); return `${url.pathname.split('/').pop().replace(/\.html$/i, '')}${url.search}`; };
const projects = (await loadData('projects.json', fallback.projects)).filter((project) => project.detailUrl && !project.external).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
const pageKey = `${location.pathname.split('/').pop().replace(/\.html$/i, '')}${location.search}`;
const current = projects.find((project) => normalize(project.detailUrl) === pageKey);

if (current) {
  const siteNav = document.querySelector('.sidebar nav');
  const workLink = siteNav?.querySelector('a[href="work.html"]');
  if (workLink) {
    workLink.setAttribute('aria-current', 'location');
    const context = document.createElement('div');
    context.className = 'work-context-list';
    context.setAttribute('aria-label', 'WORK 프로젝트');
    context.innerHTML = `<a class="work-context-all" href="work.html">← 전체 작업</a>${projects.map((project) => `<a href="${esc(project.detailUrl)}"${project.id === current.id ? ' aria-current="page"' : ''}>${esc(project.title)}</a>`).join('')}`;
    workLink.insertAdjacentElement('afterend', context);
  }

  const index = projects.findIndex((project) => project.id === current.id);
  const previous = projects[index - 1];
  const next = projects[index + 1];
  const mobile = document.createElement('nav');
  mobile.className = 'work-mobile-context';
  mobile.setAttribute('aria-label', 'WORK 상세 탐색');
  mobile.innerHTML = `<a href="work.html">← WORK 전체</a><span>${esc(current.title)}</span><div>${previous ? `<a href="${esc(previous.detailUrl)}" aria-label="이전 프로젝트: ${esc(previous.title)}">←</a>` : '<i></i>'}${next ? `<a href="${esc(next.detailUrl)}" aria-label="다음 프로젝트: ${esc(next.title)}">→</a>` : '<i></i>'}</div>`;
  document.querySelector('main')?.prepend(mobile);
}
