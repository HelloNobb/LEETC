# 설계 결정

## D1. 프론트 프레임워크
- 문제: 화면 4개(목록/문제/결과/설정), 상태 따라 바뀌는 결과 패널. DOM 직접 조작은 금방 지저분해짐
- 옵션: Vanilla TS / Preact / Svelte
- 선택: Preact
- 이유: 4KB, JSX + hooks로 선언형 UI. React 지식 그대로
- 대가: 의존성 1개. CodeMirror는 Preact 밖에서 ref로 붙여야 함
- 내가 이해한 흐름:

## D2. Run/Submit 폴링 위치
- 문제: LeetCode는 실행 요청 후 id만 주고, 결과는 `/check/` 반복 조회로 받음
- 옵션: 폰이 Worker `/check/:id`를 1초 간격 호출 / Worker 안에서 폴링 후 한 번에 응답
- 선택: 폰이 폴링
- 이유: 요청 하나가 짧아 지하철에서 끊겨도 재시도로 이어짐. Worker 무료 플랜 하위 요청 50개 제한 무관
- 대가: 폰↔Worker 왕복이 늘어남
- 내가 이해한 흐름:

## D3. 주간 진행도(Accepted) 출처
- 옵션: 로컬 기록(IndexedDB) / LeetCode GraphQL `status` 조회
- 선택: 로컬 기록
- 이유: 오프라인에서도 보임, 추가 인증 요청 없음
- 대가: PC 등 다른 곳에서 푼 건 반영 안 됨
- 내가 이해한 흐름:

## D4. "이번 주" 판정
- 옵션: PROBLEMS.md 마지막 섹션 / `26-11-w3` 라벨을 오늘 날짜와 비교
- 선택: 마지막 섹션 (추천안, 별도 반대 없어 채택)
- 이유: 단순, "월의 몇째 주" 정의 모호함 회피
- 대가: 새 주차 섹션을 안 올리면 지난주가 계속 "이번 주"
- 내가 이해한 흐름:

## D5. 외부 패키지
- 선택 (추천안, 별도 반대 없어 채택): `codemirror` + `@codemirror/lang-python`·`lang-cpp`·`theme-one-dark`, `vite-plugin-pwa`, `idb-keyval`, `dompurify`, `wrangler`(dev)
- 이유: 에디터는 요구사항. SW 캐시 목록 수동 관리는 배포마다 어긋나기 쉬움. 날것 IndexedDB는 코드가 길어짐. 본문 HTML을 innerHTML로 넣으므로 정화 필수(토큰 탈취 방지)
- 대가: 번들 크기 증가(CodeMirror가 대부분)
- 내가 이해한 흐름:
