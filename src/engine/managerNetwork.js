import {
  createManager,
  isManagerEligible,
  getManagerChoices
} from "./managerEngine"


export function createManagerNetwork() {

  return {

    managers: [],

    regions: [

      "Africa",

      "Europe",

      "Asia",

      "North America",

      "South America",

      "Middle East",

      "Oceania"

    ]

  }

}


export function registerManager(
  network,
  managerData
) {

  const manager =
    createManager(
      managerData
    )

  network.managers.push(
    manager
  )

  return manager

}


export function getDailyManagerOptions(
  network
) {

  const availableRegions =
    shuffle([
      ...network.regions
    ])


  return getManagerChoices(
    network.managers,
    availableRegions,
    3
  )

}


function shuffle(array) {

  return array
    .map(
      value => ({
        value,

        sort:
          Math.random()
      })
    )
    .sort(
      (a, b) =>
        a.sort - b.sort
    )
    .map(
      item =>
        item.value
    )

}


export function qualifyManager(
  manager,
  {
    liveTradingMonths = 0,
    demoChallengeMonths = 0
  }
) {

  manager.liveTradingMonths =
    liveTradingMonths

  manager.demoChallengeMonths =
    demoChallengeMonths

  return isManagerEligible(
    manager
  )

}


export function validateEquivalentAccountRequirement(
  manager,
  accountValue,
  accounts
) {

  if (
    !manager.ownAccountManagerId
  ) {

    return {

      eligible: false,

      reason:
        "Manager must have an account managed by another manager"

    }

  }


  const equivalentAccount =
    accounts.find(
      account =>
        account.id ===
        manager.ownAccountId
    )


  if (
    !equivalentAccount
  ) {

    return {

      eligible: false,

      reason:
        "Equivalent personal account was not found"

    }

  }


  const minimumValue =
    accountValue


  if (
    equivalentAccount.initialValue <
    minimumValue
  ) {

    return {

      eligible: false,

      reason:
        "Managed personal account is below the required equivalent size"

    }

  }


  return {

    eligible: true,

    reason: null

  }

}


export function canManagerReceiveAccount(
  manager,
  account,
  accounts
) {

  if (
    !isManagerEligible(manager)
  ) {

    return false

  }


  const requirement =
    validateEquivalentAccountRequirement(
      manager,
      account.initialValue,
      accounts
    )


  return requirement.eligible

}
