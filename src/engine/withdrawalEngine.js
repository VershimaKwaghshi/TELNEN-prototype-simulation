export const WITHDRAWAL_RULES = {
  ownerShare: 0.35,
  managerShare: 0.35,
  telnenshare: 0.30,

  referralShareFromTELNEN: 0.15,
  telnenshareAfterReferral: 0.15,

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

  const telnenshare =
    withdrawalAmount *
    WITHDRAWAL_RULES.telnenshare

  let managerAmount =
    managerAllocation

  let subManagerAmount = 0

  if (hasSubManager) {
    managerAmount =
      managerAllocation *
      (1 -
        WITHDRAWAL_RULES
          .subManagerShareOfManagerAllocation)

    subManagerAmount =
      managerAllocation *
      WITHDRAWAL_RULES
        .subManagerShareOfManagerAllocation
  }

  const referralAmount =
    telnenshare *
    WITHDRAWAL_RULES
      .referralShareFromTELNEN

  const telnenshareRetained =
    telnenshare *
    WITHDRAWAL_RULES
      .telnenshareAfterReferral

  return {
    withdrawalAmount,

    ownerAmount,

    managerAllocation,

    managerAmount,

    subManagerAmount,

    telnenshare,

    referralAmount,

    telnenshareRetained,

    totalDistributed:
      ownerAmount +
      managerAmount +
      subManagerAmount +
      referralAmount +
      telnenshareRetained
  }
}
