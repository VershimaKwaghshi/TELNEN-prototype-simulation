import { TELNEN_RULES } from "../data/rules"

export function calculateDrawdown(initialValue, equity) {
  if (initialValue <= 0) return 0

  return Math.max(
    0,
    (initialValue - equity) / initialValue
  )
}

export function hasReachedHardStop(
  initialValue,
  equity
) {
  return (
    calculateDrawdown(initialValue, equity) >=
    TELNEN_RULES.hardStopDrawdown
  )
}

export function calculateRestitutionClaim(
  initialValue,
  equity
) {
  return Math.max(
    0,
    initialValue - equity
  )
}

export function evaluateAccountRisk(account) {
  const drawdown = calculateDrawdown(
    account.initialValue,
    account.equity
  )

  const hardStop =
    drawdown >= TELNEN_RULES.hardStopDrawdown

  return {
    accountId: account.id,
    initialValue: account.initialValue,
    equity: account.equity,
    drawdown,
    hardStop,

    restitutionAmount: hardStop
      ? calculateRestitutionClaim(
          account.initialValue,
          account.equity
        )
      : 0
  }
}
