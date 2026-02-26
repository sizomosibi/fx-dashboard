import { useCallback } from 'react';
import { useDispatch } from '../context/AppContext.jsx';
import {
  fetchFX, fetchYields, fetchMarkets,
  fetchECB, fetchBoC, fetchSNB,
  fetchCOT, fetchCalendar, fetchNews,
} from '../api/sources.js';

// ── useFetch ───────────────────────────────────────────────────────
// All sources are zero-key — they call Netlify proxy functions
// or free public APIs directly. No API keys required anywhere.
export function useFetch() {
  const dispatch = useDispatch();

  const apply = useCallback((patch, statusKey, statusValue) => {
    dispatch({
      type: 'PATCH_LIVE',
      payload: { ...patch, status: { [statusKey]: statusValue } },
    });
  }, [dispatch]);

  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_FETCH_PHASE', payload: 'loading' });

    const sources = [
      // ── Direct free APIs (CORS-safe) ──────────────────────────
      fetchFX()
        .then(p => apply(p, 'fx', 'live'))
        .catch(e => console.warn('[FX Frankfurter]', e.message)),

      fetchECB()
        .then(p => apply(p, 'cbRates', 'live-partial'))
        .catch(e => console.warn('[ECB]', e.message)),

      fetchBoC()
        .then(p => apply(p, 'cbRates', 'live-partial'))
        .catch(e => console.warn('[BoC]', e.message)),

      fetchSNB()
        .then(p => apply(p, 'cbRates', 'live-partial'))
        .catch(e => console.warn('[SNB]', e.message)),

      fetchCOT()
        .then(p => apply(p, 'cot', 'live'))
        .catch(e => console.warn('[CFTC COT]', e.message)),

      // ── Netlify proxy functions (server-side, no CORS/key) ────
      fetchYields()
        .then(p => apply(p, 'yields', 'live'))
        .catch(e => console.warn('[Yields proxy]', e.message)),

      fetchMarkets()
        .then(p => apply(p, 'markets', 'live'))
        .catch(e => console.warn('[Markets proxy]', e.message)),

      fetchCalendar()
        .then(p => apply(p, 'calendar', 'live'))
        .catch(e => console.warn('[Calendar proxy]', e.message)),

      fetchNews()
        .then(p => apply(p, 'news', 'live'))
        .catch(e => console.warn('[News proxy]', e.message)),
    ];

    await Promise.allSettled(sources);
    dispatch({ type: 'SET_FETCH_PHASE', payload: 'done' });
  }, [apply, dispatch]);

  return { fetchAll };
}
