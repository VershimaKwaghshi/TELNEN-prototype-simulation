export const WITHDRAWAL_RULES = {
  ownerShare: 0.35,
  managerShare: 0.35,
  telnenshare: 0.30,

  referralShareFromTE: 0.50,
  retainedTEshareFromTE: 0.50,

  subManagerShareOfManagerAllocation: 0.50
}

export function calculateWithdrawalDistribution(
  withdrawalAmount,
  {
    hasSubManager = false
  } = {}
) {
  if (withdrawalAmount <= 0) {
    throw new Error(
      "Withdrawal amount must be greater than zero"
    )
  }

  const ownerAmount =
    withdrawalAmount *
    WITHDRAWAL_RULES.ownerShare

  const managerAllocation =
    withdrawalAmount *
    WITHDRAWAL_RULES.managerShare

  const teAllocation =
    withdrawalAmount *
    WITHDRAWAL_RULES.telnenshare

  let managerAmount =
    managerAllocation

  let subManagerAmount = 0

  if (hasSubManager) {
    managerAmount =
      managerAllocation *
      (
        1 -
        WITHDRAWAL_RULES
          .subManagerShareOfManagerAllocation
      )

    subManagerAmount =
      managerAllocation *
      WITHDRAWAL_RULES
        .subManagerShareOfManagerAllocation
  }

  const referralAmount =
    teAllocation *
    WITHDRAWAL_RULES
      .referralShareFromTE

  const retainedTEAmount =
    teAllocation *
    WITHDRAWAL_RULES
      .retainedTEshareFromTE

  const total =
    ownerAmount +
    managerAmount +
    subManagerAmount +
    referralAmount +
    retainedTEAmount

  return {
    withdrawalAmount,

    ownerAmount,

    managerAllocation,

    managerAmount,

    subManagerAmount,

    teAllocation,

    referralAmount,

    retainedTEAmount,

    total,

    balanced:
      Math.abs(total - withdrawalAmount) < 0.000001
  }
}
