import { createContext, useContext, useReducer, useCallback } from 'react';
import { Keys } from '../api/keys.js';

// ── Initial state ──────────────────────────────────────────────────
const initialLiveData = {
  yields:    {},   // { US2Y, US5Y, US10Y, US30Y } — raw numbers (%)
  cbRates:   {},   // { USD, EUR, CAD, CHF, ... } — strings ('3.50–3.75%')
  markets:   {},   // { xau, wti, spx, vix, dxy, copper } — raw numbers
  fx:        {},   // { 'EUR/USD', ... } — raw numbers
  usMacro:   {},   // { cpi, corePCE, unemployment, nfp } — US-specific
  cot:       {},   // { EUR:{net,prev}, JPY:{net,prev}, ... } — live CFTC weekly
  intlMacro: {},   // { AUD:{cpi,unemployment}, EUR:{...}, ... } — FRED international
  status: {
    yields:  'stale',
    cbRates: 'stale',
    markets: 'stale',
    fx:      'stale',
    macro:   'stale',
    cot:     'stale',
    triad:   'stale',
  },
  lastFetch: null,
};

const initialAppState = {
  cur:            'AUD',
  checkState:     {},
  journalEntries: [],
  settingsOpen:   false,
  liveData:       { ...initialLiveData, cbRates: Keys.getCBOverrides() },
  fetchPhase:     'idle',
};

// ── Reducer ────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENCY':
      return { ...state, cur: action.payload };

    case 'TOGGLE_CHECK': {
      const id = action.payload;
      return { ...state, checkState: { ...state.checkState, [id]: !state.checkState[id] } };
    }

    case 'RESET_CHECKLIST':
      return { ...state, checkState: {} };

    case 'ADD_JOURNAL': {
      const entry = {
        time: new Date().toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' }),
        ccy: state.cur,
        text: action.payload,
      };
      return { ...state, journalEntries: [...state.journalEntries, entry] };
    }

    case 'OPEN_SETTINGS':  return { ...state, settingsOpen: true };
    case 'CLOSE_SETTINGS': return { ...state, settingsOpen: false };

    case 'PATCH_LIVE': {
      const patch = action.payload;
      const next  = { ...state.liveData };
      if (patch.yields)    next.yields    = { ...next.yields,    ...patch.yields };
      if (patch.cbRates)   next.cbRates   = { ...next.cbRates,   ...patch.cbRates };
      if (patch.markets)   next.markets   = { ...next.markets,   ...patch.markets };
      if (patch.fx)        next.fx        = { ...next.fx,        ...patch.fx };
      if (patch.usMacro)   next.usMacro   = { ...next.usMacro,   ...patch.usMacro };
      if (patch.cot)       next.cot       = { ...next.cot,       ...patch.cot };
      if (patch.intlMacro) next.intlMacro = { ...next.intlMacro, ...patch.intlMacro };
      if (patch.status)    next.status    = { ...next.status,    ...patch.status };
      next.lastFetch = new Date();
      return { ...state, liveData: next };
    }

    case 'SET_FETCH_PHASE':
      return { ...state, fetchPhase: action.payload };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialAppState);

  const cbOverrides = Keys.getCBOverrides();
  if (Object.keys(cbOverrides).length && !Object.keys(state.liveData.cbRates).length) {
    dispatch({ type: 'PATCH_LIVE', payload: { cbRates: cbOverrides, status: { cbRates: 'manual' } } });
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────
export function useAppState()   { return useContext(AppContext).state; }
export function useDispatch()   { return useContext(AppContext).dispatch; }
export function useLiveData()   { return useContext(AppContext).state.liveData; }
export function useCurrentCcy() { return useContext(AppContext).state.cur; }
