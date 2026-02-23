import { useCallback } from 'react';
import { useDispatch } from '../context/AppContext.jsx';
import { Keys } from '../api/keys.js';
import {
  fetchFX, fetchTreasury, fetchECB, fetchBoC, fetchSNB,
  fetchFRED, fetchTwelveData, fetchCOT, fetchTriad,
} from '../api/sources.js';

export function useFetch() {
  const dispatch = useDispatch();

  const applyPatch = useCallback((patch, statusKey, statusValue) => {
    dispatch({
      type: 'PATCH_LIVE',
      payload: { ...patch, status: { [statusKey]: statusValue } },
    });
  }, [dispatch]);

  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_FETCH_PHASE', payload: 'loading' });

    // ── Zero-key sources — always run ─────────────────────────────
    const zeroKey = [
      fetchFX()
        .then(p  => applyPatch(p, 'fx', 'live'))
        .catch(e => console.warn('[Frankfurter]', e.message)),

      fetchTreasury()
        .then(p  => applyPatch(p, 'yields', 'live-partial'))
        .catch(e => console.warn('[Treasury]', e.message)),

      fetchECB()
        .then(p  => applyPatch(p, 'cbRates', 'live-partial'))
        .catch(e => console.warn('[ECB]', e.message)),

      fetchBoC()
        .then(p  => applyPatch(p, 'cbRates', 'live-partial'))
        .catch(e => console.warn('[BoC]', e.message)),

      fetchSNB()
        .then(p  => applyPatch(p, 'cbRates', 'live-partial'))
        .catch(e => console.warn('[SNB]', e.message)),

      // ── CFTC COT — free, no key, weekly ───────────────────────
      fetchCOT()
        .then(p  => applyPatch(p, 'cot', 'live'))
        .catch(e => console.warn('[CFTC COT]', e.message)),
    ];

    // ── Keyed sources — only if key is configured ─────────────────
    const keyed = [];

    if (Keys.fred) {
      keyed.push(
        fetchFRED(Keys.fred)
          .then(p  => applyPatch(p, 'yields', 'live'))
          .catch(e => console.warn('[FRED]', e.message)),

        // International triad — same FRED key, separate call
        fetchTriad(Keys.fred)
          .then(p  => applyPatch(p, 'triad', 'live'))
          .catch(e => console.warn('[FRED Intl]', e.message)),
      );
    }

    if (Keys.td) {
      keyed.push(
        fetchTwelveData(Keys.td)
          .then(p  => applyPatch(p, 'markets', 'live'))
          .catch(e => console.warn('[TwelveData]', e.message)),
      );
    }

    await Promise.allSettled([...zeroKey, ...keyed]);
    dispatch({ type: 'SET_FETCH_PHASE', payload: 'done' });
  }, [applyPatch, dispatch]);

  return { fetchAll };
}
