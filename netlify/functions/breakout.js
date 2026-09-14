import { getStore } from '@netlify/blobs';

// 딥다이브세션 · Breakout Canvas 전용 스토어 — 라이브 폴(za2030-deepdive-poll)과 완전히 분리됨
const STORE_NAME = 'za2030-deepdive-breakout';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'za2030admin';

const ELEMENT_IDS = ['customer', 'speed', 'global', 'hpt'];

function emptyElement() {
  return { meaning: '', action: '', change: '', evidence: '', updatedAt: null };
}

function emptyElements() {
  const out = {};
  ELEMENT_IDS.forEach((id) => { out[id] = emptyElement(); });
  return out;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function sanitizeText(v) {
  if (typeof v !== 'string') return '';
  return v.slice(0, 2000); // 캔버스 한 칸당 최대 2000자
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
      const elements = (await store.get('elements', { type: 'json' })) || emptyElements();
      // 과거 데이터에 없는 요소가 생기지 않도록 항상 4개 키를 보장
      ELEMENT_IDS.forEach((id) => { if (!elements[id]) elements[id] = emptyElement(); });
      return jsonResponse({ elements });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));

      if (body.action === 'reset') {
        if (body.password !== ADMIN_TOKEN) {
          return jsonResponse({ error: 'unauthorized' }, 401);
        }
        const fresh = emptyElements();
        await store.set('elements', JSON.stringify(fresh));
        return jsonResponse({ ok: true, elements: fresh });
      }

      const { element } = body;
      if (!ELEMENT_IDS.includes(element)) {
        return jsonResponse({ error: 'invalid_element' }, 400);
      }

      const elements = (await store.get('elements', { type: 'json' })) || emptyElements();
      ELEMENT_IDS.forEach((id) => { if (!elements[id]) elements[id] = emptyElement(); });

      elements[element] = {
        meaning: sanitizeText(body.meaning),
        action: sanitizeText(body.action),
        change: sanitizeText(body.change),
        evidence: sanitizeText(body.evidence),
        updatedAt: new Date().toISOString(),
      };

      await store.set('elements', JSON.stringify(elements));
      return jsonResponse({ ok: true, elements });
    }

    return jsonResponse({ error: 'method_not_allowed' }, 405);
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: String(err) }, 500);
  }
};

export const config = { path: '/api/breakout' };
