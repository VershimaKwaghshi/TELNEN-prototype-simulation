import { TELNEN_RULES } from "../data/rules"
import {
  recordLedgerEvent,
  LEDGER_EVENT_TYPES
} from "./ledger"


export const MANAGER_STATUS = {
  ELIGIBLE: "eligible",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  INACTIVE: "inactive"
}


export const MANAGER_HISTORY_REQUIREMENT = {
  LIVE_TRADING_MONTHS: 1,
  DEMO_CHALLENGE_MONTHS: 1
}


export function createManager({
  id,
  region,
  alias
}) {

  return {

    id,

    region,

    alias,

    status:
      MANAGER_STATUS.ELIGIBLE,

    liveTradingMonths: 0,

    demoChallengeMonths: 0,

    accountsManaged: [],

    ownAccountId: null,

    ownAccountManagerId: null,

    employeeManagerIds: [],

    revenue: 0,

    interceptedRevenue: 0,

    activeSince: null

  }

}


export function isManagerEligible(
  manager
) {

  const hasLiveHistory =
    manager.liveTradingMonths >=
    MANAGER_HISTORY_REQUIREMENT
      .LIVE_TRADING_MONTHS

  const completedDemoChallenge =
    manager.demoChallengeMonths >=
    MANAGER_HISTORY_REQUIREMENT
      .DEMO_CHALLENGE_MONTHS

  return (
    hasLiveHistory ||
    completedDemoChallenge
  )

}


export function validateManagerEligibility(
  manager
) {

  if (
    !isManagerEligible(manager)
  ) {

    throw new Error(
      "Manager does not meet the trading history or demo challenge requirement"
    )

  }

  return true

}


export function registerManagerHistory(
  manager,
  {
    liveTradingMonths = 0,
    demoChallengeMonths = 0
  } = {}
) {

  manager.liveTradingMonths =
    liveTradingMonths

  manager.demoChallengeMonths =
    demoChallengeMonths

  manager.status =
    isManagerEligible(manager)
      ? MANAGER_STATUS.ELIGIBLE
      : MANAGER_STATUS.INACTIVE

  return manager

}


export function assignOwnAccountManager(
  manager,
  managerId
) {

  if (
    manager.id === managerId
  ) {

    throw new Error(
      "A manager cannot manage their own account"
    )

  }

  manager.ownAccountManagerId =
    managerId

  return manager

}


export function canReceiveAccount(
  manager,
  account,
  managers
) {

  validateManagerEligibility(
    manager
  )

  if (
    manager.status ===
    MANAGER_STATUS.SUSPENDED
  ) {

    return false

  }

  if (
    manager.status ===
    MANAGER_STATUS.INACTIVE
  ) {

    return false

  }

  if (
    account.managerId ===
    manager.id
  ) {

    return false

  }

  const ownAccount =
    managers
      .flatMap(
        item =>
          item.accountsManaged
      )
      .find(
        item =>
          item.id ===
          manager.ownAccountId
      )

  if (
    manager.ownAccountId &&
    !ownAccount
  ) {

    return false

  }

  return true

}


export function assignAccountToManager(
  manager,
  account,
  managers,
  ledger
) {

  if (
    !canReceiveAccount(
      manager,
      account,
      managers
    )
  ) {

    throw new Error(
      "Manager is not eligible to receive this account"
    )

  }


  const existingManager =
    managers.find(
      item =>
        item.id ===
        account.managerId
    )


  if (
    existingManager
  ) {

    existingManager.accountsManaged =
      existingManager.accountsManaged.filter(
        item =>
          item.id !== account.id
      )

  }


  account.managerId =
    manager.id

  account.managerConnection =
    manager.id

  manager.accountsManaged.push(
    account
  )

  manager.status =
    MANAGER_STATUS.ACTIVE

  manager.activeSince =
    manager.activeSince ||
    new Date().toISOString()


  if (ledger) {

    recordLedgerEvent(

      ledger,

      {

        type:
          LEDGER_EVENT_TYPES.MANAGER_ASSIGNED,

        accountId:
          account.id,

        managerId:
          manager.id

      }

    )

  }


  return {

    manager,

    account

  }

}


export function getManagerChoices(
  managers,
  availableRegions,
  maximumChoices =
    TELNEN_RULES.managerChoicesPerDay
) {

  const eligible =
    managers.filter(
      manager =>
        manager.status !==
        MANAGER_STATUS.SUSPENDED &&
        manager.status !==
        MANAGER_STATUS.INACTIVE &&
        isManagerEligible(manager)
    )


  const selected = []

  const usedRegions =
    new Set()


  for (
    const region of availableRegions
  ) {

    if (
      selected.length >=
      maximumChoices
    ) {
      break
    }


    const candidate =
      eligible.find(
        manager =>
          manager.region === region &&
          !usedRegions.has(
            manager.region
          )
      )


    if (
      candidate
    ) {

      selected.push(
        candidate
      )

      usedRegions.add(
        candidate.region
      )

    }

  }


  return selected

}


export function rotateManagerAlias(
  manager,
  newAlias
) {

  manager.alias =
    newAlias

  return manager

}


export function assignAdditionalAccount(
  manager,
  account,
  managers,
  ledger
) {

  const maximum =
    TELNEN_RULES
      .maximumAssignedAccounts


  if (
    manager.accountsManaged.length >=
    maximum + 1
  ) {

    throw new Error(
      "Manager has reached the account assignment limit"
    )

  }


  return assignAccountToManager(
    manager,
    account,
    managers,
    ledger
  )

}


export function removeManagerAccount(
  manager,
  accountId
) {

  manager.accountsManaged =
    manager.accountsManaged.filter(
      account =>
        account.id !== accountId
    )

  return manager

}


export function createSubManagerAssignment({
  parentManager,
  subManager,
  account
}) {

  if (
    !parentManager.accountsManaged.some(
      item =>
        item.id === account.id
    )
  ) {

    throw new Error(
      "Parent manager does not manage this account"
    )

  }


  return {

    accountId:
      account.id,

    parentManagerId:
      parentManager.id,

    subManagerId:
      subManager.id,

    parentManagerShare:
      0.25,

    subManagerShare:
      0.25,

    accountOwnerShare:
      0.50,

    status:
      "active"

  }

}


export function calculateSubManagerDistribution(
  profit
) {

  return {

    accountOwner:
      profit * 0.50,

    parentManager:
      profit * 0.25,

    subManager:
      profit * 0.25

  }

}


export function recordManagerRevenue(
  manager,
  amount
) {

  manager.revenue +=
    amount

  return manager

}


export function interceptManagerRevenue(
  manager,
  amount,
  ledger,
  claimId
) {

  const intercepted =
    Math.min(
      Math.max(
        amount,
        0
      ),
      manager.revenue
    )


  manager.revenue -=
    intercepted

  manager.interceptedRevenue +=
    intercepted


  if (ledger) {

    recordLedgerEvent(

      ledger,

      {

        type:
          LEDGER_EVENT_TYPES.MANAGER_INTERCEPTION,

        managerId:
          manager.id,

        claimId,

        amount:
          intercepted

      }

    )

  }


  return intercepted

}


export function suspendManager(
  manager,
  reason,
  ledger
) {

  manager.status =
    MANAGER_STATUS.SUSPENDED


  manager.suspensionReason =
    reason


  if (ledger) {

    recordLedgerEvent(

      ledger,

      {

        type:
          "manager_suspended",

        managerId:
          manager.id,

        metadata: {

          reason

        }

      }

    )

  }


  return manager

}


export function getManagerCapacity(
  manager
) {

  return {

    personalAccount:
      manager.ownAccountId !== null,

    assignedAccounts:
      manager.accountsManaged.length,

    maximumAssignedAccounts:
      TELNEN_RULES
        .maximumAssignedAccounts,

    remainingAssignments:
      Math.max(

        0,

        TELNEN_RULES
          .maximumAssignedAccounts -
        manager.accountsManaged.length

      )

  }

}
