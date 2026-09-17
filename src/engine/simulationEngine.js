import {
  createLedger,
  appendLedgerEntry,
  recordAccountCreated,
  recordAccountFunding,
  recordManagerAssignment,
  recordSubManagerAssignment,
  recordTradeProfit,
  recordTradeLoss,
  recordWithdrawal,
  recordManagerRevenue,
  recordSubManagerRevenue,
  recordReferralRevenue,
  recordTelnensRevenue,
  recordBrokerRebate,
  recordHardStop,
  recordRestitutionClaim,
  recordManagerInterception,
  recordBufferAdvance,
  recordRestitutionResolution,
  recordLienPlaced,
  recordLienReleased,
  recordSocialBondRequested,
  recordSocialBondFunding,
  recordSocialBondActivationFee,
  recordSocialBondActivated,
  recordSocialBondCollateralReturn,
  recordSocialBondRepayment,
  recordBrokerTelemetry,
  recordBrokerCommand,
  getLedgerSummary
} from "./ledger"

import {
  createBrokerAccount,
  receiveBrokerTelemetry
} from "./brokerEngine"

import {
  processBrokerTelemetry
} from "./riskOrchestrator"

import {
  createRestitutionClaim,
  processRestitutionDay,
  createIndependentClaim
} from "./restitutionEngine"

import {
  createSocialBond,
  addSocialBondProvider,
  activateSocialBond,
  handleSecondHardStop,
  calculateSocialBondFeeDistribution
} from "./socialBondEngine"

import {
  calculateWithdrawalDistribution
} from "./withdrawalEngine"

import {
  executeWithdrawal
} from "./transactionEngine"

import {
  createReferralRelationship
} from "./referralMarketplace"

import {
  TELNEN_RULES
} from "../data/rules"

export const SIMULATION_STATES = {
  INITIALIZED: "initialized",
  FUNDED: "funded",
  MANAGED: "managed",
  TRADING: "trading",
  HARD_STOP: "hard_stop",
  RESTITUTION: "restitution",
  SOCIAL_BOND: "social_bond",
  RESTORED: "restored",
  SECOND_HARD_STOP: "second_hard_stop",
  COMPLETED: "completed"
}

export const SIMULATION_EVENT_TYPES = {
  SIMULATION_STARTED:
    "SIMULATION_STARTED",

  FUNDING:
    "FUNDING",

  MANAGER_ASSIGNED:
    "MANAGER_ASSIGNED",

  PROFIT:
    "PROFIT",

  WITHDRAWAL:
    "WITHDRAWAL",

  HARD_STOP:
    "HARD_STOP",

  RESTITUTION_STARTED:
    "RESTITUTION_STARTED",

  MANAGER_RECOVERY:
    "MANAGER_RECOVERY",

  BUFFER_ADVANCE:
    "BUFFER_ADVANCE",

  SOCIAL_BOND:
    "SOCIAL_BOND",

  ACCOUNT_RESTORED:
    "ACCOUNT_RESTORED",

  SECOND_HARD_STOP:
    "SECOND_HARD_STOP",

  CLAIM_RESOLVED:
    "CLAIM_RESOLVED",

  SIMULATION_COMPLETED:
    "SIMULATION_COMPLETED"
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

function now() {
  return new Date().toISOString()
}

function createEvent(
  type,
  data = {}
) {
  return {
    id: generateId("EV"),

    type,

    timestamp: now(),

    ...data
  }
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  )
}

function ensureNumber(value, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : fallback
}

function createInitialState({
  traderId,
  accountId,
  initialValue,
  brokerName,
  managerId,
  managerName,
  managerRegion,
  referrerId
}) {
  const brokerAccount =
    createBrokerAccount({
      id: accountId,

      traderId,

      initialValue,

      brokerName,

      currency: "USD"
    })

  return {
    simulationId:
      generateId("SIM"),

    status:
      SIMULATION_STATES.INITIALIZED,

    day: 0,

    trader: {
      id: traderId,

      revenue: 0,

      referralRevenue: 0,

      socialBondRevenue: 0
    },

    account: {
      id: accountId,

      traderId,

      initialValue,

      valueAtFunding:
        initialValue,

      equity:
        initialValue,

      balance:
        initialValue,

      freeMargin:
        initialValue,

      state:
        SIMULATION_STATES.INITIALIZED,

      tradingEnabled: true,

      managerId: null,

      subManagerId: null,

      socialBondActive: false,

      socialBondId: null,

      restitutionClaimIds: []
    },

    brokerAccount,

    managers: {
      current: {
        id: managerId,

        name:
          managerName,

        region:
          managerRegion,

        revenue: 0,

        interceptedRevenue: 0
      },

      previous: []
    },

    claims: [],

    socialBonds: [],

    referrals: {
      currentReferrerId:
        referrerId
    },

    ledger:
      createLedger(),

    events: [],

    dailyRecovery: [],

    metrics: {
      totalTradingProfit: 0,

      totalTradingLoss: 0,

      totalLots: 0,

      totalWithdrawals: 0,

      totalOwnerRevenue: 0,

      totalManagerRevenue: 0,

      totalSubManagerRevenue: 0,

      totalReferralRevenue: 0,

      totalTelnensRevenue: 0,

      totalBrokerRebates: 0,

      totalRestitutionClaims: 0,

      totalManagerRecovery: 0,

      totalBufferAdvanced: 0,

      totalSocialBondCapital: 0,

      totalSocialBondFees: 0
    }
  }
}

export function createSimulation(
  options = {}
) {
  const traderId =
    options.traderId ??
    "TRADER-001"

  const accountId =
    options.accountId ??
    "ACCOUNT-001"

  const initialValue =
    ensureNumber(
      options.initialValue,
      10000
    )

  const managerId =
    options.managerId ??
    "MANAGER-A"

  const managerName =
    options.managerName ??
    "Manager A"

  const managerRegion =
    options.managerRegion ??
    "Africa"

  const referrerId =
    options.referrerId ??
    "REFERRER-001"

  const brokerName =
    options.brokerName ??
    "MarMarket"

  const state =
    createInitialState({
      traderId,

      accountId,

      initialValue,

      brokerName,

      managerId,

      managerName,

      managerRegion,

      referrerId
    })

  const simulation = {
    ...state,

    options: {
      managerDailyRevenue:
        ensureNumber(
          options.managerDailyRevenue,
          100
        ),

      teBuffer:
        ensureNumber(
          options.teBuffer,
          100000
        ),

      socialBondEnabled:
        options.socialBondEnabled ??
        true,

      socialBondProviderMode:
        options.socialBondProviderMode ??
        "mixed",

      firstHardStopEquity:
        ensureNumber(
          options.firstHardStopEquity,
          initialValue * 0.5
        ),

      secondHardStopEquity:
        ensureNumber(
          options.secondHardStopEquity,
          initialValue * 0.5
        ),

      managerRecoveryDays:
        ensureNumber(
          options.managerRecoveryDays,
          TELNEN_RULES
            .restitutionManagerInterceptionDays
        ),

      withdrawalAmount:
        ensureNumber(
          options.withdrawalAmount,
          1000
        )
    }
  }

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.SIMULATION_STARTED,
      {
        simulationId:
          simulation.simulationId,

        traderId,

        accountId,

        initialValue
      }
    )
  )

  simulation.ledger =
    recordAccountCreated(
      simulation.ledger,
      {
        accountId,

        traderId,

        initialValue
      }
    )

  return simulation
}

export function fundSimulation(
  simulation,
  {
    amount = null,
    source = "direct_deposit"
  } = {}
) {
  const fundingAmount =
    amount === null
      ? simulation.account.initialValue
      : ensureNumber(
          amount,
          0
        )

  if (fundingAmount <= 0) {
    throw new Error(
      "Funding amount must be greater than zero"
    )
  }

  simulation.account.balance =
    fundingAmount

  simulation.account.equity =
    fundingAmount

  simulation.account.freeMargin =
    fundingAmount

  simulation.account.valueAtFunding =
    fundingAmount

  simulation.account.state =
    SIMULATION_STATES.FUNDED

  simulation.brokerAccount =
    receiveBrokerTelemetry(
      simulation.brokerAccount,
      {
        balance:
          fundingAmount,

        equity:
          fundingAmount,

        margin: 0,

        freeMargin:
          fundingAmount
      }
    )

  simulation.ledger =
    recordAccountFunding(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        amount:
          fundingAmount,

        source
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.FUNDING,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        amount:
          fundingAmount,

        source
      }
    )
  )

  return simulation
}

export function assignManager(
  simulation,
  {
    managerId = simulation.managers.current.id,
    managerName =
      simulation.managers.current.name,
    managerRegion =
      simulation.managers.current.region
  } = {}
) {
  simulation.account.managerId =
    managerId

  simulation.account.state =
    SIMULATION_STATES.MANAGED

  simulation.managers.current = {
    ...simulation.managers.current,

    id: managerId,

    name: managerName,

    region: managerRegion
  }

  simulation.brokerAccount =
    receiveBrokerTelemetry(
      simulation.brokerAccount,
      {
        equity:
          simulation.account.equity,

        balance:
          simulation.account.balance,

        margin: 0,

        freeMargin:
          simulation.account.freeMargin
      }
    )

  simulation.brokerAccount.managerConnection = {
    managerId,

    connected: true
  }

  simulation.ledger =
    recordManagerAssignment(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        managerId
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.MANAGER_ASSIGNED,
      {
        accountId:
          simulation.account.id,

        managerId,

        managerName,

        managerRegion
      }
    )
  )

  return simulation
}

export function assignSubManager(
  simulation,
  {
    subManagerId = "SUB-MANAGER-001"
  } = {}
) {
  simulation.account.subManagerId =
    subManagerId

  simulation.ledger =
    recordSubManagerAssignment(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        managerId:
          simulation.account.managerId,

        subManagerId
      }
    )

  simulation.events.push(
    createEvent(
      "SUB_MANAGER_ASSIGNED",
      {
        accountId:
          simulation.account.id,

        managerId:
          simulation.account.managerId,

        subManagerId
      }
    )
  )

  return simulation
}

export function recordTradingProfit(
  simulation,
  {
    amount,
    lots = 1,
    tradeId = null
  }
) {
  const profit =
    ensureNumber(amount, 0)

  if (profit <= 0) {
    throw new Error(
      "Profit must be greater than zero"
    )
  }

  const lotCount =
    ensureNumber(lots, 0)

  simulation.account.balance +=
    profit

  simulation.account.equity +=
    profit

  simulation.account.freeMargin +=
    profit

  simulation.brokerAccount =
    receiveBrokerTelemetry(
      simulation.brokerAccount,
      {
        balance:
          simulation.account.balance,

        equity:
          simulation.account.equity,

        freeMargin:
          simulation.account.freeMargin
      }
    )

  simulation.account.state =
    SIMULATION_STATES.TRADING

  simulation.metrics.totalTradingProfit +=
    profit

  simulation.metrics.totalLots +=
    lotCount

  simulation.ledger =
    recordTradeProfit(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        amount:
          profit,

        tradeId
      }
    )

  simulation.ledger =
    recordBrokerRebate(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        lots:
          lotCount,

        rebatePerLot:
          TELNEN_RULES
            .brokerRebatePerStandardLot
      }
    )

  const brokerRebate =
    lotCount *
    TELNEN_RULES
      .brokerRebatePerStandardLot

  simulation.metrics.totalBrokerRebates +=
    brokerRebate

  simulation.metrics.totalTelnensRevenue +=
    brokerRebate

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.PROFIT,
      {
        accountId:
          simulation.account.id,

        amount:
          profit,

        lots:
          lotCount,

        brokerRebate
      }
    )
  )

  return simulation
}

export function recordTradingLoss(
  simulation,
  {
    amount,
    lots = 1,
    tradeId = null
  }
) {
  const loss =
    ensureNumber(amount, 0)

  if (loss <= 0) {
    throw new Error(
      "Loss must be greater than zero"
    )
  }

  const lotCount =
    ensureNumber(lots, 0)

  simulation.account.balance =
    Math.max(
      0,
      simulation.account.balance -
        loss
    )

  simulation.account.equity =
    Math.max(
      0,
      simulation.account.equity -
        loss
    )

  simulation.account.freeMargin =
    Math.max(
      0,
      simulation.account.equity
    )

  simulation.brokerAccount =
    receiveBrokerTelemetry(
      simulation.brokerAccount,
      {
        balance:
          simulation.account.balance,

        equity:
          simulation.account.equity,

        freeMargin:
          simulation.account.freeMargin
      }
    )

  simulation.metrics.totalTradingLoss +=
    loss

  simulation.metrics.totalLots +=
    lotCount

  simulation.ledger =
    recordTradeLoss(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        amount:
          loss,

        tradeId
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.HARD_STOP,
      {
        accountId:
          simulation.account.id,

        tradingLoss:
          loss,

        equity:
          simulation.account.equity
      }
    )
  )

  return simulation
}

export function updateBrokerTelemetry(
  simulation,
  telemetry
) {
  simulation.ledger =
    recordBrokerTelemetry(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        equity:
          telemetry.equity,

        balance:
          telemetry.balance,

        margin:
          telemetry.margin,

        freeMargin:
          telemetry.freeMargin,

        drawdown:
          simulation.brokerAccount.drawdown
      }
    )

  simulation.brokerAccount =
    receiveBrokerTelemetry(
      simulation.brokerAccount,
      telemetry
    )

  simulation.account.equity =
    simulation.brokerAccount.equity

  simulation.account.balance =
    simulation.brokerAccount.balance

  simulation.account.freeMargin =
    simulation.brokerAccount.freeMargin

  return simulation
}

export function triggerHardStop(
  simulation,
  {
    managerId =
      simulation.account.managerId
  } = {}
) {
  const telemetry = {
    equity:
      simulation.options
        .firstHardStopEquity,

    balance:
      simulation.options
        .firstHardStopEquity,

    margin: 0,

    freeMargin:
      simulation.options
        .firstHardStopEquity,

    activePositions: [],

    pendingOrders: [],

    tradingEnabled: true
  }

  const result =
    processBrokerTelemetry({
      brokerAccount:
        simulation.brokerAccount,

      telemetry,

      managerId,

      eventLog:
        simulation.events
    })

  simulation.brokerAccount =
    result.account

  simulation.account.equity =
    result.account.equity

  simulation.account.balance =
    result.account.balance

  simulation.account.freeMargin =
    result.account.freeMargin

  simulation.account.state =
    SIMULATION_STATES.HARD_STOP

  simulation.account.tradingEnabled =
    false

  const claim =
    result.claims[0]

  if (claim) {
    simulation.claims.push(
      claim
    )

    simulation.account
      .restitutionClaimIds
      .push(claim.id)

    simulation.metrics
      .totalRestitutionClaims +=
      claim.claimAmount

    simulation.ledger =
      recordHardStop(
        simulation.ledger,
        {
          accountId:
            simulation.account.id,

          traderId:
            simulation.trader.id,

          managerId,

          equity:
            result.risk.equity,

          initialValue:
            result.risk.initialValue,

          drawdown:
            result.risk.drawdown,

          claimId:
            claim.id
        }
      )

    simulation.ledger =
      recordRestitutionClaim(
        simulation.ledger,
        {
          accountId:
            simulation.account.id,

          traderId:
            simulation.trader.id,

          managerId,

          claimId:
            claim.id,

          amount:
            claim.claimAmount
        }
      )

    simulation.events.push(
      createEvent(
        SIMULATION_EVENT_TYPES.HARD_STOP,
        {
          accountId:
            simulation.account.id,

          managerId,

          equity:
            result.risk.equity,

          drawdown:
            result.risk.drawdown,

          claimId:
            claim.id,

          claimAmount:
            claim.claimAmount
        }
      )
    )

    simulation.events.push(
      createEvent(
        SIMULATION_EVENT_TYPES.RESTITUTION_STARTED,
        {
          claimId:
            claim.id,

          amount:
            claim.claimAmount
        }
      )
    )
  }

  for (
    const command of result.commands
  ) {
    simulation.ledger =
      recordBrokerCommand(
        simulation.ledger,
        {
          accountId:
            simulation.account.id,

          traderId:
            simulation.trader.id,

          command:
            command.command,

          amount:
            command.amount ?? 0,

          claimId:
            claim?.id ?? null
        }
      )
  }

  return {
    simulation,

    claim,

    risk:
      result.risk,

    commands:
      result.commands
  }
}

export function processRestitution(
  simulation,
  {
    claimId = null,
    days = null,
    managerRevenuePerDay = null,
    bufferAvailable = null
  } = {}
) {
  const claim =
    simulation.claims.find(
      item =>
        item.id ===
        claimId
    ) ??
    simulation.claims.find(
      item =>
        item.status !== "resolved"
    )

  if (!claim) {
    throw new Error(
      "No active restitution claim found"
    )
  }

  const recoveryDays =
    days ??
    simulation.options
      .managerRecoveryDays

  const dailyManagerRevenue =
    managerRevenuePerDay ??
    simulation.options
      .managerDailyRevenue

  let remainingBuffer =
    bufferAvailable ??
    simulation.options.teBuffer

  let currentClaim =
    clone(claim)

  const dailyResults = []

  for (
    let day = 1;
    day <= recoveryDays;
    day += 1
  ) {
    if (
      currentClaim.outstanding <= 0
    ) {
      break
    }

    simulation.day += 1

    const manager =
      simulation.managers.current

    const availableManagerRevenue =
      Math.min(
        dailyManagerRevenue,
        manager.revenue
      ) || dailyManagerRevenue

    const result =
      processRestitutionDay({
        claim:
          currentClaim,

        managerRevenue:
          availableManagerRevenue,

        telnensBufferAvailable:
          remainingBuffer
      })

    currentClaim =
      result.claim

    const intercepted =
      result.managerIntercepted

    const bufferUsed =
      result.bufferUsed

    manager.revenue =
      Math.max(
        0,
        manager.revenue -
          intercepted
      )

    manager.interceptedRevenue =
      (manager.interceptedRevenue ?? 0) +
      intercepted

    remainingBuffer =
      Math.max(
        0,
        remainingBuffer -
          bufferUsed
      )

    if (intercepted > 0) {
      simulation.metrics
        .totalManagerRecovery +=
        intercepted

      simulation.ledger =
        recordManagerInterception(
          simulation.ledger,
          {
            accountId:
              simulation.account.id,

            traderId:
              simulation.trader.id,

            managerId:
              manager.id,

            claimId:
              currentClaim.id,

            amount:
              intercepted,

            day
          }
        )

      simulation.events.push(
        createEvent(
          SIMULATION_EVENT_TYPES.MANAGER_RECOVERY,
          {
            claimId:
              currentClaim.id,

            managerId:
              manager.id,

            day,

            amount:
              intercepted,

            outstanding:
              currentClaim.outstanding
          }
        )
      )
    }

    if (bufferUsed > 0) {
      simulation.metrics
        .totalBufferAdvanced +=
        bufferUsed

      simulation.ledger =
        recordBufferAdvance(
          simulation.ledger,
          {
            accountId:
              simulation.account.id,

            traderId:
              simulation.trader.id,

            claimId:
              currentClaim.id,

            amount:
              bufferUsed
          }
        )

      simulation.events.push(
        createEvent(
          SIMULATION_EVENT_TYPES.BUFFER_ADVANCE,
          {
            claimId:
              currentClaim.id,

            day,

            amount:
              bufferUsed,

            remainingBuffer
          }
        )
      )
    }

    dailyResults.push({
      day,

      managerRevenue:
        availableManagerRevenue,

      managerIntercepted:
        intercepted,

      bufferUsed,

      outstanding:
        currentClaim.outstanding,

      status:
        currentClaim.status
    })

    if (
      currentClaim.status ===
      "resolved"
    ) {
      simulation.ledger =
        recordRestitutionResolution(
          simulation.ledger,
          {
            accountId:
              simulation.account.id,

            traderId:
              simulation.trader.id,

            managerId:
              currentClaim.managerId,

            claimId:
              currentClaim.id,

            amount:
              currentClaim.claimAmount
          }
        )

      simulation.events.push(
        createEvent(
          SIMULATION_EVENT_TYPES.CLAIM_RESOLVED,
          {
            claimId:
              currentClaim.id,

            day,

            amount:
              currentClaim.claimAmount
          }
        )
      )

      break
    }
  }

  const claimIndex =
    simulation.claims.findIndex(
      item =>
        item.id ===
        currentClaim.id
    )

  if (claimIndex >= 0) {
    simulation.claims[
      claimIndex
    ] = currentClaim
  }

  simulation.dailyRecovery.push(
    ...dailyResults
  )

  simulation.account.state =
    currentClaim.status ===
    "resolved"
      ? SIMULATION_STATES.RESTORED
      : SIMULATION_STATES.RESTITUTION

  simulation.options.teBuffer =
    remainingBuffer

  return {
    simulation,

    claim:
      currentClaim,

    dailyResults,

    managerRecovery:
      currentClaim.recoveredFromManager,

    bufferAdvanced:
      currentClaim
        .advancedFromTelnensBuffer,

    outstanding:
      currentClaim.outstanding,

    resolved:
      currentClaim.status ===
      "resolved"
  }
}

export function createSocialBondForClaim(
  simulation,
  {
    claimId = null,
    amount = null
  } = {}
) {
  const claim =
    simulation.claims.find(
      item =>
        item.id ===
        claimId
    )

  if (!claim) {
    throw new Error(
      "Restitution claim not found"
    )
  }

  if (
    claim.outstanding <= 0
  ) {
    throw new Error(
      "Restitution claim is already resolved"
    )
  }

  const bondAmount =
    amount ??
    Math.min(
      claim.outstanding,
      simulation.account.equity
    )

  if (bondAmount <= 0) {
    throw new Error(
      "No equity available for Social Bond"
    )
  }

  const bond =
    createSocialBond({
      traderId:
        simulation.trader.id,

      claimId:
        claim.id,

      accountId:
        simulation.account.id,

      amount:
        bondAmount
    })

  simulation.socialBonds.push(
    bond
  )

  simulation.ledger =
    recordSocialBondRequested(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        claimId:
          claim.id,

        socialBondId:
          bond.id,

        amount:
          bond.amount
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.SOCIAL_BOND,
      {
        action:
          "requested",

        socialBondId:
          bond.id,

        claimId:
          claim.id,

        amount:
          bond.amount
      }
    )
  )

  return {
    simulation,

    bond
  }
}

export function fundSocialBondForSimulation(
  simulation,
  {
    socialBondId = null,
    facilitatorAmount = null,
    bonderAmounts = []
  } = {}
) {
  const bond =
    simulation.socialBonds.find(
      item =>
        item.id ===
        socialBondId
    )

  if (!bond) {
    throw new Error(
      "Social Bond not found"
    )
  }

  let currentBond =
    clone(bond)

  if (
    facilitatorAmount &&
    facilitatorAmount > 0
  ) {
    currentBond =
      addSocialBondProvider({
        bond:
          currentBond,

        providerId:
          "FACILITATOR-001",

        providerType:
          "fintech",

        providerRole:
          "facilitator",

        amount:
          facilitatorAmount
      })

    simulation.ledger =
      recordSocialBondFunding(
        simulation.ledger,
        {
          accountId:
            simulation.account.id,

          traderId:
            simulation.trader.id,

          socialBondId:
            currentBond.id,

          providerId:
            "FACILITATOR-001",

          providerType:
            "fintech",

          providerRole:
            "facilitator",

          amount:
            facilitatorAmount
        }
      )
  }

  for (
    let index = 0;
    index <
      bonderAmounts.length;
    index += 1
  ) {
    const amount =
      ensureNumber(
        bonderAmounts[index],
        0
      )

    if (amount <= 0) {
      continue
    }

    currentBond =
      addSocialBondProvider({
        bond:
          currentBond,

        providerId:
          `BONDER-${index + 1}`,

        providerType:
          "trader",

        providerRole:
          "bonder",

        amount
      })

    const provider =
      currentBond.providers[
        currentBond.providers.length -
          1
      ]

    simulation.ledger =
      recordSocialBondFunding(
        simulation.ledger,
        {
          accountId:
            simulation.account.id,

          traderId:
            simulation.trader.id,

          socialBondId:
            currentBond.id,

          providerId:
            provider.providerId,

          providerType:
            provider.providerType,

          providerRole:
            provider.providerRole,

          amount:
            provider.amount
        }
      )
  }

  const index =
    simulation.socialBonds.findIndex(
      item =>
        item.id ===
        currentBond.id
    )

  if (index >= 0) {
    simulation.socialBonds[
      index
    ] = currentBond
  }

  return {
    simulation,

    bond:
      currentBond
  }
}

export function activateSocialBondForSimulation(
  simulation,
  {
    socialBondId
  }
) {
  const index =
    simulation.socialBonds.findIndex(
      bond =>
        bond.id ===
        socialBondId
    )

  if (index < 0) {
    throw new Error(
      "Social Bond not found"
    )
  }

  const bond =
    simulation.socialBonds[index]

  const activated =
    activateSocialBond({
      bond,

      accountId:
        simulation.account.id
    })

  simulation.socialBonds[index] =
    activated

  const feeDistribution =
    calculateSocialBondFeeDistribution(
      activated.amount
    )

  simulation.metrics
    .totalSocialBondCapital +=
    activated.amount

  simulation.metrics
    .totalSocialBondFees +=
    activated.activationFee

  simulation.metrics
    .totalTelnensRevenue +=
    feeDistribution.telnenshare

  simulation.account.socialBondActive =
    true

  simulation.account.socialBondId =
    activated.id

  simulation.account.state =
    SIMULATION_STATES.SOCIAL_BOND

  simulation.account.tradingEnabled =
    true

  simulation.account.equity =
    simulation.account.valueAtFunding

  simulation.account.balance =
    simulation.account.valueAtFunding

  simulation.account.freeMargin =
    simulation.account.valueAtFunding

  simulation.brokerAccount =
    receiveBrokerTelemetry(
      simulation.brokerAccount,
      {
        balance:
          simulation.account.balance,

        equity:
          simulation.account.equity,

        margin: 0,

        freeMargin:
          simulation.account.freeMargin,

        tradingEnabled: true
      }
    )

  simulation.ledger =
    recordSocialBondActivationFee(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        socialBondId:
          activated.id,

        amount:
          activated.activationFee,

        distribution:
          feeDistribution
      }
    )

  simulation.ledger =
    recordSocialBondActivated(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        socialBondId:
          activated.id,

        claimId:
          activated.claimId,

        amount:
          activated.amount
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.ACCOUNT_RESTORED,
      {
        socialBondId:
          activated.id,

        claimId:
          activated.claimId,

        restoredAmount:
          activated.amount,

        activationFee:
          activated.activationFee
      }
    )
  )

  return {
    simulation,

    bond:
      activated,

    feeDistribution
  }
}

export function assignNewManager(
  simulation,
  {
    managerId = "MANAGER-B",
    managerName = "Manager B",
    managerRegion = "Europe"
  } = {}
) {
  const previousManager =
    simulation.managers.current

  simulation.managers.previous.push(
    previousManager
  )

  simulation.managers.current = {
    id: managerId,

    name: managerName,

    region: managerRegion,

    revenue: 0,

    interceptedRevenue: 0
  }

  simulation.account.managerId =
    managerId

  simulation.account.state =
    SIMULATION_STATES.RESTORED

  simulation.brokerAccount.managerConnection = {
    managerId,

    connected: true
  }

  simulation.ledger =
    recordManagerAssignment(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        managerId
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.MANAGER_ASSIGNED,
      {
        managerId,

        managerName,

        managerRegion,

        replacedManagerId:
          previousManager.id
      }
    )
  )

  return simulation
}

export function triggerSecondHardStop(
  simulation
) {
  const activeBond =
    simulation.socialBonds.find(
      bond =>
        bond.id ===
          simulation.account.socialBondId &&
        bond.status ===
          "active"
    )

  if (!activeBond) {
    throw new Error(
      "No active Social Bond exists for the second hard stop"
    )
  }

  const managerId =
    simulation.account.managerId

  const telemetry = {
    equity:
      simulation.options
        .secondHardStopEquity,

    balance:
      simulation.options
        .secondHardStopEquity,

    margin: 0,

    freeMargin:
      simulation.options
        .secondHardStopEquity,

    activePositions: [],

    pendingOrders: [],

    tradingEnabled: true
  }

  const riskResult =
    processBrokerTelemetry({
      brokerAccount:
        simulation.brokerAccount,

      telemetry,

      managerId,

      eventLog:
        simulation.events
    })

  simulation.brokerAccount =
    riskResult.account

  simulation.account.equity =
    riskResult.account.equity

  simulation.account.balance =
    riskResult.account.balance

  simulation.account.freeMargin =
    riskResult.account.freeMargin

  const newClaim =
    riskResult.claims[0]

  if (!newClaim) {
    throw new Error(
      "Second hard stop did not create a restitution claim"
    )
  }

  simulation.claims.push(
    newClaim
  )

  simulation.account
    .restitutionClaimIds
    .push(newClaim.id)

  simulation.metrics
    .totalRestitutionClaims +=
    newClaim.claimAmount

  const bondResult =
    handleSecondHardStop({
      bond:
        activeBond,

      account:
        simulation.account,

      newClaim
    })

  const bondIndex =
    simulation.socialBonds.findIndex(
      bond =>
        bond.id ===
        activeBond.id
    )

  simulation.socialBonds[
    bondIndex
  ] =
    bondResult.bond

  simulation.account =
    bondResult.account

  simulation.account.state =
    SIMULATION_STATES.SECOND_HARD_STOP

  simulation.ledger =
    recordHardStop(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        managerId,

        equity:
          riskResult.risk.equity,

        initialValue:
          riskResult.risk.initialValue,

        drawdown:
          riskResult.risk.drawdown,

        claimId:
          newClaim.id,

        metadata: {
          secondHardStop: true
        }
      }
    )

  simulation.ledger =
    recordRestitutionClaim(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        managerId,

        claimId:
          newClaim.id,

        amount:
          newClaim.claimAmount,

        metadata: {
          secondHardStop: true
        }
      }
    )

  simulation.ledger =
    recordSocialBondCollateralReturn(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        socialBondId:
          activeBond.id,

        amount:
          bondResult.collateralReturned,

        reason:
          "second_hard_stop"
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.SECOND_HARD_STOP,
      {
        accountId:
          simulation.account.id,

        previousClaimId:
          activeBond.claimId,

        newClaimId:
          newClaim.id,

        managerId,

        socialBondId:
          activeBond.id,

        collateralReturned:
          bondResult.collateralReturned
      }
    )
  )

  return {
    simulation,

    newClaim,

    socialBond:
      bondResult.bond,

    collateralReturned:
      bondResult.collateralReturned
  }
}

export function executeSimulationWithdrawal(
  simulation,
  {
    amount = null
  } = {}
) {
  const withdrawalAmount =
    amount ??
    simulation.options
      .withdrawalAmount

  if (
    withdrawalAmount <= 0
  ) {
    throw new Error(
      "Withdrawal amount must be greater than zero"
    )
  }

  const distribution =
    calculateWithdrawalDistribution(
      withdrawalAmount,
      {
        hasSubManager:
          Boolean(
            simulation.account
              .subManagerId
          )
      }
    )

  const execution =
    executeWithdrawal({
      account:
        simulation.account,

      withdrawalAmount,

      referral:
        simulation.referrals,

      hasSubManager:
        Boolean(
          simulation.account
            .subManagerId
        )
    })

  simulation.account.equity -=
    withdrawalAmount

  simulation.account.balance -=
    withdrawalAmount

  simulation.account.freeMargin =
    Math.max(
      0,
      simulation.account.freeMargin -
        withdrawalAmount
    )

  simulation.brokerAccount =
    receiveBrokerTelemetry(
      simulation.brokerAccount,
      {
        equity:
          simulation.account.equity,

        balance:
          simulation.account.balance,

        freeMargin:
          simulation.account.freeMargin
      }
    )

  simulation.metrics
    .totalWithdrawals +=
    withdrawalAmount

  simulation.metrics
    .totalOwnerRevenue +=
    distribution.ownerAmount

  simulation.metrics
    .totalManagerRevenue +=
    distribution.managerAmount

  simulation.metrics
    .totalSubManagerRevenue +=
    distribution.subManagerAmount

  simulation.metrics
    .totalReferralRevenue +=
    distribution.referralAmount

  simulation.metrics
    .totalTelnensRevenue +=
    distribution.retainedTEAmount

  simulation.trader.revenue +=
    distribution.ownerAmount

  simulation.trader.referralRevenue +=
    distribution.referralAmount

  simulation.managers.current.revenue +=
    distribution.managerAmount

  if (
    distribution.subManagerAmount >
    0
  ) {
    simulation.trader.revenue +=
      distribution.subManagerAmount
  }

  simulation.ledger =
    recordWithdrawal(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        amount:
          distribution.ownerAmount
      }
    )

  simulation.ledger =
    recordManagerRevenue(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        managerId:
          simulation.account.managerId,

        amount:
          distribution.managerAmount
      }
    )

  if (
    distribution.subManagerAmount >
    0
  ) {
    simulation.ledger =
      recordSubManagerRevenue(
        simulation.ledger,
        {
          accountId:
            simulation.account.id,

          traderId:
            simulation.trader.id,

          managerId:
            simulation.account.managerId,

          subManagerId:
            simulation.account.subManagerId,

          amount:
            distribution.subManagerAmount
        }
      )
  }

  simulation.ledger =
    recordReferralRevenue(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        referrerId:
          simulation.referrals
            .currentReferrerId,

        amount:
          distribution.referralAmount
      }
    )

  simulation.ledger =
    recordTelnensRevenue(
      simulation.ledger,
      {
        accountId:
          simulation.account.id,

        traderId:
          simulation.trader.id,

        amount:
          distribution.retainedTEAmount,

        source:
          "withdrawal"
      }
    )

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES.WITHDRAWAL,
      {
        amount:
          withdrawalAmount,

        distribution
      }
    )
  )

  return {
    simulation,

    distribution,

    transactions:
      execution.transactions
  }
}

export function runFullTELNENScenario(
  options = {}
) {
  let simulation =
    createSimulation({
      initialValue:
        options.initialValue ??
        10000,

      traderId:
        options.traderId ??
        "TRADER-001",

      accountId:
        options.accountId ??
        "ACCOUNT-001",

      managerId:
        options.managerId ??
        "MANAGER-A",

      managerName:
        options.managerName ??
        "Manager A",

      managerRegion:
        options.managerRegion ??
        "Africa",

      referrerId:
        options.referrerId ??
        "REFERRER-001",

      brokerName:
        options.brokerName ??
        "MarMarket",

      managerDailyRevenue:
        options.managerDailyRevenue ??
        100,

      teBuffer:
        options.teBuffer ??
        100000
    })

  simulation =
    fundSimulation(
      simulation,
      {
        amount:
          simulation.account
            .initialValue,

        source:
          options.fundingSource ??
          "direct_deposit"
      }
    )

  simulation =
    assignManager(
      simulation
    )

  simulation =
    recordTradingProfit(
      simulation,
      {
        amount:
          options.firstProfit ??
          2000,

        lots:
          options.firstProfitLots ??
          10
      }
    )

  if (
    options.executeFirstWithdrawal
  ) {
    simulation =
      executeSimulationWithdrawal(
        simulation,
        {
          amount:
            options.firstWithdrawal ??
            1000
        }
      )
  }

  const firstStop =
    triggerHardStop(
      simulation
    )

  simulation =
    firstStop.simulation

  const firstClaim =
    firstStop.claim

  if (
    !firstClaim
  ) {
    throw new Error(
      "Full scenario could not create first restitution claim"
    )
  }

  if (
    options.useSocialBond !== false
  ) {
    const bondResult =
      createSocialBondForClaim(
        simulation,
        {
          claimId:
            firstClaim.id,

          amount:
            Math.min(
              firstClaim.outstanding,
              simulation.account
                .equity
            )
        }
      )

    simulation =
      bondResult.simulation

    const bond =
      bondResult.bond

    const bondAmount =
      bond.amount

    const facilitatorAmount =
      Math.min(
        bondAmount,
        options
          .socialBondFacilitatorAmount ??
          bondAmount * 0.5
      )

    const remaining =
      bondAmount -
      facilitatorAmount

    const bonderAmounts = []

    if (remaining > 0) {
      const individualBonderAmount =
        bondAmount * 0.1

      let remainingBonder =
        remaining

      while (
        remainingBonder > 0 &&
        bonderAmounts.length < 10
      ) {
        const contribution =
          Math.min(
            individualBonderAmount,
            remainingBonder
          )

        if (
          contribution <= 0
        ) {
          break
        }

        bonderAmounts.push(
          contribution
        )

        remainingBonder -=
          contribution
      }
    }

    simulation =
      fundSocialBondForSimulation(
        simulation,
        {
          socialBondId:
            bond.id,

          facilitatorAmount,

          bonderAmounts
        }
      ).simulation

    const fundedBond =
      simulation.socialBonds.find(
        item =>
          item.id ===
          bond.id
      )

    if (
      fundedBond &&
      fundedBond.facilitatorAmount +
        fundedBond.bonderAmount >=
        fundedBond.amount
    ) {
      simulation =
        activateSocialBondForSimulation(
          simulation,
          {
            socialBondId:
              bond.id
          }
        ).simulation
    }
  }

  simulation =
    assignNewManager(
      simulation,
      {
        managerId:
          options.secondManagerId ??
          "MANAGER-B",

        managerName:
          options.secondManagerName ??
          "Manager B",

        managerRegion:
          options.secondManagerRegion ??
          "Europe"
      }
    )

  simulation =
    recordTradingProfit(
      simulation,
      {
        amount:
          options.secondProfit ??
          1000,

        lots:
          options.secondProfitLots ??
          5
      }
    )

  let secondStop = null

  const activeBond =
    simulation.socialBonds.find(
      bond =>
        bond.id ===
          simulation.account
            .socialBondId &&
        bond.status ===
          "active"
    )

  if (activeBond) {
    secondStop =
      triggerSecondHardStop(
        simulation
      )

    simulation =
      secondStop.simulation
  }

  const secondClaim =
    secondStop?.newClaim ??
    null

  if (
    options.processSecondClaim !==
    false &&
    secondClaim
  ) {
    simulation =
      processRestitution(
        simulation,
        {
          claimId:
            secondClaim.id,

          days:
            options.secondRecoveryDays ??
            simulation.options
              .managerRecoveryDays,

          managerRevenuePerDay:
            options.secondManagerDailyRevenue ??
            simulation.options
              .managerDailyRevenue
        }
      ).simulation
  }

  simulation.events.push(
    createEvent(
      SIMULATION_EVENT_TYPES
        .SIMULATION_COMPLETED,
      {
        simulationId:
          simulation.simulationId,

        claims:
          simulation.claims.map(
            claim => ({
              id:
                claim.id,

              claimAmount:
                claim.claimAmount,

              recoveredFromManager:
                claim.recoveredFromManager,

              advancedFromTelnensBuffer:
                claim.advancedFromTelnensBuffer,

              outstanding:
                claim.outstanding,

              status:
                claim.status
            })
          )
      }
    )
  )

  simulation.status =
    SIMULATION_STATES.COMPLETED

  return simulation
}

export function getSimulationSummary(
  simulation
) {
  const ledgerSummary =
    getLedgerSummary(
      simulation.ledger
    )

  const activeClaims =
    simulation.claims.filter(
      claim =>
        claim.outstanding > 0
    )

  const resolvedClaims =
    simulation.claims.filter(
      claim =>
        claim.outstanding <= 0
    )

  const activeSocialBonds =
    simulation.socialBonds.filter(
      bond =>
        bond.status === "active"
    )

  return {
    simulationId:
      simulation.simulationId,

    status:
      simulation.status,

    day:
      simulation.day,

    account: {
      id:
        simulation.account.id,

      initialValue:
        simulation.account
          .initialValue,

      equity:
        simulation.account
          .equity,

      balance:
        simulation.account
          .balance,

      managerId:
        simulation.account
          .managerId,

      socialBondActive:
        simulation.account
          .socialBondActive,

      restitutionClaims:
        simulation.account
          .restitutionClaimIds
          .length
    },

    managers: {
      current:
        simulation.managers.current,

      previous:
        simulation.managers.previous
    },

    trading: {
      profit:
        simulation.metrics
          .totalTradingProfit,

      loss:
        simulation.metrics
          .totalTradingLoss,

      lots:
        simulation.metrics
          .totalLots
    },

    traderRevenue: {
      owner:
        simulation.metrics
          .totalOwnerRevenue,

      referral:
        simulation.metrics
          .totalReferralRevenue,

      total:
        simulation.trader.revenue
    },

    managerRevenue: {
      manager:
        simulation.metrics
          .totalManagerRevenue,

      subManager:
        simulation.metrics
          .totalSubManagerRevenue
    },

    telnensRevenue: {
      withdrawal:
        simulation.metrics
          .totalTelnensRevenue,

      brokerRebates:
        simulation.metrics
          .totalBrokerRebates,

      socialBondFees:
        simulation.metrics
          .totalSocialBondFees
    },

    restitution: {
      totalClaims:
        simulation.metrics
          .totalRestitutionClaims,

      managerRecovery:
        simulation.metrics
          .totalManagerRecovery,

      bufferAdvanced:
        simulation.metrics
          .totalBufferAdvanced,

      activeClaims:
        activeClaims.length,

      resolvedClaims:
        resolvedClaims.length,

      outstanding:
        activeClaims.reduce(
          (sum, claim) =>
            sum + claim.outstanding,
          0
        )
    },

    socialBond: {
      totalCapital:
        simulation.metrics
          .totalSocialBondCapital,

      totalFees:
        simulation.metrics
          .totalSocialBondFees,

      activeBonds:
        activeSocialBonds.length,

      totalBonds:
        simulation.socialBonds.length
    },

    ledger:
      ledgerSummary
  }
}

export function getSimulationEvents(
  simulation
) {
  return [
    ...simulation.events
  ]
}

export function getSimulationClaims(
  simulation
) {
  return simulation.claims.map(
    claim => ({
      ...claim
    })
  )
}

export function getSimulationSocialBonds(
  simulation
) {
  return simulation.socialBonds.map(
    bond => ({
      ...bond
    })
  )
}

export function resetSimulation(
  simulation
) {
  return createSimulation({
    initialValue:
      simulation.account
        .initialValue,

    traderId:
      simulation.trader.id,

    accountId:
      simulation.account.id,

    managerId:
      simulation.managers
        .current.id,

    managerName:
      simulation.managers
        .current.name,

    managerRegion:
      simulation.managers
        .current.region,

    referrerId:
      simulation.referrals
        .currentReferrerId,

    brokerName:
      simulation.brokerAccount
        .brokerName,

    managerDailyRevenue:
      simulation.options
        .managerDailyRevenue,

    teBuffer:
      simulation.options
        .teBuffer
  })
}
