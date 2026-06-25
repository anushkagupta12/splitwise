const groupService = require("../services/groupService");
const { validateGroupPayload } = require("../utils/validators");

function createGroup(req, res, next) {
  try {
    const { valid, errors } = validateGroupPayload(req.body);
    if (!valid) {
      return res.status(400).json({ error: "Invalid group payload.", details: errors });
    }

    const { name, members } = req.body;
    const group = groupService.createGroup(name, members);
    return res.status(201).json(group);
  } catch (err) {
    return next(err);
  }
}

function listGroups(req, res, next) {
  try {
    return res.status(200).json(groupService.listGroups());
  } catch (err) {
    return next(err);
  }
}

function getGroup(req, res, next) {
  try {
    const group = groupService.getGroupOrThrow(req.params.groupId);
    return res.status(200).json(group);
  } catch (err) {
    return next(err);
  }
}

function deleteGroup(req, res, next) {
  try {
    groupService.removeGroup(req.params.groupId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createGroup,
  listGroups,
  getGroup,
  deleteGroup,
};
