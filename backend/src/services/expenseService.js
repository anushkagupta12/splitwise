const expenseModel = require("../models/expenseModel");
const groupService = require("./groupService");
const settlementService = require("./settlementService");

function addExpense(groupId, payload) {
  const group = groupService.getGroupOrThrow(groupId);
  const expense = expenseModel.addExpense(groupId, payload);
  return { expense, group };
}

function listExpenses(groupId) {
  groupService.getGroupOrThrow(groupId);
  return expenseModel.getExpenses(groupId);
}

function removeExpense(groupId, expenseId) {
  groupService.getGroupOrThrow(groupId);
  const removed = expenseModel.deleteExpense(groupId, expenseId);
  if (!removed) {
    const err = new Error(`Expense "${expenseId}" was not found in group "${groupId}".`);
    err.statusCode = 404;
    throw err;
  }
}

/**
 * Builds the full settlement view for a group: net balances, minimized
 * settlement transactions, and ready-to-render sentences.
 */
function getSettlement(groupId) {
  const group = groupService.getGroupOrThrow(groupId);
  const expenses = expenseModel.getExpenses(groupId);

  const { settlements, net } = settlementService.minimizeDebts(expenses, group.members);
  const sentences = settlementService.buildSettlementSentences(settlements, group.members);

  return {
    groupId,
    members: group.members,
    expenseCount: expenses.length,
    netBalances: net,
    settlements,
    sentences,
  };
}

module.exports = {
  addExpense,
  listExpenses,
  removeExpense,
  getSettlement,
};
