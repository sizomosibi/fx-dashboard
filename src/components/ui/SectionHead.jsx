export function SectionHead({ num, title, id }) {
  const n = String(num).padStart(2, '0');
  return (
    <div className="sec-head" id={id || `s${num}`}>
      <span className="sec-num">§ {n}</span>
      <div className="sec-title">{title}</div>
    </div>
  );
}
