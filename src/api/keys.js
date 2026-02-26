// ── CB Rate Overrides ─────────────────────────────────────────────
// API keys are no longer needed — all data fetches go through
// Netlify Functions which run server-side with zero CORS issues.
//
// The only thing stored locally is CB rate overrides: rates entered
// manually after a central bank meeting for CBs that don't have
// a machine-readable API (RBA, BoE, BoJ, RBNZ, Fed).

const KEY_CB = 'ldf_cb';

export const Keys = {
  getCBOverrides() {
    try { return JSON.parse(localStorage.getItem(KEY_CB) || '{}'); }
    catch { return {}; }
  },
  setCBOverrides(obj) {
    localStorage.setItem(KEY_CB, JSON.stringify(obj));
  },
};
