import {
  TELNEN_RULES,
  DEFAULT_ASSUMPTIONS
} from "../data/rules"

export function simulatePopulation(
  users,
  assumptions = DEFAULT_ASSUMPTIONS
) {
  const activeUsers =
    users *
    assumptions.activeUserRate

  const capitalBuildingUsers =
    users *
    assumptions.capitalBuildingRate

  const socialBondUsers =
    users *
    assumptions.socialBondAdoptionRate

  const profitableTraders =
    users *
    assumptions.profitableTraderRate

  const standardLots =
    activeUsers *
    assumptions.averageStandardLotsPerActiveUser

  const brokerRebate =
    standardLots *
    TELNEN_RULES.brokerRebatePerStandardLot

  const subscriptionRevenue =
    activeUsers *
    TELNEN_RULES.monthlySubscription

  const withdrawalRevenue =
    profitableTraders *
    assumptions.averageMonthlyWithdrawal *
    TELNEN_RULES.withdrawalFeeRate

  const capitalBuildingRevenue =
    capitalBuildingUsers *
    assumptions.averageCapitalBuildingTarget *
    TELNEN_RULES.capitalBuildingServiceFeeRate

  const concurrentSocialBondUsers =
    socialBondUsers *
    assumptions.concurrentSocialBondRate

  const socialBondVolume =
    concurrentSocialBondUsers *
    assumptions.averageRestitutionClaim

  const socialBondActivationFees =
    socialBondVolume *
    TELNEN_RULES.socialBondActivationFeeRate

  const socialBondTelnenshare =
    socialBondActivationFees *
    TELNEN_RULES.socialBondTelnenshare

  const hardStops =
    activeUsers *
    assumptions.hardStopRate

  const restitutionClaims =
    hardStops *
    assumptions.averageRestitutionClaim

  const managerRecovery =
    restitutionClaims *
    assumptions.managerRecoveryRate

  const telnensBufferRequirement =
    restitutionClaims -
    managerRecovery

  const telnensRevenue =
    brokerRebate +
    subscriptionRevenue +
    withdrawalRevenue +
    capitalBuildingRevenue +
    socialBondTelnenshare

  return {
    users,

    activeUsers,

    capitalBuildingUsers,

    socialBondUsers,

    profitableTraders,

    concurrentSocialBondUsers,

    standardLots,

    brokerRebate,

    subscriptionRevenue,

    withdrawalRevenue,

    capitalBuildingRevenue,

    socialBondVolume,

    socialBondActivationFees,

    socialBondTelnenshare,

    hardStops,

    restitutionClaims,

    managerRecovery,

    telnensBufferRequirement,

    telnensRevenue
  }
}
