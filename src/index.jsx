import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext.jsx';
import App from './App.jsx';

// ── Error Boundary ─────────────────────────────────────────────────
// Catches any render crash and shows the error message instead of a
// blank dark screen. Open browser DevTools console for full stack trace.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[FX Dashboard] Render error:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          <div style={{ maxWidth: 680, width: '100%' }}>
            <div style={{ color: '#e05c5c', fontSize: '0.72rem', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              ⚠ RENDER ERROR — FX DASHBOARD
            </div>
            <div style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              {this.state.error.message}
            </div>
            <pre style={{
              background: '#111',
              border: '1px solid #2a2a2a',
              padding: '1rem',
              color: '#e05c5c',
              fontSize: '0.72rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}>
              {this.state.error.stack}
            </pre>
            <div style={{ color: '#555', fontSize: '0.68rem', marginTop: '1rem', lineHeight: 1.6 }}>
              Open browser DevTools (F12) → Console for full details.
              Common causes: merge conflict markers (&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD) left in a JS file,
              missing export, or a data field that is undefined where a string is expected.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                background: 'none',
                border: '1px solid #333',
                color: '#777',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                padding: '0.4rem 1rem',
                cursor: 'pointer',
              }}
            >
              ↺ RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
