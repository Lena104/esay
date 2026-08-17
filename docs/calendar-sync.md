# Google Calendar Lecture History Sync

## 목표

온라인/오프라인 강의가 섞인 지정 Google Calendar 2개를 강의 이력 CMS처럼 사용하되, 공개 조건을 모두 만족한 과거 일정만 사이트에 노출한다.

## 공개 조건

아래 조건을 **AND**로 적용한다.

1. 허용 목록의 Calendar 2개 중 하나
2. 종료 시점이 현재보다 과거
3. 이벤트 `visibility`가 명시적으로 `public`
4. 제목이 `[강의]`로 시작

출력 제목에서는 `[강의]`와 뒤따르는 공백을 제거한다. 맨 앞이나 맨 뒤 괄호는 기관명으로 분리한다. `visibility=default`는 공개로 간주하지 않는다. 취소된 일정은 제외한다.

## 흐름

```text
2 Google Calendars → filter/sanitize → GitHub Actions
→ data/lecture-history.json → Home latest 6 / Training yearly archive
```

접두어 규칙을 적용하기 전의 과거 이력은 `data/lecture-history.manual.json`에 직접 관리한다. 동기화 시 수동 이력과 `[강의]` 조건을 통과한 Calendar 이력을 합치고, ID 중복을 제거한 뒤 날짜 역순으로 `data/lecture-history.json`을 생성한다.

## 과거 이력 수동 입력

`data/lecture-history.manual.json`에 아래 형식으로 추가한다. `id`는 다른 항목과 겹치지 않는 영문 식별자를 사용한다.

```json
{
  "id": "manual-2025-04-15-ai-workshop",
  "date": "2025-04-15",
  "endDate": "2025-04-15",
  "title": "생성형 AI 활용 워크숍",
  "organization": "공개 가능한 기관명",
  "audience": "교사",
  "topic": "AI",
  "type": "Workshop",
  "calendarSource": "manual-history",
  "allDay": true
}
```

앞으로 자동 공개할 일정은 Calendar에서 `visibility`를 `public`으로 지정하고 제목 앞에 `[강의]`를 붙인다. 기관명은 `[강의] 강의명 (기관명)` 또는 `[강의] (기관명) 강의명` 형식으로 적는다. 설명란은 비워도 되며 과거 수동 이력에는 접두어가 필요 없다.

## 인증과 설정

권장 구현은 읽기 전용 서비스 계정 또는 적절한 read-only 인증이다. 두 Calendar는 해당 계정에 읽기 권한을 부여한다.

- Secret: `GOOGLE_SERVICE_ACCOUNT_JSON` 또는 동등한 최소 권한 자격증명
- Variables: `GOOGLE_CALENDAR_ID_1`, `GOOGLE_CALENDAR_ID_2`
- Scope: Calendar read-only

자격증명과 실제 Calendar ID는 소스나 로그에 남기지 않는다.

## 데이터 최소화

저장 허용: 날짜, 정제된 제목, 공개용 기관/대상/주제/유형, calendarSource 별칭, allDay 여부.  
저장 금지: 참석자, 이메일, 내부 설명 원문, 상세 위치, 화상회의 링크, 개인 메모, organizer 정보.

설명란에서 공개 메타데이터를 파싱한다면 다음 allowlist만 인정한다.

```text
기관: ...
대상: ...
주제: ...
유형: ...
```

알 수 없는 줄은 버린다.

## 정렬과 표시

- 날짜 역순 정렬
- 중복 ID 제거
- Home: 최근 6개
- Training: 연도별 그룹
- all-day 이벤트는 날짜만 표시
- 일정 시간과 timezone 세부값은 사이트에 노출하지 않는다.

## 안전 동작

- API 실패 시 기존 JSON을 유지한다.
- 필터 결과가 갑자기 0건이면 정상 빈 Calendar인지 확인할 수 있도록 workflow를 실패 또는 경고 처리하고 자동 덮어쓰지 않는다.
- 실제 Calendar API 없이 sample fixture로 필터 테스트를 만든다.
- `public`이지만 접두어가 없는 일정, 접두어가 있지만 private/default인 일정이 제외되는지 테스트한다.
