import { TELNEN_RULES } from "../data/rules"

export function createSocialBond({
  traderId,
  claimId,
  amount
}) {
  const activationFee =
    amount *
    TELNEN_RULES.socialBondActivationFeeRate

  return {
    id:
      `SB-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    traderId,

    claimId,

    amount,

    activationFee,

    durationDays:
      TELNEN_RULES.socialBondDurationDays,

    status: "requested",

    facilitatorAmount: 0,

    bonderAmount: 0,

    telnenshare:
      activationFee *
      TELNEN_RULES.socialBondTelnenshare
  }
}

export function fundSocialBond(
  bond,
  facilitatorAmount,
  bonderAmount
) {
  const totalFunded =
    facilitatorAmount +
    bonderAmount

  if (
    totalFunded >
    bond.amount
  ) {
    throw new Error(
      "Social Bond funding exceeds required amount"
    )
  }

  return {
    ...bond,

    facilitatorAmount,

    bonderAmount,

    status:
      totalFunded === bond.amount
        ? "funded"
        : "partially funded"
  }
}
