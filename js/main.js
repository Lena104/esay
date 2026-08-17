import {loadData,fallback} from './data-loader.js';
const $=(selector,root=document)=>root.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const date=value=>new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const menu=$('.menu-button'),sidebar=$('.sidebar');
menu?.addEventListener('click',()=>{const open=!sidebar.classList.contains('open');sidebar.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':''});
sidebar?.addEventListener('click',e=>{if(e.target.closest('a')&&innerWidth<=900){sidebar.classList.remove('open');menu?.setAttribute('aria-expanded','false');document.body.style.overflow=''}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sidebar?.classList.contains('open')){sidebar.classList.remove('open');menu?.setAttribute('aria-expanded','false');document.body.style.overflow='';menu?.focus()}});
async function renderHome(){
  const projectsRoot=$('[data-projects]');if(projectsRoot){const projects=await loadData('projects.json',fallback.projects);projectsRoot.innerHTML=projects.slice(0,4).map((p,i)=>`<article class="work-card"><div class="work-visual"><b>${esc(i===0?'ADMIN / TOOLS':i===1?'CANVA / EDU':i===2?'PIN / CANVAS':'SMALL / TESTS')}</b></div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p></article>`).join('')}
  const videosRoot=$('[data-videos]');if(videosRoot){const videos=await loadData('canva-videos.json',[]);if(!videos.length){videosRoot.innerHTML='<p class="status">새로운 Canva 콘텐츠를 준비 중입니다.</p>'}else{const [first,...rest]=videos;videosRoot.innerHTML=`<a class="featured-video" href="${esc(first.videoUrl)}" target="_blank" rel="noopener"><div class="video-thumb">CANVA<br>FIELD NOTE</div><div class="copy"><h3>${esc(first.title)}</h3><time datetime="${esc(first.publishedAt)}">${date(first.publishedAt)}</time><span>영상 보기 →</span></div></a><ul class="editorial-list">${rest.slice(0,3).map(v=>`<li><a href="${esc(v.videoUrl)}" target="_blank" rel="noopener"><time>${date(v.publishedAt)}</time><span>${esc(v.title)}</span><b>→</b></a></li>`).join('')}</ul>`;if(first.playlistId&&!first.playlistId.includes('PLACEHOLDER')){const link=$('[data-playlist-link]');link.href=`https://www.youtube.com/playlist?list=${encodeURIComponent(first.playlistId)}`;link.hidden=false}}}
  const lecturesRoot=$('[data-lectures]');if(lecturesRoot){const lectures=await loadData('lecture-history.json',[]);lecturesRoot.innerHTML=lectures.length?lectures.slice(0,6).map(l=>`<div class="lecture-row"><time datetime="${esc(l.date)}">${date(l.date)}</time><span>${esc(l.title)}</span><small>${esc(l.audience||l.organization||'')}</small></div>`).join(''):'<p class="status">공개 가능한 최근 강의 이력을 준비 중입니다.</p>'}
}
renderHome();
