# Goals and Accounts

## Account System

### What is an Account?

An **Account** is a place where money is stored. Examples:
- BPI Savings Account
- GCash E-Wallet
- MP2 Investment Account
- Cash in Hand

### Account Types

| Type | Description | Debit Card | Use Case |
|------|---|---|---|
| **Traditional Bank** | Full-featured bank account | Optional | Primary savings, checking |
| **Digital Bank** | Online-only bank (ING, GXB) | Optional | Higher interest rates, low fees |
| **E-Wallet** | Mobile wallet (GCash, PayMaya) | Sometimes | Quick digital payments, transfers |
| **MP2** | Mutual Provident Fund | No | Long-term savings, dividends |
| **Cash** | Physical money | No | Emergency fund, pocket money |

### Account Fields

```typescript
interface SavingsAccount {
  id: string                    // Unique identifier
  name: string                  // Display name (e.g., "GCash Main")
  accountType: AccountType      // Type from above list
  currentBalance: number        // Balance right now (updated by transactions)
  initialBalance: number        // Balance when account was created
  linkedGoalId?: string         // Optional: goal to associate (metadata)
  hasDebitCard?: boolean        // Can this account use Debit Card payment?
  createdAt: Date              // When account was created
  updatedAt: Date              // Last modified
}
```

### Key Properties

#### Current Balance vs Initial Balance

```
Initial Balance: Set when account is created
  Example: "I have ₱5,000 in savings already"
  → initialBalance = 5000
  → currentBalance = 5000

After transactions:
  Add income of ₱1,000
  → currentBalance = 6000 (initialBalance still 5000)
  → Growth = currentBalance - initialBalance = ₱1,000
```

#### hasDebitCard Flag

```
Purpose: Indicate whether this account can be used for Debit Card payments

Example:
  Traditional Bank Account: "BPI Checking"
  hasDebitCard: true
  → Can pay expenses via Debit Card from this account

Example:
  E-Wallet: "GCash"
  hasDebitCard: false
  → Cannot use Debit Card payment method
  → Can only use E-Wallet payment method
```

### Account Lifecycle

#### Creating an Account

1. User goes to Savings Accounts page
2. Clicks "+ Add Account"
3. Fills in:
   - Name
   - Account Type
   - Initial Balance
   - hasDebitCard (if applicable)
4. Account created with `currentBalance = initialBalance`
5. Account appears in:
   - Account list
   - Payment method dropdowns (when creating transactions)
   - Goal linking when creating goals

#### Editing an Account

1. User clicks "Edit" on account
2. Can change:
   - Name
   - Account Type
   - hasDebitCard
3. Cannot change:
   - Initial Balance (historical)
   - Current Balance (updated by transactions only)

#### Deleting an Account

**⚠️ Warning**: If account has linked goals, show confirmation:
```
"This account has 2 linked goals. Deleting will prevent goal 
progress tracking. Continue?"
```

On deletion:
- Account is removed
- Linked goals remain (with stale linkedAccountId)
- Goals need to be re-linked to another account to function
- Transactions are NOT deleted

### Multiple Accounts Pattern

Many users have multiple accounts:

```
User's Financial Structure:
├─ BPI Traditional Bank
│  └─ Savings Account (₱50,000)
│  └─ Checking Account (₱5,000)
├─ GCash E-Wallet (₱2,000)
├─ PayMaya Digital Wallet (₱1,000)
└─ Cash Box (₱500)

Total Assets: ₱58,500
```

Dashboard shows:
- Total across all accounts
- Breakdown by account
- Individual account balances

### Account-Goal Relationship

**One Account can be linked to Multiple Goals**:

```
BPI Savings Account (₱50,000)
├─ Goal: Emergency Fund (₱50,000 target)
│  Progress: 50,000 / 50,000 = 100%
└─ Goal: House Down Payment (₱200,000 target)
   Progress: 50,000 / 200,000 = 25%

Both goals show the same account balance as their progress.
```

---

## Goal System

### What is a Goal?

A **Goal** is a financial target. It represents what money is for. Examples:
- Emergency Fund (Safety net)
- House Down Payment (Big purchase)
- PC Fund (Gaming computer)
- Vacation (Experience)

### Goal Types

| Type | Description | Example |
|------|---|---|
| **Savings** | Building up money | Emergency fund, vacation |
| **Investment** | Growing wealth | Stock portfolio, crypto |
| **Debt Payoff** | Reducing debt | Credit card, loan |
| **Purchase** | Saving for something | New laptop, car |
| **Other** | Miscellaneous | Custom goal |

### Goal Fields

```typescript
interface Goal {
  id: string                    // Unique identifier
  name: string                  // Display name
  goalType: GoalType           // Type from above
  targetAmount: number         // Target in ₱
  targetDate?: string          // Optional deadline
  linkedAccountId: string      // REQUIRED: which account tracks this
  notes?: string               // Additional details
  createdAt: Date              // Created when
  updatedAt: Date              // Last modified
}
```

**Note**: Goals do NOT have `currentSaved` field. Progress is calculated from the linked account's balance.

### Key Concept: Goal Progress

**Goal Progress = Linked Account Balance / Target Amount**

```
Example Goal:
  Name: Emergency Fund
  Target: ₱100,000
  Linked Account: "Savings Account" (balance: ₱30,000)
  
  Progress = 30,000 / 100,000 = 30%
  Status: 30% of target saved

When Savings Account balance increases to ₱50,000:
  Progress = 50,000 / 100,000 = 50%
  (Automatically updates, no manual action needed)

When Savings Account receives income of ₱5,000:
  New balance = ₱55,000
  New progress = 55,000 / 100,000 = 55%
```

### No Manual Saved Amount

**Old Model** (❌ Outdated):
```
Goal: Save ₱100,000
Current Saved: ₱30,000 (manually entered)
Progress: 30,000 / 100,000 = 30%
Problem: Manual entry can become out of sync
```

**New Model** (✅ Current):
```
Goal: Save ₱100,000
Linked Account: Savings Account (balance: ₱30,000)
Progress: 30,000 / 100,000 = 30%
Benefit: Automatic, always in sync
```

### Goal-Account Linking

**Every Goal MUST be Linked to an Account**

When creating a goal:
1. Name and target amount
2. **Required**: Select linked account from dropdown
3. Account balance automatically becomes the progress source

```
Goal Creation Form
├─ Goal Name: "PC Fund" ✓
├─ Target Amount: "₱60,000" ✓
├─ Linked Account: [Dropdown] ✓ REQUIRED
│  ├─ Savings Account
│  ├─ GCash E-Wallet
│  └─ PayMaya
└─ Goal Type: "Purchase"
```

**If No Accounts Exist**:
```
Goal Creation Form
├─ Name field
├─ Target field
├─ Linked Account: ⚠️ NO ACCOUNTS EXIST
│  ├─ Create Account First
│  └─ [Button: Go to Accounts →]
└─ Submit: Disabled
```

### Goal Lifecycle

#### Creating a Goal

1. Go to Goals page
2. Click "+ Add Goal"
3. Fill form:
   - Goal name
   - Goal type
   - Target amount
   - Target date (optional)
   - **Select linked account** (required)
   - Notes (optional)
4. On submit:
   - Goal is created
   - Progress immediately shows (linked account balance)
   - Goal appears in list

#### Viewing Goal Progress

Dashboard shows:
- Goal name and target
- Progress bar (filled = balance, empty = remaining)
- Percentage complete
- Linked account name and balance
- Target date countdown (if set)

Example:
```
Emergency Fund
████████░░ 80%
₱80,000 of ₱100,000
Account: Savings Account (₱80,000)
Target: 2026-12-31 (7 months away)
```

#### Updating a Goal

Click "Edit" to change:
- Target amount
- Target date
- Goal type
- Linked account (switches goal to a different account)
- Notes

Cannot change:
- Goal creation date

When you change the linked account:
```
Old: Emergency Fund → Savings Account (₱30,000)
     Progress: 30%

New: Emergency Fund → GCash Account (₱10,000)
     Progress: 10%
     (Progress immediately recalculated)
```

#### Deleting a Goal

Confirm deletion:
```
"Delete goal: Emergency Fund?"
"This cannot be undone."
```

On deletion:
- Goal is removed from the system
- Linked account remains unchanged
- Linked account balance NOT affected
- Account can still have other goals
- Transactions linked to this goal remain (metadata preserved)

### Goal Progress Auto-Updates

Goals are **reactive** to account balance changes:

```
Scenario: Goal linked to Savings Account

1. Initial state
   Account: ₱30,000
   Goal Progress: 30%

2. Add income of ₱10,000 to account
   Account: ₱40,000
   Goal Progress: 40% ← Automatically updates

3. Pay expense from account (₱5,000)
   Account: ₱35,000
   Goal Progress: 35% ← Automatically updates

4. Transfer ₱5,000 from another account
   Account: ₱40,000
   Goal Progress: 40% ← Automatically updates
```

**How it works**:
- UI loads goal with linkedAccountId
- Component loads the linked account from storage
- Progress calculated from account.currentBalance
- No separate goal balance tracking needed

### Multi-Goal on Single Account

One account can fund multiple goals simultaneously:

```
Savings Account (₱100,000)
├─ Goal 1: Emergency Fund (₱50,000 target)
│  Progress: 100,000 / 50,000 = 200% ✓ COMPLETE
├─ Goal 2: House Down Payment (₱200,000 target)
│  Progress: 100,000 / 200,000 = 50% (In Progress)
└─ Goal 3: Vacation (₱20,000 target)
   Progress: 100,000 / 20,000 = 500% ✓ WAY OVER

All three goals see the same ₱100,000 balance.
Goals are not "competing" for the account balance.
```

**Use cases**:
- Emergency fund + house down payment in same savings
- Multiple savings goals in same account (prioritize with different target dates)
- Overlap intentional (account funding multiple goals)

### Optional Goal Tagging on Transfers

Savings transfers can be tagged with a goal, but this is **metadata only**:

```
Savings Transfer Example:
├─ Source: Salary Account
├─ Destination: Savings Account (linked to Emergency Fund goal)
├─ Amount: ₱5,000
└─ Linked Goal ID: goal-emergency-fund (metadata)

Purpose of metadata:
  ✓ Can filter: "Show me all transfers to Emergency Fund"
  ✓ Can track: "I contributed ₱5,000 to Emergency Fund this month"
  ✗ NOT used for: Calculating goal progress

Goal Progress still comes from: Savings Account balance
Not affected by: Which transfers are tagged to it
```

### Goal Dashboard View

Goals page shows:

1. **Summary Stats**
   - Total saved (sum of all linked account balances)
   - Active goals (count)
   - Top priority (goal with earliest deadline)

2. **Goals Grid**
   - Card view: Goal cards with progress bars
   - List view: Table with goal details
   - Grouped by priority (High, Medium, Low)

3. **Progress Tracking**
   - Visual progress bar
   - ₱ amount and percentage
   - Days until target date
   - Account status badge

### Goal Completion

A goal is considered **complete** when:
```
Goal Progress >= 100%
i.e., Linked Account Balance >= Target Amount
```

Example:
```
Emergency Fund
Target: ₱100,000
Account Balance: ₱105,000
Progress: 105% ← COMPLETE ✓

You can still add more to the account
(Goal stays marked as complete, shows 105%)
```

---

## Coordination Between Accounts and Goals

### Typical Workflow

```
Step 1: Create Account
  User goes to Accounts
  Creates "Savings Account" with ₱5,000 initial balance

Step 2: Create Goal
  User goes to Goals
  Creates "Emergency Fund" goal (₱50,000 target)
  Selects "Savings Account" as linked account
  Progress shows: 5,000 / 50,000 = 10%

Step 3: Add Income
  User adds ₱10,000 income to "Savings Account"
  Account balance: ₱15,000
  Goal progress auto-updates: 15,000 / 50,000 = 30%

Step 4: Link More Goals (Optional)
  User creates "House Down Payment" goal (₱200,000)
  Also links to "Savings Account"
  Both goals now show: 15,000 / target

Step 5: Withdraw from Account
  User adds ₱5,000 expense from account
  Account balance: ₱10,000
  Both goals update: 10,000 / target
```

### Scenarios

#### Scenario 1: Multiple Goals, Single Account
```
Account: Joint Savings (₱100,000)
Goal 1: Emergency Fund (₱50,000)     → 100%
Goal 2: Down Payment (₱200,000)      → 50%
Goal 3: Vacation (₱20,000)           → 500%

All see the same ₱100,000 balance.
Useful for: Prioritizing multiple savings targets
```

#### Scenario 2: Multiple Accounts, Multiple Goals
```
Account A: Salary (₱50,000)
  Goal 1: Monthly Expenses
  Goal 2: Short-term savings

Account B: Investments (₱100,000)
  Goal 3: Retirement
  Goal 4: Growth portfolio

Each goal sees its linked account only.
```

#### Scenario 3: Transfer Between Accounts
```
Before:
  Account A: ₱30,000 → Goal A: 30%
  Account B: ₱20,000 → Goal B: 20%

Transfer ₱5,000 from A to B:
  Account A: ₱25,000 → Goal A: 25%
  Account B: ₱25,000 → Goal B: 25%

Both goals recalculate based on new account balances.
```

---

## Best Practices

### Setting Up Accounts

1. Create one account per bank/wallet you use
2. Use clear names: "BPI Salary", "GCash Personal", not just "Account 1"
3. Set initial balance to current balance (don't round)
4. Set hasDebitCard if you have a debit card

### Setting Up Goals

1. Create one goal per financial target
2. Choose realistic target amounts (based on timeframe)
3. Link goals to the account that will fund them
4. Set target dates for motivation and tracking
5. Use goal types consistently (Savings vs Investment vs Purchase)

### Monitoring Goals

1. Check dashboard regularly for progress
2. Adjust target amounts if plans change
3. Don't delete goals, archive instead (future feature)
4. Use notes field for context ("For laptop upgrade in 2026")

### Managing Multiple Accounts

1. Keep accounts separate if they serve different purposes
2. Use transfers to move money between accounts
3. Tag transfers with goals if moving for a specific purpose
4. Review total assets across all accounts monthly
