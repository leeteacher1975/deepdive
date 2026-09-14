import { getStore } from '@netlify/blobs';

// 딥다이브세션 · 라이브 폴(익명) 전용 스토어 — 다른 보드(핵심요소/Evidence Hunt/액션아이템)와 완전히 분리됨
const STORE_NAME = 'za2030-deepdive-poll';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'za2030admin';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function summarize(entries) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const e of entries) {
    const score = Number(e && e.score);
    if (Number.isInteger(score) && score >= 1 && score <= 5) {
      counts[score] += 1;
      total += 1;
      sum += score;
    }
  }
  const average = total > 0 ? Math.round((sum / total) * 100) / 100 : 0;
  return { counts, total, average };
}

export default async (req, context) => {
  // MissingBlobsEnvironmentError 등 스토어 초기화 실패를 방어적으로 처리
  // (v1 exports.handler 방식이 원인이었던 과거 트러블슈팅 이력 — 이 함수는 v2 방식이므로 해당 없음)
  let store;
  try {
    store = getStore(STORE_NAME);
  } catch (err) {
    return jsonResponse({ error: 'store_init_failed', message: String(err) }, 500);
  }

  try {
    if (req.method === 'GET') {
      const list = (await store.get('entries', { type: 'json' })) || [];
      return jsonResponse(summarize(list));
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));

      // 관리자 초기화 (다음 세션에서 같은 사이트를 재사용할 수 있도록)
      if (body.action === 'reset') {
        if (body.password !== ADMIN_TOKEN) {
          return jsonResponse({ error: 'unauthorized' }, 401);
        }
        await store.set('entries', JSON.stringify([]));
        return jsonResponse({ ok: true, ...summarize([]) });
      }

      const { token, score } = body;
      if (!token || typeof token !== 'string') {
        return jsonResponse({ error: 'missing_token' }, 400);
      }
      const scoreNum = Number(score);
      if (!Number.isInteger(scoreNum) || scoreNum < 1 || scoreNum > 5) {
        return jsonResponse({ error: 'invalid_score' }, 400);
      }

      const list = (await store.get('entries', { type: 'json' })) || [];
      const idx = list.findIndex((e) => e && e.token === token);
      const entry = { token, score: scoreNum, timestamp: new Date().toISOString() };
      if (idx >= 0) {
        list[idx] = entry; // 같은 기기가 다시 투표하면 이전 응답을 덮어씀 (익명이므로 별도 수정/삭제 API 불필요)
      } else {
        list.push(entry);
      }
      await store.set('entries', JSON.stringify(list));
      return jsonResponse({ ok: true, myScore: scoreNum, ...summarize(list) });
    }

    return jsonResponse({ error: 'method_not_allowed' }, 405);
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: String(err) }, 500);
  }
};

export const config = { path: '/api/poll' };
