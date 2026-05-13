# Dashboard

## Overview

The Dashboard is the main landing page of the app. It provides a monthly financial summary with insights into income, expenses, savings, and credit card status.

**URL**: `/` (home)  
**Component**: `components/Dashboard.tsx`  
**Page**: `app/(routes)/page.tsx`

## Dashboard Sections

### 1. Header

```
Dashboard
[Month Selector] [+ Add Transaction]
```

**Components**:
- **Title**: "Dashboard"
- **Month Selector**: `<input type="month" value="2026-05" />`
  - Allows browsing different months
  - Format: YYYY-MM
  - Default: Current month
- **Add Transaction Button**: Opens TransactionForm
  - Quick access to add new transaction
  - Form auto-closes after submission

### 2. Summary Cards

Five stat cards showing key metrics:

```
┌─────────────────────────────────────────────────────────┐
│ Total Income │ Total Expenses │ In Accounts │ Goals Saved │ Remaining Budget │
│   ₱22,500    │     ₱1,500     │  ₱100,000   │  ₱50,000   │    ₱21,000      │
│    (Green)   │     (Red)      │  (Blue)     │ (Purple)   │   (Indigo)      │
└─────────────────────────────────────────────────────────┘
```

#### Card Details

**Total Income**
- Sum of all 'income' transactions in selected month
- Color: Green (#10b981)
- Icon: 💰
- Example: ₱22,500 (monthly salary)

**Total Expenses**
- Sum of all 'expense' transactions in selected month
- Does NOT include credit card payments or transfers
- Color: Red (#ef4444)
- Icon: 💸
- Example: ₱1,500 (groceries, bills, etc.)

**In Accounts**
- Sum of all account.currentBalance across all accounts
- Shows total liquid assets
- Color: Blue (#3b82f6)
- Icon: 🏦
- Example: ₱100,000 (all accounts combined)

**Goals Saved**
- Sum of all goal.linkedAccount.currentBalance for each unique account
- May have overlaps (multiple goals per account)
- Color: Purple (#a855f7)
- Icon: 🎯
- Example: ₱50,000 (linked account balances)

**Remaining Budget**
- Total Income - Total Expenses
- Positive = surplus, Negative = deficit
- Shows `Math.max(remaining, 0)` (no negatives displayed)
- Color: Indigo (#6366f1)
- Icon: 📊
- Example: ₱21,000 (surplus this month)

### 3. Credit Cards Overview (Conditional)

**Shows only if user has created credit cards**

```
┌─────────────────────────────────────────────────────────┐
│ Credit Cards Overview                        [View All →] │
├─────────────────────────────────────────────────────────┤
│ Total Limit          │ Total Balance         │ Status    │
│ ₱100,000            │ ₱18,000 Outstanding   │ 2 cards   │
│ (Blue box)          │ (Red box)              │ need pay  │
└─────────────────────────────────────────────────────────┘
```

**Components**:
- **Total Limit**: Sum of all creditCard.creditLimit
  - Shows total available credit
  - Color: Blue
  
- **Total Balance**: Sum of all creditCard.currentBalance
  - Shows total debt
  - Green if negative (credit/overpayment)
  - Red if positive (debt)
  - Shows status: "Outstanding", "Surplus", or "Paid off"

- **Status**: Count of cards with balance > 0
  - Green if all paid off: "All good"
  - Orange if some have balance: "X cards need attention"
  - Links to Credit Cards page: [View All →]

### 4. Goals Section

Shows all goals with progress bars grouped by priority.

```
Goals
[Cards] [List]  (Toggle view)
────────────────────────────────
3 goals • ₱50,000 saved

Priority 1 / High
┌─────────────────┐ ┌─────────────────┐
│ Emergency Fund  │ │ PC Fund         │
│ ████████░░ 80%  │ │ ██░░░░░░░░ 20%  │
│ ₱80,000 / 100k  │ │ ₱12,000 / 60k   │
│ [Edit] [Delete] │ │ [Edit] [Delete] │
└─────────────────┘ └─────────────────┘

Priority 2 / Medium
(empty)

Priority 3 / Low
┌─────────────────┐
│ Vacation Fund   │
│ ███░░░░░░░░ 30% │
│ ₱6,000 / 20k    │
│ [Edit] [Delete] │
└─────────────────┘
```

**Features**:
- Toggle between card and list views
- View preference saved to localStorage
- Group by priority (High, Medium, Low)
- Progress bar filled proportionally
- Show percentage and amounts
- Edit and Delete buttons on each goal
- Empty state if no goals: "No goals yet" with [+ Add Goal]

### 5. Recent Transactions

List of transactions for the selected month, sorted newest first.

```
Recent Transactions
──────────────────────────────────────────────────
Date      │ Description          │ Category │ Amt │ Links │ Actions
──────────────────────────────────────────────────
May 14    │ Groceries            │ Food     │ 500 │ Card  │ [Edit] [Delete]
May 14    │ Salary               │ Salary   │22.5k│ Account│ [Edit] [Delete]
May 13    │ Gas                  │ Transport│ 200 │ Wallet│ [Edit] [Delete]
May 12    │ Electric Bill        │ Bills    │ 800 │ Bank  │ [Edit] [Delete]
May 11    │ BPI Card Payment     │ Payment  │ 2k  │ Card→Account│ [Edit] [Delete]
──────────────────────────────────────────────────
```

**Columns**:
- **Date**: Transaction date
- **Description**: User-entered description
- **Category**: Transaction category
- **Amount**: Transaction amount in ₱
- **Links**: Shows what account/card is affected
  - Account name (blue tag)
  - Card name (orange/red tag)
  - Goal name if tagged (purple tag)
- **Actions**: Edit, Delete buttons

## Data Flow

### On Mount

```javascript
useEffect(() => {
  setMounted(true)
  const stored = getTransactions()
  setTransactions(stored)
  setGoals(getGoals())
  setAccounts(getSavingsAccounts())
  setCreditCards(getCreditCards())
}, [])
```

Loads all data from localStorage.

### When Month Changes

```javascript
const handleMonthChange = (newMonth) => {
  setSelectedMonth(newMonth)
  // Component re-renders, stats recalculate
  // getTransactionsForMonth() called with new month
}
```

Stats automatically filter by selected month.

### When Transaction Added

```javascript
const handleAddTransaction = (transaction) => {
  applyTransactionEffects(transaction) // Update balances
  saveTransaction(transaction) // Save to storage
  setTransactions([...prev, transaction]) // Update state
  setShowForm(false)
  setAccounts(getSavingsAccounts()) // Reload balances
  setCreditCards(getCreditCards())
}
```

1. Effects applied (balances updated)
2. Transaction saved
3. State updated
4. Accounts/cards reloaded from storage
5. UI refreshes with new balances

### When Transaction Edited

```javascript
const handleEditTransaction = (transaction) => {
  editTransactionEffects(oldTransaction, transaction) // Reverse old, apply new
  updateTransaction(transaction.id, transaction) // Save
  setTransactions([...]) // Update state
  setAccounts(getSavingsAccounts()) // Reload balances
  setCreditCards(getCreditCards())
}
```

### When Transaction Deleted

```javascript
const handleDeleteTransaction = (id) => {
  const transaction = transactions.find(t => t.id === id)
  reverseTransactionEffects(transaction) // Undo effects
  deleteTransaction(id) // Remove from storage
  setTransactions([...]) // Update state
  setAccounts(getSavingsAccounts()) // Reload balances
  setCreditCards(getCreditCards())
}
```

## Calculations

### Monthly Statistics

```typescript
interface MonthlyStats {
  totalIncome: number // sum of income transactions
  totalExpenses: number // sum of expense transactions
  remainingBudget: number // income - expenses
}

const calculateMonthlyStats = (transactions: Transaction[]) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  return {
    totalIncome: income,
    totalExpenses: expenses,
    remainingBudget: income - expenses
  }
}
```

### Accounts Total

```typescript
const accountBalances = Object.fromEntries(
  accounts.map(a => [a.id, a.currentBalance])
)

const totalInAccounts = accounts.reduce(
  (sum, acc) => sum + acc.currentBalance,
  0
)
```

### Goals Saved

```typescript
const totalGoalsSaved = goals.reduce(
  (sum, g) => sum + (accountBalances[g.linkedAccountId] || 0),
  0
)
```

Note: This may have overlaps if multiple goals use same account.

### Credit Card Totals

```typescript
const totalCreditLimit = creditCards.reduce(
  (sum, card) => sum + card.creditLimit,
  0
)

const totalCreditCardBalance = creditCards.reduce(
  (sum, card) => sum + card.currentBalance,
  0
)

const cardsWithIssues = creditCards.filter(
  card => card.currentBalance > card.creditLimit || card.currentBalance > 0
).length
```

## UI Components Used

- **Dashboard.tsx**: Main component
- **StatCard.tsx**: Individual stat cards
- **TransactionForm.tsx**: Add/edit transaction modal
- **TransactionList.tsx**: Transaction table
- **GoalsSection.tsx**: Goals display with views
- **GoalCard.tsx**: Individual goal card
- **GoalListItem.tsx**: Table row for goal

## Features in Detail

### Month Navigation

```
Current: May 2026
← May 2026 →

Click ← : April 2026
Click → : June 2026
Select from picker: Jump to any month

Stats update automatically
```

### Transaction Editing

From dashboard:
1. Click "Edit" on any transaction
2. Form opens with transaction data
3. Modify fields
4. Click "Update Transaction"
5. Effects reversed and reapplied
6. Dashboard refreshes

### Transaction Deletion

From dashboard:
1. Click "Delete" on any transaction
2. Confirm in dialog
3. Effects reversed
4. Transaction removed
5. Dashboard refreshes

### View Switching

For Goals section:
- **Cards**: Grid layout, one per card
- **List**: Table layout, compact rows
- Toggle buttons at top of Goals section
- Preference saved to localStorage (`goals_view_mode`)

## Empty States

### No Transactions

```
Recent Transactions
──────────────────────────────
(No transactions for this month)
```

Stats still show (all zeros).

### No Goals

```
Goals
──────────────────────────────
No goals yet
Create your first goal like PC Fund, Emergency Fund, Running Shoes, or Steam Deck.
[+ Add Goal]
```

### No Credit Cards

Credit card section not shown if no cards created.

## Responsive Design

- **Desktop** (1024px+): Multi-column layout, all sections visible
- **Tablet** (768px-1023px): 2-3 column stat cards, responsive goals
- **Mobile** (< 768px): Single column, card-based layout

## Performance

**Typical render**:
- ~50 transactions: <100ms
- ~1000 transactions: <500ms
- ~10,000 transactions: <2-3s (might need optimization)

**Optimizations**:
- Use useMemo for expensive calculations
- Lazy load transaction list (show first 20)
- Index by month for faster filtering
- Future: Pagination, virtual scrolling

## Troubleshooting

### Stats don't match expectations

1. Check selected month (top left)
2. Verify transactions are in selected month
3. Refresh page (Ctrl+R)
4. Check browser console for errors

### Balances not updating

1. Add transaction
2. If balance doesn't change:
   - Try refreshing page
   - Check localStorage (DevTools)
   - Transaction might have failed to save

### Missing transactions

1. Check date range (correct month)
2. Verify transaction was saved
3. Look in all months (try adjacent months)
4. Check DevTools localStorage tab

## Future Enhancements

- [ ] Charts and visualization
- [ ] Budget vs actual comparison
- [ ] Spending trends
- [ ] Savings rate calculation
- [ ] Net worth tracking
- [ ] Budget alerts
- [ ] Custom date ranges (not just months)
- [ ] Forecast based on trends
