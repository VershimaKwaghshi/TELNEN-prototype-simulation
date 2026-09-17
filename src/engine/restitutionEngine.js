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

function now() {
  return new Date().toISOString()
}

export function createRestitutionClaim({
  accountId,
  managerId,
  claimAmount,
  source = "hard_stop"
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

    source,

    status: RESTITUTION_STATES.ACTIVE,

    createdAt: now(),

    resolvedAt: null
  }
}

export function interceptManagerRevenue(
  claim,
  managerRevenue
) {
  if (
    claim.status ===
    RESTITUTION_STATES.RESOLVED
  ) {
    return {
      claim,
      intercepted: 0
    }
  }

  if (managerRevenue <= 0) {
    return {
      claim,
      intercepted: 0
    }
  }

  const intercepted = Math.min(
    managerRevenue,
    claim.outstanding
  )

  const recoveredFromManager =
    claim.recoveredFromManager +
    intercepted

  const outstanding =
    claim.outstanding -
    intercepted

  const managerInterceptionDays =
    claim.managerInterceptionDays + 1

  const managerInterceptionComplete =
    managerInterceptionDays >=
    TELNEN_RULES.restitutionManagerInterceptionDays

  const resolved =
    outstanding <= 0

  return {
    claim: {
      ...claim,

      recoveredFromManager,

      outstanding,

      managerInterceptionDays,

      managerInterceptionComplete,

      status: resolved
        ? RESTITUTION_STATES.RESOLVED
        : managerInterceptionComplete
          ? RESTITUTION_STATES.RECOVERING
          : RESTITUTION_STATES.ACTIVE,

      resolvedAt:
        resolved
          ? now()
          : claim.resolvedAt
    },

    intercepted
  }
}

export function canUseTelnensBuffer(
  claim
) {
  return (
    claim.status !==
      RESTITUTION_STATES.RESOLVED &&
    claim.managerInterceptionComplete ===
      true &&
    claim.outstanding > 0
  )
}

export function useTelnensBuffer(
  claim,
  bufferAmount
) {
  if (
    claim.status ===
    RESTITUTION_STATES.RESOLVED
  ) {
    return {
      claim,
      bufferUsed: 0,
      blocked: false
    }
  }

  if (
    !canUseTelnensBuffer(claim)
  ) {
    return {
      claim,
      bufferUsed: 0,
      blocked: true,
      reason:
        "TE buffer cannot be used before the 100 day manager interception period is complete"
    }
  }

  if (bufferAmount <= 0) {
    return {
      claim,
      bufferUsed: 0,
      blocked: false
    }
  }

  const amount = Math.min(
    bufferAmount,
    claim.outstanding
  )

  const outstanding =
    claim.outstanding - amount

  const resolved =
    outstanding <= 0

  return {
    claim: {
      ...claim,

      advancedFromTelnensBuffer:
        claim.advancedFromTelnensBuffer +
        amount,

      outstanding,

      status: resolved
        ? RESTITUTION_STATES.RESOLVED
        : RESTITUTION_STATES.BUFFER_ADVANCED,

      resolvedAt:
        resolved
          ? now()
          : claim.resolvedAt
    },

    bufferUsed: amount,

    blocked: false
  }
}

export function processRestitutionDay({
  claim,
  managerRevenue = 0,
  telnensBufferAvailable = 0
}) {
  if (
    claim.status ===
    RESTITUTION_STATES.RESOLVED
  ) {
    return {
      claim,

      managerIntercepted: 0,

      bufferUsed: 0,

      dayProcessed: false,

      managerInterceptionComplete:
        true,

      outstanding: 0,

      resolved: true
    }
  }

  const managerResult =
    interceptManagerRevenue(
      claim,
      managerRevenue
    )

  let updatedClaim =
    managerResult.claim

  let bufferUsed = 0

  let bufferBlocked = false

  let bufferReason = null

  if (
    updatedClaim.outstanding > 0 &&
    updatedClaim.managerInterceptionComplete
  ) {
    const bufferResult =
      useTelnensBuffer(
        updatedClaim,
        telnensBufferAvailable
      )

    updatedClaim =
      bufferResult.claim

    bufferUsed =
      bufferResult.bufferUsed

    bufferBlocked =
      bufferResult.blocked

    bufferReason =
      bufferResult.reason ?? null
  }

  return {
    claim: updatedClaim,

    managerIntercepted:
      managerResult.intercepted,

    bufferUsed,

    bufferBlocked,

    bufferReason,

    dayProcessed: true,

    managerInterceptionComplete:
      updatedClaim.managerInterceptionComplete,

    outstanding:
      updatedClaim.outstanding,

    resolved:
      updatedClaim.status ===
      RESTITUTION_STATES.RESOLVED
  }
}

export function processRestitutionDays({
  claim,
  managerRevenuePerDay = 0,
  telnensBufferAvailable = 0,
  days = TELNEN_RULES.restitutionManagerInterceptionDays
}) {
  let currentClaim = {
    ...claim
  }

  const dailyResults = []

  let totalManagerIntercepted = 0

  let totalBufferUsed = 0

  for (
    let day = 1;
    day <= days;
    day += 1
  ) {
    if (
      currentClaim.status ===
      RESTITUTION_STATES.RESOLVED
    ) {
      break
    }

    const result =
      processRestitutionDay({
        claim: currentClaim,

        managerRevenue:
          typeof managerRevenuePerDay ===
          "function"
            ? managerRevenuePerDay(
                day,
                currentClaim
              )
            : managerRevenuePerDay,

        telnensBufferAvailable:
          typeof telnensBufferAvailable ===
          "function"
            ? telnensBufferAvailable(
                day,
                currentClaim
              )
            : telnensBufferAvailable
      })

    currentClaim =
      result.claim

    totalManagerIntercepted +=
      result.managerIntercepted

    totalBufferUsed +=
      result.bufferUsed

    dailyResults.push({
      day,

      managerIntercepted:
        result.managerIntercepted,

      bufferUsed:
        result.bufferUsed,

      outstanding:
        result.outstanding,

      status:
        currentClaim.status
    })

    if (result.resolved) {
      break
    }
  }

  return {
    claim: currentClaim,

    dailyResults,

    totalManagerIntercepted,

    totalBufferUsed,

    resolved:
      currentClaim.status ===
      RESTITUTION_STATES.RESOLVED,

    outstanding:
      currentClaim.outstanding
  }
}

export function getRestitutionProgress(
  claim
) {
  if (claim.claimAmount <= 0) {
    return {
      recovered: 0,
      outstanding: 0,
      recoveryRate: 1
    }
  }

  const recovered =
    claim.claimAmount -
    claim.outstanding

  return {
    recovered,

    outstanding:
      Math.max(0, claim.outstanding),

    recoveryRate:
      recovered /
      claim.claimAmount,

    managerRecoveryRate:
      claim.recoveredFromManager /
      claim.claimAmount,

    bufferAdvanceRate:
      claim.advancedFromTelnensBuffer /
      claim.claimAmount
  }
}

export function resolveClaim(
  claim
) {
  return {
    ...claim,

    outstanding: 0,

    status:
      RESTITUTION_STATES.RESOLVED,

    resolvedAt: now()
  }
}

export function createIndependentClaim({
  accountId,
  managerId,
  claimAmount,
  previousClaimId = null
}) {
  const claim =
    createRestitutionClaim({
      accountId,

      managerId,

      claimAmount,

      source:
        "subsequent_hard_stop"
    })

  return {
    ...claim,

    previousClaimId
  }
}
