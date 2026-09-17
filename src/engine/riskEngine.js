import { TELNEN_RULES } from "../data/rules"

export function calculateDrawdown(initialValue, equity) {
  if (initialValue <= 0) {
    return 0
  }

  return (
    (initialValue - equity) /
    initialValue
  )
}

export function hasReachedHardStop(initialValue, equity) {
  const drawdown =
    calculateDrawdown(
      initialValue,
      equity
    )

  return (
    drawdown >=
    TELNEN_RULES.hardStopDrawdown
  )
}

export function executeHardStop(account) {
  if (
    !hasReachedHardStop(
      account.initialValue,
      account.equity
    )
  ) {
    return {
      triggered: false,
      account
    }
  }

  const restitutionAmount =
    account.initialValue -
    account.equity

  return {
    triggered: true,

    account: {
      ...account,

      status: "restitution",

      managerConnection: null,

      restitutionCollateral:
        account.equity
    },

    restitutionClaim: {
      accountId: account.id,

      managerId:
        account.managerId,

      claimAmount:
        restitutionAmount,

      recoveredFromManager: 0,

      advancedFromTelnensBuffer: 0,

      outstanding:
        restitutionAmount,

      status: "active"
    }
  }
}
