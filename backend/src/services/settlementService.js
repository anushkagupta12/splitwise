// Core domain logic for Splitwise-Lite.
// Pure functions only — no Express, no DB access — so this is unit-testable
// in total isolation and reusable if the persistence layer ever changes.

const ROUNDING_EPSILON = 0.005; // treat balances under half a cent as settled

/**
 * Rounds a currency value to 2 decimal places, avoiding float artifacts
 * like 7 * 1.1 -> 7.700000000000001.
 */
function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Given a single expense, returns how much each non-payer owes the payer,
 * based on percentage splits (the "Fractional/Proportional Division Processor").
 *
 * @param {{ amount: number, payer: string, splits: Object<string, number> }} expense
 * @returns {Object<string, number>} person -> amount they owe the payer (payer excluded)
 */
function computeShares(expense) {
  const { amount, payer, splits } = expense;
  const shares = {};
  Object.entries(splits).forEach(([person, percentage]) => {
    if (person === payer) return; // payer doesn't owe themself
    shares[person] = roundMoney((amount * percentage) / 100);
  });
  return shares;
}

/**
 * Folds a list of expenses into a single net-balance ledger per person.
 * Positive balance = this person is owed money overall.
 * Negative balance = this person owes money overall.
 *
 * @param {Array} expenses
 * @param {string[]} members - canonical member list, ensures everyone appears even at 0
 * @returns {Object<string, number>} person -> net balance
 */
function computeNetBalances(expenses, members) {
  const net = {};
  members.forEach((m) => (net[m] = 0));

  expenses.forEach((expense) => {
    const { amount, payer, splits } = expense;
    Object.entries(splits).forEach(([person, percentage]) => {
      const share = (amount * percentage) / 100;
      if (person === payer) return;
      net[person] = (net[person] || 0) - share;
      net[payer] = (net[payer] || 0) + share;
    });
  });

  Object.keys(net).forEach((p) => (net[p] = roundMoney(net[p])));
  return net;
}

/**
 * Debt Minimization Algorithm.
 *
 * Rather than tracking every pairwise IOU and netting overlaps one at a time,
 * this computes each person's overall net balance across ALL expenses, then
 * greedily matches the largest debtor against the largest creditor, repeatedly,
 * until everyone is at zero. This guarantees the minimum possible number of
 * settlement transactions: at most (members.length - 1).
 *
 * @param {Array} expenses
 * @param {string[]} members
 * @returns {{ settlements: Array<{from: string, to: string, amount: number}>, net: Object<string, number> }}
 */
function minimizeDebts(expenses, members) {
  const net = computeNetBalances(expenses, members);

  const debtors = [];
  const creditors = [];

  Object.entries(net).forEach(([person, balance]) => {
    if (balance < -ROUNDING_EPSILON) debtors.push({ person, amount: -balance });
    else if (balance > ROUNDING_EPSILON) creditors.push({ person, amount: balance });
  });

  // Largest-first ordering minimizes the transaction count.
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = roundMoney(Math.min(debtors[i].amount, creditors[j].amount));

    if (pay > ROUNDING_EPSILON) {
      settlements.push({
        from: debtors[i].person,
        to: creditors[j].person,
        amount: pay,
      });
    }

    debtors[i].amount = roundMoney(debtors[i].amount - pay);
    creditors[j].amount = roundMoney(creditors[j].amount - pay);

    if (debtors[i].amount <= ROUNDING_EPSILON) i++;
    if (creditors[j].amount <= ROUNDING_EPSILON) j++;
  }

  return { settlements, net };
}

/**
 * Converts the settlement list into the human-readable sentences the
 * frontend's "Live Settlement Board" displays.
 *
 * @param {Array<{from: string, to: string, amount: number}>} settlements
 * @param {string[]} members
 * @returns {string[]}
 */
function buildSettlementSentences(settlements, members) {
  const involved = new Set();
  settlements.forEach((s) => {
    involved.add(s.from);
    involved.add(s.to);
  });

  const sentences = settlements.map(
    (s) => `${s.from} owes ${s.to} $${s.amount.toFixed(2)}`
  );

  members
    .filter((m) => !involved.has(m))
    .forEach((m) => sentences.push(`${m} owes nobody (Even)`));

  return sentences;
}

module.exports = {
  roundMoney,
  computeShares,
  computeNetBalances,
  minimizeDebts,
  buildSettlementSentences,
};
