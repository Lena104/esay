const fallback = {
  projects: [
    {id:'admin-toolkit',title:'Google Workspace Admin Toolkit',category:'BUILD',summary:'사용자·계정·그룹 관리와 반복 관리 업무를 자동화하는 도구군.',priority:1,status:'Active'},
    {id:'canva-education',title:'Canva Education Projects',category:'EDUCATION',summary:'기능을 오디오북 워크숍과 실제 교육 결과물로 연결합니다.',priority:2,status:'Ongoing'},
    {id:'pin-canvas',title:'Pin Canvas',category:'EXPERIMENT',summary:'아이디어를 함께 정리하고 시각화하는 협업 캔버스 실험.',priority:3,status:'Experiment'}
  ]
};
export async function loadData(file, fallbackData=[]){
  try{const response=await fetch(new URL(`../data/${file}`,import.meta.url));if(!response.ok)throw new Error(response.status);const data=await response.json();return Array.isArray(data)&&data.length?data:fallbackData}catch(error){console.warn(`${file} 데이터 대신 내장 샘플을 사용합니다.`);return fallbackData}
}
export {fallback};
