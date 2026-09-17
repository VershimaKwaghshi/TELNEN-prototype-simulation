import { evaluateAccountRisk } from "./riskEngine"
import {
  buildHardStopCommands,
  buildRestitutionCommand,
  buildLienCommand,
  buildRemoveLienCommand
} from "./brokerEngine"
import { calculateWithdrawalDistribution } from "./withdrawalEngine"

export function evaluateBrokerTelemetry(brokerAccount) {
  const risk = evaluateAccountRisk(brokerAccount)

  const commands = []

  if (risk.hardStop) {
    commands.push(
      ...buildHardStopCommands(brokerAccount)
    )

    commands.push(
      buildLienCommand({
        accountId: brokerAccount.id,
        amount: Math.max(
          0,
          Math.min(
            brokerAccount.equity,
            brokerAccount.initialValue * 0.5
          )
        ),
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

export function createSocialBondLienInstruction({
  accountId,
  claimId,
  amount
}) {
  return buildLienCommand({
    accountId,
    amount,
    claimId
  })
}

export function createSocialBondReleaseInstruction({
  accountId,
  claimId,
  amount
}) {
  return buildRemoveLienCommand({
    accountId,
    amount,
    claimId
  })
}

export function approveWithdrawal({
  account,
  withdrawalAmount,
  hasSubManager = false,
  referral
}) {
  if (!referral?.currentReferrerId) {
    throw new Error(
      "A referral relationship is required"
    )
  }

  if (account.withdrawalStatus === "blocked") {
    throw new Error(
      "Withdrawal is blocked"
    )
  }

  if (account.equity < withdrawalAmount) {
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

    withdrawalAmount,

    distribution,

    brokerInstruction: {
      command: "approve_withdrawal",

      accountId: account.id,

      amount: withdrawalAmount,

      distribution
    }
  }
}
