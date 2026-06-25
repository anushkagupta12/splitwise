const {
  computeShares,
  computeNetBalances,
  minimizeDebts,
  buildSettlementSentences,
} = require("../src/services/settlementService");

const MEMBERS = ["Amit", "Rahul", "Sneha"];

describe("computeShares", () => {
  test("splits proportionally by percentage, excluding the payer", () => {
    const expense = {
      amount: 300,
      payer: "Amit",
      splits: { Amit: 50, Rahul: 25, Sneha: 25 },
    };
    expect(computeShares(expense)).toEqual({ Rahul: 75, Sneha: 75 });
  });
});

describe("computeNetBalances", () => {
  test("single expense: payer is owed, others owe", () => {
    const expenses = [
      { amount: 300, payer: "Amit", splits: { Amit: 50, Rahul: 25, Sneha: 25 } },
    ];
    const net = computeNetBalances(expenses, MEMBERS);
    expect(net.Amit).toBeCloseTo(150);
    expect(net.Rahul).toBeCloseTo(-75);
    expect(net.Sneha).toBeCloseTo(-75);
  });

  test("counter-debts across multiple expenses net down correctly", () => {
    // Rahul pays for a meal Amit and Sneha share in; Amit later pays back into the pool.
    const expenses = [
      { amount: 100, payer: "Rahul", splits: { Amit: 50, Sneha: 50, Rahul: 0 } },
      { amount: 50, payer: "Amit", splits: { Rahul: 100, Amit: 0, Sneha: 0 } },
    ];
    const net = computeNetBalances(expenses, MEMBERS);
    // Amit owed 50 from expense 1, then paid 50 in expense 2 -> net 0
    expect(net.Amit).toBeCloseTo(0);
    // Rahul was owed 100 total from expense 1 (50 from Amit + 50 from Sneha),
    // then owes 50 to Amit from expense 2 -> net +50
    expect(net.Rahul).toBeCloseTo(50);
    expect(net.Sneha).toBeCloseTo(-50);
  });
});

describe("minimizeDebts", () => {
  test("returns no settlements when everyone is even", () => {
    const { settlements } = minimizeDebts([], MEMBERS);
    expect(settlements).toEqual([]);
  });

  test("two-person net case collapses to a single settlement", () => {
    const expenses = [
      { amount: 100, payer: "Rahul", splits: { Amit: 0, Rahul: 50, Sneha: 50 } },
    ];
    const { settlements } = minimizeDebts(expenses, MEMBERS);
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toMatchObject({ from: "Sneha", to: "Rahul", amount: 50 });
  });

  test("minimizes total number of transactions across 3 people", () => {
    // Amit owes 10, Rahul owes 5, Sneha is owed 15 overall.
    // Optimal: 2 settlements, not 3 pairwise IOUs.
    const expenses = [
      { amount: 30, payer: "Sneha", splits: { Amit: 33.33, Rahul: 16.67, Sneha: 50 } },
    ];
    const { settlements } = minimizeDebts(expenses, MEMBERS);
    expect(settlements.length).toBeLessThanOrEqual(2);
    settlements.forEach((s) => expect(s.to).toBe("Sneha"));
  });

  test("rounding dust under half a cent is treated as settled", () => {
    const expenses = [
      { amount: 10, payer: "Amit", splits: { Amit: 33.33, Rahul: 33.33, Sneha: 33.34 } },
      { amount: 10, payer: "Rahul", splits: { Amit: 33.33, Rahul: 33.33, Sneha: 33.34 } },
      { amount: 10, payer: "Sneha", splits: { Amit: 33.33, Rahul: 33.33, Sneha: 33.34 } },
    ];
    const { settlements } = minimizeDebts(expenses, MEMBERS);
    settlements.forEach((s) => expect(s.amount).toBeGreaterThan(0.005));
  });
});

describe("buildSettlementSentences", () => {
  test("formats settlements as human-readable sentences", () => {
    const settlements = [{ from: "Rahul", to: "Sneha", amount: 15 }];
    const sentences = buildSettlementSentences(settlements, MEMBERS);
    expect(sentences).toContain("Rahul owes Sneha $15.00");
    expect(sentences).toContain("Amit owes nobody (Even)");
  });

  test("everyone even produces all 'owes nobody' sentences", () => {
    const sentences = buildSettlementSentences([], MEMBERS);
    expect(sentences).toHaveLength(3);
    expect(sentences).toContain("Amit owes nobody (Even)");
  });
});
