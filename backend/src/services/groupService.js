const groupModel = require("../models/groupModel");
const expenseModel = require("../models/expenseModel");

function createGroup(name, members) {
  return groupModel.createGroup(name, members);
}

function listGroups() {
  return groupModel.getAllGroups();
}

function getGroupOrThrow(groupId) {
  const group = groupModel.getGroup(groupId);
  if (!group) {
    const err = new Error(`Group "${groupId}" was not found.`);
    err.statusCode = 404;
    throw err;
  }
  return group;
}

function removeGroup(groupId) {
  getGroupOrThrow(groupId);
  expenseModel.clearExpenses(groupId);
  groupModel.deleteGroup(groupId);
}

module.exports = {
  createGroup,
  listGroups,
  getGroupOrThrow,
  removeGroup,
};
