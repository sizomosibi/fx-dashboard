import { useState } from 'react';
import { SectionHead } from '../ui/SectionHead.jsx';

// ── Category badge colours ────────────────────────────────────────
const CAT_STYLE = {
  TARIFF:       { color: '#e09a30', border: 'rgba(224,154,48,0.35)'  },
  WAR:          { color: '#e05c5c', border: 'rgba(224,92,92,0.35)'   },
  GEOPOLITICAL: { color: '#b07ae0', border: 'rgba(176,122,224,0.35)' },
  MACRO:        { color: '#4fc3a1', border: 'rgba(79,195,161,0.35)'  },
};

const SEVERITY_DOT = { high: 'var(--red)', medium: 'var(--gold)', low: '#555' };

// ── Shared AI timestamp badge ─────────────────────────────────────
function AIStamp({ source, generatedAt, onRefresh }) {
  const ts = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('en-AU', { timeStyle: 'short' })
    : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--teal)', letterSpacing: '0.08em' }}>
        ⚡ AI · {source === 'cache' ? `CACHED ${ts}` : `LIVE ${ts || ''}`}
      </span>
      <button onClick={onRefresh} title="Regenerate with live news"
        style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', padding: '0.1rem 0.4rem', cursor: 'pointer', borderRadius: 2 }}>
        ↺ REFRESH
      </button>
    </div>
  );
}

// ── Skeleton cards ────────────────────────────────────────────────
function GeoSkeleton({ n = 3 }) {
  return Array.from({ length: n }).map((_, i) => (
    <div key={i} className="geo-card mixed" style={{ opacity: 0.3 }}>
      <div style={{ height: '0.75rem', background: '#222', borderRadius: 2, width: '55%', marginBottom: '0.5rem' }} />
      <div style={{ height: '0.7rem',  background: '#1a1a1a', borderRadius: 2, width: '95%', marginBottom: '0.3rem' }} />
      <div style={{ height: '0.7rem',  background: '#1a1a1a', borderRadius: 2, width: '75%' }} />
    </div>
  ));
}

// ── Single geo/risk card ──────────────────────────────────────────
function GeoCard({ item, showDetail }) {
  const [open, setOpen] = useState(false);
  const catStyle  = CAT_STYLE[item.category] || CAT_STYLE.GEOPOLITICAL;
  const sevColor  = SEVERITY_DOT[item.severity] || SEVERITY_DOT.low;
  const hasDetail = !!item.detail;

  return (
    <div className={`geo-card ${item.effect}`}>
      <div className="geo-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {/* severity dot */}
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sevColor, flexShrink: 0, marginTop: '0.35rem' }} />
          <div className="geo-title">{item.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {item.category && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', padding: '0.1rem 0.35rem', border: `1px solid ${catStyle.border}`, color: catStyle.color }}>
              {item.category}
            </span>
          )}
          <span className={`geo-pill ${item.effect}`}>{item.effect.toUpperCase()}</span>
        </div>
      </div>

      {/* affected currencies */}
      {item.affectedCurrencies?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
          {item.affectedCurrencies.map(c => (
            <span key={c} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.64rem', padding: '0.08rem 0.3rem', border: '1px solid #2a2a2a', color: '#777' }}>{c}</span>
          ))}
        </div>
      )}

      <div className="geo-analysis">{item.analysis}</div>

      {/* expandable sidenote */}
      {showDetail && hasDetail && (
        <div style={{ marginTop: '0.4rem' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.64rem', color: '#444', cursor: 'pointer', letterSpacing: '0.08em' }}
          >
            {open ? '▾ HIDE DETAIL' : '▸ MORE DETAIL'}
          </button>
          {open && (
            <div style={{ marginTop: '0.3rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid #2a2a2a', fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>
              {item.detail}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Collapsible "Key Intelligence" sidenote drawer ─────────────────
function KeyFactsDrawer({ facts }) {
  const [open, setOpen] = useState(false);
  if (!facts?.length) return null;
  return (
    <div style={{ marginTop: '0.75rem', border: '1px solid #1e1e1e', borderRadius: 2 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', border: 'none', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555', letterSpacing: '0.1em' }}>
          📎 KEY INTELLIGENCE — {facts.length} FACTS FROM SEARCH
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#444' }}>
          {open ? '▾ COLLAPSE' : '▸ EXPAND'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0.6rem 0.75rem', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: '0.8rem', color: '#444', lineHeight: 1.5, marginBottom: '0.4rem' }}>
            Specific facts Claude found during web search that inform this brief.
          </div>
          <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {facts.map((f, i) => (
              <li key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#666', lineHeight: 1.6, marginBottom: '0.2rem' }}>
                {f}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ── Panel divider ─────────────────────────────────────────────────
function PanelHeader({ label, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0.75rem 0 0.5rem' }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.12em' }}>{label}</span>
      {sub && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.64rem', color: '#444' }}>{sub}</span>}
    </div>
  );
}

export function S6Geo({ d, brief, globalBrief: gb }) {
  // Panel A — global (tariff/war/geo) from useGlobalBrief
  const globalItems  = gb?.globalBrief?.geoItems;
  const keyFacts     = gb?.globalBrief?.keyFacts;
  const globalIsAI   = Array.isArray(globalItems) && globalItems.length > 0;
  const globalLoad   = gb?.loading;

  // Panel B — currency-specific from useAIBrief
  const curItems     = brief?.brief?.geopolitical ?? d.geopolitical;
  const curIsAI      = !!brief?.brief?.geopolitical;
  const curLoad      = brief?.loading;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={6} title="Geopolitical Overlay & Tail Risks" />

      {/* ── PANEL A: GLOBAL MACRO RISKS ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <PanelHeader
          label="GLOBAL — TARIFFS · WAR · GEO TENSIONS"
          sub="AI-searched · all G10 currencies · refreshes every 4h"
        />
        {globalIsAI && (
          <AIStamp source={gb.source} generatedAt={gb.generatedAt} onRefresh={gb.refresh} />
        )}
        {globalLoad && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555' }}>⚡ AI SEARCHING NEWS…</span>
        )}
      </div>

      {globalLoad && <GeoSkeleton n={4} />}

      {!globalLoad && globalIsAI && globalItems.map((item, i) => (
        <GeoCard key={i} item={item} showDetail />
      ))}

      {!globalLoad && !globalIsAI && (
        <div style={{ padding: '0.75rem 1rem', border: '1px solid #2a1a1a', background: 'rgba(224,92,92,0.04)', marginBottom: '0.5rem' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#e05c5c', marginBottom: '0.3rem' }}>
            ⚠ GLOBAL BRIEF UNAVAILABLE
          </div>
          {gb?.error ? (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#666', lineHeight: 1.6 }}>
              Error: {gb.error}
              {(gb.error.includes('504') || gb.error.includes('timeout') || gb.error.includes('502')) &&
                <span style={{ color: '#e09a30', display: 'block', marginTop: '0.2rem' }}>
                  → Function timeout. claude-proxy needs timeout = 60 in netlify.toml (web search takes 15–45s).
                </span>
              }
              {gb.error.includes('unknown tool') &&
                <span style={{ color: '#e09a30', display: 'block', marginTop: '0.2rem' }}>
                  → Missing anthropic-beta header. claude-proxy.js needs 'anthropic-beta': 'web-search-2025-03-05'.
                </span>
              }
            </div>
          ) : (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555' }}>
              ANTHROPIC_API_KEY not set in Netlify env vars, or fetch failed. Check Netlify function logs.
            </div>
          )}
          {gb?.refresh && (
            <button onClick={gb.refresh}
              style={{ marginTop: '0.5rem', background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.64rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
              ↺ RETRY
            </button>
          )}
        </div>
      )}

      {/* Key facts sidenote drawer */}
      {globalIsAI && <KeyFactsDrawer facts={keyFacts} />}

      {/* ── PANEL B: CURRENCY-SPECIFIC ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', margin: '1.25rem 0 0.5rem' }}>
        <PanelHeader
          label="CURRENCY-SPECIFIC — DIRECT FX IMPACTS"
          sub="AI-searched per currency · refreshes every 24h"
        />
        {curIsAI && (
          <AIStamp source={brief.source} generatedAt={brief.generatedAt} onRefresh={brief.refresh} />
        )}
        {curLoad && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555' }}>⚡ AI GENERATING…</span>
        )}
      </div>

      {curLoad && <GeoSkeleton n={3} />}

      {!curLoad && curItems?.map((g, i) => (
        <GeoCard key={i} item={g} showDetail={false} />
      ))}
    </>
  );
}
