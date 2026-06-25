const express = require("express");
const groupController = require("../controllers/groupController");
const expenseController = require("../controllers/expenseController");
const expenseRoutes = require("./expenseRoutes");

const router = express.Router();

router.post("/", groupController.createGroup);
router.get("/", groupController.listGroups);
router.get("/:groupId", groupController.getGroup);
router.delete("/:groupId", groupController.deleteGroup);

// Derived view: minimized settlement for the whole group (not a CRUD resource)
router.get("/:groupId/settlement", expenseController.getSettlement);

// Nested expense routes: /api/groups/:groupId/expenses
router.use("/:groupId/expenses", expenseRoutes);

module.exports = router;
