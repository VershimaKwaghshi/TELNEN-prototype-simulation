export const LEDGER_EVENT_TYPES = {
  ACCOUNT_CREATED:
    "ACCOUNT_CREATED",

  ACCOUNT_FUNDED:
    "ACCOUNT_FUNDED",

  CAPITAL_BUILDING_STARTED:
    "CAPITAL_BUILDING_STARTED",

  CAPITAL_BUILDING_PAYMENT:
    "CAPITAL_BUILDING_PAYMENT",

  CAPITAL_BUILDING_COMPLETED:
    "CAPITAL_BUILDING_COMPLETED",

  MANAGER_ASSIGNED:
    "MANAGER_ASSIGNED",

  MANAGER_REASSIGNED:
    "MANAGER_REASSIGNED",

  SUB_MANAGER_ASSIGNED:
    "SUB_MANAGER_ASSIGNED",

  TRADE_OPENED:
    "TRADE_OPENED",

  TRADE_CLOSED:
    "TRADE_CLOSED",

  TRADE_PROFIT:
    "TRADE_PROFIT",

  TRADE_LOSS:
    "TRADE_LOSS",

  WITHDRAWAL_REQUESTED:
    "WITHDRAWAL_REQUESTED",

  WITHDRAWAL_APPROVED:
    "WITHDRAWAL_APPROVED",

  OWNER_WITHDRAWAL:
    "OWNER_WITHDRAWAL",

  MANAGER_REVENUE:
    "MANAGER_REVENUE",

  SUB_MANAGER_REVENUE:
    "SUB_MANAGER_REVENUE",

  REFERRER_REVENUE:
    "REFERRER_REVENUE",

  TELNEN_RETAINED_REVENUE:
    "TELNEN_RETAINED_REVENUE",

  BROKER_REBATE:
    "BROKER_REBATE",

  SUBSCRIPTION_REVENUE:
    "SUBSCRIPTION_REVENUE",

  SOCIAL_BOND_ACTIVATION_FEE:
    "SOCIAL_BOND_ACTIVATION_FEE",

  SOCIAL_BOND_PROVIDER_REVENUE:
    "SOCIAL_BOND_PROVIDER_REVENUE",

  HARD_STOP:
    "HARD_STOP",

  MANAGER_DISCONNECTED:
    "MANAGER_DISCONNECTED",

  PENDING_ORDERS_TERMINATED:
    "PENDING_ORDERS_TERMINATED",

  TRADING_LOCKED:
    "TRADING_LOCKED",

  TRADING_UNLOCKED:
    "TRADING_UNLOCKED",

  LIEN_PLACED:
    "LIEN_PLACED",

  LIEN_RELEASED:
    "LIEN_RELEASED",

  RESTITUTION_CLAIM_CREATED:
    "RESTITUTION_CLAIM_CREATED",

  MANAGER_REVENUE_INTERCEPTED:
    "MANAGER_REVENUE_INTERCEPTED",

  TE_BUFFER_ADVANCE:
    "TE_BUFFER_ADVANCE",

  RESTITUTION_PAYMENT:
    "RESTITUTION_PAYMENT",

  RESTITUTION_CLAIM_RESOLVED:
    "RESTITUTION_CLAIM_RESOLVED",

  SOCIAL_BOND_REQUESTED:
    "SOCIAL_BOND_REQUESTED",

  SOCIAL_BOND_FACILITATOR_FUNDED:
    "SOCIAL_BOND_FACILITATOR_FUNDED",

  SOCIAL_BOND_BONDER_FUNDED:
    "SOCIAL_BOND_BONDER_FUNDED",

  SOCIAL_BOND_FUNDED:
    "SOCIAL_BOND_FUNDED",

  SOCIAL_BOND_ACTIVATED:
    "SOCIAL_BOND_ACTIVATED",

  SOCIAL_BOND_REPAID:
    "SOCIAL_BOND_REPAID",

  SOCIAL_BOND_COLLATERAL_RETURNED:
    "SOCIAL_BOND_COLLATERAL_RETURNED",

  SECOND_HARD_STOP:
    "SECOND_HARD_STOP",

  REFERRAL_CREATED:
    "REFERRAL_CREATED",

  REFERRAL_ACTIVITY:
    "REFERRAL_ACTIVITY",

  REFERRAL_MARKETPLACE:
    "REFERRAL_MARKETPLACE",

  REFERRAL_TRANSFERRED:
    "REFERRAL_TRANSFERRED",

  BROKER_TELEMETRY_RECEIVED:
    "BROKER_TELEMETRY_RECEIVED",

  BROKER_COMMAND:
    "BROKER_COMMAND",

  SYSTEM_EVENT:
    "SYSTEM_EVENT"
}

export const LEDGER_CATEGORIES = {
  TRADER:
    "trader",

  MANAGER:
    "manager",

  REFERRAL:
    "referral",

  TELNEN_REVENUE:
    "telnен_revenue",

  BROKER:
    "broker",

  RESTITUTION:
    "restitution",

  SOCIAL_BOND:
    "social_bond",

  CAPITAL_BUILDING:
    "capital_building",

  RISK:
    "risk",

  SYSTEM:
    "system"
}

export const LEDGER_MONEY_TYPES = {
  TRADER_FUNDS:
    "trader_funds",

  TRADING_PROFIT:
    "trading_profit",

  TRADING_LOSS:
    "trading_loss",

  WITHDRAWAL:
    "withdrawal",

  MANAGER_REVENUE:
    "manager_revenue",

  REFERRAL_REVENUE:
    "referral_revenue",

  TELNEN_REVENUE:
    "telnен_revenue",

  BROKER_REBATE:
    "broker_rebate",

  RESTITUTION:
    "restitution",

  TE_BUFFER:
    "te_buffer",

  SOCIAL_BOND_CAPITAL:
    "social_bond_capital",

  SOCIAL_BOND_FEE:
    "social_bond_fee",

  LIEN:
    "lien",

  CAPITAL_BUILDING:
    "capital_building"
}

function generateLedgerId() {
  return `LEDGER-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

function timestamp() {
  return new Date().toISOString()
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

export function createLedgerEntry({
  type,
  category,
  moneyType = null,
  amount = 0,
  accountId = null,
  traderId = null,
  managerId = null,
  claimId = null,
  socialBondId = null,
  transactionId = null,
  referenceId = null,
  direction = null,
  description = "",
  metadata = {}
}) {
  return {
    id: generateLedgerId(),

    type,

    category,

    moneyType,

    amount:
      toNumber(amount),

    accountId,

    traderId,

    managerId,

    claimId,

    socialBondId,

    transactionId,

    referenceId,

    direction,

    description,

    metadata,

    createdAt:
      timestamp()
  }
}

export function createLedger() {
  return {
    entries: [],

    balances: {
      traderFunds: 0,

      tradingProfit: 0,

      tradingLoss: 0,

      ownerWithdrawals: 0,

      managerRevenue: 0,

      subManagerRevenue: 0,

      referralRevenue: 0,

      telnensRevenue: 0,

      brokerRebates: 0,

      restitutionClaims: 0,

      managerRecovery: 0,

      telnensBufferAdvanced: 0,

      socialBondCapital: 0,

      socialBondFees: 0,

      capitalBuilding: 0,

      liens: 0
    }
  }
}

export function appendLedgerEntry(
  ledger,
  entry
) {
  const updatedLedger = {
    entries: [
      ...ledger.entries,
      entry
    ],

    balances: {
      ...ledger.balances
    }
  }

  updateLedgerBalances(
    updatedLedger.balances,
    entry
  )

  return updatedLedger
}

export function appendLedgerEntries(
  ledger,
  entries
) {
  let updatedLedger = ledger

  for (const entry of entries) {
    updatedLedger =
      appendLedgerEntry(
        updatedLedger,
        entry
      )
  }

  return updatedLedger
}

function updateLedgerBalances(
  balances,
  entry
) {
  const amount =
    toNumber(entry.amount)

  switch (entry.type) {
    case LEDGER_EVENT_TYPES.ACCOUNT_FUNDED:
      balances.traderFunds += amount
      break

    case LEDGER_EVENT_TYPES.TRADE_PROFIT:
      balances.tradingProfit += amount
      break

    case LEDGER_EVENT_TYPES.TRADE_LOSS:
      balances.tradingLoss += amount
      break

    case LEDGER_EVENT_TYPES.OWNER_WITHDRAWAL:
      balances.ownerWithdrawals += amount
      break

    case LEDGER_EVENT_TYPES.MANAGER_REVENUE:
      balances.managerRevenue += amount
      break

    case LEDGER_EVENT_TYPES.SUB_MANAGER_REVENUE:
      balances.subManagerRevenue += amount
      break

    case LEDGER_EVENT_TYPES.REFERRER_REVENUE:
      balances.referralRevenue += amount
      break

    case LEDGER_EVENT_TYPES.TELNEN_RETAINED_REVENUE:
      balances.telnensRevenue += amount
      break

    case LEDGER_EVENT_TYPES.BROKER_REBATE:
      balances.brokerRebates += amount
      break

    case LEDGER_EVENT_TYPES.RESTITUTION_CLAIM_CREATED:
      balances.restitutionClaims += amount
      break

    case LEDGER_EVENT_TYPES.MANAGER_REVENUE_INTERCEPTED:
      balances.managerRecovery += amount
      break

    case LEDGER_EVENT_TYPES.TE_BUFFER_ADVANCE:
      balances.telnensBufferAdvanced += amount
      break

    case LEDGER_EVENT_TYPES.SOCIAL_BOND_FACILITATOR_FUNDED:
    case LEDGER_EVENT_TYPES.SOCIAL_BOND_BONDER_FUNDED:
      balances.socialBondCapital += amount
      break

    case LEDGER_EVENT_TYPES.SOCIAL_BOND_ACTIVATION_FEE:
      balances.socialBondFees += amount
      break

    case LEDGER_EVENT_TYPES.CAPITAL_BUILDING_PAYMENT:
      balances.capitalBuilding += amount
      break

    case LEDGER_EVENT_TYPES.LIEN_PLACED:
      balances.liens += amount
      break

    case LEDGER_EVENT_TYPES.LIEN_RELEASED:
      balances.liens -= amount
      break

    default:
      break
  }
}

export function recordAccountCreated(
  ledger,
  {
    accountId,
    traderId,
    initialValue,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.ACCOUNT_CREATED,

      category:
        LEDGER_CATEGORIES.TRADER,

      moneyType:
        LEDGER_MONEY_TYPES.TRADER_FUNDS,

      amount:
        initialValue,

      accountId,

      traderId,

      description:
        "TELNEN trading account created",

      metadata
    })
  )
}

export function recordAccountFunding(
  ledger,
  {
    accountId,
    traderId,
    amount,
    source = "direct_deposit",
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.ACCOUNT_FUNDED,

      category:
        LEDGER_CATEGORIES.TRADER,

      moneyType:
        LEDGER_MONEY_TYPES.TRADER_FUNDS,

      amount,

      accountId,

      traderId,

      direction:
        "in",

      description:
        `Account funded through ${source}`,

      metadata: {
        source,

        ...metadata
      }
    })
  )
}

export function recordTradeProfit(
  ledger,
  {
    accountId,
    traderId,
    amount,
    tradeId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.TRADE_PROFIT,

      category:
        LEDGER_CATEGORIES.TRADER,

      moneyType:
        LEDGER_MONEY_TYPES.TRADING_PROFIT,

      amount,

      accountId,

      traderId,

      referenceId:
        tradeId,

      direction:
        "in",

      description:
        "Trading profit recorded",

      metadata
    })
  )
}

export function recordTradeLoss(
  ledger,
  {
    accountId,
    traderId,
    amount,
    tradeId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.TRADE_LOSS,

      category:
        LEDGER_CATEGORIES.TRADER,

      moneyType:
        LEDGER_MONEY_TYPES.TRADING_LOSS,

      amount,

      accountId,

      traderId,

      referenceId:
        tradeId,

      direction:
        "out",

      description:
        "Trading loss recorded",

      metadata
    })
  )
}

export function recordManagerAssignment(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.MANAGER_ASSIGNED,

      category:
        LEDGER_CATEGORIES.MANAGER,

      accountId,

      traderId,

      managerId,

      description:
        "Manager assigned to account",

      metadata
    })
  )
}

export function recordSubManagerAssignment(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    subManagerId,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.SUB_MANAGER_ASSIGNED,

      category:
        LEDGER_CATEGORIES.MANAGER,

      accountId,

      traderId,

      managerId,

      referenceId:
        subManagerId,

      description:
        "Sub manager assigned to managed account",

      metadata
    })
  )
}

export function recordWithdrawal(
  ledger,
  {
    accountId,
    traderId,
    amount,
    transactionId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.OWNER_WITHDRAWAL,

      category:
        LEDGER_CATEGORIES.TRADER,

      moneyType:
        LEDGER_MONEY_TYPES.WITHDRAWAL,

      amount,

      accountId,

      traderId,

      transactionId,

      direction:
        "out",

      description:
        "Approved owner withdrawal",

      metadata
    })
  )
}

export function recordManagerRevenue(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    amount,
    transactionId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.MANAGER_REVENUE,

      category:
        LEDGER_CATEGORIES.MANAGER,

      moneyType:
        LEDGER_MONEY_TYPES.MANAGER_REVENUE,

      amount,

      accountId,

      traderId,

      managerId,

      transactionId,

      direction:
        "in",

      description:
        "Manager withdrawal allocation",

      metadata
    })
  )
}

export function recordSubManagerRevenue(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    subManagerId,
    amount,
    transactionId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.SUB_MANAGER_REVENUE,

      category:
        LEDGER_CATEGORIES.MANAGER,

      moneyType:
        LEDGER_MONEY_TYPES.MANAGER_REVENUE,

      amount,

      accountId,

      traderId,

      managerId,

      transactionId,

      referenceId:
        subManagerId,

      direction:
        "in",

      description:
        "Sub manager withdrawal allocation",

      metadata
    })
  )
}

export function recordReferralRevenue(
  ledger,
  {
    accountId,
    traderId,
    referrerId,
    amount,
    transactionId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.REFERRER_REVENUE,

      category:
        LEDGER_CATEGORIES.REFERRAL,

      moneyType:
        LEDGER_MONEY_TYPES.REFERRAL_REVENUE,

      amount,

      accountId,

      traderId,

      transactionId,

      referenceId:
        referrerId,

      direction:
        "in",

      description:
        "Referral allocation from TELNEN withdrawal allocation",

      metadata
    })
  )
}

export function recordTelnensRevenue(
  ledger,
  {
    accountId,
    traderId,
    amount,
    source,
    transactionId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.TELNEN_RETAINED_REVENUE,

      category:
        LEDGER_CATEGORIES.TELNEN_REVENUE,

      moneyType:
        LEDGER_MONEY_TYPES.TELNEN_REVENUE,

      amount,

      accountId,

      traderId,

      transactionId,

      direction:
        "in",

      description:
        `TELNEN revenue from ${source}`,

      metadata: {
        source,

        ...metadata
      }
    })
  )
}

export function recordBrokerRebate(
  ledger,
  {
    accountId = null,
    traderId = null,
    lots,
    rebatePerLot,
    metadata = {}
  }
) {
  const amount =
    toNumber(lots) *
    toNumber(rebatePerLot)

  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.BROKER_REBATE,

      category:
        LEDGER_CATEGORIES.BROKER,

      moneyType:
        LEDGER_MONEY_TYPES.BROKER_REBATE,

      amount,

      accountId,

      traderId,

      direction:
        "in",

      description:
        "Broker trading rebate",

      metadata: {
        lots,

        rebatePerLot,

        ...metadata
      }
    })
  )
}

export function recordHardStop(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    equity,
    initialValue,
    drawdown,
    claimId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.HARD_STOP,

      category:
        LEDGER_CATEGORIES.RISK,

      accountId,

      traderId,

      managerId,

      claimId,

      amount:
        Math.max(
          0,
          initialValue - equity
        ),

      description:
        "TELNEN 50 percent hard stop triggered",

      metadata: {
        equity,

        initialValue,

        drawdown,

        ...metadata
      }
    })
  )
}

export function recordRestitutionClaim(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    claimId,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.RESTITUTION_CLAIM_CREATED,

      category:
        LEDGER_CATEGORIES.RESTITUTION,

      moneyType:
        LEDGER_MONEY_TYPES.RESTITUTION,

      amount,

      accountId,

      traderId,

      managerId,

      claimId,

      direction:
        "in",

      description:
        "Restitution claim created",

      metadata
    })
  )
}

export function recordManagerInterception(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    claimId,
    amount,
    day,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.MANAGER_REVENUE_INTERCEPTED,

      category:
        LEDGER_CATEGORIES.RESTITUTION,

      moneyType:
        LEDGER_MONEY_TYPES.RESTITUTION,

      amount,

      accountId,

      traderId,

      managerId,

      claimId,

      direction:
        "in",

      description:
        "Manager revenue intercepted for restitution",

      metadata: {
        restitutionDay:
          day,

        ...metadata
      }
    })
  )
}

export function recordBufferAdvance(
  ledger,
  {
    accountId,
    traderId,
    claimId,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.TE_BUFFER_ADVANCE,

      category:
        LEDGER_CATEGORIES.RESTITUTION,

      moneyType:
        LEDGER_MONEY_TYPES.TE_BUFFER,

      amount,

      accountId,

      traderId,

      claimId,

      direction:
        "out",

      description:
        "TELNEN buffer advanced to satisfy restitution",

      metadata
    })
  )
}

export function recordRestitutionResolution(
  ledger,
  {
    accountId,
    traderId,
    managerId,
    claimId,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.RESTITUTION_CLAIM_RESOLVED,

      category:
        LEDGER_CATEGORIES.RESTITUTION,

      moneyType:
        LEDGER_MONEY_TYPES.RESTITUTION,

      amount,

      accountId,

      traderId,

      managerId,

      claimId,

      direction:
        "in",

      description:
        "Restitution claim fully resolved",

      metadata
    })
  )
}

export function recordLienPlaced(
  ledger,
  {
    accountId,
    traderId,
    claimId = null,
    socialBondId = null,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.LIEN_PLACED,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.LIEN,

      amount,

      accountId,

      traderId,

      claimId,

      socialBondId,

      direction:
        "restricted",

      description:
        "Lien placed against account equity",

      metadata
    })
  )
}

export function recordLienReleased(
  ledger,
  {
    accountId,
    traderId,
    claimId = null,
    socialBondId = null,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.LIEN_RELEASED,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.LIEN,

      amount,

      accountId,

      traderId,

      claimId,

      socialBondId,

      direction:
        "released",

      description:
        "Lien released",

      metadata
    })
  )
}

export function recordSocialBondRequested(
  ledger,
  {
    accountId,
    traderId,
    claimId,
    socialBondId,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.SOCIAL_BOND_REQUESTED,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.SOCIAL_BOND_CAPITAL,

      amount,

      accountId,

      traderId,

      claimId,

      socialBondId,

      description:
        "Social Bond requested",

      metadata
    })
  )
}

export function recordSocialBondFunding(
  ledger,
  {
    accountId,
    traderId,
    socialBondId,
    providerId,
    providerType,
    providerRole,
    amount,
    metadata = {}
  }
) {
  const type =
    providerRole === "facilitator"
      ? LEDGER_EVENT_TYPES.SOCIAL_BOND_FACILITATOR_FUNDED
      : LEDGER_EVENT_TYPES.SOCIAL_BOND_BONDER_FUNDED

  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.SOCIAL_BOND_CAPITAL,

      amount,

      accountId,

      traderId,

      socialBondId,

      referenceId:
        providerId,

      direction:
        "in",

      description:
        `Social Bond funded by ${providerType}`,

      metadata: {
        providerType,

        providerRole,

        ...metadata
      }
    })
  )
}

export function recordSocialBondActivationFee(
  ledger,
  {
    accountId,
    traderId,
    socialBondId,
    amount,
    distribution = {},
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.SOCIAL_BOND_ACTIVATION_FEE,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.SOCIAL_BOND_FEE,

      amount,

      accountId,

      traderId,

      socialBondId,

      direction:
        "in",

      description:
        "Social Bond activation fee",

      metadata: {
        distribution,

        ...metadata
      }
    })
  )
}

export function recordSocialBondActivated(
  ledger,
  {
    accountId,
    traderId,
    socialBondId,
    claimId,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.SOCIAL_BOND_ACTIVATED,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.SOCIAL_BOND_CAPITAL,

      amount,

      accountId,

      traderId,

      claimId,

      socialBondId,

      direction:
        "restricted",

      description:
        "Social Bond activated and account restored",

      metadata
    })
  )
}

export function recordSocialBondCollateralReturn(
  ledger,
  {
    accountId,
    traderId,
    socialBondId,
    amount,
    reason,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.SOCIAL_BOND_COLLATERAL_RETURNED,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.SOCIAL_BOND_CAPITAL,

      amount,

      accountId,

      traderId,

      socialBondId,

      direction:
        "out",

      description:
        "Social Bond collateral returned to providers",

      metadata: {
        reason,

        ...metadata
      }
    })
  )
}

export function recordSocialBondRepayment(
  ledger,
  {
    accountId,
    traderId,
    socialBondId,
    amount,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.SOCIAL_BOND_REPAID,

      category:
        LEDGER_CATEGORIES.SOCIAL_BOND,

      moneyType:
        LEDGER_MONEY_TYPES.SOCIAL_BOND_CAPITAL,

      amount,

      accountId,

      traderId,

      socialBondId,

      direction:
        "out",

      description:
        "Social Bond repayment",

      metadata
    })
  )
}

export function recordCapitalBuildingPayment(
  ledger,
  {
    accountId,
    traderId,
    amount,
    day,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.CAPITAL_BUILDING_PAYMENT,

      category:
        LEDGER_CATEGORIES.CAPITAL_BUILDING,

      moneyType:
        LEDGER_MONEY_TYPES.CAPITAL_BUILDING,

      amount,

      accountId,

      traderId,

      direction:
        "in",

      description:
        "Capital Building scheduled payment",

      metadata: {
        day,

        ...metadata
      }
    })
  )
}

export function recordBrokerTelemetry(
  ledger,
  {
    accountId,
    traderId,
    equity,
    balance,
    margin,
    freeMargin,
    drawdown,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.BROKER_TELEMETRY_RECEIVED,

      category:
        LEDGER_CATEGORIES.BROKER,

      accountId,

      traderId,

      amount:
        equity,

      description:
        "Broker account telemetry received by TELNEN",

      metadata: {
        equity,

        balance,

        margin,

        freeMargin,

        drawdown,

        ...metadata
      }
    })
  )
}

export function recordBrokerCommand(
  ledger,
  {
    accountId,
    traderId,
    command,
    amount = 0,
    claimId = null,
    socialBondId = null,
    metadata = {}
  }
) {
  return appendLedgerEntry(
    ledger,

    createLedgerEntry({
      type:
        LEDGER_EVENT_TYPES.BROKER_COMMAND,

      category:
        LEDGER_CATEGORIES.BROKER,

      amount,

      accountId,

      traderId,

      claimId,

      socialBondId,

      description:
        `TELNEN sent broker command ${command}`,

      metadata: {
        command,

        ...metadata
      }
    })
  )
}

export function getLedgerEntries(
  ledger,
  filters = {}
) {
  return ledger.entries.filter(
    entry => {
      if (
        filters.type &&
        entry.type !== filters.type
      ) {
        return false
      }

      if (
        filters.category &&
        entry.category !==
          filters.category
      ) {
        return false
      }

      if (
        filters.accountId &&
        entry.accountId !==
          filters.accountId
      ) {
        return false
      }

      if (
        filters.traderId &&
        entry.traderId !==
          filters.traderId
      ) {
        return false
      }

      if (
        filters.managerId &&
        entry.managerId !==
          filters.managerId
      ) {
        return false
      }

      if (
        filters.claimId &&
        entry.claimId !==
          filters.claimId
      ) {
        return false
      }

      if (
        filters.socialBondId &&
        entry.socialBondId !==
          filters.socialBondId
      ) {
        return false
      }

      return true
    }
  )
}

export function getAccountLedger(
  ledger,
  accountId
) {
  return getLedgerEntries(
    ledger,
    {
      accountId
    }
  )
}

export function getTraderLedger(
  ledger,
  traderId
) {
  return getLedgerEntries(
    ledger,
    {
      traderId
    }
  )
}

export function getClaimLedger(
  ledger,
  claimId
) {
  return getLedgerEntries(
    ledger,
    {
      claimId
    }
  )
}

export function getSocialBondLedger(
  ledger,
  socialBondId
) {
  return getLedgerEntries(
    ledger,
    {
      socialBondId
    }
  )
}

export function getRevenueEntries(
  ledger
) {
  return ledger.entries.filter(
    entry =>
      entry.category ===
      LEDGER_CATEGORIES.TELNEN_REVENUE ||
      entry.type ===
        LEDGER_EVENT_TYPES.BROKER_REBATE ||
      entry.type ===
        LEDGER_EVENT_TYPES.REFERRER_REVENUE ||
      entry.type ===
        LEDGER_EVENT_TYPES.MANAGER_REVENUE ||
      entry.type ===
        LEDGER_EVENT_TYPES.SUB_MANAGER_REVENUE
  )
}

export function getRestitutionEntries(
  ledger
) {
  return ledger.entries.filter(
    entry =>
      entry.category ===
      LEDGER_CATEGORIES.RESTITUTION
  )
}

export function getSocialBondEntries(
  ledger
) {
  return ledger.entries.filter(
    entry =>
      entry.category ===
      LEDGER_CATEGORIES.SOCIAL_BOND
  )
}

export function getTelnensRevenueEntries(
  ledger
) {
  return ledger.entries.filter(
    entry =>
      entry.type ===
        LEDGER_EVENT_TYPES.TELNEN_RETAINED_REVENUE ||
      entry.type ===
        LEDGER_EVENT_TYPES.BROKER_REBATE ||
      entry.type ===
        LEDGER_EVENT_TYPES.SOCIAL_BOND_ACTIVATION_FEE ||
      entry.type ===
        LEDGER_EVENT_TYPES.SUBSCRIPTION_REVENUE
  )
}

export function calculateLedgerTotals(
  entries
) {
  return entries.reduce(
    (totals, entry) => {
      const amount =
        toNumber(entry.amount)

      switch (entry.type) {
        case LEDGER_EVENT_TYPES.OWNER_WITHDRAWAL:
          totals.ownerWithdrawals += amount
          break

        case LEDGER_EVENT_TYPES.MANAGER_REVENUE:
          totals.managerRevenue += amount
          break

        case LEDGER_EVENT_TYPES.SUB_MANAGER_REVENUE:
          totals.subManagerRevenue += amount
          break

        case LEDGER_EVENT_TYPES.REFERRER_REVENUE:
          totals.referralRevenue += amount
          break

        case LEDGER_EVENT_TYPES.TELNEN_RETAINED_REVENUE:
          totals.telnensRevenue += amount
          break

        case LEDGER_EVENT_TYPES.BROKER_REBATE:
          totals.brokerRebates += amount
          break

        case LEDGER_EVENT_TYPES.TRADE_PROFIT:
          totals.tradingProfit += amount
          break

        case LEDGER_EVENT_TYPES.TRADE_LOSS:
          totals.tradingLoss += amount
          break

        case LEDGER_EVENT_TYPES.MANAGER_REVENUE_INTERCEPTED:
          totals.managerRecovery += amount
          break

        case LEDGER_EVENT_TYPES.TE_BUFFER_ADVANCE:
          totals.telnensBufferAdvanced += amount
          break

        case LEDGER_EVENT_TYPES.SOCIAL_BOND_ACTIVATION_FEE:
          totals.socialBondFees += amount
          break

        default:
          break
      }

      return totals
    },
    {
      ownerWithdrawals: 0,

      managerRevenue: 0,

      subManagerRevenue: 0,

      referralRevenue: 0,

      telnensRevenue: 0,

      brokerRebates: 0,

      tradingProfit: 0,

      tradingLoss: 0,

      managerRecovery: 0,

      telnensBufferAdvanced: 0,

      socialBondFees: 0
    }
  )
}

export function getTelnensGrossRevenue(
  ledger
) {
  const totals =
    calculateLedgerTotals(
      ledger.entries
    )

  return (
    totals.telnensRevenue +
    totals.brokerRebates +
    totals.socialBondFees
  )
}

export function getTelnensNetBufferExposure(
  ledger
) {
  const advances =
    ledger.entries
      .filter(
        entry =>
          entry.type ===
          LEDGER_EVENT_TYPES.TE_BUFFER_ADVANCE
      )
      .reduce(
        (sum, entry) =>
          sum + entry.amount,
        0
      )

  const recoveries =
    ledger.entries
      .filter(
        entry =>
          entry.type ===
          LEDGER_EVENT_TYPES.MANAGER_REVENUE_INTERCEPTED
      )
      .reduce(
        (sum, entry) =>
          sum + entry.amount,
        0
      )

  return Math.max(
    0,
    advances - recoveries
  )
}

export function getOutstandingRestitution(
  ledger
) {
  const claims =
    ledger.entries
      .filter(
        entry =>
          entry.type ===
          LEDGER_EVENT_TYPES.RESTITUTION_CLAIM_CREATED
      )
      .reduce(
        (sum, entry) =>
          sum + entry.amount,
        0
      )

  const managerRecovery =
    ledger.entries
      .filter(
        entry =>
          entry.type ===
          LEDGER_EVENT_TYPES.MANAGER_REVENUE_INTERCEPTED
      )
      .reduce(
        (sum, entry) =>
          sum + entry.amount,
        0
      )

  const bufferAdvances =
    ledger.entries
      .filter(
        entry =>
          entry.type ===
          LEDGER_EVENT_TYPES.TE_BUFFER_ADVANCE
      )
      .reduce(
        (sum, entry) =>
          sum + entry.amount,
        0
      )

  return Math.max(
    0,
    claims -
      managerRecovery -
      bufferAdvances
  )
}

export function getLedgerSummary(
  ledger
) {
  const totals =
    calculateLedgerTotals(
      ledger.entries
    )

  return {
    entries:
      ledger.entries.length,

    traderFunds:
      ledger.balances.traderFunds,

    tradingProfit:
      totals.tradingProfit,

    tradingLoss:
      totals.tradingLoss,

    ownerWithdrawals:
      totals.ownerWithdrawals,

    managerRevenue:
      totals.managerRevenue,

    subManagerRevenue:
      totals.subManagerRevenue,

    referralRevenue:
      totals.referralRevenue,

    telnensRetainedRevenue:
      totals.telnensRevenue,

    brokerRebates:
      totals.brokerRebates,

    socialBondFees:
      totals.socialBondFees,

    grossTelnensRevenue:
      getTelnensGrossRevenue(
        ledger
      ),

    restitutionClaims:
      ledger.balances.restitutionClaims,

    managerRecovery:
      totals.managerRecovery,

    telnensBufferAdvanced:
      totals.telnensBufferAdvanced,

    netTelnensBufferExposure:
      getTelnensNetBufferExposure(
        ledger
      ),

    outstandingRestitution:
      getOutstandingRestitution(
        ledger
      ),

    activeLiens:
      Math.max(
        0,
        ledger.balances.liens
      )
  }
}

export function exportLedger(
  ledger
) {
  return JSON.stringify(
    ledger,
    null,
    2
  )
}
