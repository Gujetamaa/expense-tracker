# Business Rules & Constraints

This document defines the core rules that govern how the financial system works and how to handle edge cases.

## Core Rules

### Accounts and Goals

1. **Every goal must be linked to exactly one account**
   - Goals cannot exist without an account
   - When creating a goal, the account dropdown is required
   - If no accounts exist, the goal creation UI shows a prompt to create an account first

2. **Goal progress is calculated from linked account balance only**
   - Goal progress = (linked account's current balance) / goal target amount
   - Goals do NOT store a separate "currentSaved" field
   - Goal progress updates automatically when the account balance changes
   - No manual "save to goal" transactions needed

3. **An account can be linked to multiple goals**
   - Multiple goals can point to the same account
   - Each goal's progress reflects the same underlying account balance
   - Example: Emergency Fund and "House Down Payment" goals both linked to "Savings Account"

4. **Goals should not be deleted if they're in active use**
   - Warning: Deleting a goal doesn't affect the linked account (only metadata deleted)
   - The account and its balance remain intact
   - Future: Consider archiving goals instead of deletion

### Transactions and Balance Changes

1. **Every transaction that affects balances must use the effects system**
   - Never directly modify account/card balances in components
   - Always call `applyTransactionEffects()` before saving
   - Always call `reverseTransactionEffects()` before deleting

2. **Transactions are immutable in effect**
   - Editing a transaction must:
     - Reverse effects of the old transaction
     - Apply effects of the new transaction
   - This prevents double-counting and ensures correctness

3. **Effects are applied BEFORE storage, not after**
   - Order: Apply effects → Update localStorage → Notify component
   - This ensures localStorage is always in a consistent state
   - If effects fail, the transaction is not saved

### Expenses

1. **Expenses are recorded as they happen, when they are incurred**
   - Charging a purchase to a credit card records the expense immediately
   - The card balance increases immediately
   - Do not wait for payment to record the charge

2. **Expense payment method determines balance effect**
   - **Credit Card**: Card balance increases (adds debt)
   - **Debit Card**: Account balance decreases (money leaves account immediately)
   - **Bank Transfer**: Account balance decreases (money leaves account)
   - **E-Wallet**: E-Wallet account balance decreases
   - **Cash**: Optional cash account decreases, or no balance tracking

3. **An expense must specify the payment method**
   - Required field in the expense form
   - Different payment methods show different account dropdowns:
     - Debit Card → shows accounts with `hasDebitCard: true`
     - Bank Transfer → shows Traditional/Digital Bank accounts
     - E-Wallet → shows E-Wallet accounts
     - Cash → optional Cash account
     - Credit Card → shows Credit Card list

### Credit Card Payments

1. **A credit card payment is NOT an expense**
   - It does NOT count toward monthly expense totals
   - It is tracked separately from income/expenses
   - It reduces credit card debt and the source account balance

2. **A credit card payment has two effects**
   - Effect 1: Reduce the credit card balance (pay off debt)
   - Effect 2: Reduce the payment source account balance
   - These happen together atomically

3. **A credit card payment requires a source account (usually)**
   - Payment Source Type options:
     - **Account**: Payment comes from a specific account (Debit Card, Bank Transfer, E-Wallet)
     - **Cash**: Payment from cash (account optional or Cash account)
     - **Other**: Payment from outside system (ignore account deduction)

4. **You cannot pay a card from itself**
   - A credit card payment cannot use the same card as the source
   - The source must be an account or cash

### Savings Transfers

1. **A savings transfer moves money between accounts**
   - Source account balance decreases
   - Destination account balance increases
   - Amounts must be equal
   - Cannot transfer to the same account (validation error)

2. **A savings transfer is NOT an expense or income**
   - It does NOT count toward monthly stats
   - It is purely a reallocation of existing money
   - Both accounts are adjusted by the same amount

3. **Linked goal on a transfer is metadata only**
   - Optional: A transfer can be tagged with a goal
   - Useful for: filtering transfers by goal, tracking history
   - NOT used for: calculating goal progress
   - Removing the goal link does NOT affect the transfer
   - Multiple transfers can be linked to the same goal

### Income

1. **Income increases account balance**
   - Income is always added to a specific account
   - Account balance increases by the income amount

2. **Income is independent of expenses**
   - Monthly stats show income and expenses separately
   - Income can exceed expenses (surplus) or be less (deficit)
   - No automatic allocation to goals or accounts

### Account Types

1. **Traditional Bank**
   - Full-featured account for bank savings
   - Can have debit card (optional)
   - Supports: Debit Card, Bank Transfer, Cash

2. **Digital Bank**
   - Online-only bank account
   - Can have debit card (optional)
   - Supports: Debit Card, Bank Transfer, E-Wallet

3. **E-Wallet**
   - Mobile payment/digital wallet (GCash, PayMaya, etc.)
   - Can have debit card (optional, some e-wallets issue cards)
   - Supports: E-Wallet, sometimes Debit Card

4. **MP2 (Mutual Provident Fund)**
   - Long-term investment account
   - Cannot typically spend from directly
   - Supports: Bank Transfer (manual withdrawals)

5. **Cash**
   - Physical cash tracking (optional)
   - No debit card option
   - Transactions: direct cash payments

### Credit Card Rules

1. **Credit card balance represents debt**
   - Positive balance = money you owe
   - Negative balance = credit surplus (overpayment)
   - Zero balance = fully paid off

2. **Over-limit warning**
   - If balance > credit limit, show warning/alert
   - Allow transactions to exceed limit (credit card companies may allow)
   - No automatic blocking

3. **Over-payment is allowed**
   - Pay more than you owe → negative balance (credit)
   - Use credit for future purchases (reduces outstanding balance)
   - Useful for: managing cash flow, paying off early

4. **Multiple credit cards**
   - Track each separately
   - Dashboard shows total debt across all cards
   - Payments are allocated to specific cards

## Edge Cases & Handling

### Deleting Accounts

**Situation**: User deletes an account that has linked goals

**Current Behavior**:
- Account is deleted
- Linked goals remain (but progress calculation may be affected)
- Transactions with this account are NOT deleted

**What Should Happen**:
- Show warning: "This account has X linked goals. Deleting will stop goal progress tracking."
- On confirmation, delete account but keep goals (with stale linkedAccountId)
- Note: Goals become non-functional until re-linked to another account

### Deleting Goals

**Situation**: User deletes a goal

**Current Behavior**:
- Goal is deleted
- Linked account remains unchanged
- Savings transfers linked to this goal keep the linkage (metadata preserved)

**What Should Happen**:
- Warn if goal is active/in-progress
- On confirmation, delete goal
- Don't affect account or transfers

### Editing Transactions

**Situation**: User changes a transaction's amount, account, or card

**Handling**:
1. Store old transaction state
2. Reverse effects of old transaction
3. Apply effects of new transaction
4. Save updated transaction
5. Reload balances to UI

**Example**:
```
Original: Expense $100 via Debit Card from GCash
  GCash balance: $5,000 → $4,900

Edit to: Expense $150 via Debit Card from GCash
  Step 1: Reverse -$100 → GCash becomes $5,000
  Step 2: Apply -$150 → GCash becomes $4,850
```

### Deleting Transactions

**Situation**: User deletes an expense, payment, or transfer

**Handling**:
1. Load the transaction
2. Call `reverseTransactionEffects()`
3. Delete the transaction
4. Balances revert to previous state

**Example**: Delete an expense that was charged to a credit card
```
Before: CC balance $5,000
Delete charge of $500
After: CC balance $4,500
```

### Transfer to Same Account

**Situation**: User tries to create a savings transfer from Account A to Account A

**Handling**: Form validation prevents this
- Message: "Source and destination accounts must be different"
- Submit button disabled until corrected

### Negative Account Balances

**Situation**: Account balance goes negative

**Current Behavior**:
- Allow negative balances (no automatic blocking)
- Show balance in red (visual warning)
- Account is "overdrafted"

**Future**: Consider overdraft fees or warning threshold

### Credit Card Over-Limit

**Situation**: Credit card balance exceeds credit limit

**Current Behavior**:
- Allow over-limit balances
- Dashboard shows "needs attention" warning if over-limit or has balance
- Visual indicator on credit card list

**Future**: Configurable hard limit enforcement

### Month Without Transactions

**Situation**: User selects a month with no transactions

**Handling**:
- Dashboard shows zero income, zero expenses
- Stats cards show "₱0"
- "Recent Transactions" shows empty state
- Navigation still works

### Circular References

**Situation**: Goal linked to account, account linked back to goal (if enabled)

**Handling**: 
- Prevent circular links in form validation
- linkedGoalId on Account is just metadata (can be cleaned up)
- Does not affect balance calculations

## Financial Calculations

### Monthly Statistics

```
Total Income = sum of all income transactions in the month
Total Expenses = sum of all expense transactions in the month
  (NOT including credit card payments)

In Accounts = sum of all account.currentBalance
Goals Saved = sum of all (goal.linkedAccount.currentBalance) for each goal
  (may have overlaps if multiple goals use same account)

Remaining Budget = Total Income - Total Expenses
```

### Goal Progress

```
Goal Progress % = (linked_account.currentBalance / goal.targetAmount) * 100

Example:
- Goal: Save ₱100,000 for House Down Payment
- Linked Account: "Savings Account" with ₱25,000
- Progress: 25%
```

### Credit Card Utilization

```
Credit Utilization % = (creditCard.currentBalance / creditCard.creditLimit) * 100

Example:
- Card: "BPI Credit Card" with ₱5,000 limit, ₱3,000 balance
- Utilization: 60%
```

## Data Consistency

### localStorage as Source of Truth

- localStorage is the ONLY persistent data store
- All reads must go through storage helpers (getSavingsAccounts, getTransactions, etc.)
- All writes must go through storage helpers (saveTransaction, updateSavingsAccount, etc.)
- No in-component JSON parsing/serialization (use storage helpers)

### Preventing Duplicates

- When loading data, deduplicate by ID
- When updating, use ID lookup not array push
- saveSavingsAccount uses upsert (update if exists, create if not)

### Atomicity

- All transaction effects are atomic
- Either all effects succeed, or the transaction is not saved
- No partial states (e.g., credit card charged but account not debited)

## Validation Rules

### When Adding a Transaction

**All Types**:
- Amount must be > 0
- Date must be valid
- Description required
- Category required

**Expense**:
- Type and category required
- Payment method required
- If payment method is Credit Card: linkedCreditCardId required
- If payment method is Account-based: linkedAccountId required

**Credit Card Payment**:
- linkedCreditCardId required
- Amount required
- Payment Source Type required
- If source is Account/Cash: linkedAccountId required

**Savings Transfer**:
- Source account required
- Destination account required
- Source ≠ Destination (validation error)
- linkedGoalId optional

**Income**:
- Account required
- Amount required
- Category required

### When Creating Goals

- Name required
- Goal type required
- Target amount required
- Linked account required (must select from dropdown)
- If no accounts exist: show error, prevent form submission

### When Creating Accounts

- Name required
- Account type required
- Initial balance required (can be 0)
- hasDebitCard optional (only for certain account types)

### When Creating Credit Cards

- Name required
- Issuer required
- Credit limit required (must be > 0)
- Last 4 digits optional
- Starting balance can be 0

## Backward Compatibility

When old transactions (from before the refactor) are loaded:

- Old format uses `linkedAccountId` for both account and card references
- New format uses separate `linkedCreditCardId` field
- **On load**: Effects functions check for field existence
- **On edit**: New effects use correct fields
- **On delete**: Old effects reversal works with old data
- **No migration needed**: Old data loads fine, effects are conditional

Example:
```typescript
if (transaction.linkedCreditCardId) {
  // New format: use linkedCreditCardId
} else if (transaction.linkedAccountId && isCreditCard(transaction.linkedAccountId)) {
  // Old format: infer credit card from ID
} else if (transaction.linkedAccountId) {
  // Account-based transaction
}
```

## Testing Scenarios

To verify the system works correctly:

1. Add expense via credit card → card balance increases
2. Add expense via e-wallet → e-wallet balance decreases
3. Pay credit card from savings → card balance decreases, savings decreases
4. Transfer between accounts → both accounts update correctly
5. Edit transaction → effects reversed and reapplied correctly
6. Delete transaction → balances revert to before transaction
7. Create goal → progress shows linked account balance
8. Edit goal's target → progress percentage updates

See [transactions.md](transactions.md) for detailed flow diagrams.
