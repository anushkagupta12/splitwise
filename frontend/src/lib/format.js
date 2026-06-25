// Deterministic color assignment per person, cycling through a fixed palette
// so any group size gets a stable, distinguishable color per member.
//
// Tailwind v4 scans source files for literal class strings to know what CSS
// to generate — it can't see the dynamic `text-${name}` lookups below. The
// line under this comment exists purely so the scanner finds these classes:
// text-amit bg-amit text-rahul bg-rahul text-sneha bg-sneha text-ink bg-ink
const PALETTE = [
  { text: "text-amit", dot: "bg-amit" },
  { text: "text-rahul", dot: "bg-rahul" },
  { text: "text-sneha", dot: "bg-sneha" },
  { text: "text-ink", dot: "bg-ink" },
];

export function colorForPerson(person, members) {
  const idx = members.indexOf(person);
  if (idx === -1) return PALETTE[3];
  return PALETTE[idx % PALETTE.length];
}

export function formatMoney(value) {
  const rounded = Math.round(value * 100) / 100;
  return `$${rounded.toFixed(2)}`;
}

export function evenSplit(members) {
  const base = 100 / members.length;
  return members.reduce((acc, m) => ({ ...acc, [m]: base }), {});
}

export function roundPct(value) {
  return Math.round(value * 10) / 10;
}
