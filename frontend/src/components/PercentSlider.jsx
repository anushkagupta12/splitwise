const DOT_COLORS = {
  0: "bg-amit",
  1: "bg-rahul",
  2: "bg-sneha",
  3: "bg-ink",
};

export default function PercentSlider({ person, index, value, onChange }) {
  const dotClass = DOT_COLORS[index % 4];

  return (
    <div className="flex items-center gap-3">
      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className="w-16 flex-shrink-0 truncate font-mono text-sm text-ink">{person}</span>
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={value}
        onChange={(e) => onChange(person, parseFloat(e.target.value))}
        className="flex-1 accent-owed"
        aria-label={`${person}'s share`}
      />
      <span className="w-14 flex-shrink-0 text-right font-mono text-sm font-medium text-ink">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
