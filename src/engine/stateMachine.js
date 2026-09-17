export const ACCOUNT_STATES = {
  NO_ACCOUNT: "no_account",
  FUNDING: "funding",
  ACTIVE: "active",
  HARD_STOP: "hard_stop",
  RESTITUTION: "restitution",
  SOCIAL_BOND: "social_bond",
  RESTORED: "restored",
  CLOSED: "closed"
}


export const ACCOUNT_EVENTS = {
  START_FUNDING: "start_funding",
  FUND_ACCOUNT: "fund_account",
  TRADE: "trade",
  HARD_STOP: "hard_stop",
  START_RESTITUTION: "start_restitution",
  REQUEST_SOCIAL_BOND: "request_social_bond",
  FUND_SOCIAL_BOND: "fund_social_bond",
  RESTORE_ACCOUNT: "restore_account",
  ASSIGN_MANAGER: "assign_manager",
  CLOSE_ACCOUNT: "close_account"
}


const transitions = {

  [ACCOUNT_STATES.NO_ACCOUNT]: {

    [ACCOUNT_EVENTS.START_FUNDING]:
      ACCOUNT_STATES.FUNDING

  },


  [ACCOUNT_STATES.FUNDING]: {

    [ACCOUNT_EVENTS.FUND_ACCOUNT]:
      ACCOUNT_STATES.ACTIVE

  },


  [ACCOUNT_STATES.ACTIVE]: {

    [ACCOUNT_EVENTS.TRADE]:
      ACCOUNT_STATES.ACTIVE,

    [ACCOUNT_EVENTS.HARD_STOP]:
      ACCOUNT_STATES.HARD_STOP,

    [ACCOUNT_EVENTS.CLOSE_ACCOUNT]:
      ACCOUNT_STATES.CLOSED

  },


  [ACCOUNT_STATES.HARD_STOP]: {

    [ACCOUNT_EVENTS.START_RESTITUTION]:
      ACCOUNT_STATES.RESTITUTION,

    [ACCOUNT_EVENTS.REQUEST_SOCIAL_BOND]:
      ACCOUNT_STATES.SOCIAL_BOND

  },


  [ACCOUNT_STATES.RESTITUTION]: {

    [ACCOUNT_EVENTS.REQUEST_SOCIAL_BOND]:
      ACCOUNT_STATES.SOCIAL_BOND,

    [ACCOUNT_EVENTS.RESTORE_ACCOUNT]:
      ACCOUNT_STATES.RESTORED,

    [ACCOUNT_EVENTS.CLOSE_ACCOUNT]:
      ACCOUNT_STATES.CLOSED

  },


  [ACCOUNT_STATES.SOCIAL_BOND]: {

    [ACCOUNT_EVENTS.FUND_SOCIAL_BOND]:
      ACCOUNT_STATES.RESTORED,

    [ACCOUNT_EVENTS.CLOSE_ACCOUNT]:
      ACCOUNT_STATES.CLOSED

  },


  [ACCOUNT_STATES.RESTORED]: {

    [ACCOUNT_EVENTS.ASSIGN_MANAGER]:
      ACCOUNT_STATES.ACTIVE,

    [ACCOUNT_EVENTS.TRADE]:
      ACCOUNT_STATES.RESTORED,

    [ACCOUNT_EVENTS.HARD_STOP]:
      ACCOUNT_STATES.HARD_STOP,

    [ACCOUNT_EVENTS.CLOSE_ACCOUNT]:
      ACCOUNT_STATES.CLOSED

  },


  [ACCOUNT_STATES.CLOSED]: {}

}


export function canTransition(
  currentState,
  event
) {

  return Boolean(
    transitions[currentState]?.[event]
  )

}


export function getNextState(
  currentState,
  event
) {

  if (
    !canTransition(
      currentState,
      event
    )
  ) {

    throw new Error(
      `Illegal account transition from ${currentState} using ${event}`
    )

  }

  return transitions[currentState][event]

}


export function transitionAccount(
  account,
  event
) {

  const previousState =
    account.status

  const nextState =
    getNextState(
      previousState,
      event
    )

  return {

    ...account,

    status:
      nextState,

    stateHistory: [

      ...(account.stateHistory || []),

      {

        from:
          previousState,

        event,

        to:
          nextState,

        timestamp:
          new Date().toISOString()

      }

    ]

  }

}


export function getAllowedEvents(
  currentState
) {

  return Object.keys(
    transitions[currentState] || {}
  )

}
