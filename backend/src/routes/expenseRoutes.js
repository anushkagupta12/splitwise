const express = require("express");
const expenseController = require("../controllers/expenseController");

// mergeParams: true lets this router read :groupId from the parent mount path
const router = express.Router({ mergeParams: true });

router.post("/", expenseController.addExpense);
router.get("/", expenseController.listExpenses);
router.delete("/:expenseId", expenseController.deleteExpense);

module.exports = router;
