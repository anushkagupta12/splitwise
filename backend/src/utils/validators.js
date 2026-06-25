// Pure validation helpers. No side effects, no Express objects —
// keeps these testable in isolation and reusable from any layer.

const PERCENTAGE_TOLERANCE = 0.05; // float-rounding slack allowed when checking the 100% total

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Validates the payload for creating an expense against a known group.
 * @param {Object} payload
 * @param {string[]} groupMembers - canonical member list for the group
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateExpensePayload(payload, groupMembers) {
  const errors = [];
  const { description, amount, payer, splits } = payload || {};

  if (!isNonEmptyString(description)) {
    errors.push("description is required and must be a non-empty string.");
  }

  if (!isPositiveNumber(amount)) {
    errors.push("amount is required and must be a positive number.");
  }

  if (!isNonEmptyString(payer)) {
    errors.push("payer is required.");
  } else if (!groupMembers.includes(payer)) {
    errors.push(`payer "${payer}" is not a member of this group.`);
  }

  if (typeof splits !== "object" || splits === null || Array.isArray(splits)) {
    errors.push("splits must be an object mapping person -> percentage.");
  } else {
    const splitKeys = Object.keys(splits);

    const unknownPeople = splitKeys.filter((k) => !groupMembers.includes(k));
    if (unknownPeople.length > 0) {
      errors.push(`splits contain people not in this group: ${unknownPeople.join(", ")}`);
    }

    const missingPeople = groupMembers.filter((m) => !splitKeys.includes(m));
    if (missingPeople.length > 0) {
      errors.push(`splits are missing entries for: ${missingPeople.join(", ")}`);
    }

    const nonNumeric = splitKeys.filter(
      (k) => typeof splits[k] !== "number" || !Number.isFinite(splits[k]) || splits[k] < 0
    );
    if (nonNumeric.length > 0) {
      errors.push(`splits must be non-negative numbers: ${nonNumeric.join(", ")}`);
    }

    if (nonNumeric.length === 0 && unknownPeople.length === 0) {
      const total = splitKeys.reduce((sum, k) => sum + splits[k], 0);
      if (Math.abs(total - 100) > PERCENTAGE_TOLERANCE) {
        errors.push(`splits must total exactly 100% (got ${total.toFixed(2)}%).`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the payload for creating a group.
 */
function validateGroupPayload(payload) {
  const errors = [];
  const { name, members } = payload || {};

  if (!isNonEmptyString(name)) {
    errors.push("name is required and must be a non-empty string.");
  }

  if (!Array.isArray(members) || members.length < 2) {
    errors.push("members must be an array with at least 2 people.");
  } else {
    const invalid = members.filter((m) => !isNonEmptyString(m));
    if (invalid.length > 0) {
      errors.push("every member name must be a non-empty string.");
    }
    const duplicates = members.filter((m, i) => members.indexOf(m) !== i);
    if (duplicates.length > 0) {
      errors.push(`duplicate member names are not allowed: ${[...new Set(duplicates)].join(", ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateExpensePayload,
  validateGroupPayload,
  PERCENTAGE_TOLERANCE,
};
