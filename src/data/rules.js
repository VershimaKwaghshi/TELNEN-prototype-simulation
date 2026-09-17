export const TELNEN_RULES = {
  hardStopDrawdown: 0.5,

  ownerProfitShare: 0.5,
  managerProfitShare: 0.5,
  telnenshareOfOwnerProfit: 0.15,
  telnenshareOfManagerProfit: 0.15,

  brokerRebatePerStandardLot: 12,

  withdrawalFeeRate: 0.15,
  monthlySubscription: 4.99,

  capitalBuildingDailyRate: 0.011,
  capitalBuildingFundingRate: 0.01,
  capitalBuildingServiceFeeRate: 0.001,
  capitalBuildingDays: 100,

  socialBondActivationFeeRate: 0.20,
  socialBondFacilitatorShare: 0.40,
  socialBondBonderShare: 0.40,
  socialBondTelnenshare: 0.20,
  socialBondDurationDays: 30,

  restitutionManagerInterceptionDays: 100,

  directDepositMinimum: 100,
  directDepositMaximum: 4999,

  maximumAssignedAccounts: 5,

  managerChoicesPerDay: 3
}

export const SCALE_POINTS = [
  10000,
  25000,
  50000,
  100000,
  250000,
  500000,
  1000000,
  2500000,
  5000000,
  10000000,
  25000000,
  50000000,
  100000000
]

export const DEFAULT_ASSUMPTIONS = {
  activeUserRate: 1,

  capitalBuildingRate: 0.70,

  socialBondAdoptionRate: 0.90,

  profitableTraderRate: 0.10,

  averageCapitalBuildingTarget: 1000,

  averageDirectDeposit: 1000,

  averageStandardLotsPerActiveUser: 20,

  averageMonthlyWithdrawal: 500,

  hardStopRate: 0.50,

  averageRestitutionClaim: 500,

  managerRecoveryRate: 0.50,

  concurrentSocialBondRate: 0.30
}
