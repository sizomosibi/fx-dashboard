import { CURRENCIES } from '../../data/currencies.js';
import { useCurrentCcy, useDispatch } from '../../context/AppContext.jsx';

const CCY_ORDER = ['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'NZD', 'XAU'];

export function CurrencyBar() {
  const cur      = useCurrentCcy();
  const dispatch = useDispatch();

  return (
    <div className="ccy-bar">
      {CCY_ORDER.map(ccy => {
        const d = CURRENCIES[ccy];
        return (
          <button
            key={ccy}
            className={`ccy-btn${cur === ccy ? ' active' : ''}`}
            onClick={() => {
              dispatch({ type: 'SET_CURRENCY', payload: ccy });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span style={{ marginRight: '0.35rem' }}>{d?.flag}</span>
            {ccy}
          </button>
        );
      })}
    </div>
  );
}
