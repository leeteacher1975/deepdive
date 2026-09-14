import { getStore } from '@netlify/blobs';

// 딥다이브세션 · ④ Prioritization(우선순위 투표) 전용 스토어 — 다른 세 활동과 완전히 분리됨
const STORE_NAME = 'za2030-deepdive-prioritize';
// 후보 액션을 자동으로 가져올 때만 참조하는 Clustering Matrix 스토어(읽기 전용)
const CLUSTERING_STORE_NAME = 'za2030-deepdive-clustering';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'za2030admin';

const MAX_FINALIZED = 3;
const MAX_VOTES_PER_PERSON = 3;
const MAX_CANDIDATE_LEN = 200;
const MAX_BLANK_LEN = 200;

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

function makeId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function emptyState() {
  return { candidates: [], votes: [], finalized: [], resetAt: null };
}

async function loadState(store) {
  const state = (await store.get('state', { type: 'json' })) || emptyState();
  if (!Array.isArray(state.candidates)) state.candidates = [];
  if (!Array.isArray(state.votes)) state.votes = [];
  if (!Array.isArray(state.finalized)) state.finalized = [];
  if (state.resetAt === undefined) state.resetAt = null;
  return state;
}

// 후보별 득표수 + 총 투표 참여 인원(고유 토큰 수) 계산
function computeTally(state) {
  const counts = {};
  state.candidates.forEach((c) => { counts[c.id] = 0; });
  const voterSet = new Set();
  state.votes.forEach((v) => {
    if (!v || !v.token) return;
    voterSet.add(v.token);
    (v.candidateIds || []).forEach((id) => {
      if (counts[id] !== undefined) counts[id] += 1;
    });
  });
  const candidatesWithVotes = state.candidates.map((c) => ({ ...c, votes: counts[c.id] || 0 }));
  return { candidatesWithVotes, totalVoters: voterSet.size };
}

function publicPayload(state) {
  const { candidatesWithVotes, totalVoters } = computeTally(state);
  return {
    candidates: candidatesWithVotes,
    totalVoters,
    finalized: state.finalized,
    resetAt: state.resetAt,
  };
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
      return jsonResponse(publicPayload(state));
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
        return jsonResponse({ ok: true, ...publicPayload(fresh) });
      }

      // ---- 진행자: Clustering Matrix ①QUICK WINS·②STRATEGIC MOVES 키워드를 후보로 가져오기 ----
      if (body.action === 'import_from_clustering') {
        let clusterStore;
        try {
          clusterStore = getStore(CLUSTERING_STORE_NAME);
        } catch (err) {
          return jsonResponse({ error: 'cluster_store_failed', message: String(err) }, 500);
        }
        const clusterEntries = (await clusterStore.get('entries', { type: 'json' })) || [];
        const existingTexts = new Set(state.candidates.map((c) => c.text.trim().toLowerCase()));
        let added = 0;
        clusterEntries
          .filter((e) => e && (e.quadrant === 'quickwins' || e.quadrant === 'strategic'))
          .forEach((e) => {
            const text = sanitizeText(e.keyword, MAX_CANDIDATE_LEN);
            if (!text) return;
            const key = text.toLowerCase();
            if (existingTexts.has(key)) return;
            existingTexts.add(key);
            state.candidates.push({
              id: makeId('c'),
              text,
              source: e.quadrant,
              createdAt: new Date().toISOString(),
            });
            added += 1;
          });
        await store.set('state', JSON.stringify(state));
        return jsonResponse({ ok: true, added, ...publicPayload(state) });
      }

      // ---- 진행자: 후보 직접 추가 ----
      if (body.action === 'add_candidate') {
        const text = sanitizeText(body.text, MAX_CANDIDATE_LEN);
        if (!text) return jsonResponse({ error: 'empty_text' }, 400);
        state.candidates.push({ id: makeId('c'), text, source: 'manual', createdAt: new Date().toISOString() });
        await store.set('state', JSON.stringify(state));
        return jsonResponse({ ok: true, ...publicPayload(state) });
      }

      // ---- 진행자: 후보 문구 수정 ----
      if (body.action === 'edit_candidate') {
        const cand = state.candidates.find((c) => c.id === body.id);
        if (!cand) return jsonResponse({ error: 'not_found' }, 404);
        const text = sanitizeText(body.text, MAX_CANDIDATE_LEN);
        if (!text) return jsonResponse({ error: 'empty_text' }, 400);
        cand.text = text;
        await store.set('state', JSON.stringify(state));
        return jsonResponse({ ok: true, ...publicPayload(state) });
      }

      // ---- 진행자: 후보 삭제(투표·확정 목록에서도 함께 제거) ----
      if (body.action === 'delete_candidate') {
        state.candidates = state.candidates.filter((c) => c.id !== body.id);
        state.finalized = state.finalized.filter((f) => f.candidateId !== body.id);
        state.votes.forEach((v) => {
          v.candidateIds = (v.candidateIds || []).filter((id) => id !== body.id);
        });
        await store.set('state', JSON.stringify(state));
        return jsonResponse({ ok: true, ...publicPayload(state) });
      }

      // ---- 진행자: 최종 Top 2~3 확정 후보에 추가 ----
      if (body.action === 'finalize_add') {
        if (!state.candidates.some((c) => c.id === body.candidateId)) {
          return jsonResponse({ error: 'not_found' }, 404);
        }
        if (state.finalized.some((f) => f.candidateId === body.candidateId)) {
          return jsonResponse({ ok: true, ...publicPayload(state) });
        }
        if (state.finalized.length >= MAX_FINALIZED) {
          return jsonResponse({ error: 'finalize_full' }, 400);
        }
        state.finalized.push({
          candidateId: body.candidateId,
          blank1: '',
          blank2: '',
          updatedAt: new Date().toISOString(),
        });
        await store.set('state', JSON.stringify(state));
        return jsonResponse({ ok: true, ...publicPayload(state) });
      }

      // ---- 진행자: 확정 해제 ----
      if (body.action === 'finalize_remove') {
        state.finalized = state.finalized.filter((f) => f.candidateId !== body.candidateId);
        await store.set('state', JSON.stringify(state));
        return jsonResponse({ ok: true, ...publicPayload(state) });
      }

      // ---- 진행자: 확정 후보의 "결정 문장" 빈칸 저장(칸 단위) ----
      if (body.action === 'finalize_field') {
        const entry = state.finalized.find((f) => f.candidateId === body.candidateId);
        if (!entry) return jsonResponse({ error: 'not_found' }, 404);
        if (!['blank1', 'blank2'].includes(body.field)) {
          return jsonResponse({ error: 'invalid_field' }, 400);
        }
        entry[body.field] = sanitizeText(body.value, MAX_BLANK_LEN);
        entry.updatedAt = new Date().toISOString();
        await store.set('state', JSON.stringify(state));
        return jsonResponse({ ok: true, ...publicPayload(state) });
      }

      // ---- 참가자: 투표 제출(익명, 기기 토큰 기준 upsert — 같은 기기가 다시 투표하면 이전 선택을 대체) ----
      const { token, candidateIds } = body;
      if (!token || typeof token !== 'string') {
        return jsonResponse({ error: 'missing_token' }, 400);
      }
      const validCandidateIds = new Set(state.candidates.map((c) => c.id));
      const uniqueValidIds = Array.isArray(candidateIds)
        ? Array.from(new Set(candidateIds.filter((id) => validCandidateIds.has(id)))).slice(0, MAX_VOTES_PER_PERSON)
        : [];

      const idx = state.votes.findIndex((v) => v && v.token === token);
      const entry = { token, candidateIds: uniqueValidIds, timestamp: new Date().toISOString() };
      if (idx >= 0) {
        state.votes[idx] = entry;
      } else {
        state.votes.push(entry);
      }
      await store.set('state', JSON.stringify(state));
      return jsonResponse({ ok: true, myVote: uniqueValidIds, resetAt: state.resetAt, ...publicPayload(state) });
    }

    return jsonResponse({ error: 'method_not_allowed' }, 405);
  } catch (err) {
    return jsonResponse({ error: 'internal_error', message: String(err) }, 500);
  }
};

export const config = { path: '/api/prioritize' };
