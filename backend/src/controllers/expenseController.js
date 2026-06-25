const expenseService = require("../services/expenseService");
const groupService = require("../services/groupService");
const { validateExpensePayload } = require("../utils/validators");

function addExpense(req, res, next) {
  try {
    const { groupId } = req.params;
    const group = groupService.getGroupOrThrow(groupId);

    const { valid, errors } = validateExpensePayload(req.body, group.members);
    if (!valid) {
      return res.status(400).json({ error: "Invalid expense payload.", details: errors });
    }

    const { description, amount, payer, splits } = req.body;
    const { expense } = expenseService.addExpense(groupId, {
      description,
      amount,
      payer,
      splits,
    });

    return res.status(201).json(expense);
  } catch (err) {
    return next(err);
  }
}

function listExpenses(req, res, next) {
  try {
    const expenses = expenseService.listExpenses(req.params.groupId);
    return res.status(200).json(expenses);
  } catch (err) {
    return next(err);
  }
}

function deleteExpense(req, res, next) {
  try {
    const { groupId, expenseId } = req.params;
    expenseService.removeExpense(groupId, expenseId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

function getSettlement(req, res, next) {
  try {
    const settlement = expenseService.getSettlement(req.params.groupId);
    return res.status(200).json(settlement);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  addExpense,
  listExpenses,
  deleteExpense,
  getSettlement,
};
