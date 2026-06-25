// In-memory representation of a group of people who share expenses.
// No DB layer — this module owns the canonical in-process state for groups.

const { v4: uuidv4 } = require("uuid");

/** @type {Map<string, Group>} groupId -> Group */
const groups = new Map();

/**
 * @typedef {Object} Group
 * @property {string} id
 * @property {string} name
 * @property {string[]} members  - list of person names, e.g. ["Amit", "Rahul", "Sneha"]
 * @property {string} createdAt
 */

function createGroup(name, members) {
  const group = {
    id: uuidv4(),
    name,
    members: [...members],
    createdAt: new Date().toISOString(),
  };
  groups.set(group.id, group);
  return group;
}

function getGroup(groupId) {
  return groups.get(groupId) || null;
}

function getAllGroups() {
  return Array.from(groups.values());
}

function groupExists(groupId) {
  return groups.has(groupId);
}

function deleteGroup(groupId) {
  return groups.delete(groupId);
}

module.exports = {
  createGroup,
  getGroup,
  getAllGroups,
  groupExists,
  deleteGroup,
};
