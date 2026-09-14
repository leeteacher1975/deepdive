# ZA2030 딥다이브세션 · 라이브 폴

딥다이브세션 첫 순서로 쓰는 익명 1~5점 라이브 투표입니다. 참가자는 휴대폰으로 접속해 점수를 탭하고,
진행자는 큰 화면에서 실시간 결과를 봅니다. 스포트라이트 세션 3개 보드(핵심요소/Evidence Hunt/액션아이템)와
같은 기술 패턴(Netlify Functions v2 + Netlify Blobs)을 쓰지만, **완전히 독립된 새 사이트/저장소**이고
데이터 저장소도 별도(`za2030-deepdive-poll`)라서 기존 보드에 영향을 주지 않습니다.

## 파일 구성

```
deepdive-poll/
├── index.html                 # 참가자용 투표 화면 (QR로 접속하는 페이지)
├── host.html                  # 진행자용 실시간 결과 화면 (빔프로젝터/큰 화면)
├── netlify/functions/poll.js  # 투표 저장·집계·초기화 API (Netlify Functions v2)
├── netlify.toml                # 빌드 설정 (esbuild 번들러)
├── package.json                 # @netlify/blobs 의존성 고정 (11.0.3)
└── README.md
```

## 배포 방법 (GitHub → Netlify)

1. 이 폴더 전체를 새 GitHub 저장소에 올립니다 (예: `za2030-deepdive-poll`).
2. Netlify에서 "Add new site → Import an existing project"로 방금 만든 GitHub 저장소를 연결합니다.
3. 빌드 설정은 `netlify.toml`에 이미 들어있어 별도 입력 없이 그대로 배포하면 됩니다
   (`npm install` 실행 + `netlify/functions` 폴더의 함수를 esbuild로 번들링).
4. Netlify 사이트 설정 → Environment variables 에서 `ADMIN_TOKEN` 값을 원하는 관리자 비밀번호로 설정합니다.
   (설정하지 않으면 기본값 `za2030admin`이 사용됩니다.)
5. 배포가 끝나면:
   - **참가자 링크**: `https://<사이트주소>/` — 이 링크(또는 host.html에 자동 표시되는 QR)를 참가자에게 공유
   - **진행자 화면**: `https://<사이트주소>/host.html` — 발표 화면에 띄워두는 페이지

## 동작 방식

- 참가자가 1~5 중 하나를 탭하면 즉시 `/api/poll`로 전송되고, 바로 "제출 완료" 화면으로 전환됩니다.
- 이름/소속을 전혀 수집하지 않는 완전 익명 방식이며, 기기별 로컬 토큰으로 "같은 기기가 다시 투표하면
  이전 응답을 덮어쓰는" 방식이라 중복 집계 없이도 참가자가 마음이 바뀌면 다시 선택할 수 있습니다.
- 진행자 화면(`host.html`)은 2초 간격으로 자동 새로고침되며, 탭이 비활성화되면(다른 창으로 전환 시)
  폴링을 잠시 멈췄다가 다시 보이면 즉시 재개합니다.
- 진행자 화면 하단의 "관리자 · 전체 초기화" 버튼으로 비밀번호 확인 후 모든 응답을 지울 수 있어
  같은 사이트를 다음 딥다이브세션에서도 재사용할 수 있습니다.

## 참고

- 원인 파악에 시간이 걸렸던 과거 트러블슈팅(v1 함수 방식으로 인한 `MissingBlobsEnvironmentError`)을
  피하기 위해 `poll.js`는 처음부터 v2 방식(`export default` + `config.path`)으로 작성했고,
  `getStore()` 호출을 try/catch로 감쌌습니다.
- 지금은 이 폴 하나만 담은 단일 페이지 사이트입니다. 딥다이브세션에 이후 활동이 추가되면
  스포트라이트 세션처럼 상단에 단계 플로우 탭을 붙이는 구조로 확장할 수 있습니다.
