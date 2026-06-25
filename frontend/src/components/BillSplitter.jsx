import React, { useState, useMemo } from "react";

// Fixed group as per spec — easy to extend by editing this array
const PEOPLE = ["Amit", "Rahul", "Sneha"];

// Tolerance for floating point comparison when checking "exactly 100%"
const EPSILON = 0.01;

function formatCurrency(amount) {
  const rounded = Math.round(amount * 100) / 100;
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toFixed(2)}`;
}

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function evenSplit() {
  // Distributes 100% across PEOPLE as evenly as possible, remainder to last person,
  // so the starting state always sums to exactly 100.
  const base = Math.floor((100 / PEOPLE.length) * 10) / 10;
  const split = {};
  let used = 0;
  PEOPLE.forEach((p, idx) => {
    if (idx === PEOPLE.length - 1) {
      split[p] = Math.round((100 - used) * 10) / 10;
    } else {
      split[p] = base;
      used += base;
    }
  });
  return split;
}

/**
 * Redistributes percentages when one slider moves, keeping the total at exactly 100.
 * The dragged person gets the new value; the remaining percentage is distributed
 * across the other people proportional to their current relative weights
 * (or evenly if they're all currently at 0).
 */
function redistribute(current, changedPerson, newValue) {
  const clamped = Math.max(0, Math.min(100, newValue));
  const others = PEOPLE.filter((p) => p !== changedPerson);
  const remaining = 100 - clamped;

  const othersTotal = others.reduce((sum, p) => sum + current[p], 0);

  const next = { ...current, [changedPerson]: clamped };

  if (othersTotal <= 0) {
    // Evenly split the remaining among others
    others.forEach((p, idx) => {
      if (idx === others.length - 1) {
        const usedSoFar = others
          .slice(0, idx)
          .reduce((s, q) => s + next[q], 0);
        next[p] = Math.round((remaining - usedSoFar) * 10) / 10;
      } else {
        next[p] = Math.round((remaining / others.length) * 10) / 10;
      }
    });
  } else {
    let usedSoFar = 0;
    others.forEach((p, idx) => {
      if (idx === others.length - 1) {
        next[p] = Math.round((remaining - usedSoFar) * 10) / 10;
      } else {
        const share = Math.round((current[p] / othersTotal) * remaining * 10) / 10;
        next[p] = share;
        usedSoFar += share;
      }
    });
  }

  return next;
}

function getTotal(splits) {
  return Math.round(PEOPLE.reduce((sum, p) => sum + splits[p], 0) * 10) / 10;
}

function isExactly100(splits) {
  return Math.abs(getTotal(splits) - 100) <= EPSILON;
}

/**
 * Computes raw net balance per person across all expenses.
 * Positive balance = is owed money (creditor)
 * Negative balance = owes money (debtor)
 *
 * Each expense now carries its own custom percentage split (summing to 100),
 * so each participant's share = amount * (their percentage / 100).
 */
function computeBalances(expenses) {
  const balances = {};
  PEOPLE.forEach((p) => (balances[p] = 0));

  expenses.forEach((expense) => {
    const { amount, payer, splits } = expense;

    balances[payer] += amount;
    PEOPLE.forEach((person) => {
      const pct = splits[person] || 0;
      if (pct > 0) {
        balances[person] -= amount * (pct / 100);
      }
    });
  });

  return balances;
}

/**
 * Debt simplification: greedily matches the largest creditor against
 * the largest debtor until everyone is settled. Produces the minimum
 * number of transactions instead of a tangled pairwise list.
 */
function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  PEOPLE.forEach((person) => {
    const value = Math.round(balances[person] * 100) / 100;
    if (value > 0.005) creditors.push({ name: person, amount: value });
    else if (value < -0.005) debtors.push({ name: person, amount: -value });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const payment = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.name,
      to: creditor.name,
      amount: payment,
    });

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

function BalanceCard({ person, balance }) {
  const rounded = Math.round(balance * 100) / 100;
  const isEven = Math.abs(rounded) < 0.005;
  const isOwed = rounded > 0;

  const colorClasses = isEven
    ? "bg-gray-100 text-gray-500"
    : isOwed
    ? "bg-emerald-50 text-emerald-700"
    : "bg-orange-50 text-orange-700";

  const avatarClasses = isEven
    ? "bg-gray-200 text-gray-600"
    : isOwed
    ? "bg-emerald-100 text-emerald-700"
    : "bg-orange-100 text-orange-700";

  const statusText = isEven
    ? "Even"
    : isOwed
    ? `gets back ${formatCurrency(rounded)}`
    : `owes ${formatCurrency(Math.abs(rounded))}`;

  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${avatarClasses}`}
        >
          {initials(person)}
        </div>
        <span className="text-sm font-medium text-gray-900">{person}</span>
      </div>
      <span className={`text-sm rounded-md px-2 py-0.5 ${colorClasses}`}>
        {statusText}
      </span>
    </div>
  );
}

function SettlementRow({ transaction }) {
  return (
    <div className="flex items-center gap-2 border-t border-gray-100 pt-2 text-sm">
      <span className="font-medium text-gray-900">{transaction.from}</span>
      <svg
        className="h-3.5 w-3.5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <span className="font-medium text-gray-900">{transaction.to}</span>
      <span className="ml-auto text-gray-500">
        {formatCurrency(transaction.amount)}
      </span>
    </div>
  );
}

function ExpenseHistoryRow({ expense, onDelete }) {
  const splitSummary = PEOPLE.filter((p) => expense.splits[p] > 0)
    .map((p) => `${p} ${expense.splits[p]}%`)
    .join(", ");

  return (
    <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs">
      <div className="overflow-hidden">
        <span className="font-medium text-gray-900">{expense.description}</span>
        <span className="text-gray-500">
          {" "}
          — {expense.payer} paid {formatCurrency(expense.amount)} ({splitSummary})
        </span>
      </div>
      <button
        onClick={onDelete}
        aria-label="Remove expense"
        className="ml-2 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function PercentageSlider({ person, value, onChange }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{person}</span>
        <span className="text-sm tabular-nums text-gray-500">
          {value.toFixed(1)}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={value}
        onChange={(e) => onChange(person, parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}

export default function BillSplitter() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(PEOPLE[0]);
  const [splits, setSplits] = useState(evenSplit());
  const [error, setError] = useState("");

  const balances = useMemo(() => computeBalances(expenses), [expenses]);
  const settlements = useMemo(() => simplifyDebts(balances), [balances]);

  const total = getTotal(splits);
  const canSubmit = isExactly100(splits);

  function handleSliderChange(person, newValue) {
    setSplits((prev) => redistribute(prev, person, newValue));
  }

  function handleResetEqual() {
    setSplits(evenSplit());
  }

  function handleAddExpense() {
    const trimmedDesc = description.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedDesc) {
      setError("Please enter an item description.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!isExactly100(splits)) {
      setError("Sliders must total exactly 100% before adding the expense.");
      return;
    }

    setError("");
    setExpenses((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: trimmedDesc,
        amount: Math.round(parsedAmount * 100) / 100,
        payer,
        splits: { ...splits },
      },
    ]);

    setDescription("");
    setAmount("");
    setSplits(evenSplit());
  }

  function handleDeleteExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 p-4 md:grid-cols-2">
      {/* Bill Creation Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
          <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4m-5-9H8a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-3l-1-1z" />
          </svg>
          Add an expense
        </h2>

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Item description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner at cafe"
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Total amount
        </label>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Paid by
        </label>
        <select
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {PEOPLE.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Percentage Split Sliders */}
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-500">
            Split by percentage
          </label>
          <button
            type="button"
            onClick={handleResetEqual}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Split equally
          </button>
        </div>

        <div className="mb-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          {PEOPLE.map((p) => (
            <PercentageSlider
              key={p}
              person={p}
              value={splits[p]}
              onChange={handleSliderChange}
            />
          ))}
        </div>

        <div
          className={`mb-4 flex items-center justify-between rounded-md px-3 py-1.5 text-sm ${
            canSubmit
              ? "bg-emerald-50 text-emerald-700"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          <span>Total allocated</span>
          <span className="font-medium tabular-nums">{total.toFixed(1)}%</span>
        </div>

        <button
          onClick={handleAddExpense}
          disabled={!canSubmit}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            canSubmit
              ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add expense
        </button>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {!canSubmit && !error && (
          <p className="mt-2 text-xs text-gray-400">
            Sliders must total exactly 100% to enable submission.
          </p>
        )}

        {/* Expense history */}
        <div className="mt-5 border-t border-gray-100 pt-3">
          <p className="mb-2 text-xs font-medium text-gray-500">
            Expense history
          </p>
          <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="text-xs text-gray-400">No expenses added yet.</p>
            ) : (
              [...expenses].reverse().map((e) => (
                <ExpenseHistoryRow
                  key={e.id}
                  expense={e}
                  onDelete={() => handleDeleteExpense(e.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Settlement Board */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900">
          <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          Net balances
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          Simplified — minimum number of payments to settle up
        </p>

        <div className="mb-5 grid gap-2">
          {PEOPLE.map((p) => (
            <BalanceCard key={p} person={p} balance={balances[p]} />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400">
              No expenses yet. Add one to see balances.
            </p>
          ) : settlements.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Everyone is even. Nobody owes anyone.
            </div>
          ) : (
            settlements.map((t, idx) => (
              <SettlementRow key={`${t.from}-${t.to}-${idx}`} transaction={t} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
