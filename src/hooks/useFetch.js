import { useCallback } from 'react';
import { useDispatch } from '../context/AppContext.jsx';
import {
  fetchFX,
  fetchYields,
  fetchMarkets,
  fetchCBRates,
  fetchCOT,
  fetchATR,
  fetchCalendar,
  fetchNews,
} from '../api/sources.js';

export function useFetch() {
  const dispatch = useDispatch();

  const apply = useCallback((patch, statusKey, statusValue) => {
    dispatch({
      type:    'PATCH_LIVE',
      payload: { ...patch, status: { [statusKey]: statusValue } },
    });
  }, [dispatch]);

  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_FETCH_PHASE', payload: 'loading' });

    await Promise.allSettled([
      // Frankfurter — open CORS, called directly
      fetchFX()
        .then(p => apply(p, 'fx', 'live'))
        .catch(e => console.warn('[FX]', e.message)),

      // All others go through Netlify proxy functions
      fetchYields()
        .then(p => apply(p, 'yields', 'live'))
        .catch(e => console.warn('[Yields]', e.message)),

      fetchMarkets()
        .then(p => apply(p, 'markets', 'live'))
        .catch(e => console.warn('[Markets]', e.message)),

      fetchCBRates()
        .then(p => apply(p, 'cbRates', 'live'))
        .catch(e => console.warn('[CB Rates]', e.message)),

      fetchCOT()
        .then(p => apply(p, 'cot', 'live'))
        .catch(e => console.warn('[COT]', e.message)),

      fetchATR()
        .then(p => apply(p, 'atr', 'live'))
        .catch(e => console.warn('[ATR]', e.message)),

      fetchCalendar()
        .then(p => apply(p, 'calendar', 'live'))
        .catch(e => console.warn('[Calendar]', e.message)),

      fetchNews()
        .then(p => apply(p, 'news', 'live'))
        .catch(e => console.warn('[News]', e.message)),
    ]);

    dispatch({ type: 'SET_FETCH_PHASE', payload: 'done' });
  }, [apply, dispatch]);

  return { fetchAll };
}
