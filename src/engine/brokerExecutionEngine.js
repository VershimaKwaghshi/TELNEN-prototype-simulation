import {
  BROKER_COMMANDS
} from "./brokerEngine"

export function executeBrokerCommand(
  brokerAccount,
  command
) {
  const updated = {
    ...brokerAccount
  }

  switch (command.command) {
    case BROKER_COMMANDS.DISCONNECT_MANAGER:
      updated.managerConnection = null
      break

    case BROKER_COMMANDS.TERMINATE_PENDING_ORDERS:
      updated.pendingOrders = []
      break

    case BROKER_COMMANDS.LOCK_TRADING:
      updated.tradingEnabled = false
      break

    case BROKER_COMMANDS.UNLOCK_TRADING:
      updated.tradingEnabled = true
      break

    case BROKER_COMMANDS.PLACE_LIEN:
      return executePlaceLien(
        updated,
        command
      )

    case BROKER_COMMANDS.REMOVE_LIEN:
      return executeRemoveLien(
        updated,
        command
      )

    case BROKER_COMMANDS.RESTITUTE_TRADER:
      return executeRestitution(
        updated,
        command
      )

    case BROKER_COMMANDS.APPROVE_WITHDRAWAL:
      return executeWithdrawal(
        updated,
        command
      )

    default:
      throw new Error(
        `Unsupported broker command: ${command.command}`
      )
  }

  return updated
}

function executePlaceLien(
  account,
  command
) {
  const existingLien =
    account.liens.find(
      lien =>
        lien.claimId === command.claimId &&
        lien.status === "active"
    )

  if (existingLien) {
    return account
  }

  const totalLiens =
    account.liens
      .filter(
        lien =>
          lien.status === "active"
      )
      .reduce(
        (sum, lien) =>
          sum + lien.amount,
        0
      )

  if (
    totalLiens + command.amount >
    account.equity
  ) {
    throw new Error(
      "Broker rejected lien: insufficient equity"
    )
  }

  return {
    ...account,

    liens: [
      ...account.liens,

      {
        id:
          `LIEN-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        claimId:
          command.claimId,

        amount:
          command.amount,

        status:
          "active"
      }
    ]
  }
}

function executeRemoveLien(
  account,
  command
) {
  return {
    ...account,

    liens:
      account.liens.map(
        lien =>
          lien.claimId === command.claimId
            ? {
                ...lien,
                status: "released"
              }
            : lien
      )
  }
}

function executeRestitution(
  account,
  command
) {
  return {
    ...account,

    balance:
      account.balance +
      command.amount,

    equity:
      account.equity +
      command.amount,

    freeMargin:
      account.freeMargin +
      command.amount
  }
}

function executeWithdrawal(
  account,
  command
) {
  if (
    command.amount >
    account.equity
  ) {
    throw new Error(
      "Broker rejected withdrawal: insufficient equity"
    )
  }

  return {
    ...account,

    balance:
      account.balance -
      command.amount,

    equity:
      account.equity -
      command.amount,

    freeMargin:
      Math.max(
        0,
        account.freeMargin -
        command.amount
      )
  }
}
