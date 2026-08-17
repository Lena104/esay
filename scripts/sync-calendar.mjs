import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const output=path.resolve('data/lecture-history.json'),manualInput=path.resolve('data/lecture-history.manual.json'),fixture=process.env.CALENDAR_FIXTURE,manualOnly=process.env.CALENDAR_MANUAL_ONLY==='1';
const ids=[process.env.GOOGLE_CALENDAR_ID_1,process.env.GOOGLE_CALENDAR_ID_2].filter(Boolean);
function meta(description=''){return Object.fromEntries(description.split(/\r?\n/).map(line=>line.match(/^(기관|대상|주제|유형):\s*(.+)$/)).filter(Boolean).map(m=>[({기관:'organization',대상:'audience',주제:'topic',유형:'type'})[m[1]],m[2]]))}
function titleParts(summary=''){
  const clean=String(summary).replace(/^\[강의\]\s*/,'').trim();
  const leading=clean.match(/^\(([^()]+)\)\s*(.+)$/),trailing=clean.match(/^(.+?)\s*\(([^()]+)\)$/);
  if(leading)return{title:leading[2].trim(),organization:leading[1].trim()};
  if(trailing)return{title:trailing[1].trim(),organization:trailing[2].trim()};
  return{title:clean};
}
function normalize(raw){const now=new Date(),seen=new Set();return (raw.items||raw).map(e=>{const start=e.start?.date||e.start?.dateTime||e.date,end=e.end?.date||e.end?.dateTime||e.endDate||start,summary=String(e.summary||e.title||'');if(e.status==='cancelled'||e.visibility!=='public'||!summary.startsWith('[강의]')||new Date(end)>=now)return null;const id=e.id;if(!id||seen.has(id))return null;seen.add(id);return{id,date:String(start).slice(0,10),endDate:String(end).slice(0,10),...titleParts(summary),...meta(e.description),calendarSource:e.calendarSource||'public-training',allDay:Boolean(e.start?.date||e.allDay)}}).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date))}
async function manualHistory(){
  const data=JSON.parse(await fs.readFile(manualInput,'utf8'));
  if(!Array.isArray(data))throw new Error('lecture-history.manual.json은 배열이어야 합니다.');
  return data.map(item=>({...item,calendarSource:item.calendarSource||'manual-history'}));
}
function mergeHistory(manual,synced){
  const byId=new Map();
  for(const item of [...manual,...synced])if(item?.id&&!byId.has(item.id))byId.set(item.id,item);
  return [...byId.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
const b64=value=>Buffer.from(value).toString('base64url');
async function accessToken(){
  const account=JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON||'{}');
  if(!account.client_email||!account.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON이 필요합니다.');
  const now=Math.floor(Date.now()/1000),header=b64(JSON.stringify({alg:'RS256',typ:'JWT'})),claim=b64(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/calendar.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const unsigned=`${header}.${claim}`,signature=crypto.sign('RSA-SHA256',Buffer.from(unsigned),account.private_key).toString('base64url');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`})});
  if(!response.ok)throw new Error(`Google OAuth ${response.status}`);return (await response.json()).access_token;
}
async function source(){
  if(fixture)return JSON.parse(await fs.readFile(fixture,'utf8'));
  if(ids.length!==2)throw new Error('GOOGLE_CALENDAR_ID_1과 GOOGLE_CALENDAR_ID_2가 필요합니다.');
  const token=await accessToken(),all=[];
  for(const [index,id] of ids.entries()){
    let pageToken;
    do{const url=new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);url.search=new URLSearchParams({singleEvents:'true',orderBy:'startTime',timeMax:new Date().toISOString(),maxResults:'2500',...(pageToken?{pageToken}:{})});const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});if(!response.ok)throw new Error(`Calendar API ${response.status}`);const page=await response.json();all.push(...(page.items||[]).map(item=>({...item,calendarSource:`calendar-${index+1}`})));pageToken=page.nextPageToken}while(pageToken)
  }
  return {items:all};
}
try{const manual=await manualHistory();if(manualOnly){await fs.writeFile(output,JSON.stringify(mergeHistory(manual,[]),null,2)+'\n');console.log(`수동 이력 ${manual.length}개로 공개 데이터를 생성했습니다.`)}else{const synced=normalize(await source());if(!synced.length)throw new Error('공개 조건을 통과한 일정이 0건이므로 기존 파일을 보존합니다.');const data=mergeHistory(manual,synced);await fs.writeFile(output,JSON.stringify(data,null,2)+'\n');console.log(`수동 ${manual.length}개와 자동 ${synced.length}개를 합쳐 ${data.length}개 강의를 동기화했습니다.`)}}catch(error){console.error(error.message);process.exitCode=1}
