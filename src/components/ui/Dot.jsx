// Freshness indicator — coloured dot shown next to data values
const DOT_COLORS = {
  live:         '#4fc3a1',
  manual:       '#b8932e',
  stale:        '#e05c5c',
  'live-partial': '#4fc3a1',
};
const DOT_TIPS = {
  live:         'Live data',
  manual:       'Manual override',
  stale:        'Hardcoded — may be outdated. Update in ⚙',
  'live-partial': 'Partially live',
};

export function Dot({ src = 'stale', style }) {
  const color = DOT_COLORS[src] || DOT_COLORS.stale;
  return (
    <span
      title={DOT_TIPS[src] || DOT_TIPS.stale}
      style={{
        display:       'inline-block',
        width:         6,
        height:        6,
        borderRadius:  '50%',
        background:    color,
        marginLeft:    '0.3rem',
        verticalAlign: 'middle',
        flexShrink:    0,
        ...style,
      }}
    />
  );
}
