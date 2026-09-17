import {
  ACCOUNT_STATES,
  ACCOUNT_EVENTS,
  transitionAccount
} from "./stateMachine"

import {
  createLedger,
  recordLedgerEvent,
  LEDGER_EVENT_TYPES
} from "./ledger"


export function createAccount({
  id,
  traderId,
  fundingValue = 0
}) {

  return {

    id,

    traderId,

    managerId: null,

    initialValue: fundingValue,

    equity: fundingValue,

    status:
      ACCOUNT_STATES.NO_ACCOUNT,

    managerConnection: null,

    restitutionCollateral: 0,

    stateHistory: [],

    tradeHistory: []

  }

}


export function createAccountSystem(
  account
) {

  return {

    account,

    ledger:
      createLedger()

  }

}


function transition(
  system,
  event
) {

  const previousState =
    system.account.status

  system.account =
    transitionAccount(
      system.account,
      event
    )

  recordLedgerEvent(

    system.ledger,

    {

      type:
        "state_transition",

      accountId:
        system.account.id,

      metadata: {

        event,

        from:
          previousState,

        to:
          system.account.status

      }

    }

  )

}


export function startFunding(
  system
) {

  transition(
    system,
    ACCOUNT_EVENTS.START_FUNDING
  )

  return system
}


export function fundAccount(
  system,
  amount
) {

  if (
    system.account.status !==
    ACCOUNT_STATES.FUNDING
  ) {

    throw new Error(
      "Account cannot be funded from its current state"
    )

  }


  system.account.initialValue =
    amount

  system.account.equity =
    amount


  transition(
    system,
    ACCOUNT_EVENTS.FUND_ACCOUNT
  )


  recordLedgerEvent(

    system.ledger,

    {

      type:
        LEDGER_EVENT_TYPES.FUNDING,

      accountId:
        system.account.id,

      amount

    }

  )


  return system
}


export function assignManager(
  system,
  managerId
) {

  if (
    system.account.status !==
      ACCOUNT_STATES.ACTIVE &&
    system.account.status !==
      ACCOUNT_STATES.RESTORED
  ) {

    throw new Error(
      "Manager cannot be assigned in the current account state"
    )

  }


  system.account.managerId =
    managerId

  system.account.managerConnection =
    managerId


  if (
    system.account.status ===
    ACCOUNT_STATES.RESTORED
  ) {

    transition(
      system,
      ACCOUNT_EVENTS.ASSIGN_MANAGER
    )

  }


  recordLedgerEvent(

    system.ledger,

    {

      type:
        LEDGER_EVENT_TYPES.MANAGER_ASSIGNED,

      accountId:
        system.account.id,

      managerId

    }

  )


  return system
}


export function recordTrade(
  system,
  {
    profit,
    lots,
    symbol,
    direction
  }
) {

  if (
    system.account.status !==
      ACCOUNT_STATES.ACTIVE &&
    system.account.status !==
      ACCOUNT_STATES.RESTORED
  ) {

    throw new Error(
      "Trading is not permitted in the current account state"
    )

  }


  system.account.equity +=
    profit


  const trade = {

    profit,

    lots,

    symbol,

    direction,

    equityAfterTrade:
      system.account.equity,

    timestamp:
      new Date().toISOString()

  }


  system.account.tradeHistory.push(
    trade
  )


  recordLedgerEvent(

    system.ledger,

    {

      type:
        LEDGER_EVENT_TYPES.TRADE,

      accountId:
        system.account.id,

      managerId:
        system.account.managerId,

      amount:
        profit,

      metadata:
        trade

    }

  )


  return system
}


export function triggerHardStop(
  system
) {

  if (
    system.account.equity >
    system.account.initialValue * 0.5
  ) {

    throw new Error(
      "Hard stop threshold has not been reached"
    )

  }


  if (
    system.account.status !==
      ACCOUNT_STATES.ACTIVE &&
    system.account.status !==
      ACCOUNT_STATES.RESTORED
  ) {

    throw new Error(
      "Hard stop cannot be triggered from the current state"
    )

  }


  system.account.managerConnection =
    null


  system.account.restitutionCollateral =
    system.account.equity


  transition(
    system,
    ACCOUNT_EVENTS.HARD_STOP
  )


  recordLedgerEvent(

    system.ledger,

    {

      type:
        LEDGER_EVENT_TYPES.HARD_STOP,

      accountId:
        system.account.id,

      managerId:
        system.account.managerId,

      amount:
        system.account.initialValue -
        system.account.equity

    }

  )


  transition(
    system,
    ACCOUNT_EVENTS.START_RESTITUTION
  )


  return system
}


export function requestSocialBond(
  system
) {

  if (
    system.account.status !==
      ACCOUNT_STATES.RESTITUTION
  ) {

    throw new Error(
      "Social Bond cannot be requested from the current state"
    )

  }


  transition(
    system,
    ACCOUNT_EVENTS.REQUEST_SOCIAL_BOND
  )


  recordLedgerEvent(

    system.ledger,

    {

      type:
        LEDGER_EVENT_TYPES.SOCIAL_BOND_REQUEST,

      accountId:
        system.account.id,

      amount:
        system.account.restitutionCollateral

    }

  )


  return system
}


export function restoreAccount(
  system
) {

  if (
    system.account.status !==
      ACCOUNT_STATES.SOCIAL_BOND &&
    system.account.status !==
      ACCOUNT_STATES.RESTITUTION
  ) {

    throw new Error(
      "Account cannot be restored from the current state"
    )

  }


  transition(
    system,
    ACCOUNT_EVENTS.RESTORE_ACCOUNT
  )


  recordLedgerEvent(

    system.ledger,

    {

      type:
        LEDGER_EVENT_TYPES.ACCOUNT_RESTORED,

      accountId:
        system.account.id,

      amount:
        system.account.restitutionCollateral

    }

  )


  return system
}
