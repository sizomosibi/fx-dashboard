import { createContext, useContext, useReducer } from 'react';
import { Keys } from '../api/keys.js';

// ── Initial state ──────────────────────────────────────────────────
// markets: each entry is { price, change, changePct } — from Yahoo Finance proxy
// yields:  { US2Y, US5Y, US10Y, US30Y, spread2s10s } — from Treasury XML proxy
const initialLiveData = {
  yields:    {},   // { US2Y:4.18, US5Y:4.25, US10Y:4.42, US30Y:4.68, spread2s10s:24 }
  cbRates:   {},   // { USD:'4.25–4.50%', EUR:'2.40%', ... }
  markets:   {},   // { xau:{price,change,changePct}, wti:{...}, ... }
  fx:        {},   // { 'EUR/USD':1.0842, ... }
  usMacro:   {},   // { cpi, corePCE, unemployment, nfp } — reserved for future
  cot:       {},   // { EUR:{net,prev}, JPY:{net,prev}, ... }
  cotAsOf:   null,
  intlMacro: {},   // { AUD:{cpi,unemployment}, ... } — reserved for future
  calendar:  {},   // { AUD:[...events], USD:[...events], ... }
  news:      {},   // { AUD:[...articles], ... }
  status: {
    yields:   'stale',
    cbRates:  'stale',
    markets:  'stale',
    fx:       'stale',
    cot:      'stale',
    calendar: 'stale',
    news:     'stale',
  },
  lastFetch:         null,
  calendarFetchedAt: null,
  newsFetchedAt:     null,
};

const initialAppState = {
  cur:            'AUD',
  checkState:     {},
  journalEntries: [],
  settingsOpen:   false,
  liveData:       { ...initialLiveData, cbRates: Keys.getCBOverrides() },
  fetchPhase:     'idle',
};

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
      // Deep-merge each slice
      if (patch.yields)    next.yields    = { ...next.yields,    ...patch.yields };
      if (patch.cbRates)   next.cbRates   = { ...next.cbRates,   ...patch.cbRates };
      if (patch.markets)   next.markets   = { ...next.markets,   ...patch.markets };  // objects now
      if (patch.fx)        next.fx        = { ...next.fx,        ...patch.fx };
      if (patch.usMacro)   next.usMacro   = { ...next.usMacro,   ...patch.usMacro };
      if (patch.cot)       next.cot       = { ...next.cot,       ...patch.cot };
      if (patch.cotAsOf)   next.cotAsOf   = patch.cotAsOf;
      if (patch.intlMacro) next.intlMacro = { ...next.intlMacro, ...patch.intlMacro };
      if (patch.calendar)  next.calendar  = { ...next.calendar,  ...patch.calendar };
      if (patch.news)      next.news      = { ...next.news,      ...patch.news };
      if (patch.status)    next.status    = { ...next.status,    ...patch.status };
      if (patch._calendarFetchedAt) next.calendarFetchedAt = patch._calendarFetchedAt;
      if (patch._newsFetchedAt)     next.newsFetchedAt     = patch._newsFetchedAt;
      next.lastFetch = new Date();
      return { ...state, liveData: next };
    }

    case 'SET_FETCH_PHASE':
      return { ...state, fetchPhase: action.payload };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialAppState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState()   { return useContext(AppContext).state; }
export function useDispatch()   { return useContext(AppContext).dispatch; }
export function useLiveData()   { return useContext(AppContext).state.liveData; }
export function useCurrentCcy() { return useContext(AppContext).state.cur; }
