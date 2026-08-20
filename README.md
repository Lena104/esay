# ESAY Website Codex Package

윤명희의 개인 웹사이트 **ESAY**를 GitHub Pages용 정적 웹사이트로 구현하기 위한 전달 패키지입니다.

홈페이지 콘텐츠 수정, 자동 동기화, 배포와 오류 해결 방법은 [ESAY 홈페이지 운영 안내서](OPERATIONS_GUIDE.md)를 참고하세요.

## 시작 방법

1. 이 폴더를 새 GitHub 저장소의 루트에 복사합니다.
2. Codex에 다음과 같이 요청합니다.

   > `CODEX_PROMPT.md를 먼저 읽고, PRD.md와 references의 시안을 기준으로 ESAY 홈페이지를 구현해줘.`

3. 구현 전 `PRD.md`의 공개 제외 정책과 `docs/`의 데이터 규칙을 확인합니다.
4. 실제 ID와 키는 코드에 넣지 말고 GitHub Actions Secrets/Variables로 설정합니다.

## 구성

```text
.
├── README.md
├── PRD.md
├── CODEX_PROMPT.md
├── docs/
│   ├── content-structure.md
│   ├── youtube-sync.md
│   └── calendar-sync.md
├── references/
│   ├── desktop-concept.png
│   └── responsive-desktop-mobile.png
└── sample-data/
    ├── notes.example.json
    ├── youtube-videos.example.json
    └── lecture-history.example.json
```

## 확정 원칙 요약

- 실명은 **윤명희**를 사용합니다. Lena는 메인 브랜드명으로 쓰지 않습니다.
- 시각 방향은 밝고 화사한 **Editorial Portfolio**입니다.
- Google Workspace Admin Toolkit을 대표 작업으로, Pin Canvas는 여러 실험 중 하나로 다룹니다.
- Canva YouTube 재생목록과 2개의 Google Calendar를 GitHub Actions로 동기화합니다.
- Calendar 공개 조건은 `visibility=public`이면서 제목이 `[강의]`로 시작하는 과거 일정입니다. 제목 앞·뒤 괄호는 기관명으로 분리합니다.
- 정적 사이트, 반응형, 접근성, 성능, 콘텐츠/레이아웃 분리를 우선합니다.

## 참고 이미지 주의

`references/` 이미지는 확정된 디자인 방향을 재구성한 시각 참고안입니다. 이미지 속 세부 카피·사진·날짜는 실제 콘텐츠가 아니라 레이아웃과 분위기 참고용이며, 구현 시 PRD와 실제 데이터가 우선합니다.

## V1 실행과 배포

외부 의존성이 없는 정적 사이트입니다. 저장소 루트에서 `python -m http.server 4173` 또는 원하는 정적 서버를 실행한 뒤 `http://localhost:4173/`을 엽니다. GitHub Pages는 저장소 루트를 배포 대상으로 설정하면 됩니다. 모든 내부 경로는 프로젝트 하위 경로에서도 동작하도록 상대 경로를 사용합니다.

콘텐츠는 `data/`에 분리되어 있으며 API 연결 전에도 샘플 데이터로 렌더링됩니다. 실제 운영 전 다음 GitHub 설정이 필요합니다.

- Secret: `YOUTUBE_API_KEY`
- Secret: `GOOGLE_SERVICE_ACCOUNT_JSON`
- Variable: `YOUTUBE_PLAYLIST_ID`
- Variable: `YOUTUBE_MAX_RESULTS` (선택, 기본 12)
- Variables: `GOOGLE_CALENDAR_ID_1`, `GOOGLE_CALENDAR_ID_2`

실제 이메일, SNS URL, YouTube 재생목록 ID, Calendar ID는 제공되지 않아 placeholder 상태입니다. Calendar는 읽기 전용 서비스 계정 방식으로 연결되며, 실패 시 기존 JSON을 보존합니다. 두 캘린더를 해당 서비스 계정에 공유해야 합니다. 커스텀 도메인 전환 시에만 `CNAME`을 추가하세요.

## 품질 확인

V1은 데스크톱 고정형 내비게이션과 모바일 전용 상단 메뉴, 키보드 포커스, Escape 닫기, 최소 44px 터치 영역, semantic landmark, `prefers-reduced-motion`을 포함합니다. Lighthouse 목표는 Performance, Accessibility, Best Practices, SEO 각 90 이상이며, 배포 URL과 실제 이미지가 확정된 뒤 최종 측정값을 기록해야 합니다.
