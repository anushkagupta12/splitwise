import { Trash2 } from "lucide-react";

export default function ExpenseLedger({ expenses, members, onDelete }) {
  if (expenses.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 px-1 text-sm font-medium text-ink-soft">Ledger</p>
      <ul className="space-y-2">
        {[...expenses].reverse().map((expense) => (
          <li
            key={expense.id}
            className="group flex items-center justify-between gap-3 rounded-lg border border-paper-edge bg-white/60 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{expense.description}</p>
              <p className="mt-0.5 truncate font-mono text-xs text-ink-soft">
                Paid by {expense.payer} ·{" "}
                {members.map((m) => `${m} ${expense.splits[m].toFixed(0)}%`).join(", ")}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <span className="font-mono text-sm font-semibold text-ink">
                ${expense.amount.toFixed(2)}
              </span>
              <button
                onClick={() => onDelete(expense.id)}
                className="rounded p-1 text-ink-soft opacity-0 transition group-hover:opacity-100 hover:bg-owed-soft hover:text-owed"
                aria-label={`Delete ${expense.description}`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
