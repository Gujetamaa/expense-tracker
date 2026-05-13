# localStorage Schema

## Overview

All application data is stored in the browser's localStorage. This document defines the exact structure, keys, and relationships.

**Storage Location**: `window.localStorage`  
**Scope**: Per-origin (domain-specific)  
**Limit**: ~5-10MB per origin (browser-dependent)  
**Persistence**: Cleared when browser data is cleared

## Storage Keys

The app uses the following keys:

| Key | Type | Description |
|-----|------|---|
| `transactions` | JSON Array | All transactions (expenses, income, transfers, CC payments) |
| `savings_accounts` | JSON Array | All savings accounts |
| `goals` | JSON Array | All savings goals |
| `credit_cards` | JSON Array | All credit cards |
| `settings` | JSON Object | App settings and preferences |

## Data Structures

### transactions

```javascript
localStorage.getItem('transactions')
// Returns: JSON array of Transaction objects

[
  {
    "id": "tx-001",
    "date": "2026-05-14",
    "type": "expense",
    "category": "Food",
    "description": "Lunch",
    "amount": 500,
    "paymentMethod": "Credit Card",
    "linkedCreditCardId": "card-bpi-001",
    "linkedAccountId": null,
    "sourceAccountId": null,
    "destinationAccountId": null,
    "linkedGoalId": null,
    "paymentSourceType": null,
    "notes": "Burger King",
    "createdAt": "2026-05-14T10:30:00.000Z",
    "updatedAt": "2026-05-14T10:30:00.000Z"
  },
  {
    "id": "tx-002",
    "date": "2026-05-14",
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary",
    "amount": 22500,
    "paymentMethod": null,
    "linkedCreditCardId": null,
    "linkedAccountId": "account-savings-001",
    "sourceAccountId": null,
    "destinationAccountId": null,
    "linkedGoalId": null,
    "paymentSourceType": null,
    "notes": null,
    "createdAt": "2026-05-15T08:00:00.000Z",
    "updatedAt": "2026-05-15T08:00:00.000Z"
  },
  {
    "id": "tx-003",
    "date": "2026-05-16",
    "type": "credit_card_payment",
    "category": "Statement Payment",
    "description": "BPI card payment",
    "amount": 2000,
    "paymentMethod": null,
    "linkedCreditCardId": "card-bpi-001",
    "linkedAccountId": "account-savings-001",
    "sourceAccountId": null,
    "destinationAccountId": null,
    "linkedGoalId": null,
    "paymentSourceType": "Account",
    "notes": null,
    "createdAt": "2026-05-16T14:00:00.000Z",
    "updatedAt": "2026-05-16T14:00:00.000Z"
  },
  {
    "id": "tx-004",
    "date": "2026-05-17",
    "type": "savings_transfer",
    "category": null,
    "description": "Monthly emergency fund contribution",
    "amount": 5000,
    "paymentMethod": null,
    "linkedCreditCardId": null,
    "linkedAccountId": null,
    "sourceAccountId": "account-salary-001",
    "destinationAccountId": "account-emergency-001",
    "linkedGoalId": "goal-emergency-fund",
    "paymentSourceType": null,
    "notes": null,
    "createdAt": "2026-05-17T09:15:00.000Z",
    "updatedAt": "2026-05-17T09:15:00.000Z"
  }
]
```

**TypeScript Interface**:
```typescript
interface Transaction {
  id: string
  date: string // ISO format
  type: 'expense' | 'income' | 'credit_card_payment' | 'savings_transfer'
  category: string | null
  description: string
  amount: number
  paymentMethod?: string // For expenses: 'Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'Cash'
  linkedCreditCardId?: string // For expenses via CC, or CC payment target
  linkedAccountId?: string // For account-based transactions
  sourceAccountId?: string // For savings transfers
  destinationAccountId?: string // For savings transfers
  linkedGoalId?: string // Optional goal tag (savings transfers)
  paymentSourceType?: string // For CC payments: 'Account', 'Cash', 'Other'
  notes?: string
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}
```

### savings_accounts

```javascript
localStorage.getItem('savings_accounts')
// Returns: JSON array of SavingsAccount objects

[
  {
    "id": "account-savings-001",
    "name": "BPI Savings",
    "accountType": "Traditional Bank",
    "currentBalance": 45000,
    "initialBalance": 50000,
    "linkedGoalId": null,
    "hasDebitCard": true,
    "createdAt": "2026-01-15T08:00:00.000Z",
    "updatedAt": "2026-05-14T12:30:00.000Z"
  },
  {
    "id": "account-gcash-001",
    "name": "GCash Main",
    "accountType": "E-Wallet",
    "currentBalance": 8500,
    "initialBalance": 5000,
    "linkedGoalId": null,
    "hasDebitCard": false,
    "createdAt": "2026-02-10T10:00:00.000Z",
    "updatedAt": "2026-05-14T11:00:00.000Z"
  },
  {
    "id": "account-emergency-001",
    "name": "Emergency Fund",
    "accountType": "Digital Bank",
    "currentBalance": 35000,
    "initialBalance": 25000,
    "linkedGoalId": "goal-emergency-fund",
    "hasDebitCard": false,
    "createdAt": "2026-03-01T09:00:00.000Z",
    "updatedAt": "2026-05-14T09:15:00.000Z"
  }
]
```

**TypeScript Interface**:
```typescript
interface SavingsAccount {
  id: string
  name: string
  accountType: 'Traditional Bank' | 'Digital Bank' | 'E-Wallet' | 'MP2' | 'Cash'
  currentBalance: number
  initialBalance: number
  linkedGoalId?: string // Optional: goal associated with this account
  hasDebitCard?: boolean // Can use Debit Card for expenses
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}
```

### goals

```javascript
localStorage.getItem('goals')
// Returns: JSON array of Goal objects

[
  {
    "id": "goal-emergency-fund",
    "name": "Emergency Fund",
    "goalType": "Savings",
    "targetAmount": 100000,
    "targetDate": "2026-12-31",
    "linkedAccountId": "account-emergency-001",
    "notes": "6 months of expenses",
    "createdAt": "2026-03-01T09:00:00.000Z",
    "updatedAt": "2026-05-14T09:00:00.000Z"
  },
  {
    "id": "goal-pc-fund",
    "name": "Gaming PC",
    "goalType": "Purchase",
    "targetAmount": 60000,
    "targetDate": "2026-10-31",
    "linkedAccountId": "account-savings-001",
    "notes": "High-end gaming setup",
    "createdAt": "2026-02-15T14:00:00.000Z",
    "updatedAt": "2026-05-12T10:30:00.000Z"
  }
]
```

**TypeScript Interface**:
```typescript
interface Goal {
  id: string
  name: string
  goalType: 'Savings' | 'Investment' | 'Debt Payoff' | 'Purchase' | 'Other'
  targetAmount: number
  targetDate?: string // ISO date format
  linkedAccountId: string // REQUIRED: which account tracks this goal
  notes?: string
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}
```

**Important**: Goals do NOT have `currentSaved` field. Progress is calculated from `linkedAccountId.currentBalance`.

### credit_cards

```javascript
localStorage.getItem('credit_cards')
// Returns: JSON array of CreditCard objects

[
  {
    "id": "card-bpi-001",
    "name": "BPI Visa Gold",
    "issuer": "Bank of the Philippine Islands",
    "lastFourDigits": "1234",
    "creditLimit": 50000,
    "currentBalance": 3500,
    "interestRate": 24,
    "dueDate": "2026-06-15",
    "createdAt": "2026-01-20T08:00:00.000Z",
    "updatedAt": "2026-05-14T14:30:00.000Z"
  },
  {
    "id": "card-mastercard-001",
    "name": "Mastercard",
    "issuer": "RCBC",
    "lastFourDigits": "5678",
    "creditLimit": 30000,
    "currentBalance": -500,
    "interestRate": null,
    "dueDate": "2026-05-20",
    "createdAt": "2026-02-10T10:00:00.000Z",
    "updatedAt": "2026-05-14T12:00:00.000Z"
  }
]
```

**TypeScript Interface**:
```typescript
interface CreditCard {
  id: string
  name: string
  issuer: string
  lastFourDigits: string
  creditLimit: number
  currentBalance: number // Can be negative (credit/overpayment)
  interestRate?: number // APR percentage (optional, informational)
  dueDate?: string // ISO date format (optional)
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}
```

### settings

```javascript
localStorage.getItem('settings')
// Returns: JSON object

{
  "currency": "PHP",
  "theme": "light",
  "goals_view_mode": "card", // 'card' or 'list'
  "language": "en",
  "dateFormat": "YYYY-MM-DD",
  "appVersion": "1.0.0"
}
```

**TypeScript Interface**:
```typescript
interface Settings {
  currency?: string
  theme?: 'light' | 'dark'
  goals_view_mode?: 'card' | 'list'
  language?: string
  dateFormat?: string
  appVersion?: string
}
```

## Relationships

### Account → Goals (One-to-Many)

```
SavingsAccount
├─ Goal 1 (linkedAccountId = account.id)
├─ Goal 2 (linkedAccountId = account.id)
└─ Goal 3 (linkedAccountId = account.id)
```

Example:
```javascript
// Find all goals linked to an account
const accountId = 'account-savings-001'
const goals = JSON.parse(localStorage.getItem('goals') || '[]')
const linkedGoals = goals.filter(g => g.linkedAccountId === accountId)
```

### Account → Transactions (One-to-Many)

```
SavingsAccount (account-savings-001)
├─ Transaction (linkedAccountId = account.id)
├─ Transaction (sourceAccountId = account.id)
├─ Transaction (destinationAccountId = account.id)
└─ Transaction (linkedAccountId = account.id)
```

### CreditCard → Transactions (One-to-Many)

```
CreditCard (card-bpi-001)
├─ Transaction (linkedCreditCardId = card.id) [expense]
├─ Transaction (linkedCreditCardId = card.id) [payment]
└─ Transaction (linkedCreditCardId = card.id) [expense]
```

### Goal → Transactions (One-to-Many, Metadata)

```
Goal (goal-emergency-fund)
├─ Transaction (linkedGoalId = goal.id) [savings_transfer tagged]
└─ Transaction (linkedGoalId = goal.id) [savings_transfer tagged]

Note: Goal progress does NOT come from these transactions.
It comes from: linkedAccount.currentBalance
```

### Transaction Relationships Summary

```
Transaction
├─ For 'expense':
│  ├─ linkedCreditCardId → CreditCard (if payment via CC)
│  └─ linkedAccountId → SavingsAccount (if payment via account)
│
├─ For 'income':
│  └─ linkedAccountId → SavingsAccount (deposit to)
│
├─ For 'credit_card_payment':
│  ├─ linkedCreditCardId → CreditCard (which card to pay)
│  └─ linkedAccountId → SavingsAccount (if source is account)
│
└─ For 'savings_transfer':
   ├─ sourceAccountId → SavingsAccount (from)
   ├─ destinationAccountId → SavingsAccount (to)
   └─ linkedGoalId → Goal (optional metadata)
```

## Data Access Patterns

### Reading Data

```typescript
// Get all transactions
const transactions = JSON.parse(localStorage.getItem('transactions') || '[]')

// Get all accounts
const accounts = JSON.parse(localStorage.getItem('savings_accounts') || '[]')

// Get all goals
const goals = JSON.parse(localStorage.getItem('goals') || '[]')

// Find specific goal
const goal = goals.find(g => g.id === 'goal-emergency-fund')

// Get linked account for goal
const linkedAccount = accounts.find(a => a.id === goal.linkedAccountId)

// Get goal's progress
const progress = linkedAccount.currentBalance / goal.targetAmount
```

### Writing Data

```typescript
// Save all accounts (replace)
localStorage.setItem('savings_accounts', JSON.stringify(accounts))

// Add transaction
const transactions = JSON.parse(localStorage.getItem('transactions') || '[]')
transactions.push(newTransaction)
localStorage.setItem('transactions', JSON.stringify(transactions))

// Update account balance
const accounts = JSON.parse(localStorage.getItem('savings_accounts') || '[]')
const account = accounts.find(a => a.id === accountId)
account.currentBalance += amount
account.updatedAt = new Date().toISOString()
localStorage.setItem('savings_accounts', JSON.stringify(accounts))
```

## Storage Helpers

All storage operations are wrapped in helper functions in `lib/storage.ts`:

```typescript
export const getTransactions = (): Transaction[] => {
  // Load from localStorage, return array
}

export const saveTransaction = (transaction: Transaction): void => {
  // Add new transaction, save array
}

export const updateTransaction = (id: string, updates: Partial<Transaction>): void => {
  // Update existing transaction
}

export const deleteTransaction = (id: string): void => {
  // Remove transaction
}

export const getSavingsAccounts = (): SavingsAccount[] => {
  // Load accounts from localStorage
}

export const saveSavingsAccount = (account: SavingsAccount): void => {
  // Upsert account (update if exists, create if not)
}

export const updateSavingsAccount = (id: string, account: SavingsAccount): void => {
  // Update specific account
}

export const deleteSavingsAccount = (id: string): void => {
  // Remove account
}

export const getGoals = (): Goal[] => {
  // Load goals
}

export const addGoal = (goal: Goal): void => {
  // Add new goal
}

export const updateGoal = (id: string, goal: Goal): void => {
  // Update goal
}

export const deleteGoal = (id: string): void => {
  // Remove goal
}

export const getCreditCards = (): CreditCard[] => {
  // Load cards
}

export const saveCreditCard = (card: CreditCard): void => {
  // Upsert card
}

export const updateCreditCard = (id: string, card: CreditCard): void => {
  // Update card
}

export const deleteCreditCard = (id: string): void => {
  // Remove card
}

export const getSettings = (): Settings => {
  // Load settings
}

export const saveSettings = (settings: Settings): void => {
  // Save settings
}
```

**Always use these helpers instead of directly accessing localStorage.**

## Backup and Restore

### Manual Backup

```javascript
// Get all data
const backup = {
  transactions: localStorage.getItem('transactions'),
  savings_accounts: localStorage.getItem('savings_accounts'),
  goals: localStorage.getItem('goals'),
  credit_cards: localStorage.getItem('credit_cards'),
  settings: localStorage.getItem('settings'),
  backup_date: new Date().toISOString()
}

// Save to file (browser download)
const json = JSON.stringify(backup, null, 2)
const blob = new Blob([json], { type: 'application/json' })
const url = URL.createObjectURL(blob)
// trigger download...
```

### Manual Restore

```javascript
// Load from file (user selects file)
const backup = JSON.parse(fileContents)

// Restore to localStorage
Object.entries(backup).forEach(([key, value]) => {
  if (typeof value === 'string' && key !== 'backup_date') {
    localStorage.setItem(key, value)
  }
})

// Page refresh to see changes
location.reload()
```

## Data Consistency Rules

1. **IDs must be unique across entire dataset**
   - No duplicate IDs within a type
   - IDs are generally UUIDs or unique strings

2. **Foreign keys must exist**
   - linkedAccountId must reference existing account
   - linkedCreditCardId must reference existing card
   - linkedGoalId must reference existing goal (if present)

3. **Dates must be ISO format**
   - All dates stored as ISO 8601 strings
   - createdAt and updatedAt are timestamps

4. **No circular references**
   - Goal linkedAccountId cannot reference a goal
   - Transaction cannot reference transaction

5. **Balance integrity**
   - Account currentBalance = sum of all effects on that account
   - Card currentBalance = sum of all charges minus payments
   - Must be maintained by effects system

## Storage Optimization

### Data Size Estimates

```
Typical usage (1000 transactions):
  Transactions: ~300KB
  Accounts (10): ~2KB
  Goals (5): ~1KB
  Credit Cards (5): ~1KB
  Settings: <1KB
  Total: ~305KB

Heavy usage (10,000 transactions):
  Total: ~3MB

localStorage limit: 5-10MB
Safe for: 10,000+ transactions (depending on notes/descriptions)
```

### Cleanup Strategies

For future optimizations:
- Archive old transactions (2+ years)
- Compress old data
- Separate hot/cold data
- Implement database backend (Supabase)

## Backward Compatibility

### Old Transaction Format

Transactions before the refactor may have:
```javascript
{
  // Old format
  "linkedAccountId": "card-or-account-id", // ambiguous
  // Missing fields:
  // linkedCreditCardId, sourceAccountId, destinationAccountId, paymentSourceType
}
```

**Loading old data**:
- New code checks for field existence
- Effects system handles missing fields gracefully
- On edit/delete, transitions to new format

**No migration needed**: App handles both formats transparently.

## Exporting Data

**CSV Export** (planned):
- Export transactions as CSV
- Export accounts summary
- Export goals status
- Open in Excel/Sheets

**JSON Export** (available):
- Download all data as single JSON file
- Useful for backup
- Shareable format

## Querying Examples

### Get all expenses in May 2026

```typescript
const transactions = getTransactions()
const mayExpenses = transactions.filter(t => {
  const date = new Date(t.date)
  return t.type === 'expense' && date.getMonth() === 4 && date.getFullYear() === 2026
})
```

### Get total balance across all accounts

```typescript
const accounts = getSavingsAccounts()
const total = accounts.reduce((sum, a) => sum + a.currentBalance, 0)
```

### Get goal progress

```typescript
const goal = getGoals().find(g => g.id === goalId)
const account = getSavingsAccounts().find(a => a.id === goal.linkedAccountId)
const progress = (account.currentBalance / goal.targetAmount) * 100
```

### Get credit card utilization

```typescript
const card = getCreditCards().find(c => c.id === cardId)
const utilization = (card.currentBalance / card.creditLimit) * 100
```
