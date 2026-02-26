import { useState } from 'react';
import { SectionHead } from '../ui/SectionHead.jsx';
import { Dot } from '../ui/Dot.jsx';
import { useLiveData, useCurrentCcy } from '../../context/AppContext.jsx';
import { CURRENCIES } from '../../data/currencies.js';

// Source badge colours
const SOURCE_COLORS = {
  'FXStreet':  '#4a90d9',
  'ForexLive': '#e8a838',
  'DailyFX':   '#9b59b6',
};

function SourceBadge({ source }) {
  const color = SOURCE_COLORS[source] || '#555';
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.62rem',
      color,
      border: `1px solid ${color}44`,
      padding: '0.05rem 0.3rem',
      letterSpacing: '0.06em',
      flexShrink: 0,
    }}>
      {source}
    </span>
  );
}

function CcyPill({ ccy }) {
  if (!CURRENCIES[ccy]) return null;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.6rem',
      color: 'var(--muted)',
      background: 'var(--paper3)',
      border: '1px solid var(--rule2)',
      padding: '0.04rem 0.25rem',
    }}>
      {CURRENCIES[ccy]?.flag} {ccy}
    </span>
  );
}

function ArticleRow({ article, expanded, onToggle }) {
  return (
    <div className="news-article" onClick={onToggle} style={{ cursor: 'pointer' }}>
      <div className="news-article-head">
        <div className="news-meta">
          <SourceBadge source={article.source} />
          <span className="news-time">{article.timeAgo}</span>
          {article.currencies?.filter(c => c !== 'USD').slice(0, 3).map(c => (
            <CcyPill key={c} ccy={c} />
          ))}
        </div>
        <div className="news-title">{article.title}</div>
      </div>

      {expanded && article.description && (
        <div className="news-body">
          <div className="news-desc">{article.description}</div>
          <a
            href={article.link}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="news-link"
          >
            READ FULL ARTICLE ↗
          </a>
        </div>
      )}
    </div>
  );
}

// Filter controls
const IMPACT_OPTIONS = ['all', 'high', 'medium', 'low'];

export function S12News() {
  const live     = useLiveData();
  const cur      = useCurrentCcy();
  const [expanded, setExpanded] = useState(null);
  const [filter,   setFilter]   = useState('all');   // source filter
  const [max,      setMax]      = useState(8);

  const newsSrc  = live.status.news;
  const isLive   = newsSrc === 'live';
  const articles = isLive ? (live.news[cur] || []) : [];

  // Source options from available articles
  const sources = ['all', ...new Set(articles.map(a => a.source))];

  const filtered = filter === 'all'
    ? articles
    : articles.filter(a => a.source === filter);

  const visible = filtered.slice(0, max);

  const fetchedAt = live.newsFetchedAt
    ? new Date(live.newsFetchedAt).toLocaleTimeString('en-AU', { timeStyle: 'short' })
    : null;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={12} title={`Headline News — ${CURRENCIES[cur]?.flag || ''} ${cur}`} />

      {/* Status bar */}
      <div className="news-status-bar">
        <Dot src={newsSrc} />
        {isLive ? (
          <span className="news-status-live">
            LIVE · FXStreet · ForexLive · DailyFX
            {fetchedAt && <span style={{ color: '#555', marginLeft: '0.5rem' }}>fetched {fetchedAt}</span>}
          </span>
        ) : (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#555' }}>
            News loads on Netlify deployment — not available in local dev
          </span>
        )}
      </div>

      {!isLive && (
        <div className="news-offline-box">
          <div className="news-offline-title">NEWS FEED — DEPLOYMENT ONLY</div>
          <p>
            The news proxy runs as a Netlify Function and is not available during local development
            (<code>npm run dev</code>). Deploy to Netlify to activate live headlines.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Sources: <strong>FXStreet</strong>, <strong>ForexLive</strong>, <strong>DailyFX</strong> — 
            RSS feeds filtered by currency keywords, updated every 5 minutes.
          </p>
        </div>
      )}

      {isLive && (
        <>
          {/* Source filter tabs */}
          {sources.length > 2 && (
            <div className="news-filters">
              {sources.map(s => (
                <button
                  key={s}
                  className={`news-filter-btn${filter === s ? ' active' : ''}`}
                  onClick={() => { setFilter(s); setExpanded(null); }}
                >
                  {s === 'all' ? 'ALL SOURCES' : s.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Article count */}
          {filtered.length === 0 ? (
            <div className="news-empty">
              No recent {cur} headlines found across tracked sources.
              <div style={{ marginTop: '0.35rem', fontSize: '0.84rem' }}>
                This can happen when there are no major {cur}-relevant events today.
              </div>
            </div>
          ) : (
            <>
              <div className="news-feed">
                {visible.map((article, i) => (
                  <ArticleRow
                    key={`${article.source}-${i}`}
                    article={article}
                    expanded={expanded === i}
                    onToggle={() => setExpanded(expanded === i ? null : i)}
                  />
                ))}
              </div>

              {filtered.length > max && (
                <button
                  className="news-load-more"
                  onClick={() => setMax(m => m + 6)}
                >
                  SHOW MORE ({filtered.length - max} remaining)
                </button>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
