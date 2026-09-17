import {
  evaluateAccountRisk
} from "./riskEngine"

import {
  buildHardStopCommands,
  buildRestitutionCommand,
  buildLienCommand
} from "./brokerEngine"

import {
  calculateWithdrawalDistribution
} from "./withdrawalEngine"

export function evaluateBrokerTelemetry(
  brokerAccount
) {
  const risk =
    evaluateAccountRisk(brokerAccount)

  const commands = []

  if (risk.hardStop) {
    commands.push(
      ...buildHardStopCommands(
        brokerAccount
      )
    )

    commands.push(
      buildLienCommand({
        accountId:
          brokerAccount.id,

        amount:
          brokerAccount.equity,

        claimId: null
      })
    )
  }

  return {
    risk,
    commands
  }
}

export function createRestitutionInstruction({
  accountId,
  claimId,
  amount
}) {
  return {
    ...buildRestitutionCommand({
      accountId,
      amount
    }),

    claimId
  }
}

export function approveWithdrawal({
  account,
  withdrawalAmount,
  hasSubManager = false,
  claimId = null
}) {
  if (
    account.withdrawalStatus ===
    "blocked"
  ) {
    throw new Error(
      "Withdrawal is blocked"
    )
  }

  if (
    account.equity < withdrawalAmount
  ) {
    throw new Error(
      "Insufficient equity"
    )
  }

  const distribution =
    calculateWithdrawalDistribution(
      withdrawalAmount,
      {
        hasSubManager
      }
    )

  return {
    approved: true,

    accountId: account.id,

    claimId,

    withdrawalAmount,

    distribution,

    brokerInstruction: {
      command:
        "approve_withdrawal",

      accountId:
        account.id,

      amount:
        withdrawalAmount,

      distribution
    }
  }
}
