# ZA2030 딥다이브세션 대시보드

딥다이브세션에서 쓰는 5단계 워크숍 대시보드입니다. 스포트라이트 세션 3개 보드(핵심요소/Evidence Hunt/액션아이템)와
같은 기술 패턴(Netlify Functions v2 + Netlify Blobs)을 쓰지만, **완전히 독립된 새 사이트/저장소**이고
데이터 저장소도 모두 별도라서 기존 보드에 영향을 주지 않습니다.

- **① Live Poll**: 익명 1~5점 라이브 투표
- **② Breakout Canvas**: 4개 그룹이 ZA2030 4대 요소 중 하나씩 맡아 깊이 토의하고 결과를 공유 캔버스에 기록
- **③ Clustering Matrix**: 각 그룹 발표를 들으며 떠오른 키워드를 Impact × Effort 2x2 매트릭스 위에 올려 함께 보는 보드
- **④ Prioritization**: Clustering Matrix의 QUICK WINS·STRATEGIC MOVES(①②사분면)에서 나온 후보 중 Top 2~3
  액션을 라이브 투표로 좁히고, 진행자가 토론 후 최종 확정하는 보드
- **⑤ Action Card**: 확정된 Top 2~3 우선순위를 대전제로, 참석자 각자가 자신의 액션(ACTION/WHY/OWNER/
  FIRST STEP/WHEN)을 기록·제출하는 보드

모든 페이지 상단에는 같은 플로우 탭("① Live Poll → ② Breakout Canvas → ③ Clustering Matrix →
④ Prioritization → ⑤ Action Card")이 있어 세션 흐름을 따라 이동할 수 있습니다.

## 파일 구성

```
deepdive-poll/
├── index.html                       # ① 참가자용 투표 화면 (QR로 접속하는 페이지)
├── host.html                        # ① 진행자용 실시간 결과 화면 (빔프로젝터/큰 화면)
├── breakout.html                    # ② Breakout Canvas — 작성하기/함께 보기 탭
├── clustering.html                  # ③ 참가자용 키워드 제출 화면
├── clustering-host.html             # ③ 진행자용 실시간 매트릭스 화면 (빔프로젝터/큰 화면)
├── prioritize.html                  # ④ 참가자용 우선순위 투표 화면
├── prioritize-host.html             # ④ 진행자용 후보 관리·투표 현황·최종 확정 화면 (빔프로젝터/큰 화면)
├── actioncard.html                  # ⑤ 참가자용 액션카드 작성·제출 화면
├── actioncard-host.html             # ⑤ 진행자용 액션카드 실시간 취합 화면 (빔프로젝터/큰 화면)
├── netlify/functions/poll.js        # 투표 저장·집계·초기화 API (Netlify Functions v2)
├── netlify/functions/breakout.js    # Breakout Canvas 저장·조회·초기화 API (Netlify Functions v2)
├── netlify/functions/clustering.js  # Clustering Matrix 저장·조회·초기화 API (Netlify Functions v2)
├── netlify/functions/prioritize.js  # Prioritization 저장·집계·초기화 API (Netlify Functions v2)
├── netlify/functions/actioncard.js  # Action Card 저장·조회·초기화 API (Netlify Functions v2)
├── netlify.toml                      # 빌드 설정 (esbuild 번들러)
├── package.json                       # @netlify/blobs 의존성 고정 (11.0.3)
└── README.md
```

## 배포 방법 (GitHub → Netlify)

1. 이 폴더 전체를 새 GitHub 저장소에 올립니다 (예: `za2030-deepdive-poll`).
2. Netlify에서 "Add new site → Import an existing project"로 방금 만든 GitHub 저장소를 연결합니다.
3. 빌드 설정은 `netlify.toml`에 이미 들어있어 별도 입력 없이 그대로 배포하면 됩니다
   (`npm install` 실행 + `netlify/functions` 폴더의 함수를 esbuild로 번들링).
4. Netlify 사이트 설정 → Environment variables 에서 `ADMIN_TOKEN` 값을 원하는 관리자 비밀번호로 설정합니다.
   (설정하지 않으면 기본값 `za2030admin`이 사용됩니다. 세 활동의 관리자 초기화가 모두 같은 값을 공유합니다.)
5. 배포가 끝나면:
   - **참가자 링크(폴)**: `https://<사이트주소>/` — 이 링크(또는 host.html에 자동 표시되는 QR)를 참가자에게 공유
   - **진행자 화면(폴)**: `https://<사이트주소>/host.html` — 발표 화면에 띄워두는 페이지, 또는 참가자 화면
     하단의 "진행자 화면 열기" 버튼을 눌러 비밀번호(기본값 `1234`, `index.html` 안의 `HOST_PASSWORD`
     상수에서 변경 가능)를 입력해도 이동할 수 있습니다.
   - **Breakout Canvas**: `https://<사이트주소>/breakout.html` — 각 그룹이 이 링크로 접속해 "작성하기" 탭에서
     자기 요소를 선택해 입력. 발표 화면에 전체를 띄우고 싶으면 `breakout.html?tab=together`로 접속하면
     "함께 보기" 탭이 바로 열립니다(host.html의 플로우 탭도 이 주소로 연결되어 있음).
   - **Clustering Matrix 참가자용**: `https://<사이트주소>/clustering.html` — 발표를 들으며 참가자들이
     각자 폰으로 접속해 키워드를 올리는 화면
   - **Clustering Matrix 진행자용**: `https://<사이트주소>/clustering-host.html` — 발표 화면에 띄워두는
     실시간 매트릭스 보드
   - **Prioritization 참가자용**: `https://<사이트주소>/prioritize.html` — 후보 액션 중 3표를 나눠 투표하는 화면
   - **Prioritization 진행자용**: `https://<사이트주소>/prioritize-host.html` — 후보 가져오기/관리, 실시간
     투표 현황, 최종 Top 2~3 확정 및 결정 문장 입력 화면
   - **Action Card 참가자용**: `https://<사이트주소>/actioncard.html` — 확정된 우선순위를 참고해 각자
     자신의 액션카드를 작성·제출하는 화면
   - **Action Card 진행자용**: `https://<사이트주소>/actioncard-host.html` — 우선순위별로 묶어 실시간
     취합해 보여주는 화면

## 동작 방식 — ① Live Poll

- 참가자가 1~5 중 하나를 탭하면 즉시 `/api/poll`로 전송되고, 바로 "제출 완료" 화면으로 전환됩니다.
- 이름/소속을 전혀 수집하지 않는 완전 익명 방식이며, 기기별 로컬 토큰으로 "같은 기기가 다시 투표하면
  이전 응답을 덮어쓰는" 방식이라 중복 집계 없이도 참가자가 마음이 바뀌면 다시 선택할 수 있습니다.
- 진행자 화면(`host.html`)은 2초 간격으로 자동 새로고침되며, 탭이 비활성화되면(다른 창으로 전환 시)
  폴링을 잠시 멈췄다가 다시 보이면 즉시 재개합니다.
- 진행자 화면 하단의 "관리자 · 전체 초기화" 버튼으로 비밀번호 확인 후 모든 응답을 지울 수 있어
  같은 사이트를 다음 딥다이브세션에서도 재사용할 수 있습니다.
- 관리자가 전체 초기화를 하면 서버에 새로운 초기화 시각(`resetAt`)이 함께 기록됩니다. 참가자 화면은
  로컬에 "이미 투표함" 기록이 남아있어도 페이지를 다시 열 때마다 서버의 `resetAt`과 대조해, 그 사이
  초기화가 있었다면 로컬 기록을 자동으로 지우고 새로 투표할 수 있게 합니다(2026-09-14 수정 —
  초기화 후에도 참가자 화면에 예전 응답이 계속 남아 보이던 문제 해결).

## 동작 방식 — ② Breakout Canvas

- "작성하기" 탭에서 그룹이 4개 요소(Customer at the Core / Speed / Truly Global / High-Performance Team ZEISS)
  중 하나를 선택하면, 해당 요소의 Group Mission 문구, "참여자(소속·이름)" 입력 칸 1개, 그리고 4개 입력 칸
  (A. MEANING / B. ALREADY IN ACTION / C. DO DIFFERENTLY / D. EVIDENCE·EXAMPLE)이 나타납니다. 참여자 칸도
  다른 칸과 동일하게 자동저장/실시간 동기화 대상이며, CSV와 "함께 보기" 화면에도 함께 표시됩니다
  (2026-09-14 추가 — 이 활동은 다른 두 활동과 달리 익명이 아니라서 누가 참여했는지 남길 수 있게 함).
- 입력을 멈추면 약 1.2초 후 그 **칸 하나만** 자동 저장됩니다(별도 저장 버튼 없음, 칸마다 저장 상태 표시).
  같은 요소의 다른 3칸은 건드리지 않으므로, 그룹원 4명이 각자 다른 기기로 A/B/C/D 칸을 하나씩 맡아 **동시에**
  입력해도 서로 덮어쓰지 않습니다. 또한 작성하기 화면은 3초 간격으로 서버 최신 값을 확인해, 내가 지금
  타이핑 중이지 않은 칸에는 다른 그룹원이 입력한 내용이 자동으로 반영됩니다(내가 커서를 두고 있거나
  아직 저장 안 된 칸은 덮어쓰지 않음). 다만 같은 칸(예: 둘 다 "MEANING")을 두 사람이 동시에 타이핑하는
  경우는 지원하지 않으며, 이때는 나중에 저장되는 쪽 내용이 최종 반영됩니다 — 칸을 나눠서 작성하는 것을
  추천합니다.
- "함께 보기" 탭은 4개 요소를 색상이 다른 4개 컬럼으로 나란히 보여주고, 2초 간격으로 자동 새로고침됩니다
  (탭이 보이지 않을 때는 폴링 일시중지).
- "함께 보기" 탭 상단의 "CSV 다운로드" 버튼으로 4개 요소 × (Group Mission, A~D 4개 항목, 마지막 업데이트
  시각) 표를 CSV 파일로 내려받을 수 있습니다(엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 포함).
- "함께 보기" 탭 하단의 "관리자 · 전체 초기화" 버튼으로 비밀번호 확인 후 4개 요소의 캔버스 내용을 모두
  지울 수 있습니다(Live Poll과 같은 `ADMIN_TOKEN` 사용).

## 동작 방식 — ③ Clustering Matrix

- 슬라이드의 Impact(높은 영향/낮은 영향) × Effort(낮은 노력/높은 노력) 2x2 매트릭스를 그대로 4개 사분면으로
  구현: ① QUICK WINS / ② STRATEGIC MOVES / ③ PARK(낮은 영향·낮은 노력) / ④ WATCH(낮은 영향·높은 노력).
  슬라이드 범례에는 아래 두 칸이 "PARK/WATCH"로 묶여 있지만, 4개를 각각 선택할 수 있게 나눠서 구현했습니다.
- 참가자 화면(`clustering.html`)에서 키워드(최대 40자)를 입력하고 4개 사분면 버튼 중 하나를 탭하면 즉시
  등록되고 입력창이 비워져 다음 키워드를 이어서 올릴 수 있습니다. 완전 익명이며 1인당 제출 개수 제한 없음 —
  발표를 들으며 떠오르는 대로 여러 개 자유롭게 올리는 용도입니다.
- 진행자 화면(`clustering-host.html`)은 세션 전체가 공유하는 매트릭스 하나에 모든 키워드가 계속 쌓이는
  구조입니다(그룹·발표별로 매트릭스를 나누지 않음). 각 사분면 칸 안에 제출된 키워드가 말풍선 태그로 표시되고,
  2초 간격으로 자동 새로고침됩니다(탭이 보이지 않을 때는 폴링 일시중지).
- "CSV 다운로드" 버튼으로 (키워드, 구역, 제출시각) 표를 내려받을 수 있고, "관리자 · 전체 초기화" 버튼으로
  비밀번호 확인 후 모든 키워드를 지울 수 있습니다(다른 두 활동과 같은 `ADMIN_TOKEN` 사용).
- 참가자 화면(`clustering.html`) 하단의 "진행자 화면 열기" 버튼으로 비밀번호(기본값 `1234`, Live Poll과
  동일한 클라이언트 측 게이트)를 입력하면 `clustering-host.html`로 이동할 수 있습니다(2026-09-14 추가).
- 세션당 최대 500개 키워드까지 보관하고, 그 이상 쌓이면 오래된 것부터 자동으로 정리됩니다(장시간 다회
  워크숍에서 데이터가 과도하게 쌓이는 것을 막기 위한 안전장치).

## 동작 방식 — ④ Prioritization

- **후보 액션 관리(진행자 화면)**: "클러스터링 매트릭스에서 가져오기" 버튼을 누르면 서버가 Clustering
  Matrix 스토어(`za2030-deepdive-clustering`)를 직접 읽어 ①QUICK WINS·②STRATEGIC MOVES 사분면의
  키워드만 가져와 후보로 추가합니다(대소문자·공백을 무시하고 중복 키워드는 건너뜀, ③PARK·④WATCH는
  가져오지 않음). 진행자는 후보를 직접 추가하거나, 기존 후보의 문구를 수정·삭제할 수도 있습니다.
- **참가자 화면(`prioritize.html`)**: 후보 액션 목록에서 최대 3개까지 선택(토글)한 뒤 "투표 제출"을
  누르면 등록됩니다. 완전 익명이며, 기기별 로컬 토큰으로 재투표 시 이전 선택을 대체합니다(분산 투표 —
  한 후보에 표를 몰아줄 수는 없음). 라이브 폴과 동일하게 서버의 초기화 시각(`resetAt`)을 확인해, 관리자가
  전체 초기화한 뒤에는 로컬의 "이미 투표함" 캐시를 자동으로 지웁니다.
- **실시간 투표 현황(진행자 화면)**: 후보별 득표수를 막대그래프로 보여주고, 2초 간격으로 자동 새로고침됩니다
  (탭이 보이지 않을 때는 폴링 일시중지). 참가자 화면에는 득표수를 보여주지 않습니다(투표에 영향 주지 않기 위함).
- **최종 확정(진행자 화면)**: 각 후보 옆의 "확정" 버튼으로 최종 Top 2~3 액션을 지정합니다(최대 3개, 토론
  결과에 따라 득표 1위가 아니어도 진행자 재량으로 확정 가능). 확정된 액션마다 슬라이드의 "결정 문장" 틀
  ("우리 팀은 ___을(를) 통해 ___을(를) 더 잘 살린다")을 입력합니다 — 첫 번째 빈칸(무엇을 통해)은 자유
  텍스트 입력, 두 번째 빈칸(무엇을 더 잘 살리는가)은 ZA2030 4대 아젠다 영역(Customer at the Core / Speed /
  Truly Global / High-Performance Team ZEISS) 중 하나를 고르는 드롭다운입니다(2026-09-14 추가). 입력·선택은
  자동 저장되어 참가자 화면에는 보이지 않고 진행자 화면에서만 관리·전시됩니다.
- "CSV 다운로드" 버튼으로 (후보 액션/출처/득표수/최종 확정 여부/결정 문장) 표를 내려받을 수 있고,
  "관리자 · 전체 초기화" 버튼으로 비밀번호 확인 후 후보·투표·확정 결과를 모두 지울 수 있습니다(다른
  활동과 같은 `ADMIN_TOKEN` 사용).
- 참가자 화면 하단의 "진행자 화면 열기" 버튼으로 비밀번호(기본값 `1234`)를 입력하면 `prioritize-host.html`이
  새 탭으로 열립니다.
- 데이터 저장: 완전히 새로운 Netlify Blobs 스토어 `za2030-deepdive-prioritize` — 다른 세 활동과 무관하며,
  Clustering Matrix 스토어는 후보를 가져올 때만 읽기 전용으로 참조합니다.

## 동작 방식 — ⑤ Action Card

- **참조 카드(참가자 화면 상단)**: `prioritize-host.html`에서 확정한 Top 2~3 "결정 문장"을 그대로
  불러와 보여줍니다(서버가 `za2030-deepdive-prioritize` 스토어를 직접 읽는 읽기 전용 크로스 스토어
  조회 — 참가자가 별도로 확인하러 갈 필요 없이 액션카드 작성 화면에서 바로 대전제를 볼 수 있음).
- **작성 폼(`actioncard.html`)**: 어떤 우선순위와 관련된 액션인지 드롭다운으로 고르고(확정된 우선순위가
  없거나 해당 없음일 경우 "기타/아직 정해지지 않음" 선택 가능), 슬라이드의 표 구성 그대로 ACTION /
  WHY-EXPECTED IMPACT / OWNER / FIRST STEP / WHEN 5개 항목을 입력합니다. ACTION과 OWNER는 필수 입력이며,
  OWNER와 FIRST STEP 입력칸에는 슬라이드의 "Minimum rule"을 그대로 힌트 문구로 표시합니다(OWNER는
  개인/역할 단위로 명확하게, FIRST STEP은 "회의를 잡는다"보다 한 단계 더 구체적으로).
- **1인 1카드, 수정 가능**: 기기별 로컬 토큰으로 참가자당 하나의 카드만 허용합니다. 같은 기기로 다시
  들어오면 서버에 저장된 내 카드를 찾아 폼에 자동으로 채워주고 버튼이 "수정 완료"로 바뀌어, 다시
  제출하면 기존 카드를 덮어씁니다(새 카드가 추가되지 않음). 이 활동은 라이브 폴/Prioritization과 달리
  `resetAt` 로컬 캐시 방식을 쓰지 않고, 페이지를 열 때마다 항상 서버의 최신 카드 목록에서 내 토큰을
  다시 찾는 방식으로 구현해 초기화 후 옛 상태가 남는 종류의 버그 자체가 생기지 않도록 했습니다.
- **진행자 화면(`actioncard-host.html`)**: 제출된 카드를 관련 우선순위(결정 문장)별로 묶어 그룹 헤더 +
  표(ACTION/WHY-EXPECTED IMPACT/OWNER/FIRST STEP/WHEN) 형태로 보여주고, 우선순위와 연결되지 않은 카드는
  "기타/우선순위 미지정" 그룹으로 따로 모읍니다. 하단에는 슬라이드의 "Minimum rule" 문구를 그대로 배너로
  띄워 진행자가 참가자들에게 다시 안내할 수 있게 했습니다. 2초 간격으로 자동 새로고침됩니다(탭이 보이지
  않을 때는 폴링 일시중지).
- "CSV 다운로드" 버튼으로 (관련 우선순위/ACTION/WHY-EXPECTED IMPACT/OWNER/FIRST STEP/WHEN/제출시각) 표를
  내려받을 수 있고, "관리자 · 전체 초기화" 버튼으로 비밀번호 확인 후 모든 카드를 지울 수 있습니다(다른
  활동과 같은 `ADMIN_TOKEN` 사용).
- 참가자 화면 하단의 "진행자 화면 열기" 버튼으로 비밀번호(기본값 `1234`)를 입력하면 `actioncard-host.html`이
  새 탭으로 열립니다.
- 데이터 저장: 완전히 새로운 Netlify Blobs 스토어 `za2030-deepdive-actioncard` — 다른 활동과 무관하며,
  Prioritization 스토어는 확정된 우선순위 문장을 가져올 때만 읽기 전용으로 참조합니다.
- **내 액션 이메일로 받기(2026-09-14 추가)**: 제출(또는 재방문 시 내 카드 자동 로드) 후 폼 아래에
  "내 액션, 이메일로 받아보기" 카드가 나타납니다. 받을 이메일 주소를 입력하고 버튼을 누르면 `mailto:`
  링크로 참가자 본인의 메일 앱이 열리고, 아래 내용이 제목·본문에 미리 채워져 있습니다 — 실제 전송은
  참가자가 메일 앱에서 "보내기"를 눌러야 완료됩니다(별도 이메일 발송 서비스·API 키 설정이 필요 없는
  방식이라 지금 바로 쓸 수 있음). 본문에 포함되는 내용: 세션 정보(워크숍명·기록 시각), 우리 팀이 확정한
  Top 2~3 우선순위 문장 전체, 내 액션과 연결된 우선순위 문장(연결 안 했으면 "기타" 표시), 내 액션카드
  전체(ACTION/WHY/OWNER/FIRST STEP/WHEN). 입력한 이메일 주소는 다음 방문을 위해 로컬에 기억해둡니다.

## 참고

- 원인 파악에 시간이 걸렸던 과거 트러블슈팅(v1 함수 방식으로 인한 `MissingBlobsEnvironmentError`)을
  피하기 위해 다섯 함수 모두 처음부터 v2 방식(`export default` + `config.path`)으로 작성했고,
  `getStore()` 호출을 try/catch로 감쌌습니다. `poll.js`/`breakout.js`/`clustering.js`/`prioritize.js`/
  `actioncard.js` 모두 로컬에서 Netlify Blobs를 흉내 낸 인메모리 스텁으로 시뮬레이션 테스트를 거쳤습니다.
- 딥다이브세션에 활동이 더 추가되면 같은 방식(새 페이지 + 새 함수 + 새 Blobs 스토어)으로 이어서
  확장하고, 플로우 탭에 ⑥을 추가하면 됩니다.
