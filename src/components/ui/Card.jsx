export function Card({ label, children, style, labelRight }) {
  return (
    <div className="card" style={style}>
      {label && (
        <div className="card-lbl">
          {label}
          {labelRight && <span>{labelRight}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
