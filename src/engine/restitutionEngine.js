export function createRestitutionClaim({
  accountId,
  managerId,
  claimAmount
}) {
  return {
    id:
      `RC-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    accountId,

    managerId,

    claimAmount,

    recoveredFromManager: 0,

    advancedFromTelnensBuffer: 0,

    outstanding: claimAmount,

    managerInterceptionDays: 0,

    status: "active"
  }
}

export function interceptManagerRevenue(
  claim,
  managerRevenue
) {
  if (
    claim.status === "resolved"
  ) {
    return claim
  }

  const amount =
    Math.min(
      managerRevenue,
      claim.outstanding
    )

  return {
    ...claim,

    recoveredFromManager:
      claim.recoveredFromManager +
      amount,

    outstanding:
      claim.outstanding -
      amount,

    managerInterceptionDays:
      claim.managerInterceptionDays +
      1
  }
}

export function useTelnensBuffer(
  claim,
  bufferAmount
) {
  if (
    claim.status === "resolved"
  ) {
    return {
      claim,

      bufferUsed: 0
    }
  }

  const amount =
    Math.min(
      bufferAmount,
      claim.outstanding
    )

  const updatedClaim = {
    ...claim,

    advancedFromTelnensBuffer:
      claim.advancedFromTelnensBuffer +
      amount,

    outstanding:
      claim.outstanding -
      amount
  }

  if (
    updatedClaim.outstanding <= 0
  ) {
    updatedClaim.status =
      "resolved"
  }

  return {
    claim: updatedClaim,

    bufferUsed: amount
  }
}
