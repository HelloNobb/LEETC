# PLAN

## 지금
- 하던 것: 7단계 — Worker 배포·secret 완료(https://leetc-proxy.khj59105.workers.dev), GitHub push·Pages 배포
- 다음: 폰에서 설치 → 설정에 토큰(`worker/.access-token`) 입력 → 실제 Submit
- 막힌 것: 없음
- 메모: PROBLEMS.md를 새 형식으로 바꿔야 목록이 채워짐. 서브도메인을 바꾸면 `web/.env.production`도 수정

## 단계 (각 단계: 완료 조건 확인 → 커밋 → 다음)

- [x] 0. 검증 — `wrangler dev --remote`로 GraphQL 조회, interpret→check, submit→check 3개 모두 결과 JSON 수신
- [x] 1. Worker 정식화 — 토큰 없으면 401, 허용 안 된 Origin 차단, 쿠키 망가뜨리면 `{error:"AUTH"}`
- [x] 2. 목록 — 파서 테스트 통과, 주차별 목록·진행도 n/총·파싱 경고·slug 직접 입력·설정(Worker URL/토큰)
- [x] 3. 문제 화면 — 본문·예제 표시, 두 번째 열 때 IndexedDB 캐시 사용
- [x] 4. 에디터 — CM6, Python3/C++ 전환, 템플릿 시작, 단축키 줄, 새로고침해도 언어별 코드 유지
- [x] 5. Run/Submit — Run Accepted·C++ 컴파일 에러·Submit Accepted·쿠키 만료 배너 확인 (오답·런타임 에러 화면은 실제로 못 봄)
- [x] 6. PWA — 서버 둘 다 끈 상태에서 연 적 있는 문제 열림, Run은 "오프라인" 표시
- [ ] 7. 배포 — Pages 배포, 폰 홈 화면 설치, 실제 폰에서 Submit 성공 (README 2~4절)

## 확인 못 한 것 (실제 폰에서 볼 것)
- [ ] 단축키 줄 탭할 때 키보드가 안 닫히는지 (iOS Safari, Android Chrome)
- [ ] Android에서 키보드가 올라오면 단축키 줄이 키보드 위에 보이는지
- [ ] Submit 오답·런타임 에러 결과 화면 (필드명 `code_output`, `expected_output`, `last_testcase`는 추정)

## 이해 부채 ("전부 진행"으로 건너뜀 → 1·6단계로 갚기)
- [ ] 1단계 Worker: 토큰 비교(timingSafeEqual), Origin 검사와 CORS preflight, LeetCode 응답 → 에러 코드 매핑 흐름
- [ ] 2단계 목록: 정규식 파서, 해시 라우팅
- [ ] 3·4단계: IndexedDB 캐시 순서, Editor의 useEffect 정리 함수가 코드를 저장하는 이유, pointerdown preventDefault
- [ ] 5단계: 폰 폴링 루프와 재시도 조건, Run 정답 판정(`correct_answer`)
- [ ] 6단계: 서비스 워커가 캐시하는 것(앱 셸·목록·이미지)과 IndexedDB가 맡는 것의 분리
