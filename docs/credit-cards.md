# Credit Cards

## Overview

Credit cards are tracked separately from savings accounts. They represent lines of credit and track outstanding debt.

## Credit Card Basics

### What is a Credit Card Balance?

```
Balance = Money you owe to the credit card company

Positive balance: ₱5,000
  → You owe the card company ₱5,000

Zero balance: ₱0
  → Card is fully paid off

Negative balance: -₱500
  → You have a ₱500 credit (overpayment)
  → You can spend this on future purchases
```

### Credit Card Fields

```typescript
interface CreditCard {
  id: string                    // Unique identifier
  name: string                  // Display name (e.g., "BPI Visa")
  issuer: string               // Bank name (e.g., "BPI")
  lastFourDigits: string       // Last 4 digits (e.g., "1234")
  creditLimit: number          // Credit limit (e.g., ₱50,000)
  currentBalance: number       // Outstanding debt
  interestRate?: number        // APR (optional, informational)
  dueDate?: string            // Payment due date (optional)
  createdAt: Date             // When added to system
  updatedAt: Date             // Last modified
}
```

## Credit Card Lifecycle

### Adding a Credit Card

1. Go to Credit Cards page
2. Click "+ Add Card"
3. Fill in:
   - Card name (e.g., "BPI Visa Gold")
   - Issuer (e.g., "BPI")
   - Last 4 digits (e.g., "1234")
   - Credit limit (e.g., ₱50,000)
   - Interest rate (optional)
   - Due date (optional)
   - Starting balance (usually ₱0)
4. Card created and added to system

### Card Management

**Editing a Card**:
- Change card name, issuer, credit limit
- Update interest rate or due date
- Cannot change balance (updated by transactions only)

**Deleting a Card**:
- Show warning if card has outstanding balance
- Confirm deletion
- Card removed from system

## How Credit Cards Work

### Adding an Expense to a Card

When you charge an expense to a credit card:
- The expense is recorded immediately
- Card balance increases (debt increases)
- You are not required to pay it immediately

```
Example:
  Initial balance: ₱0
  Charge ₱5,000 purchase
  New balance: ₱5,000 (you owe this amount)
```

### Paying the Credit Card

When you make a payment to a credit card:
- The payment must come from a savings account
- Card balance decreases (debt decreases)
- Account balance decreases (money leaves)

```
Example:
  Card balance: ₱5,000
  Account: Savings (₱10,000)
  
  Make payment: ₱2,000
  
  After payment:
    Card balance: ₱3,000 (still owe)
    Savings account: ₱8,000 (paid from here)
```

### Overpayment (Credit Balance)

You can pay more than you owe:

```
Card balance: ₱5,000
Pay: ₱6,000
Result: -₱1,000 balance (₱1,000 credit)

Next purchase:
  Buy ₱500 item
  Credit used: ₱500 (net -₱500)
  Remaining balance: -₱500 (still in credit)
```

**Use cases**:
- Paying ahead of due date
- Making extra payment to earn interest
- Refunds that are credited back

## Transaction Types Affecting Cards

### Expense via Credit Card

**Effect**: Increases card debt

```
Expense Transaction:
  Type: expense
  Amount: ₱1,500
  Payment Method: Credit Card
  Linked Card: "BPI Visa"

Effect:
  BPI Card balance: ₱2,000 → ₱3,500
  (Debt increases by expense amount)
```

**When to use**:
- Any purchase charged to credit card
- Restaurant, shopping, travel, etc.

### Credit Card Payment

**Effect**: Decreases card debt (and source account)

```
Payment Transaction:
  Type: credit_card_payment
  Amount: ₱2,000
  Linked Card: "BPI Visa"
  Payment Source: Savings Account
  
Effects:
  BPI Card balance: ₱3,500 → ₱1,500
  (Debt decreases by payment amount)
  
  Savings Account: ₱10,000 → ₱8,000
  (Money leaves to pay card)
```

**When to use**:
- Making monthly payments
- Paying statement balance
- Early payment to reduce interest
- Partial payments

### Payment Source Options

#### Source: Savings Account

```
Payment from Bank Account:
  Source: Salary Account (₱10,000)
  
  Transaction:
    Amount: ₱2,000
    Source Type: Account
    Linked Account: Salary Account
    
  Effects:
    Card: -₱2,000
    Account: -₱2,000
```

#### Source: Cash

```
Payment with Cash:
  Source: Physical cash (no account tracking)
  
  Transaction:
    Amount: ₱2,000
    Source Type: Cash
    Linked Account: None (optional)
    
  Effects:
    Card: -₱2,000
    No account affected
```

#### Source: External

```
Payment from External Source:
  Source: Refund, insurance reimbursement, etc.
  
  Transaction:
    Amount: ₱500
    Source Type: Other
    Linked Account: None
    
  Effects:
    Card: -₱500
    No account affected
```

## Dashboard Credit Card Overview

The dashboard shows a Credit Cards section (if cards exist):

```
Credit Cards Overview
├─ Total Limit: ₱100,000 (sum of all cards)
├─ Total Balance: ₱15,000 (total debt)
│  Status: Outstanding
├─ Card Status:
   ├─ 2 cards with balance (need payment)
   └─ 1 card paid off
```

**Visual indicators**:
- **Limit**: Blue box showing total credit available
- **Balance**: Red if positive (owing), Green if negative (credit)
- **Status**: Good (no issues), Caution (high utilization), Over-limit (exceeded limit)

## Credit Card Metrics

### Credit Utilization

```
Utilization % = (Current Balance / Credit Limit) × 100

Example 1:
  Card: ₱50,000 limit
  Balance: ₱10,000
  Utilization: 20% ✓ Good

Example 2:
  Card: ₱50,000 limit
  Balance: ₱40,000
  Utilization: 80% ⚠️ High

Example 3:
  Card: ₱50,000 limit
  Balance: ₱55,000
  Utilization: 110% ❌ Over-limit
```

**Guidelines**:
- Under 30%: Excellent
- 30-70%: Good
- 70-100%: Caution (too much)
- Over 100%: Over-limit (fix soon)

### Total Debt Across Cards

```
Card 1 (BPI Visa): ₱5,000
Card 2 (Mastercard): ₱3,000
Card 3 (AmEx): -₱1,000 (credit)

Total Debt: ₱7,000
(Sum of balances)
```

### Interest Calculation

Interest is **informational only** (not automatically calculated in the app):

```
If you record:
  Card APR: 24% per annum
  Balance: ₱5,000
  Days: 30
  
Manual calculation:
  Interest = (₱5,000 × 24% / 365) × 30
  Interest = ₱98.63
  
To account for interest:
  Add transaction: ₱98.63 charge to card
  New balance: ₱5,098.63
```

**Future feature**: Automatic interest calculations

## Payment Strategies

### Scenario 1: Pay Full Statement

```
Statement Period: May 1-31
Charges:
  May 5: ₱1,500 (groceries)
  May 15: ₱2,000 (utilities)
  May 25: ₱500 (dining)
Total: ₱4,000

Due Date: June 15
Action: Pay ₱4,000 by due date

Result:
  Card balance: ₱0 (fully paid)
  No interest charged
```

### Scenario 2: Minimum Payment

```
Card balance: ₱10,000
Minimum payment: 5% = ₱500

Pay minimum: ₱500

Result:
  Card balance: ₱9,500
  Interest charged on remaining ₱9,500
  Next statement shows interest added
```

### Scenario 3: Partial Payment

```
Card balance: ₱5,000
Can only pay: ₱2,000

Make payment: ₱2,000

Result:
  Card balance: ₱3,000
  Interest charged on ₱3,000
  Plan to pay ₱1,500 next month
```

## Multiple Cards Management

### Scenario: 3 Cards

```
BPI Visa (₱50,000 limit)
  Current balance: ₱5,000
  Utilization: 10%
  Due: 2026-05-20

Mastercard (₱30,000 limit)
  Current balance: ₱15,000
  Utilization: 50%
  Due: 2026-05-15

AmEx (₱20,000 limit)
  Current balance: -₱500 (credit)
  Utilization: -2.5%
  Due: 2026-05-25

Total debt: ₱19,500
Total limit: ₱100,000
Overall utilization: 19.5%
```

### Payment Plan

```
Month 1:
  Pay Mastercard: ₱2,000 (due soonest)
  Pay BPI Visa: ₱1,000
  Use AmEx credit: ₱300
  
Month 2:
  Continue paying down each card
  Focus on highest interest rate
  Use AmEx credit first
```

## Edge Cases

### Attempting to Pay Over-limit Card

```
Card: ₱50,000 limit
Balance: ₱55,000 (over-limit)

Option 1: Pay ₱10,000 immediately
  New balance: ₱45,000 (under limit)
  
Option 2: Pay in installments
  Pay ₱3,000 this month → ₱52,000
  Pay ₱3,000 next month → ₱49,000
  ...eventually under limit
```

**App behavior**: Allow payment (no hard block), but warn

### Deleted Card with Outstanding Balance

```
Card: ₱5,000 balance

Delete card → Warning:
  "Card has ₱5,000 outstanding balance.
   Delete will remove card from tracking
   (but ₱5,000 is still owed in real world)"
   
Confirm deletion → Card removed from app
  (Real debt still exists, you need to pay manually)
```

### Negative Balance (Credit)

```
Reason 1: Overpayment
  Owe: ₱5,000
  Pay: ₱6,000
  Result: -₱1,000 credit

Reason 2: Refund
  Owe: ₱5,000
  Refund: ₱3,000
  Result: ₱2,000 (reduced debt)

Reason 3: Credit posted
  Owe: ₱5,000
  Reward credit: ₱500
  Result: ₱4,500 (reduced debt)
```

All result in negative balance = credit available

### Paying from Wrong Account

```
Wrong:
  Need to pay card from payroll account
  But accidentally pay from personal account
  
Fix:
  Edit payment transaction
  Change source account
  Balances automatically recalculate
```

## Credit Card Statements (Future)

**Not yet implemented, but planned**:
- Upload PDF statements
- Reconcile with recorded transactions
- Track disputed charges
- Flag unreconciledcharges

## Reporting and Analysis

### Monthly Credit Card Report

```
May 2026 - Credit Card Activity

All Cards Combined:
  Total Charges: ₱8,500
  Total Payments: ₱5,000
  Net increase: ₱3,500

Balances:
  Start of month: ₱16,000
  End of month: ₱19,500

Interest (if charged):
  ₱125.50

Top Spending Category:
  Food: ₱2,500
  Bills: ₱3,000
  Shopping: ₱3,000
```

### Card-Specific Report

```
BPI Visa Report

Transactions:
  May 5: ₱1,500 (groceries)
  May 10: ₱2,000 (utilities)
  May 15: ₱3,500 (shopping)
  May 25: ₱2,000 (payment)
  
Net: +₱4,000

Balance:
  Start: ₱5,000
  End: ₱9,000
  Increase: ₱4,000 ✓
```

## Integration with Goals

Goals do NOT directly integrate with credit cards, but you can:

1. Create goal: "Pay off Credit Card Debt"
   - Link to a "Payment Account"
   - Target: Total debt across all cards
   - Progress: Shows account balance (payment savings)

2. Create goal: "Reduce Credit Utilization to 30%"
   - Link to account
   - Target: 30% of total credit limit
   - Monitor utilization manually

**Future**: Direct credit card payoff goals

## Best Practices

1. **Track every charge**: Record credit card expenses immediately
2. **Schedule payments**: Set phone reminders for due dates
3. **Monitor balance**: Check dashboard weekly
4. **Pay on time**: Avoid late fees and interest
5. **Pay more than minimum**: Reduce interest and payoff faster
6. **Track limits**: Don't exceed credit limits (impacts credit score)
7. **Review statements**: Reconcile actual statements with app records

## Troubleshooting

### Card balance doesn't match real statement

1. Check each transaction in the app
2. Compare with credit card statement
3. Look for missing charges or payments
4. Edit transactions as needed
5. Mark as reconciled (future feature)

### Over-limit balance

1. Make a payment immediately
2. Pay at least enough to go under limit
3. Continue making regular payments
4. Monitor utilization percentage

### Lost track of payments

1. Go to Transactions page
2. Filter by Credit Card Payment
3. Review payment history
4. See which cards have pending balances
