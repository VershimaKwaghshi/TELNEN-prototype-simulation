TELNEN Operating Simulator

Standalone GitHub Pages prototype.

What changed

This version replaces the earlier simplified simulator with four connected operating views:

• Scale Engine
• Trader Lifecycle
• Restitution Lab
• Revenue Detail
• Event Ledger

The scale engine uses a progressive average account size as the user population increases.

Scale assumptions currently begin at $5,000 average account size for 10,000 users and rise gradually through the 100 million user tier. These values are editable scenario assumptions.

TE revenue is calculated separately from trader and manager income:

• 15% of estimated profit withdrawals
• $4.99 monthly subscription
• 0.1% Capital Building service fee
• 20% of the Social Bond activation fee
• $12 per standard lot broker rebate

Restitution is not counted as revenue. It is stress exposure.

The restitution simulator first intercepts responsible manager revenue through the 100 day window and only then uses the TE buffer for remaining exposure.
