import { SectionHead } from '../ui/SectionHead.jsx';

export function S6Geo({ d }) {
  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={6} title="Geopolitical Overlay & Tail Risks" />
      {d.geopolitical?.map((g, i) => (
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
