import { getStore } from '@netlify/blobs';

// 딥다이브세션 5개 활동을 한 번에 관리하기 위한 통합 함수(읽기 전용 집계 + 전체 초기화).
// 각 활동의 실제 저장/조회 로직은 각자의 함수(poll.js/breakout.js/clustering.js/prioritize.js/actioncard.js)에
// 그대로 남아있고, 이 함수는 그 다섯 스토어를 서버 사이드에서 한 번에 읽거나 한 번에 비우기만 함.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'za2030admin';

const STORE_NAMES = {
  poll: 'za2030-deepdive-poll',
  breakout: 'za2030-deepdive-breakout',
  clustering: 'za2030-deepdive-clustering',
  prioritize: 'za2030-deepdive-prioritize',
  actioncard: 'za2030-deepdive-actioncard',
};

const ELEMENT_IDS = ['customer', 'speed', 'global', 'hpt'];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function emptyElement() {
  return { participants: '', meaning: '', action: '', change: '', evidence: '', updatedAt: null };
}
function emptyElements() {
  const out = {};
  ELEMENT_IDS.forEach((id) => { out[id] = emptyElement(); });
  return out;
}

function summarizePoll(entries) {
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

// prioritize.js의 computeTally와 동일한 로직(후보별 득표수 계산) — 통합 조회 전용으로 별도 보관
function tallyPrioritize(state) {
  const counts = {};
  (state.candidates || []).forEach((c) => { counts[c.id] = 0; });
  (state.votes || []).forEach((v) => {
    if (!v) return;
    (v.candidateIds || []).forEach((id) => {
      if (counts[id] !== undefined) counts[id] += 1;
    });
  });
  return (state.candidates || []).map((c) => ({ ...c, votes: counts[c.id] || 0 }));
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  if (body.password !== ADMIN_TOKEN) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  let stores;
  try {
    stores = {
      poll: getStore(STORE_NAMES.poll),
      breakout: getStore(STORE_NAMES.breakout),
      clustering: getStore(STORE_NAMES.clustering),
      prioritize: getStore(STORE_NAMES.prioritize),
      actioncard: getStore(STORE_NAMES.actioncard),
    };
  } catch (err) {
    return jsonResponse({ error: 'store_init_failed', message: String(err) }, 500);
  }

  try {
    if (body.action === 'export_all') {
      const pollEntries = (await stores.poll.get('entries', { type: 'json' })) || [];
      const breakoutElements = (await stores.breakout.get('elements', { type: 'json' })) || emptyElements();
      ELEMENT_IDS.forEach((id) => { if (!breakoutElements[id]) breakoutElements[id] = emptyElement(); });
      const clusteringEntries = (await stores.clustering.get('entries', { type: 'json' })) || [];
      const prioritizeState = (await stores.prioritize.get('state', { type: 'json' })) || { candidates: [], votes: [], finalized: [] };
      const actioncardState = (await stores.actioncard.get('state', { type: 'json' })) || { entries: [] };

      return jsonResponse({
        ok: true,
        exportedAt: new Date().toISOString(),
        poll: summarizePoll(pollEntries),
        breakout: { elements: breakoutElements },
        clustering: { entries: clusteringEntries },
        prioritize: {
          candidates: tallyPrioritize(prioritizeState),
          finalized: prioritizeState.finalized || [],
        },
        actioncard: {
          entries: actioncardState.entries || [],
        },
      });
    }

    if (body.action === 'reset_all') {
      const resetAt = new Date().toISOString();
      await stores.poll.set('entries', JSON.stringify([]));
      await stores.poll.set('meta', JSON.stringify({ resetAt }));
      await stores.breakout.set('elements', JSON.stringify(emptyElements()));
      await stores.clustering.set('entries', JSON.stringify([]));
      await stores.prioritize.set('state', JSON.stringify({ candidates: [], votes: [], finalized: [], resetAt }));
      await stores.actioncard.set('state', JSON.stringify({ entries: [], resetAt }));
      return jsonResponse({ ok: true, resetAt });
    }

    return jsonResponse({ error: 'invalid_action' }, 400);
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: String(err) }, 500);
  }
};

export const config = { path: '/api/session-admin' };
