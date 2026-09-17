import { TELNEN_RULES } from "../data/rules"

export const RESTITUTION_STATES = {
  ACTIVE: "active",
  RECOVERING: "recovering",
  BUFFER_ADVANCED: "buffer_advanced",
  RESOLVED: "resolved"
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function createRestitutionClaim({
  accountId,
  managerId,
  claimAmount
}) {
  if (claimAmount <= 0) {
    throw new Error(
      "Restitution claim must be greater than zero"
    )
  }

  return {
    id: generateId("RC"),

    accountId,

    managerId,

    claimAmount,

    recoveredFromManager: 0,

    advancedFromTelnensBuffer: 0,

    outstanding: claimAmount,

    managerInterceptionDays: 0,

    managerInterceptionComplete: false,

    status:
      RESTITUTION_STATES.ACTIVE,

    createdAt:
      new Date().toISOString(),

    resolvedAt: null
  }
}
