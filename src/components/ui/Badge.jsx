export function Badge({ type = 'neut', children }) {
  return <span className={`badge ${type}`}>{children}</span>;
}
