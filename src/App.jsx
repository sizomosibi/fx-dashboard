import { useEffect, useRef } from 'react';
import { Masthead }        from './components/layout/Masthead.jsx';
import { StatusBar }       from './components/layout/StatusBar.jsx';
import { CurrencyBar }     from './components/layout/CurrencyBar.jsx';
import { Sidebar }         from './components/layout/Sidebar.jsx';
import { SettingsModal }   from './components/settings/SettingsModal.jsx';
import { S1Macro }         from './components/sections/S1Macro.jsx';
import { S2Monetary }      from './components/sections/S2Monetary.jsx';
import { S3Triad }         from './components/sections/S3Triad.jsx';
import { S4External }      from './components/sections/S4External.jsx';
import { S5Calendar }      from './components/sections/S5Calendar.jsx';
import { S6Geo }           from './components/sections/S6Geo.jsx';
import { S7Cot }           from './components/sections/S7Cot.jsx';
import { S8Trades }        from './components/sections/S8Trades.jsx';
import { S9AI }            from './components/sections/S9AI.jsx';
import { S10Exec }         from './components/sections/S10Exec.jsx';
import { S11Update }       from './components/sections/S11Update.jsx';
import { S12News }         from './components/sections/S12News.jsx';
import { GoldBrief }       from './components/sections/GoldBrief.jsx';
import { GuideView }       from './components/sections/GuideView.jsx';
import { ThesisView }      from './components/sections/ThesisView.jsx';
import { useCurrentCcy, useCurrentView, useLiveData } from './context/AppContext.jsx';
import { useCurrencyData } from './hooks/useCurrencyData.js';
import { useMarketData }   from './hooks/useMarketData.js';
import { useFetch }        from './hooks/useFetch.js';
import { useAIBrief }      from './hooks/useAIBrief.js';
import { useGlobalBrief }  from './hooks/useGlobalBrief.js';
import { useMatrixEnrich } from './hooks/useMatrixEnrich.js';
import './styles/global.css';

function FXBrief({ d, mkt, brief, globalBrief, matrixEnrich }) {
  return (
    <>
      <S1Macro    mkt={mkt} globalBrief={globalBrief} />
      <S2Monetary d={d} brief={brief} />
      <S3Triad    d={d} />
      <S4External d={d} />
      <S5Calendar d={d} />
      <S6Geo      d={d} brief={brief} globalBrief={globalBrief} />
      <S7Cot      brief={brief} />
      <S8Trades   d={d} brief={brief} matrixEnrich={matrixEnrich} />
      <S9AI       d={d} mkt={mkt} />
      <S10Exec />
      <S11Update />
      <S12News />
    </>
  );
}

function Brief() {
  const cur  = useCurrentCcy();
  const view = useCurrentView();
  const live = useLiveData();
  const d    = useCurrencyData();
  const mkt  = useMarketData();

  // AI-powered brief: per-currency CB language, geo risks, trade thesis, COT commentary
  const brief = useAIBrief(cur, live.cot);
  // Global brief: app-load once, covers tariffs/wars/geo news across all currencies
  const { globalBrief, loading: globalLoading, source: globalSrc, generatedAt: globalTs, refresh: globalRefresh } = useGlobalBrief();
  const gbProp = { globalBrief, loading: globalLoading, source: globalSrc, generatedAt: globalTs, refresh: globalRefresh };
  // Matrix enrich: AI-derived riskType + commodityExposure for all G10 currencies
  const matrixEnrich = useMatrixEnrich();

  // Static guide views — full-width, no sidebar dependency on currency data
  if (view === 'guide')   return <main className="brief"><GuideView /></main>;
  if (view === 'thesis')  return <main className="brief"><ThesisView /></main>;

  return (
    <main className="brief">
      {cur === 'XAU'
        ? <GoldBrief d={d} mkt={mkt} />
        : <FXBrief   d={d} mkt={mkt} brief={brief} globalBrief={gbProp} matrixEnrich={matrixEnrich} />
      }
    </main>
  );
}

export default function App() {
  const { fetchAll } = useFetch();
  const hasFetched   = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll();
  }, []); // eslint-disable-line

  return (
    <>
      <Masthead />
      <StatusBar />
      <CurrencyBar />
      <div className="layout">
        <Sidebar />
        <Brief />
      </div>
      <SettingsModal />
    </>
  );
}
