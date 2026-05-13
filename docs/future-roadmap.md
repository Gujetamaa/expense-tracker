# Future Roadmap

This document outlines planned features and architectural improvements for the Expenses Tracker. Items are grouped by timeline and priority.

## Near-term (Next 2-3 months)

### 1. Account Balance History

**Feature**: Track how account balances change over time

**Why**: Understand savings trends and growth rates
- Snapshot account balance at end of each month
- View historical balance chart
- Calculate monthly savings rate

**Implementation**:
- New localStorage key: `account_snapshots`
- Auto-snapshot at end of month or on-demand
- Show chart: Balance over 12 months
- Calculate: Monthly change, growth trend

**Database Schema** (future):
```
account_snapshots {
  id: string
  accountId: string
  balance: number
  snapshotDate: date
  previousBalance: number
}
```

### 2. Transaction Search & Filtering

**Feature**: Find transactions more easily

**Why**: Large transaction lists become hard to navigate
- Search by description
- Filter by date range
- Filter by category
- Filter by account/card
- Filter by amount range
- Multi-criteria search

**Implementation**:
- Add search input on Transactions page
- Implement filter UI sidebar
- Real-time filtering in-memory
- Persist filter preferences

### 3. Recurring Transactions

**Feature**: Auto-create transactions on schedule

**Why**: Bills, salary, subscriptions happen regularly
- Monthly: Rent, salary, insurance
- Weekly: Grocery shopping
- One-time: Pay off credit card on specific date

**Implementation**:
- New entity: `RecurringTransaction`
- Auto-generate on schedule
- Allow skip/edit individual occurrences
- Show upcoming scheduled transactions

**Database Schema** (future):
```
recurring_transactions {
  id: string
  templateId: string // Which transaction to repeat
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual'
  startDate: date
  endDate?: date
  nextOccurrence: date
  isActive: boolean
}
```

### 4. CSV Import/Export

**Feature**: Backup data and move to external tools

**Why**: Data portability, backup, analysis in Excel/Sheets
- Export transactions as CSV
- Export account summary
- Export goal status
- Import transactions from CSV
- Import from Excel/Sheets

**Format Example**:
```csv
Date,Type,Category,Description,Amount,Account,Card,Notes
2026-05-14,expense,Food,Groceries,500,GCash,,Weekly shopping
2026-05-15,income,Salary,Monthly Salary,22500,Savings Account,,Paid
2026-05-16,credit_card_payment,Statement,BPI Payment,2000,Savings Account,BPI Visa,
```

## Medium-term (3-6 months)

### 5. Charts & Visualization

**Feature**: Visual insights into spending patterns

**Why**: Easier to understand trends and anomalies
- Monthly expense breakdown (pie chart)
- Income vs Expense trend (line chart)
- Spending by category (bar chart)
- Goal progress toward targets (gauge chart)
- Net worth over time (area chart)

**Technology**:
- Use Chart.js, Recharts, or Visx
- Responsive charts
- Hover tooltips with details
- Export chart as image

**Data Needed**:
- Monthly expense totals by category
- Category list with colors
- Income/expense history
- Goal progress history

### 6. Backup & Restore

**Feature**: Protect data with manual backups

**Why**: localStorage can be lost if browser data is cleared
- One-click backup download (JSON file)
- Drag-drop restore from JSON
- Backup before major operations
- Version control (restore from older backups)
- Cloud backup (future: Dropbox, Google Drive)

**Implementation**:
- Add to Settings page
- Backup all localStorage keys to single JSON
- Include metadata: app version, backup date, data size
- Validate on restore (check required fields)

**Example Backup**:
```json
{
  "version": "1.0.0",
  "backupDate": "2026-05-14T14:30:00Z",
  "dataSize": "305KB",
  "data": {
    "transactions": [...],
    "savings_accounts": [...],
    "goals": [...],
    "credit_cards": [...]
  }
}
```

### 7. Mobile PWA Support

**Feature**: Install app on phone, works offline

**Why**: Manage finances on-the-go
- Install on home screen (iOS, Android)
- Works offline (cached app shell)
- Background sync (sync when online)
- Mobile-optimized UI
- Push notifications for bills/goals

**Implementation**:
- Add service worker
- Create manifest.json
- Optimize for mobile viewport
- Cache static assets
- Implement background sync (future)

### 8. Budget vs Actual Comparison

**Feature**: Compare spending to planned budget

**Why**: Track if you're overspending in categories
- Set monthly budget by category
- View actual vs budgeted
- Alerts when overspending
- Monthly budget report
- Budget variance analysis

**New Entity**:
```
budget {
  id: string
  month: string (YYYY-MM)
  category: string
  amount: number (budgeted amount)
}
```

## Long-term (6-12 months)

### 9. Supabase/Database Backend

**Feature**: Multi-device sync, collaborative features

**Why**: Share finances with spouse, sync across devices
- Migrate from localStorage to Supabase
- Real-time sync across devices
- Shared access (invite others)
- Audit trail (who changed what)
- Backup on server

**Architecture**:
- Keep current UI layer
- Replace storage layer with Supabase SDK
- Add authentication
- Implement conflict resolution
- Data encryption at rest

**Breaking Changes**:
- Require login/signup
- OAuth with Google/GitHub
- New data permissions model

### 10. Authentication & Multi-User

**Feature**: Secure login, shared finances

**Why**: Secure data access, family budgeting
- User login/signup
- Shared accounts with spouse
- Role-based access (view-only, edit)
- Family account with rules
- Individual goals vs shared goals

**Scope**:
- OAuth login (Google, GitHub)
- Email/password backup
- Session management
- Permission system

### 11. Advanced Credit Card Features

**Feature**: Deeper credit card management

**Why**: Better tracking of credit usage
- Upload PDF statements (OCR parsing)
- Reconcile transactions
- Dispute tracking
- Statement history by period
- Credit score estimation
- Card rewards tracking
- Installment tracking (0% installments)

**Implementation**:
- PDF upload with OCR
- Statement parser
- Credit score API integration
- Rewards database

### 12. Installment Tracker

**Feature**: Track 0% installment plans

**Why**: Many credit card purchases are installments
- Create installment from transaction
- Auto-generate monthly payments
- Track payment schedule
- Alert on due dates
- Installment status dashboard

**Example**:
```
Laptop Purchase: ₱50,000 (12 months)
├─ Month 1: ₱4,166.67 (paid)
├─ Month 2: ₱4,166.67 (due 2026-06-15)
├─ Month 3: ₱4,166.67 (upcoming)
└─ ...
```

### 13. Tax & Contribution Tracking

**Feature**: Help with annual tax filing

**Why**: Easier to file taxes and check contributions
- Track annual income by category
- Calculate taxable income
- SSS/PhilHealth/PAG-IBIG totals
- Generate BIR-style reports
- Export for tax filing
- Track deductions
- Quarterly summary

**Data Needed**:
- All income transactions (annual)
- Business deductions
- Investment losses
- Charitable donations

### 14. Salary Negotiation Tools

**Feature**: Helper for salary discussions

**Why**: Know your worth and what to ask for
- Calculate required gross for target net
- Salary comparison by industry
- Cost of living adjustments
- Benefit valuation
- Overtime/bonus simulations

**Integration with Salary Calculator**:
- "I want ₱25,000 net, what gross do I need?"
- "With 2 years experience, market rate is ₱30,000"
- "₱1,000 worth of benefits = ₱200 gross savings"

## Epic: Analytics & Reporting

### 15. Spending Analytics

**Feature**: Understand where money goes

**Why**: Find savings opportunities
- Top spending categories (last 3 months, 6 months, year)
- Spending trends (increasing/decreasing)
- Seasonal patterns (highest spending month)
- Anomaly detection (unusual transactions)
- Category spending vs budget

### 16. Financial Health Score

**Feature**: Overall financial wellness indicator

**Why**: Motivate better habits
- Emergency fund adequacy
- Credit utilization
- Savings rate
- Debt-to-income ratio
- Goal progress overall
- Financial trend (improving/declining)

**Score Components**:
```
Emergency Fund (20%):   ✓ (6 months coverage)
Credit Usage (20%):    ✓ (25% utilization)
Savings Rate (20%):    ⚠ (15%, target 25%)
Goal Progress (20%):   ✓ (30% of goals met)
Debt Status (20%):     ✓ (No high-interest debt)

Overall Score: 8.5/10 (Good)
Trend: ↗ Improving
```

### 17. Net Worth Tracking

**Feature**: Track total wealth growth

**Why**: Understand long-term financial progress
- Calculate net worth (assets - liabilities)
- Track over time
- Breakdown by account
- Property values (home, car)
- Investment portfolio
- Debt balance total

**Formula**:
```
Net Worth = (All Account Balances + Investments + Property)
          - (Credit Card Debt + Loans)
```

## Epic: Collaboration & Sharing

### 18. Shared Finances with Spouse

**Feature**: Joint financial planning

**Why**: Couples need shared budget/goals
- Joint account pool
- Individual allowances
- Shared vs personal expenses
- Common goals
- Financial agreements
- Budget discussions

### 19. Family Budget Management

**Feature**: Household budget for families

**Why**: Parents want to track family spending
- Allowance allocation
- Chore-based earnings
- Family savings goals
- Educational expenses tracking
- Child account setup (future)

### 20. Export Shared Reports

**Feature**: Generate reports for accountant/advisor

**Why**: Need clean reports for professionals
- CPA-ready reports
- Tax summary PDF
- Annual expense breakdown
- Goal achievement report
- Variance analysis
- Custom date ranges

## Experimental Features

### 21. AI-Powered Insights

**Feature**: Smart suggestions from spending data

**Potential Uses**:
- "You're spending 40% more on food this month. Why?"
- "Based on trends, you'll save ₱X by year-end"
- "Your spending in Dining is up 25%. Consider setting alert"
- "You're on track to reach Emergency Fund by December"

**Privacy-first**: All analysis happens locally, no data sent to APIs

### 22. Gamification

**Feature**: Gamify financial health

**Why**: Make budgeting more engaging
- Achievements (Emergency Fund complete!)
- Streaks (30-day no overspending)
- Badges (Frugal Month, Savings Champion)
- Challenges (Spend less than last month)
- Leaderboards (vs friends, private)

### 23. Smart Categorization

**Feature**: AI suggests category for new transactions

**Why**: Reduce manual data entry
- Learn from past categories
- Suggest category on new transaction
- User can confirm or change
- Improve suggestions over time

**Implementation**:
- Keyword matching (description → category)
- Pattern recognition (merchant → category)
- Confidence score (high/low)
- User feedback to improve

## Planned Deprecations

### Will Remove in v2.0

- [ ] Old transaction format (migrate to new linkedCreditCardId)
- [ ] Manual currentSaved field in goals (already deprecated)
- [ ] Direct localStorage JSON editing (deprecate, provide UI)

### Will Change in v2.0

- [ ] Authentication required (currently optional)
- [ ] Storage location (migrate from localStorage to database)
- [ ] Data schema (restructure for scalability)

## Integration Roadmap

### Third-party Services (Optional)

- **Dropbox**: Cloud backup
- **Google Drive**: Backup and collaborative editing
- **Stripe**: Payment features (future)
- **Plaid**: Bank integration (future)
- **Supabase**: Backend database (future)
- **Vercel**: Hosting (currently)

### APIs (Planned, Privacy-first)

- **Exchange Rates API**: Multi-currency support
- **Open Banking API**: Bank statement import
- **Salary Survey API**: Salary benchmarking
- **Cost of Living API**: Geographic adjustments

All integrations will be optional and transparent about data usage.

## Performance Roadmap

### Optimization Priorities

1. **Current** (~1000 transactions): Performant
2. **Near-term** (~10,000 transactions): Needs optimization
   - Pagination or virtual scrolling
   - Indexed month lookups
   - Cached calculations
3. **Long-term** (→ Database): Unlimited scale
   - Server-side filtering
   - Database indexing
   - API pagination

### Technology Debt

- [ ] Migrate from localStorage (temporary solution)
- [ ] Add proper error boundaries
- [ ] Improve component structure (currently monolithic)
- [ ] Add comprehensive test suite
- [ ] Document internal APIs
- [ ] Performance profiling

## Research & Exploration

### Areas Under Consideration

- **Machine learning**: Spending predictions, anomaly detection
- **Natural language**: Transaction search by description
- **Offline-first**: Sync when online
- **YNAB-style budgeting**: Per-paycheck methodology
- **Bogleheads**: Investment tracking and reporting
- **Personal Capital-style**: Full financial platform

### Community Features (Distant Future)

- Open-source community contributions
- Public templates (budget templates, goal types)
- Community benchmarks (spending comparison)
- Public data (anonymized trends)

## How to Prioritize

### Current Development Focus

1. ✅ Fix core balance update issues
2. ✅ Complete account/goal linking
3. 🔄 Currently: Documentation
4. ⏳ Next: User testing and feedback

### Feedback Loop

- User feedback prioritizes features
- GitHub issues track requests
- Community voting on features
- Monthly prioritization review

## Version Milestones

**v1.0.0** (Current):
- Core functionality complete
- Accounts, Goals, Transactions, Credit Cards
- Single-user, localStorage-based
- Dashboard, Analytics basics

**v1.5.0** (3 months):
- Account history
- Search & filtering
- CSV import/export
- Charts & visualization
- Mobile PWA support

**v2.0.0** (6 months):
- Supabase backend
- Authentication
- Multi-device sync
- Collaborative features
- Advanced credit card features

**v2.5.0** (9 months):
- Tax & contributions tracking
- Full analytics suite
- Net worth tracking
- AI insights
- API integrations

**v3.0.0** (12+ months):
- Full financial platform
- Investment tracking
- Multi-user families
- Advanced budgeting
- Mobile apps (iOS, Android)

## Getting Involved

### Want to contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) (future) for guidelines.

### Have a feature idea?

1. Check if it's listed here
2. Open a GitHub issue
3. Describe use case and why you need it
4. Upvote similar requests
5. Share feedback on implementation

### Want to sponsor?

This is currently a free, open-source project. Future sponsorship could accelerate development. Contact via GitHub.

---

**Last Updated**: May 2026  
**Next Review**: August 2026
