# ESAY 홈페이지 운영 안내서

이 문서는 ESAY 홈페이지를 오랫동안 운영하면서 **어디에서 무엇을 수정해야 하는지** 빠르게 찾기 위한 안내서입니다.

- 공개 홈페이지: <https://esay.pages.dev/>
- GitHub 저장소: <https://github.com/Lena104/esay>
- 자동화 확인: <https://github.com/Lena104/esay/actions>

> 비밀번호, API 키, 서비스 계정 JSON은 이 문서나 소스 파일에 적지 않습니다. GitHub의 Secrets에만 보관합니다.

## 가장 자주 하는 일

| 하고 싶은 일 | 수정할 곳 | 반영 방법 |
|---|---|---|
| 앞으로의 강의 일정 추가 | 연결된 Google Calendar | 제목을 `[강의] 강의명 (기관명)`으로 입력하고, 일정이 지난 뒤 매일 자동 동기화 |
| 과거 강의 이력 수정 | `data/lecture-history.manual.json` | GitHub에서 수정 후 `main`에 병합하거나 직접 커밋 |
| Brunch 글 추가·제목 수정 | 연결된 Brunch 매거진·브런치북 | 매일 자동 동기화. 바로 반영하려면 `Sync public content` 수동 실행 |
| Canva 영상 추가·제목 수정 | 연결된 YouTube 재생목록 | 재생목록을 저장한 뒤 매일 자동 동기화 또는 수동 실행 |
| WORK 프로젝트 수정 | 관리용 Google Sheet의 `Work` 탭 | 수정 완료 5분 후 연결된 Apps Script가 동기화 요청 |
| 일반 프로젝트 상세 내용 수정 | 같은 시트의 `Work Details` 탭 | 수정 완료 5분 후 자동 반영 |
| Small Experiments 수정 | 같은 시트의 `Experiments` 탭 | 수정 완료 5분 후 자동 반영 |
| PinCanvas 전용 페이지 수정 | `work-pincanvas.html` 및 관련 CSS/이미지 | GitHub 코드 수정 후 `main` 반영 |
| 소개·연락처·메인 문구 수정 | `index.html`, `about.html` 등 HTML 파일 | GitHub 코드 수정 후 `main` 반영 |
| 색상·폰트·크기 수정 | `css/style.css` | GitHub 코드 수정 후 `main` 반영 |

## 배포가 이루어지는 방식

```text
코드가 main에 반영됨
        ↓
GitHub Actions: Deploy to Cloudflare Pages
        ↓
Cloudflare Pages
        ↓
https://esay.pages.dev/
```

GitHub의 `main` 브랜치에 변경이 들어가면 자동으로 배포됩니다. 보통 별도로 Cloudflare에서 버튼을 누를 필요는 없습니다.

배포 확인 방법:

1. GitHub 저장소에서 **Actions**를 엽니다.
2. 왼쪽에서 **Deploy to Cloudflare Pages**를 선택합니다.
3. 가장 위 실행 결과가 초록색 체크인지 확인합니다.
4. 홈페이지를 새로 엽니다. 이전 화면이 보이면 `Ctrl+F5`로 새로고침합니다.

## 강의 이력 관리

### 앞으로 추가하는 일정

연결된 Google Calendar에 다음처럼 입력합니다.

```text
[강의] 강의 제목 (기관명)
```

기관명을 앞에 두어도 됩니다.

```text
[강의] (기관명) 강의 제목
```

- `[강의]` 접두어는 필수입니다.
- 공개 상태가 `기본 공개`, `public` 또는 미지정이면 수집됩니다.
- `비공개(private)`와 `confidential` 일정은 제외됩니다.
- 취소된 일정과 아직 끝나지 않은 일정은 나오지 않습니다.
- 설명란은 비워도 됩니다.
- 두 캘린더 모두 서비스 계정에 읽기 권한으로 공유되어 있어야 합니다.

자동 동기화는 매일 1회 실행됩니다. 즉시 확인하려면 GitHub에서 다음 순서로 실행합니다.

1. **Actions** → **Sync public content**
2. **Run workflow** → 브랜치 `main`
3. 초록색 **Run workflow** 버튼

### 예전 강의 수정

접두어 규칙을 사용하기 전 이력은 `data/lecture-history.manual.json`에서 관리합니다. 날짜, 제목, 기관명, 유형 등을 수정한 뒤 `main`에 반영합니다. 자동 캘린더 데이터가 합쳐져 최종 `data/lecture-history.json`이 만들어집니다.

## Brunch NOTES 관리

현재 NOTES는 Brunch의 「Canva는 어디로 가고 있을까」, 「함께 건너는 중」, 「써보는 중」과 연결되어 있습니다.

- 홈의 **NOW WRITING** 카드는 `data/note-series.json`에서 `featured: true`인 연재로 연결됩니다.
- `notes.html`은 연재 목록, `notes-series.html?series=연재ID`는 해당 연재의 전체 공개 글 목록입니다.
- 개별 글을 누르면 Brunch 원문이 새 창에서 열립니다. 홈페이지에 본문을 복제하지 않습니다.
- 새 글을 연결된 매거진이나 브런치북에 공개하면 다음 동기화 때 NOTES에 나타납니다. 브런치북의 예약·미공개 글은 제외됩니다.
- 기존 글의 **제목, 부제목, 대표 이미지**를 Brunch에서 수정하면 다음 동기화 때 홈페이지 데이터도 갱신됩니다.
- 홈페이지의 요약은 Brunch 부제목을 사용합니다. 부제목이 없으면 기본 안내 문구가 표시됩니다.
- 새 연재를 추가하려면 `data/note-series.json`에 연결 정보와 순서를 한 번 등록합니다.

바로 갱신하려면 **Actions → Sync public content → Run workflow**를 실행합니다.

> Brunch 내부 API 구조가 변경되면 동기화가 실패할 수 있습니다. 이 경우 기존 NOTES 데이터는 지워지지 않습니다.

## YouTube · CANVA LAB NOTES 관리

연결된 YouTube 재생목록에 영상을 추가하고 저장하면 홈페이지가 다음 동기화 때 가져옵니다.

- 제목, 공개일, 썸네일과 영상 링크가 자동 반영됩니다.
- 삭제 영상과 비공개 영상은 제외됩니다.
- 동기화 오류가 발생해도 기존 영상 목록은 유지됩니다.
- 즉시 갱신: **Actions → Sync public content → Run workflow**

## WORK와 Small Experiments 관리

관리용 Google Sheet에는 다음 세 탭이 있습니다.

### `Work` 탭

프로젝트 목록 카드와 연결 방식을 관리합니다.

- `id`: 영문 소문자, 숫자, 하이픈만 사용하며 한 번 정하면 바꾸지 않는 것을 권장
- `visible`: `TRUE`인 항목만 공개
- `featured`: 대표 프로젝트 여부
- `sort_order`: 작은 숫자가 먼저 표시
- `technologies`: 여러 값은 `|`로 구분
- `thumbnail_url`: `https://` 이미지 또는 Google Drive 파일 링크
- `link_type`
  - `DETAIL`: 공통 상세 페이지 자동 생성
  - `CUSTOM`: 별도로 만든 전용 HTML 페이지 연결
  - `EXTERNAL`: 외부 사이트로 바로 연결
  - `NONE`: 링크 없음
- `link_url`: `CUSTOM` 또는 `EXTERNAL`일 때 사용

WORK 상세 페이지의 데스크톱 왼쪽 하위 메뉴와 모바일 이전·다음 탐색도 이 목록을 사용합니다. 따라서 `sort_order`, `title`, `visible`을 시트에서 바꾸면 다음 동기화 뒤 상세 페이지 탐색에도 같은 내용과 순서가 반영됩니다.

### `Work Details` 탭

`DETAIL` 프로젝트의 상세 페이지 섹션을 관리합니다.

- `project_id`: `Work` 탭의 `id`와 정확히 같아야 함
- `section_id`: 프로젝트 안에서 겹치지 않는 영문 식별자
- `visible`: `TRUE`인 섹션만 공개
- `sort_order`: 섹션 순서
- `heading`, `body`: 제목과 본문
- `image_url`: 섹션 이미지
- `button_label`, `button_url`: 선택 버튼

YouTube 영상을 페이지 안에서 바로 재생하려면 다음처럼 입력합니다.

- `section_type`: `VIDEO`
- `button_url`: `https://www.youtube.com/watch?v=...` 또는 `https://youtu.be/...` 형식의 영상 주소
- `button_label`: 선택값. 입력하면 플레이어 아래에 YouTube 원본 링크 버튼도 표시

일반 영상, YouTube Shorts, `youtu.be` 공유 주소를 지원합니다. 재생목록 주소는 영상 한 개의 주소가 아니므로 임베드되지 않습니다.

PinCanvas처럼 완전히 다른 화면 구성이 필요한 프로젝트는 `CUSTOM` 방식으로 전용 HTML과 CSS를 만들어야 합니다. 일반적인 소개·이미지·버튼 조합은 `DETAIL`로 추가하면 새 코드를 작성하지 않아도 됩니다.

### `Experiments` 탭

Small Experiments 목록을 관리합니다.

- `visible`: `TRUE`인 항목만 공개
- `tags`: 여러 태그는 `|`로 구분
- `url`: 실제 앱 링크
- `source_url`: GitHub 등 소스 링크
- `thumbnail_url`: `https://` 이미지 또는 Google Drive 파일 링크
- `sort_order`: 작은 숫자가 먼저 표시

시트를 연속해서 수정할 때마다 배포하지 않도록, 현재 Apps Script는 마지막 편집 후 약 5분간 추가 수정이 없을 때 GitHub 동기화를 요청하는 구조입니다.

즉시 수동 갱신하려면:

1. GitHub **Actions**
2. **Sync Work Content**
3. **Run workflow** → `main`

이미지가 깨지면 먼저 확인할 사항:

- URL이 `https://`로 시작하는지
- Google Drive 이미지가 서비스 계정과 공유되어 있는지
- PNG, JPG, WEBP, GIF 형식인지
- 파일 크기가 10MB 이하인지

동기화 시 외부 이미지는 저장소의 `images/work` 또는 `images/experiments`로 복사됩니다.

## 홈페이지 문구와 디자인 수정

| 영역 | 주요 파일 |
|---|---|
| 홈 | `index.html` |
| WORK 목록 | `work.html` |
| NOTES | `notes.html` |
| TRAINING | `training.html` |
| ABOUT·연락처 | `about.html` |
| 문의 양식 | `contact.html`, `js/contact.js` |
| PinCanvas | `work-pincanvas.html` |
| 공통 모양·반응형 | `css/style.css` |
| 공통 동작·데이터 로딩 | `js/main.js`, `js/data-loader.js` |
| 파비콘 | `favicon.svg` |

현재 CONTACT 문의 양식은 작성 내용을 정리해 방문자의 이메일 앱을 여는 방식입니다. 별도의 서버 저장 기능을 연결하기 전까지는 방문자가 이메일 앱에서 마지막 전송을 완료해야 합니다. 이메일과 카카오 오픈톡은 보조 연락 수단으로 계속 표시됩니다.

HTML이나 CSS를 수정할 때는 모바일 화면도 함께 확인합니다. `references/`는 디자인 참고 자료이므로 수정하지 않습니다.

## GitHub 설정값 보관 위치

GitHub 저장소에서 **Settings → Secrets and variables → Actions**로 이동합니다.

### Secrets

- `CLOUDFLARE_API_TOKEN`: Cloudflare 배포 권한
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Google 서비스 계정 JSON 전체 내용
- `YOUTUBE_API_KEY`: YouTube Data API 키

### Variables

- `CLOUDFLARE_ACCOUNT_ID`
- `GOOGLE_CALENDAR_ID_1`
- `GOOGLE_CALENDAR_ID_2`
- `GOOGLE_EXPERIMENTS_SHEET_ID`
- `GOOGLE_WORK_SHEET_ID` — 별도 Work 시트를 쓸 때 사용
- `YOUTUBE_PLAYLIST_ID`
- `YOUTUBE_MAX_RESULTS` — 선택값, 기본 12·최대 50

키를 새로 만들거나 교체할 때도 **이름은 그대로 두고 값만 변경**하면 됩니다.

## 문제가 생겼을 때

### 수정했는데 홈페이지가 그대로일 때

1. 수정한 내용이 저장되었는지 확인합니다.
2. GitHub **Actions**에서 해당 동기화가 실행됐는지 확인합니다.
3. 실행 결과가 빨간색이면 실패한 단계를 펼쳐 오류 메시지를 확인합니다.
4. 배포 작업이 초록색인지 확인합니다.
5. `Ctrl+F5`로 캐시를 비우고 새로고침합니다.

### Calendar 일정이 나오지 않을 때

- 일정이 이미 끝났는지
- 제목이 정확히 `[강의]`로 시작하는지
- 일정이 비공개가 아닌지
- 해당 캘린더 ID가 GitHub Variable에 등록되어 있는지
- 캘린더를 서비스 계정 이메일에 공유했는지 확인합니다.

### Sheet 수정이 반영되지 않을 때

- Apps Script 실행 기록에서 오류 확인
- 마지막 수정 후 5분이 지났는지 확인
- GitHub Actions의 **Sync Work Content** 실행 여부 확인
- 시트 탭 이름이 `Work`, `Work Details`, `Experiments`인지 확인
- `visible`이 `TRUE`인지 확인
- 서비스 계정에 시트가 공유되어 있는지 확인

### 자동 동기화가 실패할 때

기존 JSON은 가능한 한 보존되므로 사이트 전체가 바로 사라지지는 않습니다. GitHub Actions의 실패 단계 이름으로 범위를 좁힙니다.

- `Sync YouTube`: API 키, API 제한, 재생목록 ID 확인
- `Sync Brunch`: Brunch 매거진 또는 API 구조 확인
- `Sync Calendar`: 서비스 계정, 캘린더 공유, 캘린더 ID 확인
- `Read Experiments sheet` / `Read Work sheets`: 시트 ID, 탭 이름, 서비스 계정 공유 확인
- `Deploy production site`: Cloudflare 토큰과 Account ID 확인

## 안전하게 운영하는 원칙

- 작업 전후 GitHub 변경 내용을 확인합니다.
- 가능하면 별도 브랜치와 Pull Request를 사용하고, 확인 후 `main`에 병합합니다.
- Secrets 값을 코드, Issue, Pull Request, 화면 캡처에 넣지 않습니다.
- 자동 생성 파일(`data/notes.json`, `data/canva-videos.json`, `data/lecture-history.json`, `data/projects.json`, `data/work-details.json`, `data/experiments.json`)은 가급적 원본 서비스나 시트에서 수정합니다.
- 이미지와 링크는 공개해도 되는 자료만 사용합니다.
- 큰 변경 후에는 데스크톱과 모바일에서 메뉴, 링크, 줄바꿈을 확인합니다.

## 빠른 점검표

변경 후 아래 다섯 가지만 확인하면 됩니다.

- [ ] 원본(Calendar, Brunch, YouTube, Sheet 또는 코드)을 저장했는가?
- [ ] 관련 GitHub Action이 성공했는가?
- [ ] Cloudflare 배포가 성공했는가?
- [ ] 데스크톱과 모바일에서 확인했는가?
- [ ] 외부 링크와 이미지가 정상적으로 열리는가?
