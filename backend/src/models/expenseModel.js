// In-memory store of expenses ("bills"), scoped by group.
// Each expense records who paid, the total, and the percentage split per person.

const { v4: uuidv4 } = require("uuid");

/** @type {Map<string, Expense[]>} groupId -> list of expenses */
const expensesByGroup = new Map();

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} groupId
 * @property {string} description
 * @property {number} amount        - total bill amount, in currency units (e.g. dollars)
 * @property {string} payer         - person who paid the bill
 * @property {Object<string, number>} splits - person -> percentage share (sums to 100)
 * @property {string} createdAt
 */

function addExpense(groupId, { description, amount, payer, splits }) {
  const expense = {
    id: uuidv4(),
    groupId,
    description,
    amount,
    payer,
    splits,
    createdAt: new Date().toISOString(),
  };

  if (!expensesByGroup.has(groupId)) {
    expensesByGroup.set(groupId, []);
  }
  expensesByGroup.get(groupId).push(expense);
  return expense;
}

function getExpenses(groupId) {
  return expensesByGroup.get(groupId) || [];
}

function getExpenseById(groupId, expenseId) {
  const list = getExpenses(groupId);
  return list.find((e) => e.id === expenseId) || null;
}

function deleteExpense(groupId, expenseId) {
  const list = expensesByGroup.get(groupId);
  if (!list) return false;
  const idx = list.findIndex((e) => e.id === expenseId);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

function clearExpenses(groupId) {
  expensesByGroup.set(groupId, []);
}

module.exports = {
  addExpense,
  getExpenses,
  getExpenseById,
  deleteExpense,
  clearExpenses,
};
