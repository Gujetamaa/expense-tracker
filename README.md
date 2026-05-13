# Expenses Tracker

A personal finance management tool for tracking expenses, income, savings goals, and credit card payments with real-time account balance updates.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Persistence**: localStorage (no external APIs)
- **Language**: TypeScript

## Main Features

- 💰 **Multiple Accounts**: Track savings across Traditional Bank, Digital Bank, E-Wallet, MP2, and Cash accounts
- 🎯 **Savings Goals**: Create goals linked to specific accounts with automatic progress tracking
- 💳 **Credit Card Management**: Monitor multiple credit cards, track balances, and log payments
- 📊 **Transaction Tracking**: Record expenses, income, credit card payments, and inter-account transfers
- 📈 **Monthly Dashboard**: View income, expenses, account balances, and goal progress
- 💹 **Salary Calculator**: Calculate net salary from gross with configurable deductions
- 🔄 **Real-time Updates**: Account and card balances update immediately when transactions are recorded

## Architecture Summary

### Core Concepts

**Accounts** represent where money is stored. Every account has a current balance that updates based on transactions.

**Goals** represent financial targets (e.g., "Emergency Fund", "New Laptop"). Every goal is linked to exactly one account, and its progress is automatically calculated from that account's balance.

**Transactions** include:
- Expenses (paid via Account or Credit Card)
- Income (added to accounts)
- Credit Card Payments (reduces card debt from an Account)
- Savings Transfers (moves money between Accounts)

**Credit Cards** track outstanding debt. When you charge an expense to a card, the balance increases. When you pay the card, the balance decreases.

### Transaction Effects

Every transaction automatically updates account and card balances:

```
Expense via Account    → Account balance decreases
Expense via Credit Card → Credit Card balance increases
Credit Card Payment     → Credit Card balance decreases + source Account decreases
Savings Transfer        → Source Account decreases, Destination Account increases
Income                  → Account balance increases
```

For detailed flow diagrams, see [docs/transactions.md](docs/transactions.md).

## Setup Instructions

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd expenses-tracker

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

## Environment Notes

- **No Environment Variables Required**: This app uses localStorage for all data and does not require API keys or external service configuration.
- **Browser Compatibility**: Works in all modern browsers that support localStorage and ES2020+ JavaScript.
- **Storage Limit**: localStorage typically has a 5-10MB limit per domain (depends on browser). The app should comfortably fit within this for typical personal use.
- **Data Persistence**: Data persists across browser sessions but is lost if localStorage is cleared.

## Data Privacy

✅ **All data stays on your device.** This app:
- Uses **localStorage only** for data persistence
- Makes **no external API calls** to sync or backup data
- Stores **no user information** on any server
- Requires **no login or authentication**

**Backup your data** by exporting it regularly (export feature in development) or using browser DevTools to copy localStorage contents.

## Screenshots Section

[Screenshots coming soon—dashboard, accounts, goals, and credit cards views]

## Project Structure

```
expenses-tracker/
├── app/                      # Next.js app router pages
│   └── (routes)/            # Route group with layouts
├── components/              # React components
├── lib/                     # Utility functions & business logic
│   ├── storage.ts           # localStorage helpers
│   ├── calculations.ts      # Financial calculations
│   ├── goalHelpers.ts       # Goal-specific logic
│   ├── transactionEffects.ts # Transaction side effects
│   ├── accountEffects.ts    # Account balance changes
│   └── creditCardEffects.ts # Credit card balance changes
├── types/                   # TypeScript interfaces
├── docs/                    # Project documentation
└── public/                  # Static assets
```

For detailed architecture, see [docs/architecture.md](docs/architecture.md).

## Key Workflows

### Creating a Savings Goal

1. Create an Account first (Traditional Bank, E-Wallet, etc.)
2. Go to Goals and create a new goal (must select the linked account)
3. Goal progress automatically tracks the account balance
4. No manual entry of saved amount needed

### Recording an Expense

1. Add a transaction on the Dashboard
2. Select expense type
3. Choose payment method:
   - **Credit Card**: Expense charged to the card (card balance increases)
   - **Debit Card/Bank Transfer**: Drawn from a savings account (account balance decreases)
   - **E-Wallet**: Drawn from e-wallet account
   - **Cash**: Optional account tracking
4. Account/card balances update immediately

### Paying a Credit Card Bill

1. Create a Credit Card Payment transaction
2. Select which card to pay
3. Select the source account (where the payment comes from)
4. Credit card balance decreases, source account balance decreases

For more detailed workflows, see [docs/business-rules.md](docs/business-rules.md).

## Developer Notes

- **Dual-use linkedAccountId**: In transactions, `linkedAccountId` can refer to either a savings account or implicitly a cash account, depending on context
- **Goal-Account Relationship**: Goals are required to have a `linkedAccountId`. Goal progress is **always** calculated from the linked account's current balance, never stored separately
- **Credit Card vs Account**: Credit cards and savings accounts are separate concepts. A credit card is a liability account; a savings account is an asset
- **Transaction Effects**: All transactions use a unified effects system in `lib/transactionEffects.ts` that applies/reverses balance changes atomically
- **localStorage as Source of Truth**: There is no backend; localStorage is the single source of truth. All components should call storage helpers to read current state

## Roadmap

See [docs/future-roadmap.md](docs/future-roadmap.md) for planned features.

### Near-term
- Account balance history/snapshots
- Transaction search and filtering
- Recurring transactions

### Medium-term
- Charts and data visualization
- CSV import/export
- Backup and restore functionality

### Long-term
- Mobile PWA support
- Database backend (Supabase)
- Multi-user authentication
- Advanced budgeting features

## Support & Contribution

For documentation on specific features or subsystems, see the `/docs` folder. All code should follow the business rules and architectural patterns documented there.

---

**Last Updated**: May 2026
