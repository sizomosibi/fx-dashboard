// ── API Key Management ─────────────────────────────────────────────
// Keys live only in the browser's localStorage.
// Never hardcoded. Never sent to any server except the target API itself.

const KEY_FRED = 'ldf_fred';
const KEY_TD   = 'ldf_td';
const KEY_CB   = 'ldf_cb';

export const Keys = {
  get fred()  { return localStorage.getItem(KEY_FRED) || ''; },
  set fred(v) { localStorage.setItem(KEY_FRED, v.trim()); },

  get td()    { return localStorage.getItem(KEY_TD)   || ''; },
  set td(v)   { localStorage.setItem(KEY_TD, v.trim()); },

  // CB rate overrides — stored as { USD: '3.50–3.75%', EUR: '2.40%', ... }
  getCBOverrides() {
    try { return JSON.parse(localStorage.getItem(KEY_CB) || '{}'); }
    catch { return {}; }
  },
  setCBOverrides(obj) {
    localStorage.setItem(KEY_CB, JSON.stringify(obj));
  },
};
