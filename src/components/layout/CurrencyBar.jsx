import { CURRENCIES } from '../../data/currencies.js';
import { useCurrentCcy, useCurrentView, useDispatch } from '../../context/AppContext.jsx';

const CCY_ORDER = ['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'NZD', 'XAU'];

export function CurrencyBar() {
  const cur      = useCurrentCcy();
  const view     = useCurrentView();
  const dispatch = useDispatch();

  function setCcy(ccy) {
    dispatch({ type: 'SET_CURRENCY', payload: ccy });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setView(v) {
    dispatch({ type: 'SET_VIEW', payload: v });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="ccy-bar">
      {/* G10 + Gold currency tabs */}
      {CCY_ORDER.map(ccy => {
        const d = CURRENCIES[ccy];
        return (
          <button
            key={ccy}
            className={`ccy-btn${view === 'currency' && cur === ccy ? ' active' : ''}`}
            onClick={() => setCcy(ccy)}
          >
            <span style={{ marginRight: '0.35rem' }}>{d?.flag}</span>
            {ccy}
          </button>
        );
      })}

      {/* Separator */}
      <div className="ccy-bar-sep" />

      {/* Static guide tabs */}
      <button
        className={`ccy-btn ccy-btn-tool${view === 'guide' ? ' active' : ''}`}
        onClick={() => setView('guide')}
        title="Dashboard User Guide"
      >
        📖 GUIDE
      </button>
      <button
        className={`ccy-btn ccy-btn-tool${view === 'thesis' ? ' active' : ''}`}
        onClick={() => setView('thesis')}
        title="How to Form a Trade Thesis"
      >
        📐 THESIS
      </button>
    </div>
  );
}
