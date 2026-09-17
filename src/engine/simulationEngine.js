import {
  TELNEN_RULES
} from "../data/rules"

import {
  calculateProfitDistribution
} from "./profitEngine"

import {
  executeHardStop
} from "./riskEngine"

import {
  createRestitutionClaim,
  interceptManagerRevenue,
  useTelnensBuffer
} from "./restitutionEngine"

import {
  createSocialBond,
  fundSocialBond
} from "./socialBondEngine"


export function createTrader({
  id = "TRADER-001",
  name = "Trader 001"
} = {}) {

  return {

    id,

    name,

    status: "active",

    accounts: [],

    referral: null,

    restitutionClaims: [],

    socialBonds: [],

    revenue: {

      personalAccount: 0,

      assignedAccount1: 0,

      assignedAccount2: 0,

      assignedAccount3: 0,

      assignedAccount4: 0,

      assignedAccount5: 0,

      referral: 0,

      socialBondFacilitator: 0,

      socialBondBonder: 0

    }

  }

}


export function createManager({
  id = "MANAGER-001"
} = {}) {

  return {

    id,

    status: "active",

    accounts: [],

    revenue: 0,

    interceptedRevenue: 0

  }

}


export function createAccount({
  id = "ACCOUNT-001",

  traderId,

  managerId,

  fundingValue = 10000

} = {}) {

  return {

    id,

    traderId,

    managerId,

    initialValue: fundingValue,

    equity: fundingValue,

    status: "active",

    managerConnection: managerId,

    pendingOrders: [],

    restitutionCollateral: 0,

    tradeHistory: []

  }

}


export function createSimulation() {

  const trader =
    createTrader()

  const manager =
    createManager()

  const account =
    createAccount({

      traderId:
        trader.id,

      managerId:
        manager.id,

      fundingValue: 10000

    })


  trader.accounts.push(
    account.id
  )

  manager.accounts.push(
    account.id
  )


  return {

    trader,

    manager,

    accounts: [account],

    restitutionClaims: [],

    socialBonds: [],

    events: [],

    telnensRevenue: 0,

    telnensBuffer: 0,

    currentStep: 0

  }

}


function addEvent(
  simulation,
  type,
  message,
  data = {}
) {

  simulation.currentStep += 1

  simulation.events.push({

    id:
      simulation.currentStep,

    type,

    message,

    data

  })

}


export function fundAccount(
  simulation,
  accountId,
  amount
) {

  const account =
    simulation.accounts.find(
      item =>
        item.id === accountId
    )

  if (!account) {
    throw new Error(
      "Account not found"
    )
  }

  if (
    amount <
    TELNEN_RULES.directDepositMinimum
  ) {
    throw new Error(
      "Funding amount is below the minimum"
    )
  }

  if (
    amount >
    TELNEN_RULES.directDepositMaximum
  ) {
    throw new Error(
      "Funding amount exceeds direct deposit maximum"
    )
  }

  account.initialValue += amount

  account.equity += amount

  addEvent(
    simulation,

    "ACCOUNT FUNDED",

    "Account receives additional direct funding",

    {
      accountId,

      amount
    }
  )

  return account
}


export function recordTrade(
  simulation,
  {
    accountId,

    profit,

    lots,

    direction,

    symbol
  }
) {

  const account =
    simulation.accounts.find(
      item =>
        item.id === accountId
    )

  if (!account) {
    throw new Error(
      "Account not found"
    )
  }

  if (
    account.status !== "active"
  ) {
    throw new Error(
      "Account is not active"
    )
  }

  account.equity += profit

  account.tradeHistory.push({

    symbol,

    direction,

    lots,

    profit,

    equityAfterTrade:
      account.equity

  })


  const distribution =
    calculateProfitDistribution(
      profit
    )


  simulation.telnensRevenue +=
    distribution.totalTelnenshare


  addEvent(
    simulation,

    "TRADE PROFIT",

    "Manager generated trading result",

    {

      accountId,

      profit,

      lots,

      symbol,

      direction

    }
  )


  addEvent(
    simulation,

    "PROFIT SPLIT",

    "Profit is distributed between account owner and manager",

    distribution

  )


  addEvent(
    simulation,

    "TELNEN FEE",

    "TELNEN receives its share from the profit distribution",

    {

      amount:
        distribution.totalTelnenshare

    }

  )


  return distribution

}


export function applyLoss(
  simulation,
  {
    accountId,

    loss,

    lots = 0,

    symbol = "EURUSD"

  }
) {

  return recordTrade(
    simulation,

    {

      accountId,

      profit:
        -Math.abs(loss),

      lots,

      direction: "loss",

      symbol

    }

  )

}


export function checkHardStop(
  simulation,
  accountId
) {

  const account =
    simulation.accounts.find(
      item =>
        item.id === accountId
    )

  if (!account) {
    throw new Error(
      "Account not found"
    )
  }


  const result =
    executeHardStop(
      account
    )


  if (
    !result.triggered
  ) {

    return {

      triggered: false,

      account

    }

  }


  const oldManagerId =
    account.managerId


  Object.assign(
    account,
    result.account
  )


  const claim =
    createRestitutionClaim({

      accountId:
        account.id,

      managerId:
        oldManagerId,

      claimAmount:
        result.restitutionClaim
          .claimAmount

    })


  simulation.restitutionClaims
    .push(claim)


  account.restitutionCollateral =
    result.account
      .restitutionCollateral


  addEvent(

    simulation,

    "HARD STOP",

    "The 50 percent equity drawdown threshold has been reached",

    {

      accountId:
        account.id,

      managerId:
        oldManagerId,

      remainingEquity:
        account.equity

    }

  )


  addEvent(

    simulation,

    "RESTITUTION CLAIM",

    "A new independent restitution claim has been created",

    {

      claimId:
        claim.id,

      amount:
        claim.claimAmount

    }

  )


  return {

    triggered: true,

    account,

    claim

  }

}


export function interceptManagerRevenueForClaim(
  simulation,
  claimId,
  managerRevenue
) {

  const claim =
    simulation.restitutionClaims.find(
      item =>
        item.id === claimId
    )

  if (!claim) {
    throw new Error(
      "Restitution claim not found"
    )
  }


  const before =
    claim.outstanding


  const updated =
    interceptManagerRevenue(
      claim,
      managerRevenue
    )


  const recovered =
    before -
    updated.outstanding


  simulation.telnensRevenue += 0


  simulation.managerRecovery =
    (simulation.managerRecovery || 0) +
    recovered


  addEvent(

    simulation,

    "MANAGER REVENUE INTERCEPTION",

    "Revenue belonging to the responsible manager is intercepted",

    {

      claimId,

      attemptedRevenue:
        managerRevenue,

      recovered

    }

  )


  return updated

}


export function advanceBufferForClaim(
  simulation,
  claimId,
  bufferAmount
) {

  const claim =
    simulation.restitutionClaims.find(
      item =>
        item.id === claimId
    )

  if (!claim) {
    throw new Error(
      "Restitution claim not found"
    )
  }


  const result =
    useTelnensBuffer(
      claim,
      bufferAmount
    )


  simulation.telnensBuffer +=
    result.bufferUsed


  addEvent(

    simulation,

    "TELNEN BUFFER",

    "TELNEN buffer advances funds against the outstanding restitution claim",

    {

      claimId,

      amount:
        result.bufferUsed

    }

  )


  return result.claim

}


export function requestSocialBond(
  simulation,
  {
    traderId,

    claimId,

    amount

  }
) {

  const bond =
    createSocialBond({

      traderId,

      claimId,

      amount

    })


  simulation.socialBonds.push(
    bond
  )


  addEvent(

    simulation,

    "SOCIAL BOND REQUEST",

    "Trader requests Social Bond liquidity",

    {

      bondId:
        bond.id,

      claimId,

      amount

    }

  )


  return bond

}


export function fundBond(
  simulation,
  bondId,
  {
    facilitatorAmount = 0,

    bonderAmount = 0

  } = {}
) {

  const bond =
    simulation.socialBonds.find(
      item =>
        item.id === bondId
    )


  if (!bond) {
    throw new Error(
      "Social Bond not found"
    )
  }


  const updated =
    fundSocialBond(

      bond,

      facilitatorAmount,

      bonderAmount

    )


  Object.assign(
    bond,
    updated
  )


  if (
    bond.status === "funded"
  ) {

    const account =
      simulation.accounts.find(
        item =>
          item.traderId ===
          bond.traderId
      )


    if (account) {

      account.status =
        "active"

      account.equity +=
        bond.amount

      account.managerConnection =
        account.managerId

      addEvent(

        simulation,

        "ACCOUNT RESTORED",

        "Social Bond restores trading liquidity while restitution remains active",

        {

          accountId:
            account.id,

          bondId:
            bond.id,

          amount:
            bond.amount

        }

      )

    }

  }


  addEvent(

    simulation,

    "SOCIAL BOND FUNDED",

    "Social Bond funding is recorded",

    {

      bondId:
        bond.id,

      facilitatorAmount,

      bonderAmount

    }

  )


  return bond

}


export function assignNewManager(
  simulation,
  accountId,
  newManagerId
) {

  const account =
    simulation.accounts.find(
      item =>
        item.id === accountId
    )


  if (!account) {
    throw new Error(
      "Account not found"
    )
  }


  account.managerId =
    newManagerId

  account.managerConnection =
    newManagerId

  account.status =
    "active"


  addEvent(

    simulation,

    "NEW MANAGER",

    "A new manager is assigned after restitution or Social Bond restoration",

    {

      accountId,

      managerId:
        newManagerId

    }

  )


  return account

}


export function runFullScenario() {

  const simulation =
    createSimulation()


  const accountId =
    simulation.accounts[0].id


  addEvent(

    simulation,

    "TRADER JOINS",

    "Trader joins TELNEN"

  )


  addEvent(

    simulation,

    "CAPITAL BUILDING",

    "Trader enters Capital Building"

  )


  addEvent(

    simulation,

    "ACCOUNT ACTIVE",

    "Account becomes active"

  )


  recordTrade(

    simulation,

    {

      accountId,

      profit: 2000,

      lots: 5,

      direction: "buy",

      symbol: "EURUSD"

    }

  )


  applyLoss(

    simulation,

    {

      accountId,

      loss: 7000,

      lots: 15,

      symbol: "EURUSD"

    }

  )


  const firstStop =
    checkHardStop(

      simulation,

      accountId

    )


  const firstClaim =
    firstStop.claim


  const managerDailyRevenue =
    firstClaim.claimAmount *
    0.50 /
    TELNEN_RULES
      .restitutionManagerInterceptionDays


  for (
    let day = 1;

    day <=
      TELNEN_RULES
        .restitutionManagerInterceptionDays;

    day++
  ) {

    if (
      firstClaim.outstanding <= 0
    ) {
      break
    }


    interceptManagerRevenueForClaim(

      simulation,

      firstClaim.id,

      managerDailyRevenue

    )

  }


  if (
    firstClaim.outstanding > 0
  ) {

    advanceBufferForClaim(

      simulation,

      firstClaim.id,

      firstClaim.outstanding

    )

  }


  const bond =
    requestSocialBond(

      simulation,

      {

        traderId:
          simulation.trader.id,

        claimId:
          firstClaim.id,

        amount:
          5000

      }

    )


  fundBond(

    simulation,

    bond.id,

    {

      facilitatorAmount:
        5000,

      bonderAmount:
        0

    }

  )


  assignNewManager(

    simulation,

    accountId,

    "MANAGER-002"

  )


  applyLoss(

    simulation,

    {

      accountId,

      loss: 5000,

      lots: 10,

      symbol: "GBPUSD"

    }

  )


  const secondStop =
    checkHardStop(

      simulation,

      accountId

    )


  return {

    ...simulation,

    firstClaim,

    secondClaim:
      secondStop.claim

  }

}
