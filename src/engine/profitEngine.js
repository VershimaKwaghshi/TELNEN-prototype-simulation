import { TELNEN_RULES } from "../data/rules"

export function calculateProfitDistribution(profit) {
  const ownerGross =
    profit * TELNEN_RULES.ownerProfitShare

  const managerGross =
    profit * TELNEN_RULES.managerProfitShare

  const ownerTelnenshare =
    ownerGross *
    TELNEN_RULES.telnenshareOfOwnerProfit

  const managerTelnenshare =
    managerGross *
    TELNEN_RULES.telnenshareOfManagerProfit

  return {
    ownerGross,

    managerGross,

    ownerTelnenshare,

    managerTelnenshare,

    ownerNet:
      ownerGross -
      ownerTelnenshare,

    managerNet:
      managerGross -
      managerTelnenshare,

    totalTelnenshare:
      ownerTelnenshare +
      managerTelnenshare
  }
}
