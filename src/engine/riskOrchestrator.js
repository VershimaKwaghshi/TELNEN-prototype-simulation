import {
  receiveBrokerTelemetry
} from "./brokerEngine"

import {
  evaluateBrokerTelemetry
} from "./teControlEngine"

import {
  executeBrokerCommand
} from "./brokerExecutionEngine"

import {
  createRestitutionClaim
} from "./restitutionEngine"

export function processBrokerTelemetry({
  brokerAccount,
  telemetry,
  managerId,
  eventLog = []
}) {
  let account =
    receiveBrokerTelemetry(
      brokerAccount,
      telemetry
    )

  const control =
    evaluateBrokerTelemetry(
      account
    )

  const events = [
    ...eventLog,

    {
      type: "BROKER_TELEMETRY_RECEIVED",

      accountId:
        account.id,

      equity:
        account.equity,

      balance:
        account.balance,

      margin:
        account.margin,

      drawdown:
        account.drawdown,

      timestamp:
        new Date().toISOString()
    }
  ]

  if (!control.risk.hardStop) {
    return {
      account,

      risk:
        control.risk,

      commands: [],

      claims: [],

      events
    }
  }

  const claim =
    createRestitutionClaim({
      accountId:
        account.id,

      managerId,

      claimAmount:
        control.risk.restitutionAmount
    })

  events.push({
    type: "HARD_STOP",

    accountId:
      account.id,

    managerId,

    drawdown:
      control.risk.drawdown,

    equity:
      account.equity,

    restitutionAmount:
      claim.claimAmount,

    timestamp:
      new Date().toISOString()
  })

  events.push({
    type: "RESTITUTION_CLAIM_CREATED",

    claimId:
      claim.id,

    accountId:
      account.id,

    managerId,

    amount:
      claim.claimAmount,

    timestamp:
      new Date().toISOString()
  })

  for (const command of control.commands) {
    account =
      executeBrokerCommand(
        account,
        {
          ...command,

          claimId:
            command.claimId ??
            claim.id
        }
      )

    events.push({
      type:
        `BROKER_COMMAND_${command.command.toUpperCase()}`,

      command,

      accountId:
        account.id,

      timestamp:
        new Date().toISOString()
    })
  }

  return {
    account,

    risk:
      control.risk,

    commands:
      control.commands,

    claims: [
      claim
    ],

    events
  }
}
