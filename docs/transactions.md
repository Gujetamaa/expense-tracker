# Transactions

## Overview

Transactions are the primary way money moves through the system. Each transaction type has specific rules for which balances are affected and how.

## Transaction Types

### 1. Expense

An expense represents money spent. The impact on balances depends on the payment method.

#### Payment Methods

| Method | Source | Balance Effect | Account Type |
|--------|--------|---|---|
| **Credit Card** | Credit Card | Card balance increases | Required |
| **Debit Card** | Savings Account | Account balance decreases | Account with hasDebitCard=true |
| **Bank Transfer** | Savings Account | Account balance decreases | Traditional/Digital Bank |
| **E-Wallet** | E-Wallet | Account balance decreases | E-Wallet account type |
| **Cash** | Cash | Optional account balance decreases | Cash account (optional) |

#### Flow Diagram

```
User Records Expense
└─ Expense Type Transaction
   ├─ [Payment Method: Credit Card]
   │  └─ linkedCreditCardId: "card-123"
   │     └─ applyCardCharge(cardId, amount)
   │        └─ creditCard.currentBalance += amount
   │           (Adds debt to the card)
   │
   ├─ [Payment Method: Debit Card]
   │  └─ linkedAccountId: "account-456"
   │     └─ applyAccountDebit(accountId, amount)
   │        └─ account.currentBalance -= amount
   │           (Money leaves the account)
   │
   ├─ [Payment Method: Bank Transfer]
   │  └─ linkedAccountId: "account-456"
   │     └─ applyAccountDebit(accountId, amount)
   │
   └─ [Payment Method: E-Wallet]
      └─ linkedAccountId: "ewallet-789"
         └─ applyAccountDebit(accountId, amount)
```

#### Example

```
Scenario: Buy groceries for ₱500 using credit card

Transaction {
  type: 'expense',
  category: 'Food',
  description: 'Groceries at SM',
  amount: 500,
  paymentMethod: 'Credit Card',
  linkedCreditCardId: 'card-bpi-001',
  date: '2026-05-14'
}

Effect:
  BPI Credit Card balance: ₱5,000 → ₱5,500
  (Debt increases)
```

### 2. Income

Income represents money received and deposited into an account.

#### Flow Diagram

```
User Records Income
└─ Income Type Transaction
   └─ linkedAccountId: "account-123"
      └─ applyAccountCredit(accountId, amount)
         └─ account.currentBalance += amount
            (Money enters the account)
```

#### Example

```
Scenario: Receive monthly salary of ₱22,500

Transaction {
  type: 'income',
  category: 'Salary',
  description: 'Monthly salary',
  amount: 22500,
  linkedAccountId: 'account-savings-001',
  date: '2026-05-15'
}

Effect:
  Savings Account balance: ₱5,000 → ₱27,500
```

### 3. Credit Card Payment

A credit card payment is a transaction specifically for paying off credit card debt. It differs from an expense in that:
- It does NOT count as an expense
- It reduces card debt (not increases)
- It requires both a card and a payment source

#### Payment Source Types

| Source | Effect | Requirement |
|--------|--------|---|
| **Account** | Source account decreases, card balance decreases | linkedAccountId required |
| **Cash** | Card balance decreases only (no account tracking) | Optional linkedAccountId |
| **Other** | Card balance decreases only (external source) | No linkedAccountId needed |

#### Flow Diagram

```
User Records Credit Card Payment
└─ Credit Card Payment Type Transaction
   ├─ Effect 1: applyCardPayment(cardId, amount)
   │  └─ creditCard.currentBalance -= amount
   │     (Debt decreases)
   │
   └─ Effect 2 (if source is Account):
      └─ applyAccountDebit(accountId, amount)
         └─ account.currentBalance -= amount
            (Money leaves source account)
```

#### Example: Payment from Savings Account

```
Scenario: Pay BPI credit card ₱2,000 from GCash

Transaction {
  type: 'credit_card_payment',
  category: 'Statement Payment',
  amount: 2000,
  linkedCreditCardId: 'card-bpi-001',
  paymentSourceType: 'Account',
  linkedAccountId: 'account-gcash-001',
  date: '2026-05-20'
}

Effects:
  BPI Credit Card: ₱5,500 → ₱3,500
    (Debt decreases by payment amount)
  
  GCash Account: ₱10,000 → ₱8,000
    (Money leaves GCash)
```

#### Example: Payment from Cash

```
Scenario: Pay BPI credit card ₱1,000 in cash (physical withdrawal)

Transaction {
  type: 'credit_card_payment',
  category: 'Statement Payment',
  amount: 1000,
  linkedCreditCardId: 'card-bpi-001',
  paymentSourceType: 'Cash',
  date: '2026-05-20'
}

Effects:
  BPI Credit Card: ₱3,500 → ₱2,500
    (Debt decreases)
  
  No account balance change
    (Cash payment not tracked)
```

#### Example: Payment from External Source

```
Scenario: Credit card refund or adjustment by bank

Transaction {
  type: 'credit_card_payment',
  category: 'Other Credit Payment',
  amount: 500,
  linkedCreditCardId: 'card-bpi-001',
  paymentSourceType: 'Other',
  notes: 'Refund for returned merchandise',
  date: '2026-05-20'
}

Effects:
  BPI Credit Card: ₱2,500 → ₱2,000
    (Balance adjusts)
  
  No account impact
```

### 4. Savings Transfer

A savings transfer moves money from one account to another. It is NOT an expense or income—it is a reallocation of existing money.

#### Flow Diagram

```
User Records Savings Transfer
└─ Savings Transfer Type Transaction
   ├─ sourceAccountId: "account-abc"
   │  └─ applyAccountDebit(sourceAccountId, amount)
   │     └─ source.currentBalance -= amount
   │
   └─ destinationAccountId: "account-xyz"
      └─ applyAccountCredit(destinationAccountId, amount)
         └─ dest.currentBalance += amount
```

#### Optional Goal Tagging

A savings transfer can be tagged with a linked goal, but this is purely metadata:

```
linkedGoalId: "goal-emergency-fund"
  ↓
Used for:
  ✓ Filtering transfers by goal
  ✓ Showing transfer history in goal details
  ✗ NOT used for calculating goal progress
  
The goal's progress still comes from the linked account balance,
not from transfers tagged to it.
```

#### Example

```
Scenario: Transfer ₱5,000 from Savings Account to Emergency Fund (which is also a linked account)

Transaction {
  type: 'savings_transfer',
  description: 'Monthly emergency fund contribution',
  amount: 5000,
  sourceAccountId: 'account-salary-001',
  destinationAccountId: 'account-emergency-001',
  linkedGoalId: 'goal-emergency-fund', // metadata only
  date: '2026-05-14'
}

Effects:
  Salary Account: ₱22,500 → ₱17,500
    (Money leaves source)
  
  Emergency Account: ₱30,000 → ₱35,000
    (Money enters destination)

Goal Progress (NOT affected by transfer tagging):
  Goal: Emergency Fund (₱50,000 target)
  Progress: ₱35,000 / ₱50,000 = 70%
    (Progress comes from Emergency Account balance, not from transfer record)
```

## Transaction Editing & Effects Reversal

When a transaction is edited, the system must:
1. Reverse the OLD transaction's effects
2. Apply the NEW transaction's effects
3. Save the updated transaction

### Example: Editing an Expense

```
Original Transaction:
  Expense: ₱100 via Credit Card
  Card balance was: ₱5,000
  Card balance is: ₱5,100

User edits to:
  Expense: ₱150 via E-Wallet from GCash Account

Step 1: Reverse old effects
  applyCardPayment(card, 100) // Undo the charge
  Card balance: ₱5,100 → ₱5,000

Step 2: Apply new effects
  applyAccountDebit(gcash, 150) // Debit the e-wallet
  GCash balance: ₱10,000 → ₱9,850

Result:
  BPI Card: ₱5,000 (as if original charge never happened)
  GCash: ₱9,850 (charged new amount)
```

## Transaction Deletion & Effects Reversal

When a transaction is deleted, all its effects are reversed.

### Example: Deleting a Payment

```
Credit Card Payment Transaction:
  Amount: ₱2,000
  Card: BPI Credit Card
  Source: GCash Account

Current State (BEFORE delete):
  BPI Card balance: ₱3,000
  GCash balance: ₱8,000

On Delete:
  reverseCardPayment(card, 2000)
    BPI Card: ₱3,000 → ₱5,000
  
  reverseAccountDebit(gcash, 2000)
    GCash: ₱8,000 → ₱10,000

Result:
  Balances revert as if the payment never happened
```

## Category System

Each transaction type has predefined categories:

### Expense Categories
- Bills (utilities, rent, insurance)
- Food (groceries, restaurants)
- Transportation (gas, jeepney, grab)
- Entertainment (movies, games)
- Shopping (clothes, gadgets)
- Certifications (courses, training)
- Miscellaneous

### Income Categories
- Salary
- Freelance
- Business Income
- Investment Returns
- Gifts
- Miscellaneous

### Savings Transfer Categories
- (No predefined categories, description is free-form)

### Credit Card Payment Categories
- Statement Payment (regular payment)
- Installment Payment (installment agreement)
- Annual Fee Payment (yearly fee payment)
- Advance Payment (prepayment/overpayment)
- Other Credit Payment (miscellaneous)

## Summary Statistics by Transaction Type

### Monthly Dashboard Calculations

```
Total Income
  = sum of all 'income' transactions in the selected month
  = displayed in green on dashboard

Total Expenses
  = sum of all 'expense' transactions in the selected month
  = does NOT include credit card payments
  = does NOT include savings transfers
  = displayed in red on dashboard

Credit Card Payments
  = tracked separately
  = NOT counted in "Total Expenses"
  = shows total debt paid down in the month

Savings Transfers
  = NOT counted in income or expenses
  = tracked separately
  = shows total reallocations in the month

Remaining Budget
  = Total Income - Total Expenses
  = positive = surplus, negative = deficit
  = does not include credit card payments
```

### Example Monthly Snapshot

```
Month: May 2026

Income Transactions:
  - Salary: ₱22,500
  Total: ₱22,500

Expense Transactions:
  - Groceries: ₱500 (via Credit Card)
  - Gas: ₱200 (via E-Wallet)
  - Electricity Bill: ₱800 (via Bank Transfer)
  Total: ₱1,500

Credit Card Payments:
  - BPI Payment: ₱2,000 (from Savings Account)
  - MC Payment: ₱1,000 (from Savings Account)
  Total: ₱3,000

Savings Transfers:
  - To Emergency Fund: ₱5,000
  - To Investment: ₱3,000
  Total: ₱8,000

Dashboard Shows:
  ✓ Income: ₱22,500
  ✓ Expenses: ₱1,500
  ✓ Remaining Budget: ₱21,000
  ✓ CC Payments: ₱3,000 (separate)
  ✓ Transfers: ₱8,000 (separate)
```

## Effects System Implementation

All balance changes happen through the effects system in `lib/transactionEffects.ts`:

```typescript
export function applyTransactionEffects(transaction: Transaction): void {
  switch (transaction.type) {
    case 'expense':
      if (transaction.paymentMethod === 'Credit Card') {
        applyCardCharge(transaction.linkedCreditCardId!, transaction.amount)
      } else {
        applyAccountDebit(transaction.linkedAccountId!, transaction.amount)
      }
      break
    
    case 'income':
      applyAccountCredit(transaction.linkedAccountId!, transaction.amount)
      break
    
    case 'credit_card_payment':
      applyCardPayment(transaction.linkedCreditCardId!, transaction.amount)
      if (transaction.paymentSourceType === 'Account') {
        applyAccountDebit(transaction.linkedAccountId!, transaction.amount)
      }
      break
    
    case 'savings_transfer':
      applyAccountDebit(transaction.sourceAccountId!, transaction.amount)
      applyAccountCredit(transaction.destinationAccountId!, transaction.amount)
      // Note: linkedGoalId is metadata, not used for effects
      break
  }
}
```

Effects are idempotent when used correctly:
- Apply, save, apply again: Still correct (storage reloads before second apply)
- Reverse, apply: Still correct (reverses then reapplies)
- Cannot be called twice on same transaction without reversal (would double-count)

## Validation During Transaction Creation

```
Form Submission
├─ Check amount > 0
├─ Check required fields filled
├─ Check date is valid
│
└─ Transaction Type Specific:
   ├─ Expense:
   │  └─ If Credit Card: check linkedCreditCardId selected
   │     If Debit/Bank/Wallet: check linkedAccountId selected
   │
   ├─ Income:
   │  └─ Check linkedAccountId selected
   │
   ├─ CC Payment:
   │  ├─ Check linkedCreditCardId selected
   │  └─ If source is Account: check linkedAccountId selected
   │
   └─ Savings Transfer:
      ├─ Check sourceAccountId selected
      ├─ Check destinationAccountId selected
      └─ Check sourceAccountId ≠ destinationAccountId
```

## Data Persistence

All transactions are stored in localStorage under the key `transactions`:

```javascript
localStorage.setItem('transactions', JSON.stringify(transactions))
```

When reading:
```typescript
export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem('transactions')
  return data ? JSON.parse(data) : []
}
```

For detailed localStorage structure, see [localstorage-schema.md](localstorage-schema.md).
