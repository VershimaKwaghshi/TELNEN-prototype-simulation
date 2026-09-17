import { TELNEN_RULES } from "../data/rules"

export const REFERRAL_STATES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  MARKETPLACE_ELIGIBLE: "marketplace_eligible",
  OFFER_OPEN: "offer_open",
  TRANSFERRED: "transferred",
  CLOSED: "closed"
}

export const REFERRAL_EVENTS = {
  RELATIONSHIP_CREATED: "referral_relationship_created",
  ACTIVITY_RECORDED: "referral_activity_recorded",
  MARKETPLACE_ELIGIBLE: "referral_marketplace_eligible",
  OFFER_CREATED: "referral_offer_created",
  OFFER_NEGOTIATED: "referral_offer_negotiated",
  OFFER_ACCEPTED: "referral_offer_accepted",
  RELATIONSHIP_TRANSFERRED: "referral_relationship_transferred"
}

const REFERRAL_SHARE = 0.15
const MAX_ORIGINAL_REFERRER_RETENTION = 0.05
const MARKETPLACE_INACTIVITY_DAYS = 45

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function createReferralRelationship({
  traderId,
  referrerId,
  currentDay = 0
}) {
  if (!traderId) {
    throw new Error("Trader ID is required")
  }

  if (!referrerId) {
    throw new Error("Referrer ID is required")
  }

  if (traderId === referrerId) {
    throw new Error("Trader cannot refer themselves")
  }

  return {
    id: createId("REF"),
    traderId,
    originalReferrerId: referrerId,
    currentReferrerId: referrerId,

    referralShare: REFERRAL_SHARE,

    originalReferrerRetention: 0,
    newReferrerShare: REFERRAL_SHARE,

    createdDay: currentDay,
    lastReferrerActivityDay: currentDay,

    inactivityDays: 0,

    state: REFERRAL_STATES.ACTIVE,

    transferredAtDay: null,

    marketplaceEligible: false
  }
}

export function recordReferrerActivity(
  relationship,
  currentDay
) {
  if (relationship.state === REFERRAL_STATES.CLOSED) {
    return relationship
  }

  return {
    ...relationship,

    lastReferrerActivityDay: currentDay,
    inactivityDays: 0,

    marketplaceEligible: false,

    state: REFERRAL_STATES.ACTIVE
  }
}

export function updateReferralInactivity(
  relationship,
  currentDay
) {
  if (relationship.state === REFERRAL_STATES.CLOSED) {
    return relationship
  }

  const inactivityDays = Math.max(
    0,
    currentDay - relationship.lastReferrerActivityDay
  )

  const marketplaceEligible =
    inactivityDays >= MARKETPLACE_INACTIVITY_DAYS

  return {
    ...relationship,

    inactivityDays,

    marketplaceEligible,

    state: marketplaceEligible
      ? REFERRAL_STATES.MARKETPLACE_ELIGIBLE
      : REFERRAL_STATES.INACTIVE
  }
}

export function canEnterReferralMarketplace(
  relationship,
  traderReferralCount
) {
  if (!relationship) {
    return {
      eligible: false,
      reason: "No referral relationship exists"
    }
  }

  if (!relationship.marketplaceEligible) {
    return {
      eligible: false,
      reason: "Original referrer has not been inactive for 45 days"
    }
  }

  if (traderReferralCount > 1) {
    return {
      eligible: false,
      reason:
        "Trader with more than one referral cannot acquire another referral through the marketplace"
    }
  }

  return {
    eligible: true,
    reason: null
  }
}

export function createMarketplaceOffer({
  relationship,
  newReferrerId,
  traderReferralCount,
  requestedTraderRetention = 0
}) {
  const eligibility = canEnterReferralMarketplace(
    relationship,
    traderReferralCount
  )

  if (!eligibility.eligible) {
    throw new Error(eligibility.reason)
  }

  if (!newReferrerId) {
    throw new Error("New referrer ID is required")
  }

  if (
    newReferrerId === relationship.originalReferrerId
  ) {
    throw new Error(
      "Original referrer cannot create a marketplace transfer offer to themselves"
    )
  }

  if (
    requestedTraderRetention < 0 ||
    requestedTraderRetention > MAX_ORIGINAL_REFERRER_RETENTION
  ) {
    throw new Error(
      "Trader retention must be between 0 and 5 percent"
    )
  }

  const newReferrerShare =
    REFERRAL_SHARE - requestedTraderRetention

  return {
    id: createId("RMO"),

    referralId: relationship.id,

    traderId: relationship.traderId,

    originalReferrerId:
      relationship.originalReferrerId,

    newReferrerId,

    traderRetention:
      requestedTraderRetention,

    originalReferrerRetention:
      requestedTraderRetention,

    newReferrerShare,

    totalReferralShare: REFERRAL_SHARE,

    status: "open",

    createdAtDay: relationship.lastReferrerActivityDay
  }
}

export function negotiateMarketplaceOffer(
  offer,
  requestedTraderRetention
) {
  if (offer.status !== "open") {
    throw new Error(
      "Only open marketplace offers can be negotiated"
    )
  }

  if (
    requestedTraderRetention < 0 ||
    requestedTraderRetention > MAX_ORIGINAL_REFERRER_RETENTION
  ) {
    throw new Error(
      "Trader retention must be between 0 and 5 percent"
    )
  }

  return {
    ...offer,

    traderRetention:
      requestedTraderRetention,

    originalReferrerRetention:
      requestedTraderRetention,

    newReferrerShare:
      REFERRAL_SHARE - requestedTraderRetention
  }
}

export function acceptMarketplaceOffer(
  relationship,
  offer,
  currentDay
) {
  if (offer.status !== "open") {
    throw new Error(
      "Marketplace offer is no longer open"
    )
  }

  if (offer.referralId !== relationship.id) {
    throw new Error(
      "Marketplace offer does not belong to this referral relationship"
    )
  }

  const transferredRelationship = {
    ...relationship,

    currentReferrerId:
      offer.newReferrerId,

    originalReferrerRetention:
      offer.originalReferrerRetention,

    newReferrerShare:
      offer.newReferrerShare,

    transferredAtDay:
      currentDay,

    state:
      REFERRAL_STATES.TRANSFERRED,

    marketplaceEligible: false,

    inactivityDays: 0
  }

  return {
    relationship: transferredRelationship,

    offer: {
      ...offer,
      status: "accepted",
      acceptedAtDay: currentDay
    }
  }
}

export function calculateReferralDistribution(
  referralProfitBase,
  relationship
) {
  if (referralProfitBase <= 0) {
    return {
      grossReferralAmount: 0,
      originalReferrerAmount: 0,
      newReferrerAmount: 0,
      traderRetentionAmount: 0,
      platformAmount: 0
    }
  }

  const grossReferralAmount =
    referralProfitBase * REFERRAL_SHARE

  const traderRetentionAmount =
    grossReferralAmount *
    (
      relationship.originalReferrerRetention /
      REFERRAL_SHARE
    )

  const originalReferrerAmount =
    relationship.currentReferrerId ===
    relationship.originalReferrerId
      ? grossReferralAmount
      : traderRetentionAmount

  const newReferrerAmount =
    relationship.currentReferrerId !==
    relationship.originalReferrerId
      ? grossReferralAmount -
        traderRetentionAmount
      : 0

  return {
    grossReferralAmount,

    originalReferrerAmount,

    newReferrerAmount,

    traderRetentionAmount,

    platformAmount: 0
  }
}

export function calculateReferralRevenueForTrader(
  referralProfitBase,
  relationship
) {
  if (referralProfitBase <= 0) {
    return 0
  }

  const distribution =
    calculateReferralDistribution(
      referralProfitBase,
      relationship
    )

  if (
    relationship.currentReferrerId ===
    relationship.traderId
  ) {
    return distribution.traderRetentionAmount
  }

  return 0
}

export function getReferralRevenueForReferrer(
  referralProfitBase,
  relationship,
  referrerId
) {
  const distribution =
    calculateReferralDistribution(
      referralProfitBase,
      relationship
    )

  if (
    referrerId === relationship.originalReferrerId &&
    relationship.currentReferrerId !==
      relationship.originalReferrerId
  ) {
    return distribution.originalReferrerAmount
  }

  if (
    referrerId === relationship.currentReferrerId
  ) {
    return distribution.newReferrerAmount
  }

  return 0
}

export function closeReferralRelationship(
  relationship
) {
  return {
    ...relationship,
    state: REFERRAL_STATES.CLOSED,
    marketplaceEligible: false
  }
}
