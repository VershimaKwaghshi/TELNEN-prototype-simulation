import {
  calculateWithdrawalDistribution
} from "./withdrawalEngine"

function generateTransactionId() {
  return `TX-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function createTransaction({
  type,
  accountId,
  amount,
  metadata = {}
}) {
  return {
    id: generateTransactionId(),

    type,

    accountId,

    amount,

    metadata,

    status: "pending",

    createdAt:
      new Date().toISOString()
  }
}

export function executeWithdrawal({
  account,
  withdrawalAmount,
  referral,
  hasSubManager = false
}) {
  if (!referral?.currentReferrerId) {
    throw new Error(
      "Withdrawal requires an active referral relationship"
    )
  }

  const distribution =
    calculateWithdrawalDistribution(
      withdrawalAmount,
      {
        hasSubManager
      }
    )

  if (!distribution.balanced) {
    throw new Error(
      "Withdrawal distribution does not balance"
    )
  }

  const transactions = []

  transactions.push(
    createTransaction({
      type: "OWNER_WITHDRAWAL",

      accountId: account.id,

      amount:
        distribution.ownerAmount
    })
  )

  if (distribution.managerAmount > 0) {
    transactions.push(
      createTransaction({
        type: "MANAGER_REVENUE",

        accountId: account.id,

        amount:
          distribution.managerAmount
      })
    )
  }

  if (distribution.subManagerAmount > 0) {
    transactions.push(
      createTransaction({
        type: "SUB_MANAGER_REVENUE",

        accountId: account.id,

        amount:
          distribution.subManagerAmount
      })
    )
  }

  transactions.push(
    createTransaction({
      type: "REFERRER_REVENUE",

      accountId: account.id,

      amount:
        distribution.referralAmount,

      metadata: {
        referrerId:
          referral.currentReferrerId,

        source:
          "TELNEN_30_PERCENT_ALLOCATION"
      }
    })
  )

  transactions.push(
    createTransaction({
      type: "TELNEN_RETAINED_REVENUE",

      accountId: account.id,

      amount:
        distribution.retainedTEAmount
    })
  )

  return {
    distribution,

    transactions,

    balanced:
      transactions.reduce(
        (sum, transaction) =>
          sum + transaction.amount,
        0
      ) === withdrawalAmount
  }
}
