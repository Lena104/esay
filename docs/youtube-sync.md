# YouTube Playlist Sync

## 목표

윤명희 YouTube 채널의 지정 Canva 재생목록을 ESAY의 `LATEST FROM CANVA` 데이터로 사용한다. 브라우저에서 API를 직접 호출하지 않고 GitHub Actions가 정적 JSON을 생성한다.

## 흐름

```text
YouTube playlist → GitHub Actions → data/canva-videos.json → GitHub Pages
```

## 설정값

- GitHub Secret: `YOUTUBE_API_KEY`
- GitHub Variable: `YOUTUBE_PLAYLIST_ID`
- 선택 Variable: `YOUTUBE_MAX_RESULTS` (기본 12)

키에는 최소 권한과 API 제한을 적용한다. 키를 HTML, JS, JSON, 로그에 출력하지 않는다.

## 수집/정규화 규칙

1. 지정 재생목록의 항목만 가져온다.
2. 삭제/비공개 영상, 유효한 video ID가 없는 항목은 제외한다.
3. video ID 기준으로 중복을 제거한다.
4. `publishedAt` 최신순으로 정렬한다.
5. 제목, 게시일, thumbnail URL, video URL, playlist ID와 필요한 짧은 설명만 저장한다.
6. 출력은 안정적인 key 순서와 trailing newline을 사용한다.
7. 결과가 이전 파일과 다를 때만 commit한다.

## 화면 규칙

- 최신 영상 1개를 가장 크게 표현한다.
- 나머지는 editorial list로 표현한다.
- 썸네일 3×3 반복 카드 갤러리는 사용하지 않는다.
- `VIEW PLAYLIST`는 실제 playlist URL로 연결한다.
- 썸네일에는 영상 제목 기반 alt text를 제공한다.

## 실행 주기

- 하루 1회 cron + `workflow_dispatch`
- cron은 UTC 기준임을 workflow 주석에 기록
- API 실패, quota 초과, 비정상 빈 응답 시 기존 JSON을 덮어쓰지 않는다.

## 로컬 개발

실제 키가 없으면 `sample-data/youtube-videos.example.json`을 `data/canva-videos.json`으로 복사해 사용한다. 테스트에서는 API fixture/mock을 사용하고 비밀값을 요구하지 않는다.

