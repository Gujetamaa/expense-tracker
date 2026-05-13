# Architecture

## System Overview

The Expenses Tracker is a single-page financial management application with a client-side architecture. There is no backend server—all data is stored and processed locally in the browser using localStorage.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Components & Pages                 │   │
│  │  (Dashboard, Goals, Accounts, Transactions, etc) │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │      State Management (React Hooks)              │   │
│  │  useState, useEffect, Custom Hooks               │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │    Business Logic & Effects                      │   │
│  │  (transactionEffects, goalHelpers, etc)          │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │    Storage Helpers (localStorage API)            │   │
│  │  (getTransactions, saveAccount, etc)             │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │         localStorage (5-10MB quota)              │   │
│  │  (JSON serialized data structures)               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Core Data Model

### Entities

#### SavingsAccount
Represents a place where money is stored (checking account, e-wallet, etc).

```typescript
interface SavingsAccount {
  id: string
  name: string
  accountType: 'Traditional Bank' | 'Digital Bank' | 'E-Wallet' | 'MP2' | 'Cash'
  currentBalance: number
  initialBalance: number
  linkedGoalId?: string // Optional: goals page shows this account's goals (metadata only)
  hasDebitCard?: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Key Rules:**
- Current balance is updated by transaction effects
- Initial balance is a snapshot of when the account was created
- `hasDebitCard` indicates if expenses can be paid via Debit Card from this account
- Multiple goals can reference the same account

#### Goal
Represents a financial target (e.g., Emergency Fund, New Laptop).

```typescript
interface Goal {
  id: string
  name: string
  goalType: 'Savings' | 'Investment' | 'Debt Payoff' | 'Purchase' | 'Other'
  targetAmount: number
  targetDate?: string
  linkedAccountId: string // Required: which account tracks this goal's progress
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

**Key Rules:**
- Every goal must have a `linkedAccountId` (required, not optional)
- Goal progress is **always** derived from `linkedAccount.currentBalance`, never stored separately
- Goal does **not** have a `currentSaved` field
- A single account can be linked to multiple goals
- Deleting an account should warn about linked goals

#### Transaction
Represents any movement of money.

```typescript
interface Transaction {
  id: string
  date: string
  type: 'expense' | 'income' | 'credit_card_payment' | 'savings_transfer'
  category: string
  description: string
  amount: number
  paymentMethod?: string // For expenses: 'Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'Cash'
  linkedCreditCardId?: string // For CC expenses or CC payments
  linkedAccountId?: string // For account-based expenses, CC payment source, or transfer source
  sourceAccountId?: string // For savings transfers
  destinationAccountId?: string // For savings transfers
  linkedGoalId?: string // For savings transfers: which goal is this funding? (metadata only)
  paymentSourceType?: 'Account' | 'Cash' | 'Other' // For CC payments
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

**Key Rules:**
- Type determines which balance changes occur
- For expenses: payment method determines which balance is affected
- For transfers: must have both source and destination accounts (different)
- `linkedGoalId` on transfers is metadata for filtering/history, NOT for calculation

#### CreditCard
Represents a credit card or line of credit.

```typescript
interface CreditCard {
  id: string
  name: string
  issuer: string
  lastFourDigits: string
  creditLimit: number
  currentBalance: number // Debt: positive = owing, negative = credit surplus
  interestRate?: number
  dueDate?: string
  createdAt: Date
  updatedAt: Date
}
```

**Key Rules:**
- `currentBalance` represents debt (positive) or credit (negative)
- A charged expense increases the balance (adds debt)
- A payment decreases the balance (reduces debt)
- Balance can be negative (represents overpayment/credit surplus)

### Entity Relationships

```
Accounts ──many──┐
                  │
              Goals ──one──→ Account
                  
Transactions:
  ├─ expense via CC ────→ CreditCard
  ├─ expense via Account ──→ Account
  ├─ income ──→ Account
  ├─ CC payment ──→ CreditCard + source Account
  ├─ savings transfer ──→ source Account + destination Account
  └─ (optional) linked to Goal (metadata only)

CreditCards ← standalone (not linked to accounts directly)
```

## Balance Update Flow

### Transaction Lifecycle

When a transaction is **added**:
1. User submits form with transaction data
2. `applyTransactionEffects(transaction)` is called
3. Depending on type, balance mutations are applied:
   - `applyAccountDebit()`, `applyAccountCredit()`
   - `applyCardCharge()`, `applyCardPayment()`
4. Updated accounts/cards are saved to localStorage
5. React state is refreshed to re-render UI

When a transaction is **edited**:
1. Old transaction effects are reversed
2. New transaction effects are applied
3. Balances reflect the change

When a transaction is **deleted**:
1. Effects are reversed
2. Balances are restored to previous state

### Effect Functions

Located in `lib/accountEffects.ts`, `lib/creditCardEffects.ts`, and `lib/transactionEffects.ts`:

```typescript
// Account effects
applyAccountDebit(accountId, amount) // balance -= amount
reverseAccountDebit(accountId, amount) // balance += amount
applyAccountCredit(accountId, amount) // balance += amount
reverseAccountCredit(accountId, amount) // balance -= amount

// Credit card effects
applyCardCharge(cardId, amount) // balance += amount (debt increases)
reverseCardCharge(cardId, amount) // balance -= amount
applyCardPayment(cardId, amount) // balance -= amount (debt decreases)
reverseCardPayment(cardId, amount) // balance += amount

// Unified transaction effects
applyTransactionEffects(transaction) // Apply all relevant effects for this transaction type
reverseTransactionEffects(transaction) // Reverse all effects (for delete/edit)
editTransactionEffects(oldTx, newTx) // reverse old, apply new
```

## State Management Pattern

Components use React Hooks to manage state:

```typescript
// Example: Dashboard.tsx
const [transactions, setTransactions] = useState<Transaction[]>([])
const [accounts, setAccounts] = useState<SavingsAccount[]>([])
const [creditCards, setCreditCards] = useState<CreditCard[]>([])

// On mount: load from localStorage
useEffect(() => {
  setTransactions(getTransactions())
  setAccounts(getSavingsAccounts())
  setCreditCards(getCreditCards())
}, [])

// When adding transaction: apply effects, save, and reload state
const handleAddTransaction = (transaction) => {
  applyTransactionEffects(transaction)
  saveTransaction(transaction)
  setTransactions([...prev, transaction]) // Update local state
  setAccounts(getSavingsAccounts()) // Reload accounts (balances changed)
  setCreditCards(getCreditCards()) // Reload cards (balances changed)
}
```

**Key Pattern:**
- UI always reads from local state
- State is initialized from localStorage
- When data changes, effects are applied first, then state is refreshed from localStorage
- This ensures UI reflects current localStorage state

## Page Structure

### Dashboard (`/`)
- Shows monthly overview
- Summary stats (income, expenses, account balances)
- Recent transactions for selected month
- Credit card overview
- Goals progress

### Accounts (`/savings-accounts`)
- List all accounts with current balances
- Add, edit, delete accounts
- Shows linked goals for each account
- Account type badges (Traditional Bank, E-Wallet, etc.)

### Goals (`/goals`)
- List all goals with progress
- Progress derived from linked account balance
- Add, edit, delete goals
- Goal type and target date display
- Must select an account when creating goal

### Transactions (`/transactions`)
- List all transactions (paginated/filtered by month)
- Add, edit, delete transactions
- Transaction type selector with dynamic form fields
- Payment method selector (for expenses)
- Dynamic dropdowns based on transaction type

### Credit Cards (`/credit-cards`)
- List all credit cards with balances
- Add, edit, delete cards
- Shows credit utilization (balance / limit)
- Status indicators (good, caution, over-limit)

### Settings (`/settings`)
- Application preferences
- Data export/import (future)
- Reset data option

### Salary Calculator (`/salary-calculator`)
- Calculate net salary from gross
- Configurable deductions
- Visual breakdown of taxes and contributions

## Type System

All TypeScript types are in `types/index.ts`:

```typescript
// Main entity types
export type Transaction
export type Goal
export type SavingsAccount
export type CreditCard

// Union types for type-safe dispatch
export type TransactionType = 'expense' | 'income' | 'credit_card_payment' | 'savings_transfer'
export type AccountType = 'Traditional Bank' | 'Digital Bank' | 'E-Wallet' | 'MP2' | 'Cash'
export type GoalType = 'Savings' | 'Investment' | 'Debt Payoff' | 'Purchase' | 'Other'

// Category types
export type ExpenseCategory = 'Bills' | 'Food' | ...
export type IncomeCategory = 'Salary' | ...
export type CreditCardPaymentCategory = 'Statement Payment' | ...
```

## Storage Schema

See [localstorage-schema.md](localstorage-schema.md) for detailed localStorage key structure and data shapes.

## Error Handling

The app follows these error handling patterns:

- **Validation**: Form components validate input before submission
- **Type Safety**: TypeScript catches most errors at compile time
- **Graceful Degradation**: Components handle missing/null data
- **User Feedback**: Toast/modal dialogs for errors (future enhancement)
- **No Error Logging**: All data stays local, no external logging

## Performance Considerations

- **localStorage Operations**: O(n) reads, O(n) writes (linear scans)
- **Filtering**: Done in-memory after loading from localStorage
- **Re-renders**: Components re-render when state changes (React default)
- **Optimization**: Use useMemo, useCallback for expensive calculations
- **Batch Updates**: Multiple state changes can be batched in a single effect

For a typical user (1000s of transactions), performance should be fine. As data grows into 10,000+ transactions, consider:
- Pagination on transaction lists
- Indexed month lookups
- Caching monthly calculations

## Future Architecture Changes

See [future-roadmap.md](future-roadmap.md) for planned architectural improvements, including database backends and authentication.
