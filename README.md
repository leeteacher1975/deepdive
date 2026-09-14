# ZA2030 딥다이브세션 대시보드

딥다이브세션에서 쓰는 2단계 워크숍 대시보드입니다. 스포트라이트 세션 3개 보드(핵심요소/Evidence Hunt/액션아이템)와
같은 기술 패턴(Netlify Functions v2 + Netlify Blobs)을 쓰지만, **완전히 독립된 새 사이트/저장소**이고
데이터 저장소도 모두 별도라서 기존 보드에 영향을 주지 않습니다.

- **① Live Poll**: 익명 1~5점 라이브 투표
- **② Breakout Canvas**: 4개 그룹이 ZA2030 4대 요소 중 하나씩 맡아 깊이 토의하고 결과를 공유 캔버스에 기록

두 페이지 상단에는 같은 플로우 탭("① Live Poll → ② Breakout Canvas")이 있어 세션 흐름을 따라 이동할 수 있습니다.

## 파일 구성

```
deepdive-poll/
├── index.html                     # ① 참가자용 투표 화면 (QR로 접속하는 페이지)
├── host.html                      # ① 진행자용 실시간 결과 화면 (빔프로젝터/큰 화면)
├── breakout.html                  # ② Breakout Canvas — 작성하기/함께 보기 탭
├── netlify/functions/poll.js      # 투표 저장·집계·초기화 API (Netlify Functions v2)
├── netlify/functions/breakout.js  # Breakout Canvas 저장·조회·초기화 API (Netlify Functions v2)
├── netlify.toml                    # 빌드 설정 (esbuild 번들러)
├── package.json                     # @netlify/blobs 의존성 고정 (11.0.3)
└── README.md
```

## 배포 방법 (GitHub → Netlify)

1. 이 폴더 전체를 새 GitHub 저장소에 올립니다 (예: `za2030-deepdive-poll`).
2. Netlify에서 "Add new site → Import an existing project"로 방금 만든 GitHub 저장소를 연결합니다.
3. 빌드 설정은 `netlify.toml`에 이미 들어있어 별도 입력 없이 그대로 배포하면 됩니다
   (`npm install` 실행 + `netlify/functions` 폴더의 함수를 esbuild로 번들링).
4. Netlify 사이트 설정 → Environment variables 에서 `ADMIN_TOKEN` 값을 원하는 관리자 비밀번호로 설정합니다.
   (설정하지 않으면 기본값 `za2030admin`이 사용됩니다. Live Poll과 Breakout Canvas의 관리자 초기화가 같은
   값을 공유합니다.)
5. 배포가 끝나면:
   - **참가자 링크(폴)**: `https://<사이트주소>/` — 이 링크(또는 host.html에 자동 표시되는 QR)를 참가자에게 공유
   - **진행자 화면(폴)**: `https://<사이트주소>/host.html` — 발표 화면에 띄워두는 페이지, 또는 참가자 화면
     하단의 "진행자 화면 열기" 버튼을 눌러 비밀번호(기본값 `1234`, `index.html` 안의 `HOST_PASSWORD`
     상수에서 변경 가능)를 입력해도 이동할 수 있습니다.
   - **Breakout Canvas**: `https://<사이트주소>/breakout.html` — 각 그룹이 이 링크로 접속해 "작성하기" 탭에서
     자기 요소를 선택해 입력. 발표 화면에 전체를 띄우고 싶으면 `breakout.html?tab=together`로 접속하면
     "함께 보기" 탭이 바로 열립니다(host.html의 플로우 탭도 이 주소로 연결되어 있음).

## 동작 방식 — ① Live Poll

- 참가자가 1~5 중 하나를 탭하면 즉시 `/api/poll`로 전송되고, 바로 "제출 완료" 화면으로 전환됩니다.
- 이름/소속을 전혀 수집하지 않는 완전 익명 방식이며, 기기별 로컬 토큰으로 "같은 기기가 다시 투표하면
  이전 응답을 덮어쓰는" 방식이라 중복 집계 없이도 참가자가 마음이 바뀌면 다시 선택할 수 있습니다.
- 진행자 화면(`host.html`)은 2초 간격으로 자동 새로고침되며, 탭이 비활성화되면(다른 창으로 전환 시)
  폴링을 잠시 멈췄다가 다시 보이면 즉시 재개합니다.
- 진행자 화면 하단의 "관리자 · 전체 초기화" 버튼으로 비밀번호 확인 후 모든 응답을 지울 수 있어
  같은 사이트를 다음 딥다이브세션에서도 재사용할 수 있습니다.

## 동작 방식 — ② Breakout Canvas

- "작성하기" 탭에서 그룹이 4개 요소(Customer at the Core / Speed / Truly Global / High-Performance Team ZEISS)
  중 하나를 선택하면, 해당 요소의 Group Mission 문구와 4개 입력 칸(A. MEANING / B. ALREADY IN ACTION /
  C. DO DIFFERENTLY / D. EVIDENCE·EXAMPLE)이 나타납니다.
- 입력을 멈추면 약 1.2초 후 자동 저장되며(별도 저장 버튼 없음), 화면 하단에 "저장됨" 상태가 표시됩니다.
- "함께 보기" 탭은 4개 요소를 색상이 다른 4개 컬럼으로 나란히 보여주고, 2초 간격으로 자동 새로고침됩니다
  (탭이 보이지 않을 때는 폴링 일시중지).
- 한 요소를 저장할 때마다 그 요소의 4개 칸을 통째로 덮어쓰는 구조라, 같은 요소를 동시에 여러 기기에서
  편집하면 마지막 저장이 이전 저장을 덮어씁니다. 그룹당 보통 한 기기로 함께 입력하는 워크숍 상황에
  맞춘 단순한 구조이며, 아주 드물게 같은 요소를 두 기기가 동시에 저장하면 한쪽 내용이 씹힐 수 있습니다.
- "함께 보기" 탭 하단의 "관리자 · 전체 초기화" 버튼으로 비밀번호 확인 후 4개 요소의 캔버스 내용을 모두
  지울 수 있습니다(Live Poll과 같은 `ADMIN_TOKEN` 사용).

## 참고

- 원인 파악에 시간이 걸렸던 과거 트러블슈팅(v1 함수 방식으로 인한 `MissingBlobsEnvironmentError`)을
  피하기 위해 두 함수 모두 처음부터 v2 방식(`export default` + `config.path`)으로 작성했고,
  `getStore()` 호출을 try/catch로 감쌌습니다.
- 딥다이브세션에 활동이 더 추가되면 같은 방식(새 페이지 + 새 함수 + 새 Blobs 스토어)으로 이어서
  확장하고, 플로우 탭에 ③, ④를 추가하면 됩니다.
