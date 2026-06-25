import { useState, useMemo } from "react";
import { RotateCcw, Check, X as XIcon } from "lucide-react";
import PercentSlider from "./PercentSlider";
import { evenSplit, roundPct } from "../lib/format";

export default function BillForm({ members, onSubmit }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(members[0]);
  const [sliders, setSliders] = useState(() => evenSplit(members));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalPct = useMemo(
    () => roundPct(Object.values(sliders).reduce((a, b) => a + b, 0)),
    [sliders]
  );
  const isValidSplit = Math.abs(totalPct - 100) < 0.05;
  const canSubmit = description.trim().length > 0 && parseFloat(amount) > 0 && isValidSplit;

  function handleSliderChange(person, newVal) {
    const others = members.filter((p) => p !== person);
    const remaining = 100 - newVal;
    const othersTotal = others.reduce((sum, p) => sum + sliders[p], 0);

    const next = { ...sliders, [person]: newVal };
    if (othersTotal > 0) {
      others.forEach((p) => {
        next[p] = (sliders[p] / othersTotal) * remaining;
      });
    } else {
      const even = remaining / others.length;
      others.forEach((p) => (next[p] = even));
    }
    setSliders(next);
  }

  function resetEven() {
    setSliders(evenSplit(members));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        description: description.trim(),
        amount: parseFloat(amount),
        payer,
        splits: sliders,
      });
      setDescription("");
      setAmount("");
      resetEven();
    } catch (err) {
      setError(err.message || "Couldn't add that expense.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-paper-edge bg-white/60 p-6 shadow-sm backdrop-blur-sm"
    >
      <h2 className="mb-5 font-mono text-base font-semibold text-ink">Add an expense</h2>

      <label className="mb-1.5 block text-sm font-medium text-ink-soft">What was it for?</label>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Pizza night, cab to the station..."
        className="mb-4 w-full rounded-lg border border-paper-edge bg-white px-3.5 py-2.5 text-sm text-ink outline-none ring-owed/20 transition focus:border-owed focus:ring-4"
      />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Total amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-paper-edge bg-white px-3.5 py-2.5 pl-7 text-sm text-ink outline-none ring-owed/20 transition focus:border-owed focus:ring-4"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Paid by</label>
          <select
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className="w-full rounded-lg border border-paper-edge bg-white px-3.5 py-2.5 text-sm text-ink outline-none ring-owed/20 transition focus:border-owed focus:ring-4"
          >
            {members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-ink-soft">Split by percentage</label>
        <button
          type="button"
          onClick={resetEven}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-owed"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          Reset to even
        </button>
      </div>

      <div className="mb-3 space-y-3 rounded-xl border border-paper-edge bg-paper/60 p-4">
        {members.map((person, idx) => (
          <PercentSlider
            key={person}
            person={person}
            index={idx}
            value={sliders[person] ?? 0}
            onChange={handleSliderChange}
          />
        ))}
        <div
          className={`flex items-center justify-between border-t border-dashed border-paper-edge pt-3 font-mono text-xs ${
            isValidSplit ? "text-settled" : "text-owed"
          }`}
        >
          <span>Total</span>
          <span className="inline-flex items-center gap-1 font-medium">
            {isValidSplit ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <XIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            {totalPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-owed">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Adding..." : "Add to ledger"}
      </button>
      {!isValidSplit && (
        <p className="mt-2 text-center text-xs text-ink-soft">Sliders need to add up to exactly 100% first.</p>
      )}
    </form>
  );
}
