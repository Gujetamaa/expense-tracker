# Finance Tracker Database Architecture (Revised)

## Overview

Production-grade PostgreSQL schema designed for:
- Small team (5 people) with multi-user isolation via Row Level Security
- Financial data consistency with atomic RPC functions
- Safe transaction posting/editing/deletion with comprehensive triggers
- Clean, minimal design for v1; future-proofing for analytics and recurring transactions
- High query performance with strategic indexing

**Design Philosophy:** Correctness first, simplicity second, performance third.

---

## Key Revisions

### 1. Credit Card Transactions Consolidated

**Decision:** Eliminate separate `credit_card_transactions` table. All spending recorded in `transactions`.

**Why:**
- Single source of truth for all financial activity
- Prevents confusion and duplicate balance logic
- Simpler RLS (one transactions table, not two)
- Easier reporting and reconciliation

**How it works:**
- Expense with `payment_method='credit_card'` and `credit_card_id` set
  - Updates credit card balance (increases outstanding)
  - Does NOT update account balance
- `cc_payment` type decreases credit card and source account simultaneously
- RPC function ensures atomicity

**Tradeoff:** Slightly more complex transaction type validation, but much cleaner overall.

---

### 2. Comprehensive Balance Consistency

**Decision:** Triggers handle INSERT, UPDATE, DELETE. RPC functions for atomic operations.

**Covers:**
- Insert posted transaction → update account/card balances
- Update posted transaction → reverse old effects, apply new effects
- Delete posted transaction → reverse effects
- Post draft → move to transactions, apply balance effects
- Edit draft → update draft fields only (no balance impact)
- Delete draft → no balance impact

**Double-counting prevention:**
- Triggers recalculate balance from scratch for each operation
- RPC functions run in single transaction (no race conditions)
- Audit log records all changes for forensics

---

### 3. Account Balance Constraints (Revised)

**Decision:** Allow negative balances for accounts; keep >= 0 for credit cards.

**Why:**
- Regular accounts (checking, cash): May have tracking discrepancies, corrections, or temporary overages
- Credit cards: Outstanding balance is always non-negative (you can't have negative debt)
- Flexibility without compromising financial correctness

**Implementation:**
```
accounts.current_balance: no check (allows negative)
credit_cards.current_balance: CHECK (current_balance >= 0)
```

---

### 4. RPC Functions for Safe Operations

**Decision:** Critical operations run as PostgreSQL functions, not multiple frontend calls.

**Functions:**
- `post_transaction_draft(draft_id)` → Move draft to posted, apply balance effects
- `create_posted_transaction(...)` → Insert + update balances atomically
- `update_posted_transaction(transaction_id, ...)` → Reverse old + apply new atomically
- `delete_posted_transaction(transaction_id)` → Reverse all effects atomically

**Benefits:**
- Atomic: all-or-nothing (no intermediate states)
- Audited: single entry in balance_history
- Validated: ownership checks via auth.uid()
- Safe: no race conditions

---

## Schema: v1 Tables (Production Ready)

### 1. Profiles (Extends Supabase Auth)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'PHP',
  timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

### 2. Categories

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '📁',
  is_custom BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, name, type)
);
```

**Defaults created on profile creation:** Income, Groceries, Utilities, Dining, Transport, etc.

---

### 3. Accounts (Savings, Checking, E-Wallets, Cash)

```sql
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN (
    'traditional_bank', 'digital_bank', 'e_wallet', 'savings_fund', 'cash'
  )),
  current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  target_balance DECIMAL(12, 2),
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  is_default_for_income BOOLEAN DEFAULT FALSE,
  has_debit_card BOOLEAN DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT positive_target CHECK (target_balance IS NULL OR target_balance > 0),
  UNIQUE(user_id, name)
);
```

**Note:** `current_balance` can be negative (for corrections/discrepancies). No constraint.

---

### 4. Credit Cards

```sql
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  card_last_four TEXT,
  credit_limit DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  available_credit DECIMAL(12, 2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
  statement_date INT CHECK (statement_date >= 1 AND statement_date <= 31),
  due_date INT CHECK (due_date >= 1 AND due_date <= 31),
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT positive_limit CHECK (credit_limit > 0),
  CONSTRAINT non_negative_balance CHECK (current_balance >= 0)
);
```

---

### 5. Posted Transactions (Single Source of Truth)

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type determines balance effects
  type TEXT NOT NULL CHECK (type IN (
    'income',           -- +account balance
    'expense',          -- -account balance (or -cc balance if payment_method=credit_card)
    'transfer',         -- -account, +destination_account
    'cc_payment'        -- -account, -credit_card balance
  )),
  
  amount DECIMAL(12, 2) NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  description TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  
  -- Primary account (source for expense/income/transfer, payment source for cc_payment)
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  
  -- Destination (only for transfer)
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
  
  -- Credit card (for expenses paid with CC, or CC payments)
  credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE RESTRICT,
  
  -- How was it paid (debit_card, credit_card, bank_transfer, cash, e_wallet, other)
  payment_method TEXT DEFAULT 'debit_card',
  
  -- Link related transactions (transfer pair, CC payment, split)
  reference_number TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_transfer CHECK (
    (type = 'transfer' AND destination_account_id IS NOT NULL) OR
    (type != 'transfer' AND destination_account_id IS NULL)
  ),
  CONSTRAINT valid_cc_payment CHECK (
    (type = 'cc_payment' AND credit_card_id IS NOT NULL) OR
    (type != 'cc_payment' AND credit_card_id IS NULL)
  ),
  CONSTRAINT valid_cc_expense CHECK (
    (type = 'expense' AND payment_method = 'credit_card' AND credit_card_id IS NOT NULL) OR
    (type != 'expense') OR
    (type = 'expense' AND payment_method != 'credit_card' AND credit_card_id IS NULL)
  )
);
```

**Key:** Only posted transactions exist. No `status` column.

---

### 6. Draft Transactions

```sql
CREATE TABLE public.transaction_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'cc_payment')),
  amount DECIMAL(12, 2) NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  description TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
  credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE RESTRICT,
  payment_method TEXT DEFAULT 'debit_card',
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Lifecycle:** Draft → (user clicks "Post") → RPC `post_transaction_draft()` → moved to `transactions`, deleted from `transaction_drafts`.

---

### 7. Account Balance History (Audit Trail)

```sql
CREATE TABLE public.account_balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  balance_before DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  reason TEXT, -- 'transaction_posted', 'transaction_updated', 'transaction_deleted', 'draft_posted'
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

### 8. Savings Goals

```sql
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  linked_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  target_amount DECIMAL(12, 2) NOT NULL,
  target_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT positive_target CHECK (target_amount > 0),
  UNIQUE(user_id, name)
);
```

**Progress:** Calculated from linked account balance (not a stored field).

---

### 9. Audit Log

```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'account', 'transaction', 'credit_card', 'goal', 'category'
  )),
  entity_id UUID NOT NULL,
  
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

## Schema: Optional v1+ Tables

### Salary Configuration

```sql
CREATE TABLE public.salary_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  basic_monthly_salary DECIMAL(12, 2) NOT NULL,
  taxable_allowance DECIMAL(12, 2) DEFAULT 0,
  non_taxable_allowance DECIMAL(12, 2) DEFAULT 0,
  reimbursements DECIMAL(12, 2) DEFAULT 0,
  
  payroll_frequency TEXT NOT NULL DEFAULT 'monthly' 
    CHECK (payroll_frequency IN ('monthly', 'semi_monthly')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT positive_salary CHECK (basic_monthly_salary > 0)
);
```

**Use:** Salary calculator / tax estimation. Not critical for core app.

---

## Schema: Future Tables (v2+)

### Tags & Transaction Tags

```sql
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

CREATE TABLE public.transaction_tags (
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);
```

---

### Recurring Transactions

```sql
CREATE TABLE public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  
  frequency TEXT NOT NULL CHECK (frequency IN (
    'daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly'
  )),
  
  start_date DATE NOT NULL,
  end_date DATE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
```

---

### Attachments

```sql
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_size CHECK (file_size > 0 AND file_size <= 10485760)
);
```

---

## PostgreSQL RPC Functions (Critical for Safety)

### 1. Post Transaction Draft

```sql
CREATE OR REPLACE FUNCTION public.post_transaction_draft(
  draft_id UUID
)
RETURNS UUID AS $$
DECLARE
  draft record;
  new_transaction_id UUID;
  amount_signed DECIMAL;
BEGIN
  -- Verify ownership
  SELECT * INTO draft FROM public.transaction_drafts
  WHERE id = draft_id AND user_id = auth.uid();
  
  IF draft IS NULL THEN
    RAISE EXCEPTION 'Draft not found or not owned by user';
  END IF;
  
  -- Create posted transaction
  INSERT INTO public.transactions (
    user_id, type, amount, category_id, description, date,
    account_id, destination_account_id, credit_card_id, payment_method, notes
  )
  VALUES (
    draft.user_id, draft.type, draft.amount, draft.category_id, draft.description, draft.date,
    draft.account_id, draft.destination_account_id, draft.credit_card_id, draft.payment_method, draft.notes
  )
  RETURNING id INTO new_transaction_id;
  
  -- Apply balance effects (see trigger below)
  -- Trigger will handle all balance updates
  
  -- Delete draft
  DELETE FROM public.transaction_drafts WHERE id = draft_id;
  
  RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### 2. Create Posted Transaction (Direct)

```sql
CREATE OR REPLACE FUNCTION public.create_posted_transaction(
  p_type TEXT,
  p_amount DECIMAL,
  p_category_id UUID,
  p_description TEXT,
  p_date DATE,
  p_account_id UUID,
  p_destination_account_id UUID DEFAULT NULL,
  p_credit_card_id UUID DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'debit_card',
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_transaction_id UUID;
BEGIN
  -- Verify all referenced entities belong to user
  PERFORM 1 FROM public.categories 
  WHERE id = p_category_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found'; END IF;
  
  PERFORM 1 FROM public.accounts 
  WHERE id = p_account_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  
  IF p_destination_account_id IS NOT NULL THEN
    PERFORM 1 FROM public.accounts 
    WHERE id = p_destination_account_id AND user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Destination account not found'; END IF;
  END IF;
  
  IF p_credit_card_id IS NOT NULL THEN
    PERFORM 1 FROM public.credit_cards 
    WHERE id = p_credit_card_id AND user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Credit card not found'; END IF;
  END IF;
  
  -- Insert transaction (trigger handles balance updates)
  INSERT INTO public.transactions (
    user_id, type, amount, category_id, description, date,
    account_id, destination_account_id, credit_card_id, payment_method, notes
  )
  VALUES (
    auth.uid(), p_type, p_amount, p_category_id, p_description, p_date,
    p_account_id, p_destination_account_id, p_credit_card_id, p_payment_method, p_notes
  )
  RETURNING id INTO new_transaction_id;
  
  RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### 3. Update Posted Transaction

```sql
CREATE OR REPLACE FUNCTION public.update_posted_transaction(
  transaction_id UUID,
  p_type TEXT DEFAULT NULL,
  p_amount DECIMAL DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_date DATE DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_destination_account_id UUID DEFAULT NULL,
  p_credit_card_id UUID DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  old_transaction record;
BEGIN
  -- Get old transaction
  SELECT * INTO old_transaction FROM public.transactions
  WHERE id = transaction_id AND user_id = auth.uid();
  
  IF old_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or not owned by user';
  END IF;
  
  -- Use trigger to reverse old effects
  DELETE FROM public.transactions WHERE id = transaction_id;
  
  -- Verify ownership of new references
  IF p_category_id IS NOT NULL AND p_category_id != old_transaction.category_id THEN
    PERFORM 1 FROM public.categories 
    WHERE id = p_category_id AND user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'New category not found'; END IF;
  END IF;
  
  IF p_account_id IS NOT NULL AND p_account_id != old_transaction.account_id THEN
    PERFORM 1 FROM public.accounts 
    WHERE id = p_account_id AND user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'New account not found'; END IF;
  END IF;
  
  -- Re-insert with new values (trigger applies new effects)
  INSERT INTO public.transactions (
    id, user_id, type, amount, category_id, description, date,
    account_id, destination_account_id, credit_card_id, payment_method, notes, created_at
  )
  VALUES (
    transaction_id,
    old_transaction.user_id,
    COALESCE(p_type, old_transaction.type),
    COALESCE(p_amount, old_transaction.amount),
    COALESCE(p_category_id, old_transaction.category_id),
    COALESCE(p_description, old_transaction.description),
    COALESCE(p_date, old_transaction.date),
    COALESCE(p_account_id, old_transaction.account_id),
    COALESCE(p_destination_account_id, old_transaction.destination_account_id),
    COALESCE(p_credit_card_id, old_transaction.credit_card_id),
    COALESCE(p_payment_method, old_transaction.payment_method),
    COALESCE(p_notes, old_transaction.notes),
    old_transaction.created_at
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### 4. Delete Posted Transaction

```sql
CREATE OR REPLACE FUNCTION public.delete_posted_transaction(
  transaction_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify ownership
  PERFORM 1 FROM public.transactions
  WHERE id = transaction_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not owned by user';
  END IF;
  
  -- Delete (trigger reverses all effects)
  DELETE FROM public.transactions WHERE id = transaction_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Comprehensive Triggers for Balance Consistency

### Balance Update on Insert

```sql
CREATE OR REPLACE FUNCTION public.update_balance_on_transaction_insert()
RETURNS TRIGGER AS $$
DECLARE
  amount_signed DECIMAL;
  old_balance DECIMAL;
BEGIN
  -- Determine amount sign based on type
  amount_signed := CASE
    WHEN NEW.type = 'income' THEN NEW.amount
    WHEN NEW.type = 'expense' AND NEW.payment_method = 'credit_card' THEN 0  -- CC balance handled separately
    WHEN NEW.type = 'expense' THEN -NEW.amount
    WHEN NEW.type = 'transfer' THEN -NEW.amount
    WHEN NEW.type = 'cc_payment' THEN -NEW.amount
  END;
  
  -- Update primary account
  UPDATE public.accounts
  SET current_balance = current_balance + amount_signed
  WHERE id = NEW.account_id;
  
  -- Log account balance change
  IF amount_signed != 0 THEN
    INSERT INTO public.account_balance_history (
      account_id, user_id, balance_before, balance_after, transaction_id, reason
    )
    SELECT
      NEW.account_id,
      NEW.user_id,
      current_balance - amount_signed,
      current_balance,
      NEW.id,
      'transaction_posted'
    FROM public.accounts WHERE id = NEW.account_id;
  END IF;
  
  -- Handle transfer destination
  IF NEW.type = 'transfer' THEN
    UPDATE public.accounts
    SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.destination_account_id;
    
    INSERT INTO public.account_balance_history (
      account_id, user_id, balance_before, balance_after, transaction_id, reason
    )
    SELECT
      NEW.destination_account_id,
      NEW.user_id,
      current_balance - NEW.amount,
      current_balance,
      NEW.id,
      'transfer_received'
    FROM public.accounts WHERE id = NEW.destination_account_id;
  END IF;
  
  -- Handle credit card expenses
  IF NEW.type = 'expense' AND NEW.payment_method = 'credit_card' THEN
    UPDATE public.credit_cards
    SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.credit_card_id;
  END IF;
  
  -- Handle credit card payments
  IF NEW.type = 'cc_payment' THEN
    UPDATE public.credit_cards
    SET current_balance = current_balance - NEW.amount
    WHERE id = NEW.credit_card_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transaction_insert AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_balance_on_transaction_insert();
```

---

### Balance Reversal on Delete

```sql
CREATE OR REPLACE FUNCTION public.reverse_balance_on_transaction_delete()
RETURNS TRIGGER AS $$
DECLARE
  amount_signed DECIMAL;
BEGIN
  -- Reverse the amount signed during insert
  amount_signed := CASE
    WHEN OLD.type = 'income' THEN -OLD.amount
    WHEN OLD.type = 'expense' AND OLD.payment_method = 'credit_card' THEN 0
    WHEN OLD.type = 'expense' THEN OLD.amount
    WHEN OLD.type = 'transfer' THEN OLD.amount
    WHEN OLD.type = 'cc_payment' THEN OLD.amount
  END;
  
  -- Reverse account balance
  UPDATE public.accounts
  SET current_balance = current_balance + amount_signed
  WHERE id = OLD.account_id;
  
  -- Log reversal
  IF amount_signed != 0 THEN
    INSERT INTO public.account_balance_history (
      account_id, user_id, balance_before, balance_after, transaction_id, reason
    )
    SELECT
      OLD.account_id,
      OLD.user_id,
      current_balance - amount_signed,
      current_balance,
      OLD.id,
      'transaction_deleted'
    FROM public.accounts WHERE id = OLD.account_id;
  END IF;
  
  -- Reverse transfer destination
  IF OLD.type = 'transfer' THEN
    UPDATE public.accounts
    SET current_balance = current_balance - OLD.amount
    WHERE id = OLD.destination_account_id;
    
    INSERT INTO public.account_balance_history (
      account_id, user_id, balance_before, balance_after, transaction_id, reason
    )
    SELECT
      OLD.destination_account_id,
      OLD.user_id,
      current_balance + OLD.amount,
      current_balance,
      OLD.id,
      'transfer_deleted'
    FROM public.accounts WHERE id = OLD.destination_account_id;
  END IF;
  
  -- Reverse CC expense
  IF OLD.type = 'expense' AND OLD.payment_method = 'credit_card' THEN
    UPDATE public.credit_cards
    SET current_balance = current_balance - OLD.amount
    WHERE id = OLD.credit_card_id;
  END IF;
  
  -- Reverse CC payment
  IF OLD.type = 'cc_payment' THEN
    UPDATE public.credit_cards
    SET current_balance = current_balance + OLD.amount
    WHERE id = OLD.credit_card_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transaction_delete BEFORE DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.reverse_balance_on_transaction_delete();
```

---

### Auto-Update Timestamps

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## Row Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_config ENABLE ROW LEVEL SECURITY;
```

---

### RLS Policy Pattern

**For each table, apply all four policies (SELECT, INSERT, UPDATE, DELETE):**

#### Profiles

```sql
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);
```

#### Accounts

```sql
CREATE POLICY "Users view own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own accounts"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own accounts"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);
```

#### Categories

```sql
CREATE POLICY "Users view own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);
```

#### Credit Cards

```sql
CREATE POLICY "Users view own credit cards"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own credit cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own credit cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own credit cards"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);
```

#### Transactions

```sql
CREATE POLICY "Users view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT user_id FROM public.categories WHERE id = category_id
    ) = auth.uid()
    AND (
      SELECT user_id FROM public.accounts WHERE id = account_id
    ) = auth.uid()
    AND (destination_account_id IS NULL OR (
      SELECT user_id FROM public.accounts WHERE id = destination_account_id
    ) = auth.uid())
    AND (credit_card_id IS NULL OR (
      SELECT user_id FROM public.credit_cards WHERE id = credit_card_id
    ) = auth.uid())
  );

CREATE POLICY "Users update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (
    SELECT user_id FROM public.categories WHERE id = category_id
  ) = auth.uid());

CREATE POLICY "Users delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);
```

#### Transaction Drafts

```sql
CREATE POLICY "Users view own drafts"
  ON public.transaction_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own drafts"
  ON public.transaction_drafts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (SELECT user_id FROM public.categories WHERE id = category_id) = auth.uid()
    AND (SELECT user_id FROM public.accounts WHERE id = account_id) = auth.uid()
  );

CREATE POLICY "Users update own drafts"
  ON public.transaction_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own drafts"
  ON public.transaction_drafts FOR DELETE
  USING (auth.uid() = user_id);
```

#### Account Balance History

```sql
CREATE POLICY "Users view own balance history"
  ON public.account_balance_history FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE - system only via triggers
```

#### Goals

```sql
CREATE POLICY "Users view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (SELECT user_id FROM public.accounts WHERE id = linked_account_id) = auth.uid()
  );

CREATE POLICY "Users update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);
```

#### Audit Log

```sql
CREATE POLICY "Users view own audit log"
  ON public.audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE - system only
```

#### Salary Config

```sql
CREATE POLICY "Users view own salary config"
  ON public.salary_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own salary config"
  ON public.salary_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own salary config"
  ON public.salary_config FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own salary config"
  ON public.salary_config FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Strategic Indexing

```sql
-- Accounts
CREATE INDEX idx_accounts_user ON public.accounts(user_id) WHERE NOT is_archived;
CREATE INDEX idx_accounts_user_default_income ON public.accounts(user_id, is_default_for_income);

-- Transactions
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_account ON public.transactions(user_id, account_id);
CREATE INDEX idx_transactions_reference ON public.transactions(reference_number) WHERE reference_number IS NOT NULL;

-- Drafts
CREATE INDEX idx_transaction_drafts_user_created ON public.transaction_drafts(user_id, created_at DESC);

-- Categories
CREATE INDEX idx_categories_user_type ON public.categories(user_id, type) WHERE NOT is_archived;

-- Credit Cards
CREATE INDEX idx_credit_cards_user ON public.credit_cards(user_id) WHERE NOT is_archived;

-- Goals
CREATE INDEX idx_goals_user_archived ON public.goals(user_id, is_archived);

-- Balance History
CREATE INDEX idx_balance_history_account_created ON public.account_balance_history(account_id, created_at DESC);

-- Audit Log
CREATE INDEX idx_audit_log_user_created ON public.audit_log(user_id, created_at DESC);
```

---

## Migration Strategy

### Phase 1: v1 (Launch)
- ✅ profiles, categories, accounts, credit_cards
- ✅ transactions, transaction_drafts
- ✅ account_balance_history, goals
- ✅ audit_log (optional, but recommended)

### Phase 2: v1.5 (Nice-to-have)
- salary_config (for salary calculator)

### Phase 3: v2 (Future)
- tags, transaction_tags
- recurring_transactions
- attachments

---

## Key Tradeoffs & Decisions

### 1. Single Transactions Table
- **vs.** Separate credit_card_transactions
- **Pro:** Single source of truth, simpler RLS, consistent balance logic
- **Con:** Slightly more complex validation (can't have both cc_payment and regular expense in same type)
- **Decision:** Single table is worth it.

### 2. RPC Functions vs. Multiple Frontend Calls
- **vs.** Client calls POST /api/transaction, PATCH /api/account, etc.
- **Pro:** Atomic (all-or-nothing), safe, no race conditions, single audit trail entry
- **Con:** More database setup, needs careful permission design
- **Decision:** RPC functions mandatory for financial correctness.

### 3. Negative Account Balances
- **vs.** Prevent all negative balances
- **Pro:** Flexibility for corrections, overdrafts, tracking mismatches
- **Con:** Could hide bugs
- **Decision:** Allow for accounts, prevent for credit cards.

### 4. Separate Drafts Table
- **vs.** Status column in transactions
- **Pro:** Drafts never affect balance, smaller tables, clear semantics
- **Con:** Schema duplication
- **Decision:** Separate table is essential for correctness.

---

## Testing Checklist

- [ ] Post transaction → balance updates correctly
- [ ] Edit transaction → old effects reversed, new applied
- [ ] Delete transaction → balance restored
- [ ] Post draft → draft deleted, transaction created, balance updated
- [ ] Edit draft → no balance impact
- [ ] Transfer → both accounts updated
- [ ] CC expense → CC balance increases, account unchanged
- [ ] CC payment → CC balance decreases, account decreases
- [ ] RLS prevents users from accessing other users' data
- [ ] Audit log records all changes
- [ ] Balance history records all changes

---

## Implementation Notes

1. **Default Categories:** Create on user profile creation (Supabase trigger)
2. **Authentication:** All RPC functions use `auth.uid()` - safe for direct client calls
3. **Frontend:** Use RPC functions, never multiple API calls for balance updates
4. **Validation:** Amount > 0, dates valid, foreign key ownership checked in RLS/RPC
5. **Transactions:** Always use RPC functions for critical operations
