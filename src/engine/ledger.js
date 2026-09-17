export const LEDGER_EVENT_TYPES = {

  ACCOUNT_CREATED:
    "account_created",

  FUNDING:
    "funding",

  MANAGER_ASSIGNED:
    "manager_assigned",

  TRADE:
    "trade",

  PROFIT_DISTRIBUTION:
    "profit_distribution",

  TELNEN_REVENUE:
    "telnens_revenue",

  DRAWDOWN:
    "drawdown",

  HARD_STOP:
    "hard_stop",

  RESTITUTION_CREATED:
    "restitution_created",

  MANAGER_INTERCEPTION:
    "manager_interception",

  BUFFER_ADVANCE:
    "buffer_advance",

  SOCIAL_BOND_REQUEST:
    "social_bond_request",

  SOCIAL_BOND_FUNDING:
    "social_bond_funding",

  ACCOUNT_RESTORED:
    "account_restored",

  MANAGER_REPLACED:
    "manager_replaced",

  ACCOUNT_CLOSED:
    "account_closed"

}


export function createLedger() {

  return []

}


export function recordLedgerEvent(
  ledger,
  {
    type,
    actorId = null,
    accountId = null,
    managerId = null,
    claimId = null,
    bondId = null,
    amount = 0,
    metadata = {}
  }
) {

  const event = {

    id:
      ledger.length + 1,

    type,

    actorId,

    accountId,

    managerId,

    claimId,

    bondId,

    amount,

    metadata,

    timestamp:
      new Date().toISOString()

  }

  ledger.push(event)

  return event

}


export function getAccountHistory(
  ledger,
  accountId
) {

  return ledger.filter(
    event =>
      event.accountId === accountId
  )

}


export function getClaimHistory(
  ledger,
  claimId
) {

  return ledger.filter(
    event =>
      event.claimId === claimId
  )

}


export function getManagerHistory(
  ledger,
  managerId
) {

  return ledger.filter(
    event =>
      event.managerId === managerId
  )

}
