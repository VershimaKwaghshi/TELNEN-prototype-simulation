import { TELNEN_RULES } from "../data/rules"

export const SOCIAL_BOND_STATES = {
  REQUESTED: "requested",
  PARTIALLY_FUNDED: "partially_funded",
  FUNDED: "funded",
  ACTIVE: "active",
  COLLATERAL_RETURNED:
    "collateral_returned",
  REPAID: "repaid",
  EXPIRED: "expired",
  DEFAULTED: "defaulted"
}

export const PROVIDER_TYPES = {
  TRADER: "trader",
  FINTECH: "fintech",
  BANK: "bank",
  OTHER: "other"
}

export const PROVIDER_ROLES = {
  FACILITATOR: "facilitator",
  BONDER: "bonder"
}

const FACILITATOR_RESPONSE_WINDOW_MINUTES = 5

const BONDER_RESPONSE_WINDOW_MINUTES = 5

const MAX_BONDERS = 10

const MAX_BONDER_SHARE = 0.10

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

export function createSocialBond({
  traderId,
  claimId,
  amount,
  accountId = null
}) {
  if (amount <= 0) {
    throw new Error(
      "Social Bond amount must be greater than zero"
    )
  }

  const activationFee =
    amount *
    TELNEN_RULES.socialBondActivationFeeRate

  return {
    id: generateId("SB"),

    traderId,

    accountId,

    claimId,

    amount,

    activationFee,

    durationDays:
      TELNEN_RULES.socialBondDurationDays,

    elapsedDays: 0,

    status:
      SOCIAL_BOND_STATES.REQUESTED,

    facilitatorAmount: 0,

    bonderAmount: 0,

    providers: [],

    collateralAccountId:
      accountId,

    collateralAmount: 0,

    repaymentAmount: 0,

    facilitatorResponseWindowMinutes:
      FACILITATOR_RESPONSE_WINDOW_MINUTES,

    bonderResponseWindowMinutes:
      BONDER_RESPONSE_WINDOW_MINUTES,

    maxBonders:
      MAX_BONDERS,

    maxBonderShare:
      MAX_BONDER_SHARE,

    createdAt: now(),

    activatedAt: null,

    expiresAt: null,

    returnedAt: null,

    repaidAt: null
  }
}

export function calculateSocialBondFee(
  amount
) {
  return (
    amount *
    TELNEN_RULES.socialBondActivationFeeRate
  )
}

export function calculateSocialBondFeeDistribution(
  amount
) {
  const activationFee =
    calculateSocialBondFee(amount)

  return {
    activationFee,

    facilitatorShare:
      activationFee *
      TELNEN_RULES.socialBondFacilitatorShare,

    bonderShare:
      activationFee *
      TELNEN_RULES.socialBondBonderShare,

    telnenshare:
      activationFee *
      TELNEN_RULES.socialBondTelnenshare,

    total:
      activationFee
  }
}

export function addSocialBondProvider({
  bond,
  providerId,
  providerType,
  providerRole,
  amount
}) {
  if (amount <= 0) {
    throw new Error(
      "Provider contribution must be greater than zero"
    )
  }

  if (
    bond.status ===
      SOCIAL_BOND_STATES.ACTIVE ||
    bond.status ===
      SOCIAL_BOND_STATES.REPAID
  ) {
    throw new Error(
      "Social Bond can no longer accept funding"
    )
  }

  if (
    providerRole ===
    PROVIDER_ROLES.BONDER
  ) {
    const existingBonders =
      bond.providers.filter(
        provider =>
          provider.providerRole ===
          PROVIDER_ROLES.BONDER
      )

    if (
      existingBonders.length >=
      bond.maxBonders
    ) {
      throw new Error(
        "Maximum number of Social Bonders reached"
      )
    }

    const maximumBonderAmount =
      bond.amount *
      bond.maxBonderShare

    const alreadyCommitted =
      existingBonders.reduce(
        (sum, provider) =>
          sum + provider.amount,
        0
      )

    if (
      alreadyCommitted >=
      maximumBonderAmount
    ) {
      throw new Error(
        "This Bonder has reached the maximum allocation for this Social Bond"
      )
    }

    amount = Math.min(
      amount,
      maximumBonderAmount -
        alreadyCommitted
    )
  }

  const fundedBefore =
    bond.facilitatorAmount +
    bond.bonderAmount

  const remaining =
    Math.max(
      0,
      bond.amount -
        fundedBefore
    )

  const contribution =
    Math.min(
      amount,
      remaining
    )

  if (contribution <= 0) {
    throw new Error(
      "Social Bond is already fully funded"
    )
  }

  const provider = {
    id: generateId("SBP"),

    providerId,

    providerType,

    providerRole,

    amount: contribution,

    status: "committed",

    createdAt: now(),

    returnedAmount: 0
  }

  const providers = [
    ...bond.providers,
    provider
  ]

  let facilitatorAmount =
    bond.facilitatorAmount

  let bonderAmount =
    bond.bonderAmount

  if (
    providerRole ===
    PROVIDER_ROLES.FACILITATOR
  ) {
    facilitatorAmount +=
      contribution
  }

  if (
    providerRole ===
    PROVIDER_ROLES.BONDER
  ) {
    bonderAmount +=
      contribution
  }

  const totalFunded =
    facilitatorAmount +
    bonderAmount

  const funded =
    totalFunded >= bond.amount

  return {
    ...bond,

    providers,

    facilitatorAmount,

    bonderAmount,

    status:
      funded
        ? SOCIAL_BOND_STATES.FUNDED
        : SOCIAL_BOND_STATES.PARTIALLY_FUNDED
  }
}

export function fundSocialBond(
  bond,
  facilitatorAmount = 0,
  bonderAmount = 0
) {
  let updatedBond = {
    ...bond
  }

  if (facilitatorAmount > 0) {
    updatedBond =
      addSocialBondProvider({
        bond: updatedBond,

        providerId:
          "FACILITATOR_POOL",

        providerType:
          PROVIDER_TYPES.OTHER,

        providerRole:
          PROVIDER_ROLES.FACILITATOR,

        amount:
          facilitatorAmount
      })
  }

  if (bonderAmount > 0) {
    let remaining =
      Math.max(
        0,
        updatedBond.amount -
          updatedBond.facilitatorAmount -
          updatedBond.bonderAmount
      )

    while (
      remaining > 0
    ) {
      const existingBonders =
        updatedBond.providers.filter(
          provider =>
            provider.providerRole ===
            PROVIDER_ROLES.BONDER
        )

      if (
        existingBonders.length >=
        MAX_BONDERS
      ) {
        break
      }

      const perBonder =
        Math.min(
          bonderAmount,
          updatedBond.amount *
            MAX_BONDER_SHARE
        )

      if (perBonder <= 0) {
        break
      }

      updatedBond =
        addSocialBondProvider({
          bond: updatedBond,

          providerId:
            `BONDER_POOL_${
              existingBonders.length + 1
            }`,

          providerType:
            PROVIDER_TYPES.TRADER,

          providerRole:
            PROVIDER_ROLES.BONDER,

          amount:
            perBonder
        })

      bonderAmount -=
        perBonder

      remaining =
        Math.max(
          0,
          updatedBond.amount -
            updatedBond.facilitatorAmount -
            updatedBond.bonderAmount
        )
    }
  }

  return updatedBond
}

export function isFullyFunded(
  bond
) {
  return (
    bond.facilitatorAmount +
      bond.bonderAmount >=
    bond.amount
  )
}

export function activateSocialBond({
  bond,
  accountId
}) {
  if (!isFullyFunded(bond)) {
    throw new Error(
      "Social Bond is not fully funded"
    )
  }

  const activatedAt =
    new Date()

  const expiresAt =
    new Date(activatedAt)

  expiresAt.setDate(
    expiresAt.getDate() +
      bond.durationDays
  )

  return {
    ...bond,

    accountId,

    collateralAccountId:
      accountId,

    collateralAmount:
      bond.amount,

    status:
      SOCIAL_BOND_STATES.ACTIVE,

    activatedAt:
      activatedAt.toISOString(),

    expiresAt:
      expiresAt.toISOString()
  }
}

export function advanceSocialBondDay(
  bond
) {
  if (
    bond.status !==
    SOCIAL_BOND_STATES.ACTIVE
  ) {
    return {
      bond,
      expired: false
    }
  }

  const elapsedDays =
    bond.elapsedDays + 1

  const expired =
    elapsedDays >=
    bond.durationDays

  return {
    bond: {
      ...bond,

      elapsedDays,

      status:
        expired
          ? SOCIAL_BOND_STATES.EXPIRED
          : SOCIAL_BOND_STATES.ACTIVE
    },

    expired
  }
}

export function returnCollateral({
  bond,
  reason
}) {
  if (
    bond.status !==
      SOCIAL_BOND_STATES.ACTIVE &&
    bond.status !==
      SOCIAL_BOND_STATES.EXPIRED
  ) {
    throw new Error(
      "Social Bond does not have active collateral"
    )
  }

  const providers =
    bond.providers.map(
      provider => ({
        ...provider,

        status:
          "collateral_returned",

        returnedAmount:
          provider.amount
      })
    )

  return {
    ...bond,

    providers,

    collateralAmount: 0,

    status:
      SOCIAL_BOND_STATES.COLLATERAL_RETURNED,

    returnedAt: now(),

    returnReason:
      reason ?? "collateral_returned"
  }
}

export function handleSecondHardStop({
  bond,
  account,
  newClaim
}) {
  if (
    bond.status !==
    SOCIAL_BOND_STATES.ACTIVE
  ) {
    throw new Error(
      "Social Bond is not active"
    )
  }

  const collateralReturned =
    bond.collateralAmount

  const result =
    returnCollateral({
      bond,

      reason:
        "second_hard_stop"
    })

  return {
    bond: result.bond,

    newClaim,

    account: {
      ...account,

      socialBondActive: false,

      socialBondId: null,

      tradingEnabled: false
    },

    collateralReturned,

    event: {
      type:
        "SOCIAL_BOND_COLLATERAL_RETURNED",

      accountId:
        account.id,

      bondId:
        bond.id,

      newClaimId:
        newClaim.id,

      amount:
        collateralReturned,

      reason:
        "second_hard_stop",

      timestamp: now()
    }
  }
}

export function repaySocialBond({
  bond,
  repaymentAmount
}) {
  if (
    bond.status !==
    SOCIAL_BOND_STATES.ACTIVE
  ) {
    throw new Error(
      "Social Bond is not active"
    )
  }

  if (repaymentAmount <= 0) {
    throw new Error(
      "Repayment amount must be greater than zero"
    )
  }

  const amount =
    Math.min(
      repaymentAmount,
      bond.amount
    )

  const fullyRepaid =
    amount >= bond.amount

  return {
    ...bond,

    repaymentAmount:
      bond.repaymentAmount +
      amount,

    status:
      fullyRepaid
        ? SOCIAL_BOND_STATES.REPAID
        : SOCIAL_BOND_STATES.ACTIVE,

    repaidAt:
      fullyRepaid
        ? now()
        : null
  }
}

export function getSocialBondSummary(
  bond
) {
  const funded =
    bond.facilitatorAmount +
    bond.bonderAmount

  return {
    bondId: bond.id,

    requested:
      bond.amount,

    funded,

    outstandingFunding:
      Math.max(
        0,
        bond.amount - funded
      ),

    fundingRate:
      bond.amount > 0
        ? funded / bond.amount
        : 0,

    activationFee:
      bond.activationFee,

    facilitatorAmount:
      bond.facilitatorAmount,

    bonderAmount:
      bond.bonderAmount,

    providerCount:
      bond.providers.length,

    collateralAmount:
      bond.collateralAmount,

    repaymentAmount:
      bond.repaymentAmount,

    remainingRepayment:
      Math.max(
        0,
        bond.amount -
          bond.repaymentAmount
      ),

    status:
      bond.status
  }
}

export function createFacilitatorRequest(
  bond
) {
  return {
    id: generateId("SFR"),

    bondId: bond.id,

    amount:
      bond.amount,

    responseWindowMinutes:
      FACILITATOR_RESPONSE_WINDOW_MINUTES,

    status: "open",

    createdAt: now()
  }
}

export function createBonderRequest(
  bond
) {
  return {
    id: generateId("SBR"),

    bondId: bond.id,

    requestedAmount:
      bond.amount,

    maximumBonders:
      MAX_BONDERS,

    maximumSharePerBonder:
      MAX_BONDER_SHARE,

    responseWindowMinutes:
      BONDER_RESPONSE_WINDOW_MINUTES,

    status: "open",

    createdAt: now()
  }
}
