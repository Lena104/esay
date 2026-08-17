import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('data/canva-videos.json');
const key=process.env.YOUTUBE_API_KEY,playlistId=process.env.YOUTUBE_PLAYLIST_ID;
const fixture=process.env.YOUTUBE_FIXTURE;
async function source(){
  if(fixture)return JSON.parse(await fs.readFile(fixture,'utf8'));
  if(!key||!playlistId)throw new Error('YOUTUBE_API_KEY와 YOUTUBE_PLAYLIST_ID가 필요합니다.');
  const max=Math.min(Number(process.env.YOUTUBE_MAX_RESULTS||12),50);
  const url=new URL('https://www.googleapis.com/youtube/v3/playlistItems');url.search=new URLSearchParams({part:'snippet,contentDetails',playlistId,maxResults:String(max),key});
  const res=await fetch(url);if(!res.ok)throw new Error(`YouTube API ${res.status}`);return res.json();
}
function normalize(raw){
  const items=Array.isArray(raw)?raw:raw.items||[],seen=new Set();return items.map((item,index)=>{const s=item.snippet||item,id=item.contentDetails?.videoId||s.resourceId?.videoId||item.id;if(!id||seen.has(id)||s.title==='Deleted video'||s.title==='Private video')return null;seen.add(id);return{id,title:s.title,publishedAt:s.publishedAt,thumbnailUrl:s.thumbnails?.high?.url||s.thumbnailUrl||null,videoUrl:s.videoUrl||`https://www.youtube.com/watch?v=${id}`,playlistId:s.playlistId||playlistId||'fixture',description:String(s.description||'').slice(0,240),position:s.position??index}}).filter(Boolean).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
}
try{const data=normalize(await source());if(!data.length)throw new Error('정상 항목이 0건이므로 기존 파일을 보존합니다.');await fs.writeFile(output,JSON.stringify(data,null,2)+'\n');console.log(`${data.length}개 영상을 동기화했습니다.`)}catch(error){console.error(error.message);process.exitCode=1}
