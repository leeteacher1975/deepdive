import { getStore } from '@netlify/blobs';

// 딥다이브세션 · ⑤ Action Card(개인 액션 아이템) 전용 스토어 — 다른 네 활동과 완전히 분리됨
const STORE_NAME = 'za2030-deepdive-actioncard';
// 확정된 Top 2~3 우선순위를 드롭다운에 보여줄 때만 참조하는 Prioritization 스토어(읽기 전용)
const PRIORITIZE_STORE_NAME = 'za2030-deepdive-prioritize';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'za2030admin';

const MAX_LEN = { action: 200, why: 300, owner: 100, firstStep: 300, when: 100, priorityText: 300 };

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function sanitizeText(v, maxLen) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, maxLen);
}

function emptyState() {
  return { entries: [], resetAt: null };
}

async function loadState(store) {
  const state = (await store.get('state', { type: 'json' })) || emptyState();
  if (!Array.isArray(state.entries)) state.entries = [];
  if (state.resetAt === undefined) state.resetAt = null;
  return state;
}

// Prioritization에서 확정된 Top 2~3 항목을 읽어와 참가자 화면 드롭다운/진행자 화면 그룹핑에 사용
// (이 활동은 이 값을 저장하지 않고, 매 요청마다 최신 확정 목록을 그대로 반영함)
async function loadFinalizedOptions() {
  let prioritizeStore;
  try {
    prioritizeStore = getStore(PRIORITIZE_STORE_NAME);
  } catch (err) {
    return [];
  }
  const state = (await prioritizeStore.get('state', { type: 'json' })) || {};
  const finalized = Array.isArray(state.finalized) ? state.finalized : [];
  const candidates = Array.isArray(state.candidates) ? state.candidates : [];
  return finalized.map((f) => {
    const cand = candidates.find((c) => c.id === f.candidateId);
    const candidateText = cand ? cand.text : '(삭제된 후보)';
    const sentence = '우리 팀은 ' + (f.blank1 || '___') + '을(를) 통해 ' + (f.blank2 || '___') + '을(를) 더 잘 살린다.';
    return { id: f.candidateId, candidateText, sentence };
  });
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
      const state = await loadState(store);
      const finalizedOptions = await loadFinalizedOptions();
      return jsonResponse({ entries: state.entries, finalizedOptions, resetAt: state.resetAt });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const state = await loadState(store);

      // ---- 관리자 · 전체 초기화 ----
      if (body.action === 'reset') {
        if (body.password !== ADMIN_TOKEN) {
          return jsonResponse({ error: 'unauthorized' }, 401);
        }
        const fresh = emptyState();
        fresh.resetAt = new Date().toISOString();
        await store.set('state', JSON.stringify(fresh));
        const finalizedOptions = await loadFinalizedOptions();
        return jsonResponse({ ok: true, entries: fresh.entries, finalizedOptions, resetAt: fresh.resetAt });
      }

      // ---- 참가자: 액션카드 제출(1인당 1개 — 기기 토큰 기준 upsert, 재제출 시 이전 내용을 대체) ----
      const { token } = body;
      if (!token || typeof token !== 'string') {
        return jsonResponse({ error: 'missing_token' }, 400);
      }

      const action = sanitizeText(body.action_text, MAX_LEN.action);
      const owner = sanitizeText(body.owner, MAX_LEN.owner);
      if (!action || !owner) {
        return jsonResponse({ error: 'missing_required_fields' }, 400);
      }

      const entry = {
        token,
        priorityId: sanitizeText(body.priorityId, 100) || null,
        priorityText: sanitizeText(body.priorityText, MAX_LEN.priorityText),
        action,
        why: sanitizeText(body.why, MAX_LEN.why),
        owner,
        firstStep: sanitizeText(body.firstStep, MAX_LEN.firstStep),
        when: sanitizeText(body.when, MAX_LEN.when),
        timestamp: new Date().toISOString(),
      };

      const idx = state.entries.findIndex((e) => e && e.token === token);
      if (idx >= 0) {
        state.entries[idx] = entry;
      } else {
        state.entries.push(entry);
      }
      await store.set('state', JSON.stringify(state));
      const finalizedOptions = await loadFinalizedOptions();
      return jsonResponse({ ok: true, entry, entries: state.entries, finalizedOptions, resetAt: state.resetAt });
    }

    return jsonResponse({ error: 'method_not_allowed' }, 405);
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: String(err) }, 500);
  }
};

export const config = { path: '/api/actioncard' };
