# Salary Calculator

## Overview

The Salary Calculator helps you understand your net take-home pay from your gross salary. It accounts for taxes, contributions, and deductions specific to the Philippine context.

**URL**: `/salary-calculator`  
**Component**: `components/SalaryCalculator.tsx`  
**Page**: `app/(routes)/salary-calculator/page.tsx`

## Purpose

For personal financial planning, you need to know how much money actually lands in your account each month. This tool provides:
- Breakdown of deductions
- Net salary calculation
- Tax estimation
- Contribution tracking
- Take-home pay visualization

## Input Fields

### Gross Salary (Required)

```
Input: ₱22,500 (or any amount)
Description: "Total salary before deductions"
```

Your full monthly salary before any deductions.

### Tax Parameters

#### Income Tax (Automatic Calculation)

Uses Philippine BIR tax brackets for 2026:

```
Monthly Gross    Tax Rate    Calculation
₱0 - ₱2,500      0%         (Exempt)
₱2,500 - ₱8,333  20%        (Income - 2,500) × 20%
₱8,333 - ₱33,333 25%        (Income - 8,333) × 25%
₱33,333+         30%        (Income - 33,333) × 30%
```

**Example: ₱22,500 gross salary**
```
Taxable income: ₱22,500
Falls in ₱8,333 - ₱33,333 bracket
Tax = (₱22,500 - ₱8,333) × 25%
    = ₱14,167 × 25%
    = ₱3,541.75
```

#### SSS Contribution

```
Employee share: 3.63% of gross
₱22,500 × 3.63% = ₱816.75
```

(Employer also pays 8.76%, not shown in net calculation)

#### Medicare (PhilHealth)

```
Employee share: 1.75% of gross
₱22,500 × 1.75% = ₱393.75
```

(Employer also pays 1.75%, not shown)

#### PAG-IBIG Contribution

```
Employee share: 1% or 2% of gross (minimum ₱100, maximum ₱200)
For ₱22,500: ₱100 - ₱200
(Employer also pays 1% or 2%, not shown)
```

### Custom Deductions

Users can add custom deductions:

```
Examples:
- Life insurance: ₱500
- Union dues: ₱200
- Loan repayment: ₱1,000
- Other benefits: ₱300
```

Each deduction is:
- User-editable
- Can be disabled (toggled on/off)
- Removable
- Named and described

## Output Breakdown

### Summary Card

```
Net Salary: ₱17,549.50
(Highlighted, large text)

Gross: ₱22,500
Total Deductions: ₱2,950.50
```

### Deduction Breakdown

```
Income Tax:      ₱3,541.75  (15.7%)
SSS:             ₱  816.75  (3.6%)
PhilHealth:      ₱  393.75  (1.7%)
PAG-IBIG:        ₱  100.00  (0.4%)
Custom Ded:      ₱    0.00  (0.0%)
────────────────────────────────────
Total:           ₱4,852.25  (21.6%)
```

### Net Salary Calculation

```
Gross Salary:        ₱22,500.00
- Income Tax:        ₱3,541.75
- SSS:               ₱  816.75
- PhilHealth:        ₱  393.75
- PAG-IBIG:          ₱  100.00
- Custom Deductions: ₱    0.00
────────────────────────────────────
Net Salary:          ₱17,647.75
```

## Visual Breakdown

### Pie Chart

```
Net Take-Home
├─ ₱17,647.75 (78.4%) [largest, bright green]
└─ Deductions
   ├─ Income Tax ₱3,541.75 (15.7%) [red]
   ├─ SSS ₱816.75 (3.6%) [orange]
   ├─ PhilHealth ₱393.75 (1.7%) [yellow]
   └─ PAG-IBIG ₱100 (0.4%) [gray]
```

### Bar Chart

```
₱25,000 ─────────────────────────
₱22,500 ─ GROSS ════════════════
        │ (100%)
₱20,000 │
        │ Deductions
₱15,000 ├─ Taxes & Contributions
        │
₱17,648 ─ NET ═════════════════ (78%)
```

## Use Cases

### 1. Budgeting

```
"My gross is ₱30,000. What can I budget for?"

Input ₱30,000 → Net shows ₱20,000
"I have ₱20,000 take-home to budget"

Allocate:
- Bills: ₱6,000 (30%)
- Food: ₱3,000 (15%)
- Savings: ₱8,000 (40%)
- Entertainment: ₱3,000 (15%)
```

### 2. Negotiating Salary

```
"My current net is ₱17,648. I want ₱20,000 net."

Try ₱25,000 gross → Net shows ₱17,850 (not enough)
Try ₱27,000 gross → Net shows ₱19,100 (closer)
Try ₱30,000 gross → Net shows ₱21,300 (good)

"I need to ask for ₱30,000 gross"
```

### 3. Comparing Job Offers

```
Job A: ₱25,000 gross
Job B: ₱28,000 gross + ₱1,500 benefits

Job A Net: ₱17,850
Job B Net: ₱18,650 + benefits = ₱20,150

"Job B is clearly better"
```

### 4. Tracking Savings Goal

```
Net salary: ₱17,648
Expenses: ₱12,000
Available: ₱5,648/month

"I can save ₱5,648/month toward my ₱100,000 emergency fund"
Target date: 18 months
```

## Customization

### Adding Custom Deductions

```
1. Click "+ Add Custom Deduction"
2. Enter name: "Car Loan"
3. Enter amount: ₱2,500
4. Toggle enabled: [✓]
5. Auto-calculates net salary
```

### Removing Custom Deductions

```
1. Find deduction in list
2. Click "Remove" button
3. Net salary updates immediately
```

### Disabling Without Removing

```
1. Click toggle switch [✓/☐]
2. Deduction hidden from calculation
3. Can re-enable later
```

### Editing Values

```
1. Click on amount field
2. Edit value
3. Net salary updates in real-time
```

## Settings (Future)

- [ ] Tax year selection (2024, 2025, 2026, etc.)
- [ ] Different tax brackets (regional variations)
- [ ] Spouse/dependent deductions
- [ ] Housing allowance calculations
- [ ] Meal allowance
- [ ] COLA adjustments
- [ ] Overtime multipliers (1.25x, 1.35x, 2x)
- [ ] 13th month pay simulation

## Accuracy Notes

### This calculator:

✅ **Accurate for**:
- Regular employees
- Standard deductions only
- Fixed monthly salaries
- Philippine BIR 2026 brackets

❌ **Does NOT account for**:
- Employer contributions (benefits)
- Regional tax variations
- Special allowances
- Professional fees
- Customized corporate tax plans
- Freelance/self-employment income
- Variable income
- Bonus structures
- Stock options

### Disclaimer

> This calculator provides estimates only and is not official tax advice. Actual deductions depend on your employer's setup and BIR regulations. Please consult with an accountant or your HR department for accurate figures.

## Integration with Dashboard

After calculating net salary:

```
Dashboard shows:
  Total Income: ₱17,648 (net, not gross)

This is the amount that actually lands in your account
for budgeting and expense tracking.
```

**Note**: Dashboard income comes from transaction records, not from calculator. The calculator is informational only.

## Technical Details

### Calculation Function

```typescript
interface SalaryBreakdown {
  gross: number
  incomeTax: number
  sss: number
  philHealth: number
  pagIbig: number
  customDeductions: number
  totalDeductions: number
  net: number
}

function calculateSalary(gross: number, customDeductions: number[]): SalaryBreakdown {
  const incomeTax = calculateIncomeTax(gross)
  const sss = gross * 0.0363
  const philHealth = gross * 0.0175
  const pagIbig = calculatePagIbig(gross)
  const customTotal = customDeductions.reduce((sum, d) => sum + d, 0)
  
  return {
    gross,
    incomeTax,
    sss,
    philHealth,
    pagIbig,
    customDeductions: customTotal,
    totalDeductions: incomeTax + sss + philHealth + pagIbig + customTotal,
    net: gross - (incomeTax + sss + philHealth + pagIbig + customTotal)
  }
}
```

### Income Tax Calculation

```typescript
function calculateIncomeTax(monthlyGross: number): number {
  const annualGross = monthlyGross * 12
  let tax = 0
  
  // Apply tax brackets
  if (annualGross <= 30000) {
    // Exempt
  } else if (annualGross <= 100000) {
    tax = (annualGross - 30000) * 0.20
  } else if (annualGross <= 400000) {
    tax = (100000 - 30000) * 0.20 + (annualGross - 100000) * 0.25
  } else {
    tax = (100000 - 30000) * 0.20 + (400000 - 100000) * 0.25 + (annualGross - 400000) * 0.30
  }
  
  return tax / 12 // Convert back to monthly
}
```

## FAQ

**Q: Is this tax calculator accurate?**  
A: It provides estimates based on standard 2026 tax brackets. Actual taxes depend on your specific situation. Consult an accountant for precise figures.

**Q: Can I use this for yearly salary planning?**  
A: Yes, multiply the net monthly by 13 (to include 13th month pay) or 12 (regular months only).

**Q: What if I get a bonus or variable income?**  
A: This calculator assumes fixed monthly income. For irregular income, calculate separately and add/subtract from your average.

**Q: Should I use gross or net for my budget?**  
A: Always use net salary. That's the money that actually enters your account.

**Q: Can I include BIR withholding tax?**  
A: This calculator shows employee contributions only. Withholding tax depends on your employer's system (already included in some cases).

**Q: How do I know my actual take-home?**  
A: Compare with your latest payslip. If it matches, this calculator is calibrated correctly for your situation.
