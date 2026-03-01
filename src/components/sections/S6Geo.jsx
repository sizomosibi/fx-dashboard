import { SectionHead } from '../ui/SectionHead.jsx';

function GeoSkeleton() {
  return (
    <div className="geo-card mixed" style={{ opacity: 0.35 }}>
      <div style={{ height: '0.8rem', background: '#222', borderRadius: 2, width: '60%', marginBottom: '0.5rem' }} />
      <div style={{ height: '0.7rem', background: '#1a1a1a', borderRadius: 2, width: '95%', marginBottom: '0.3rem' }} />
      <div style={{ height: '0.7rem', background: '#1a1a1a', borderRadius: 2, width: '80%' }} />
    </div>
  );
}

export function S6Geo({ d, brief }) {
  const geoItems  = brief?.brief?.geopolitical ?? d.geopolitical;
  const isAI      = !!brief?.brief?.geopolitical;
  const isLoading = brief?.loading;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={6} title="Geopolitical Overlay & Tail Risks" />

      {isAI && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--teal)', letterSpacing: '0.08em' }}>
            ⚡ AI · {brief.source === 'cache' ? 'CACHED' : 'LIVE'}
            {brief.generatedAt ? ' · ' + new Date(brief.generatedAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' }) : ''}
          </span>
          <button
            onClick={brief.refresh}
            title="Regenerate with current data"
            style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', padding: '0.1rem 0.4rem', cursor: 'pointer', borderRadius: 2 }}
          >↺ REFRESH</button>
        </div>
      )}

      {isLoading && (
        <>
          <GeoSkeleton />
          <GeoSkeleton />
          <GeoSkeleton />
        </>
      )}

      {!isLoading && geoItems?.map((g, i) => (
        <div key={i} className={`geo-card ${g.effect}`}>
          <div className="geo-head">
            <div className="geo-title">{g.title}</div>
            <span className={`geo-pill ${g.effect}`}>{g.effect.toUpperCase()}</span>
          </div>
          <div className="geo-analysis">{g.analysis}</div>
        </div>
      ))}
    </>
  );
}
