import { getStore } from '@netlify/blobs';

// 딥다이브세션 · Clustering Matrix 전용 스토어 — 다른 두 활동(poll/breakout)과 완전히 분리됨
const STORE_NAME = 'za2030-deepdive-clustering';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'za2030admin';

// 4사분면: quickwins(높은영향·낮은노력) / strategic(높은영향·높은노력) / park(낮은영향·낮은노력) / watch(낮은영향·높은노력)
const QUADRANTS = ['quickwins', 'strategic', 'park', 'watch'];
const MAX_ENTRIES = 500; // 세션 하나에서 과도하게 쌓이는 것을 막는 안전장치
const MAX_KEYWORD_LEN = 40;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function sanitizeKeyword(v) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, MAX_KEYWORD_LEN);
}

function makeId() {
  return 'k_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export default async (req, context) => {
  let store;
  try {
    store = getStore(STORE_NAME);
  } catch (err) {
    return jsonResponse({ error: 'store_init_failed', message: String(err) }, 500);
  }

  try {
    if (req.method === 'GET') {
      const entries = (await store.get('entries', { type: 'json' })) || [];
      return jsonResponse({ entries });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));

      if (body.action === 'reset') {
        if (body.password !== ADMIN_TOKEN) {
          return jsonResponse({ error: 'unauthorized' }, 401);
        }
        await store.set('entries', JSON.stringify([]));
        return jsonResponse({ ok: true, entries: [] });
      }

      const keyword = sanitizeKeyword(body.keyword);
      const quadrant = body.quadrant;
      if (!keyword) {
        return jsonResponse({ error: 'empty_keyword' }, 400);
      }
      if (!QUADRANTS.includes(quadrant)) {
        return jsonResponse({ error: 'invalid_quadrant' }, 400);
      }

      const entries = (await store.get('entries', { type: 'json' })) || [];
      entries.push({
        id: makeId(),
        keyword,
        quadrant,
        timestamp: new Date().toISOString(),
      });
      var trimmed = entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;

      await store.set('entries', JSON.stringify(trimmed));
      return jsonResponse({ ok: true, entries: trimmed });
    }

    return jsonResponse({ error: 'method_not_allowed' }, 405);
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: String(err) }, 500);
  }
};

export const config = { path: '/api/clustering' };
