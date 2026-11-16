# PLAN

## 지금
- 하던 것: 0단계 완료 (Cloudflare 엣지에서 조회·Run·Submit 모두 성공)
- 다음: [설계] 1단계 Worker 정식화 — 토큰·Origin·AUTH 에러
- 막힌 것: 없음
- 메모: 채팅에 노출된 쿠키는 배포 전 LeetCode 재로그인으로 교체. workers.dev 서브도메인 `khj59105` → `leetc-nobb` 변경 권장

## 단계 (각 단계: 완료 조건 확인 → 커밋 → 다음)

- [x] 0. 검증 — `wrangler dev --remote`로 GraphQL 조회, interpret→check, submit→check 3개 모두 결과 JSON 수신
- [ ] 1. Worker 정식화 — 토큰 없으면 401, 허용 안 된 Origin 차단, 쿠키 망가뜨리면 `{error:"AUTH"}`
- [ ] 2. 목록 — 파서 테스트 통과, 폰에서 주차별 목록·진행도 n/5·파싱 경고·slug 직접 입력·설정(Worker URL/토큰)
- [ ] 3. 문제 화면 — 폰에서 본문·예제 읽기 편함, 두 번째 열 때 캐시 사용
- [ ] 4. 에디터 — CM6, Python3/C++ 전환, 템플릿 시작, 단축키 줄, 새로고침해도 언어별 코드 유지
- [ ] 5. Run/Submit — 오답·컴파일 에러·런타임 에러·AC 각각 올바르게 표시, 쿠키 만료 시 "쿠키 갱신 필요"
- [ ] 6. PWA — 비행기 모드에서 연 적 있는 문제 읽기·편집 가능, Run은 "오프라인" 표시
- [ ] 7. 배포 — Pages 배포, 폰 홈 화면 설치, 실제 Submit 성공, README 정리

## 이해 부채
- (없음)
