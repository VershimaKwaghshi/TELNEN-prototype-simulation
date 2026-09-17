import { TELNEN_RULES } from "../data/rules"
import { calculateDrawdown } from "./riskEngine"

export const BROKER_COMMANDS = {
  DISCONNECT_MANAGER: "disconnect_manager",
  TERMINATE_PENDING_ORDERS: "terminate_pending_orders",
  PLACE_LIEN: "place_lien",
  REMOVE_LIEN: "remove_lien",
  APPROVE_WITHDRAWAL: "approve_withdrawal",
  REJECT_WITHDRAWAL: "reject_withdrawal",
  RESTITUTE_TRADER: "restitute_trader",
  LOCK_TRADING: "lock_trading",
  UNLOCK_TRADING: "unlock_trading"
}

export function createBrokerAccount({
  id,
  traderId,
  initialValue,
  brokerName = "MarMarket",
  currency = "USD"
}) {
  return {
    id,
    traderId,
    brokerName,
    currency,

    initialValue,
    balance: initialValue,
    equity: initialValue,

    margin: 0,
    freeMargin: initialValue,

    tradingEnabled: true,

    managerConnection: null,

    pendingOrders: [],

    activePositions: [],

    liens: [],

    withdrawalStatus: "available"
  }
}

export function receiveBrokerTelemetry(
  brokerAccount,
  telemetry
) {
  const equity =
    Number(telemetry.equity ?? brokerAccount.equity)

  const balance =
    Number(telemetry.balance ?? brokerAccount.balance)

  const margin =
    Number(telemetry.margin ?? brokerAccount.margin)

  const freeMargin =
    Number(
      telemetry.freeMargin ??
      Math.max(0, equity - margin)
    )

  const drawdown =
    calculateDrawdown(
      brokerAccount.initialValue,
      equity
    )

  return {
    ...brokerAccount,

    balance,
    equity,
    margin,
    freeMargin,

    activePositions:
      telemetry.activePositions ??
      brokerAccount.activePositions,

    pendingOrders:
      telemetry.pendingOrders ??
      brokerAccount.pendingOrders,

    tradingEnabled:
      telemetry.tradingEnabled ??
      brokerAccount.tradingEnabled,

    drawdown
  }
}

export function hasReachedTELNENHardStop(
  brokerAccount
) {
  return (
    brokerAccount.drawdown >=
    TELNEN_RULES.hardStopDrawdown
  )
}

export function buildHardStopCommands(
  brokerAccount
) {
  if (!hasReachedTELNENHardStop(brokerAccount)) {
    return []
  }

  return [
    {
      command:
        BROKER_COMMANDS.DISCONNECT_MANAGER,

      accountId:
        brokerAccount.id
    },

    {
      command:
        BROKER_COMMANDS.TERMINATE_PENDING_ORDERS,

      accountId:
        brokerAccount.id
    },

    {
      command:
        BROKER_COMMANDS.LOCK_TRADING,

      accountId:
        brokerAccount.id
    }
  ]
}

export function buildRestitutionCommand({
  accountId,
  amount
}) {
  if (amount <= 0) {
    throw new Error(
      "Restitution amount must be greater than zero"
    )
  }

  return {
    command:
      BROKER_COMMANDS.RESTITUTE_TRADER,

    accountId,

    amount,

    reason:
      "TELNEN restitution instruction"
  }
}

export function buildLienCommand({
  accountId,
  amount,
  claimId
}) {
  if (amount <= 0) {
    throw new Error(
      "Lien amount must be greater than zero"
    )
  }

  return {
    command:
      BROKER_COMMANDS.PLACE_LIEN,

    accountId,

    amount,

    claimId
  }
}

export function buildRemoveLienCommand({
  accountId,
  amount,
  claimId
}) {
  return {
    command:
      BROKER_COMMANDS.REMOVE_LIEN,

    accountId,

    amount,

    claimId
  }
}

export function placeLien(
  brokerAccount,
  {
    amount,
    claimId
  }
) {
  if (amount <= 0) {
    throw new Error(
      "Lien amount must be greater than zero"
    )
  }

  const totalExistingLiens =
    brokerAccount.liens.reduce(
      (total, lien) =>
        total + lien.amount,
      0
    )

  if (
    totalExistingLiens + amount >
    brokerAccount.equity
  ) {
    throw new Error(
      "Lien exceeds available account equity"
    )
  }

  return {
    ...brokerAccount,

    liens: [
      ...brokerAccount.liens,

      {
        id:
          `LIEN-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        claimId,

        amount,

        status: "active"
      }
    ]
  }
}

export function removeLien(
  brokerAccount,
  claimId
) {
  return {
    ...brokerAccount,

    liens:
      brokerAccount.liens.map(
        lien =>
          lien.claimId === claimId
            ? {
                ...lien,
                status: "released"
              }
            : lien
      )
  }
}
