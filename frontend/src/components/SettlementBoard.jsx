import { ArrowRight, CheckCircle2 } from "lucide-react";
import { colorForPerson } from "../lib/format";

export default function SettlementBoard({ settlement, members }) {
  const settlements = settlement?.settlements || [];
  const expenseCount = settlement?.expenseCount ?? 0;

  const involved = new Set();
  settlements.forEach((s) => {
    involved.add(s.from);
    involved.add(s.to);
  });
  const evenPeople = members.filter((m) => !involved.has(m));

  return (
    <div className="torn-edge overflow-hidden rounded-t-sm border border-paper-edge bg-white shadow-sm">
      <div className="px-6 pb-6 pt-7">
        <p className="text-center font-mono text-base font-semibold tracking-widest text-ink">
          NET BALANCES
        </p>
        <p className="mt-1 text-center font-mono text-xs text-ink-soft">
          {expenseCount} {expenseCount === 1 ? "expense" : "expenses"} logged
        </p>

        <div className="my-4 border-t border-dashed border-paper-edge" />

        {expenseCount === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">
            No expenses yet — add one to see who owes who.
          </p>
        ) : settlements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="h-6 w-6 text-settled" strokeWidth={1.75} />
            <p className="text-center text-sm text-ink">Everyone's settled up. Nobody owes anybody.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {settlements.map((s, idx) => {
              const fromColor = colorForPerson(s.from, members);
              const toColor = colorForPerson(s.to, members);
              return (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 font-mono text-sm"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={`font-medium ${fromColor.text}`}>{s.from}</span>
                    <span className="text-ink-soft">owes</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-ink-soft" strokeWidth={2} />
                    <span className={`font-medium ${toColor.text}`}>{s.to}</span>
                  </span>
                  <span className="flex-shrink-0 font-semibold text-ink">
                    ${s.amount.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {expenseCount > 0 && evenPeople.length > 0 && (
          <>
            <div className="my-4 border-t border-dashed border-paper-edge" />
            <ul className="space-y-1.5">
              {evenPeople.map((p) => (
                <li key={p} className="font-mono text-xs text-ink-soft">
                  {p} owes nobody <span className="text-settled">(Even)</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="h-3 bg-paper-edge/40" aria-hidden="true" />
    </div>
  );
}
