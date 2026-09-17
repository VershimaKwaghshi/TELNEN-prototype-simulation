import {
  calculateWithdrawalDistribution
} from "./withdrawalEngine"

export function createTransaction({
  type,
  accountId,
  amount,
  metadata = {}
}) {
  return {
    id:
      `TX-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

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
  const distribution =
    calculateWithdrawalDistribution(
      withdrawalAmount,
      {
        hasSubManager
      }
    )

  const transactions = []

  transactions.push(
    createTransaction({
      type: "OWNER_WITHDRAWAL",
      accountId: account.id,
      amount:
        distribution.ownerAmount
    })
  )

  if (
    distribution.managerAmount > 0
  ) {
    transactions.push(
      createTransaction({
        type: "MANAGER_REVENUE",
        accountId: account.id,
        amount:
          distribution.managerAmount
      })
    )
  }

  if (
    distribution.subManagerAmount > 0
  ) {
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
      type: "TE_WITHDRAWAL_REVENUE",
      accountId: account.id,
      amount:
        distribution.teAllocation
    })
  )

  if (
    referral &&
    distribution.referralAmount > 0
  ) {
    transactions.push(
      createTransaction({
        type: "REFERRAL_REVENUE",
        accountId: account.id,
        amount:
          distribution.referralAmount,

        metadata: {
          referrerId:
            referral.currentReferrerId
        }
      })
    )
  }

  transactions.push(
    createTransaction({
      type: "TE_RETAINED_REVENUE",
      accountId: account.id,
      amount:
        distribution.retainedTEAmount
    })
  )

  return {
    distribution,
    transactions
  }
}
