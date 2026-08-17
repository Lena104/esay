# Content Structure

콘텐츠는 UI 코드와 분리한다. V1은 JSON을 사용하되 향후 Markdown으로 이전하기 쉽게 필드 의미를 유지한다.

## 디렉터리 권장안

```text
data/
├── site.json
├── projects.json
├── notes.json
├── canva-videos.json
└── lecture-history.json
```

## 공통 규칙

- ID는 안정적이고 중복되지 않아야 한다.
- 날짜는 `YYYY-MM-DD`, 날짜·시간은 ISO 8601을 사용한다.
- URL이 없으면 빈 문자열보다 `null`을 사용한다.
- 사용자에게 보여주는 한국어와 분류용 영문 enum을 분리한다.
- 외부 데이터는 필요한 공개 필드만 저장한다.
- HTML 문자열을 JSON에 저장하지 않는다.

## Note

필수: `id`, `title`, `slug`, `date`, `category`, `summary`, `featured`  
선택: `tags`, `thumbnail`, `bodySource`, `videoUrl`, `externalUrl`

`category`: `CANVA | AI | BUILD | EDUCATION`

## Project

필수: `id`, `title`, `category`, `summary`, `priority`, `status`  
선택: `image`, `url`, `technologies`, `outcomes`

권장 우선순위는 Admin Toolkit → Canva Education → Pin Canvas → Experiments다. 공개 허가가 없는 프로젝트는 데이터 파일에 만들지 않는다.

## YouTube item

필수: `id`, `title`, `publishedAt`, `thumbnailUrl`, `videoUrl`, `playlistId`  
선택: `description`, `position`

설명은 화면용 짧은 요약만 저장하며 불필요한 원문 전체 복제를 피한다.

## Lecture item

필수: `id`, `date`, `title`, `calendarSource`  
선택: `endDate`, `organization`, `audience`, `topic`, `type`, `allDay`

홈은 최신 6개를 사용한다. 전체 Training에서는 연도별로 묶는다. 시간, 참석자, 이메일, 내부 메모, 위치 상세, 회의 URL은 저장하지 않는다.

## 렌더링 상태

각 자동 영역은 세 상태를 제공한다.

- Loading: 짧고 접근 가능한 상태 문구
- Empty: 콘텐츠가 아직 없다는 안내와 전체 채널/문의 링크
- Error: 기존 캐시 데이터가 있으면 사용하고, 없으면 영역을 조용히 축소

